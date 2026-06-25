import { join } from 'node:path'
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
import type { WebhookRoute } from '@atlas/types'
import {
  createLinearAdapter,
  createWebhookHandler as createLinearWebhookHandler,
} from '@atlas/linear'
import { printConfig } from './banner'
import { createServer } from './server'

const SIGNALS = ['SIGINT', 'SIGTERM'] as const
const MIGRATIONS_DIR = join(import.meta.dir, '../../../packages/db/migrations')

const checkHealth = async (name: string, check: () => Promise<boolean>): Promise<boolean> => {
  const ok = await check()
  const status = ok ? 'OK' : 'UNREACHABLE'
  const marker = ok ? '\x1b[32m' : '\x1b[31m'
  console.log(`  ${marker}${status}\x1b[0m  ${name}`)
  return ok
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
    ? createLinearAdapter({
        apiKey: config.linear.apiKey,
        webhookSecret: config.linear.webhookSecret,
      })
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

  const server = createServer({
    port: config.server.port,
    runtime,
    webhooks,
  })

  console.log(`\nHTTP server listening on port ${config.server.port}`)
  for (const webhook of webhooks) {
    console.log(`  POST ${webhook.path}  — ${webhook.platform} webhook endpoint`)
  }
  console.log('  GET  /health           — Health check')
  if (linearAdapter) {
    console.log('  Linear adapter: configured')
  } else {
    console.log('  Linear adapter: not configured (set ATLAS_LINEAR_API_KEY)')
  }

  let shuttingDown = false
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    console.log('\nShutting down...')
    server.stop()
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
