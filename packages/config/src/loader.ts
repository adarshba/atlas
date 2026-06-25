import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import type {
  AtlasConfig,
  AiConfig,
  RedisConfig,
  PostgresConfig,
  OtelConfig,
  GraphitiConfig,
  ServerConfig,
  SlackConfig,
  DiscordConfig,
  LinearConfig,
  McpConfig,
  McpServerConfig,
} from '@atlas/types'
import { envSchema, type RawEnv } from './schema'

export type { RawEnv }

const mcpTomlSchema = z
  .object({
    mcp_servers: z
      .record(
        z.object({
          type: z.enum(['stdio', 'http']).optional(),
          transport: z.enum(['stdio', 'streamable_http']).optional(),
          command: z.string().min(1).nullable().default(null),
          args: z.array(z.string()).default([]),
          env: z.record(z.string()).default({}),
          env_from: z.array(z.string().min(1)).default([]),
          url: z.string().url().nullable().default(null),
          headers: z.record(z.string()).default({}),
          headers_from: z.record(z.string().min(1)).default({}),
          bearer_token_env: z.string().min(1).nullable().default(null),
          cwd: z.string().min(1).nullable().default(null),
          enabled: z.boolean().default(true),
          timeout_ms: z.number().int().positive().default(30000),
        }),
      )
      .default({}),
  })
  .default({ mcp_servers: {} })

const loadMcpConfig = (): McpConfig => {
  const path = join(process.cwd(), 'mcp.toml')
  if (!existsSync(path)) {
    return { servers: [] }
  }

  const raw = readFileSync(path, 'utf8')
  const parsed = mcpTomlSchema.parse(Bun.TOML.parse(raw))
  const servers: McpServerConfig[] = Object.entries(parsed.mcp_servers).map(([name, server]) => {
    const transport = server.transport ?? (server.type === 'http' ? 'streamable_http' : 'stdio')
    const envFrom = Object.fromEntries(
      server.env_from
        .map((key) => [key, process.env[key]] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    )
    const headersFrom = Object.fromEntries(
      Object.entries(server.headers_from)
        .map(([header, key]) => [header, process.env[key]] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    )
    const bearerToken =
      server.bearer_token_env !== null ? process.env[server.bearer_token_env] : undefined

    if (transport === 'stdio' && server.command === null) {
      throw new Error(`mcp.toml: ${name} requires command for stdio transport`)
    }

    if (transport === 'streamable_http' && server.url === null) {
      throw new Error(`mcp.toml: ${name} requires url for streamable_http transport`)
    }

    return {
      name,
      transport,
      command: server.command,
      args: server.args,
      env: { ...server.env, ...envFrom },
      url: server.url,
      headers: {
        ...server.headers,
        ...headersFrom,
        ...(bearerToken !== undefined ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      cwd: server.cwd,
      enabled: server.enabled,
      timeoutMs: server.timeout_ms,
    }
  })

  return { servers }
}

export const loadConfig = (): AtlasConfig => {
  const parsed = envSchema.parse(process.env)

  const ai: AiConfig = {
    baseURL: parsed.ATLAS_AI_BASE_URL,
    apiKey: parsed.ATLAS_AI_API_KEY,
    model: parsed.ATLAS_AI_MODEL,
  }

  const redis: RedisConfig = {
    url: parsed.ATLAS_REDIS_URL,
    keyPrefix: parsed.ATLAS_REDIS_KEY_PREFIX,
  }

  const postgres: PostgresConfig = {
    url: parsed.ATLAS_POSTGRES_URL,
    maxConnections: parsed.ATLAS_POSTGRES_MAX_CONNECTIONS,
  }

  const otel: OtelConfig = {
    collectorEndpoint: parsed.ATLAS_OTEL_COLLECTOR_ENDPOINT,
    serviceName: parsed.ATLAS_OTEL_SERVICE_NAME,
    serviceVersion: parsed.ATLAS_OTEL_SERVICE_VERSION,
    environment: parsed.ATLAS_OTEL_ENVIRONMENT,
  }

  const graphiti: GraphitiConfig = {
    baseURL: parsed.ATLAS_GRAPHITI_BASE_URL,
  }

  const server: ServerConfig = {
    port: parsed.ATLAS_PORT,
  }

  const slack: SlackConfig = {
    botToken: parsed.ATLAS_SLACK_BOT_TOKEN ?? '',
    signingSecret: parsed.ATLAS_SLACK_SIGNING_SECRET ?? '',
  }

  const discord: DiscordConfig = {
    botToken: parsed.ATLAS_DISCORD_BOT_TOKEN ?? '',
    applicationId: parsed.ATLAS_DISCORD_APPLICATION_ID ?? '',
  }

  const linear: LinearConfig = {
    apiKey: parsed.ATLAS_LINEAR_API_KEY ?? '',
    webhookSecret: parsed.ATLAS_LINEAR_WEBHOOK_SECRET ?? '',
    oauthClientId: parsed.ATLAS_LINEAR_OAUTH_CLIENT_ID ?? '',
    oauthClientSecret: parsed.ATLAS_LINEAR_OAUTH_CLIENT_SECRET ?? '',
    oauthRedirectUri: parsed.ATLAS_LINEAR_OAUTH_REDIRECT_URI ?? '',
  }

  const mcp = loadMcpConfig()

  return { ai, redis, postgres, otel, graphiti, server, slack, discord, linear, mcp }
}
