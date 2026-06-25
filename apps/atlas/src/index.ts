import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { loadConfig } from '@atlas/config'
import { initTelemetry, shutdownTelemetry } from '@atlas/otel'
import * as db from '@atlas/db'
import * as cache from '@atlas/cache'
import { createEventBus } from '@atlas/events'
import { createProvider } from '@atlas/ai'
import { createGraphitiClient } from '@atlas/memory'
import {
  createToolRegistry,
  createSearchTool,
  createHttpTool,
  createReminderTool,
} from '@atlas/tools'
import { createRuntime, type RuntimeServices } from '@atlas/core'
import type { WebhookRoute, HttpRoute } from '@atlas/types'
import {
  createLinearAdapter,
  createWebhookHandler as createLinearWebhookHandler,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  storeToken,
  type LinearOAuthConfig,
} from '@atlas/linear'
import { printConfig } from './banner'
import { registerMcpServers } from './mcp'
import { createServer } from './server'

const SIGNALS = ['SIGINT', 'SIGTERM'] as const
const MIGRATIONS_DIR = join(import.meta.dir, '../../../packages/db/migrations')
const OAUTH_STATE_KEY = 'linear:oauth:state'
const OAUTH_STATE_TTL_SECONDS = 300

const checkHealth = async (name: string, check: () => Promise<boolean>): Promise<boolean> => {
  const ok = await check()
  const status = ok ? 'OK' : 'UNREACHABLE'
  const marker = ok ? '\x1b[32m' : '\x1b[31m'
  console.log(`  ${marker}${status}\x1b[0m  ${name}`)
  return ok
}

const buildOAuthRoutes = (
  oauthConfig: LinearOAuthConfig,
  redis: ReturnType<typeof cache.createRedis>,
): readonly HttpRoute[] => {
  const authorizeRoute = {
    method: 'GET' as const,
    path: '/oauth/linear/start',
    handler: async (_req: Request, _url: URL): Promise<Response> => {
      const state = randomUUID()
      await redis.set(OAUTH_STATE_KEY, state, 'EX', OAUTH_STATE_TTL_SECONDS)
      const authorizeUrl = buildAuthorizeUrl(oauthConfig, state)
      return Response.redirect(authorizeUrl, 302)
    },
  }

  const callbackRoute = {
    method: 'GET' as const,
    path: '/oauth/linear',
    handler: async (_req: Request, url: URL): Promise<Response> => {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')

      if (!code || !state) {
        return new Response('Missing code or state parameters', { status: 400 })
      }

      const storedState = await redis.get(OAUTH_STATE_KEY)
      if (!storedState || storedState !== state) {
        return new Response('Invalid or expired state', { status: 400 })
      }

      await redis.del(OAUTH_STATE_KEY)

      try {
        const tokenResponse = await exchangeCodeForToken(oauthConfig, code)
        await storeToken(redis, tokenResponse.access_token)
        return new Response(
          '<html><body><h1>Atlas OAuth Successful</h1><p>Atlas is now authorized to post on your behalf. You can close this window.</p></body></html>',
          { status: 200, headers: { 'Content-Type': 'text/html' } },
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return new Response(`OAuth token exchange failed: ${msg}`, { status: 500 })
      }
    },
  }

  return [authorizeRoute, callbackRoute]
}

const start = async (): Promise<void> => {
  const config = loadConfig()
  printConfig(config)

  initTelemetry(config.otel)

  console.log('Health checks:')
  const sql = db.createDatabase(config.postgres)
  const redis = cache.createRedis(config.redis)
  const memory = createGraphitiClient(config.graphiti)

  const [dbOk, redisOk, memoryOk] = await Promise.all([
    checkHealth('PostgreSQL', () => db.healthCheck(sql)),
    checkHealth('Redis', () => cache.healthCheck(redis)),
    checkHealth('Graphiti', () => memory.healthCheck()),
  ])

  if (!dbOk) {
    console.error('\nPostgreSQL is required. Start it with: bash compose.sh up -d')
    process.exit(1)
  }
  if (!redisOk) {
    console.error('\nRedis is required. Start it with: bash compose.sh up -d')
    process.exit(1)
  }
  if (!memoryOk) {
    console.warn('\n  WARNING: Graphiti is unreachable. Memory features will be degraded.')
  }

  console.log('\nRunning migrations...')
  const applied = await db.runMigrations(sql, MIGRATIONS_DIR)
  if (applied.length > 0) {
    console.log(`  Applied ${applied.length} migration(s): ${applied.join(', ')}`)
  } else {
    console.log('  No pending migrations.')
  }

  const eventBus = await createEventBus({ db: sql, redis })
  const aiProvider = createProvider(config.ai)
  const tools = createToolRegistry()

  tools.register(createSearchTool())
  tools.register(createHttpTool())
  tools.register(createReminderTool())
  const closeMcpClients = await registerMcpServers(config.mcp.servers, tools)

  const services: RuntimeServices = {
    eventBus,
    db: sql,
    redis,
    memory,
    aiProvider,
    tools,
    queues: null,
    model: config.ai.model,
  }

  const runtime = createRuntime(services)

  const linearAdapter = config.linear.apiKey
    ? createLinearAdapter({ config: config.linear, redis })
    : undefined
  const webhooks: readonly WebhookRoute[] = [
    ...(linearAdapter !== undefined
      ? [
          {
            path: '/webhooks/linear',
            platform: linearAdapter.platform,
            adapter: linearAdapter,
            handler: createLinearWebhookHandler(config.linear, linearAdapter),
          },
        ]
      : []),
  ]

  const hasOAuthConfig = Boolean(
    config.linear.oauthClientId &&
    config.linear.oauthClientSecret &&
    config.linear.oauthRedirectUri,
  )
  const oauthRoutes: readonly HttpRoute[] = hasOAuthConfig
    ? buildOAuthRoutes(
        {
          clientId: config.linear.oauthClientId,
          clientSecret: config.linear.oauthClientSecret,
          redirectUri: config.linear.oauthRedirectUri,
        },
        redis,
      )
    : []

  const server = createServer({
    port: config.server.port,
    runtime,
    webhooks,
    routes: oauthRoutes,
  })

  console.log(`\nHTTP server listening on port ${config.server.port}`)
  for (const webhook of webhooks) {
    console.log(`  POST ${webhook.path}  — ${webhook.platform} webhook endpoint`)
  }
  if (oauthRoutes.length > 0) {
    console.log('  GET  /oauth/linear/start  — Linear OAuth authorize')
    console.log('  GET  /oauth/linear        — Linear OAuth callback')
  }
  console.log('  GET  /health           — Health check')
  if (linearAdapter) {
    console.log('  Linear adapter: configured')
    if (hasOAuthConfig) {
      console.log('  Linear OAuth: enabled')
    } else {
      console.log('  Linear OAuth: not configured (set ATLAS_LINEAR_OAUTH_* env vars)')
    }
  } else {
    console.log('  Linear adapter: not configured (set ATLAS_LINEAR_API_KEY)')
  }

  let shuttingDown = false
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    console.log('\nShutting down...')
    server.stop()
    await Promise.allSettled(closeMcpClients.map((close) => close()))
    await eventBus.close()
    await redis.quit()
    await sql.end()
    await shutdownTelemetry()
    process.exit(0)
  }

  for (const sig of SIGNALS) {
    process.on(sig, () => {
      console.log(`\nReceived ${sig}`)
      void shutdown()
    })
  }

  console.log('\nRuntime initialized. Press Ctrl+C to stop.\n')
}

start().catch((error) => {
  console.error('Fatal:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
