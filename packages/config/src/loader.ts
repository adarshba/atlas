import type {
  AtlasConfig,
  AiConfig,
  RedisConfig,
  PostgresConfig,
  OtelConfig,
  GraphitiConfig,
  SlackConfig,
  DiscordConfig,
  LinearConfig,
} from '@atlas/types'
import { envSchema, type RawEnv } from './schema'

export type { RawEnv }

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

  const slack: SlackConfig = {
    botToken: parsed.ATLAS_SLACK_BOT_TOKEN ?? '',
    signingSecret: parsed.ATLAS_SLACK_SIGNING_SECRET ?? '',
    port: parsed.ATLAS_SLACK_PORT,
  }

  const discord: DiscordConfig = {
    botToken: parsed.ATLAS_DISCORD_BOT_TOKEN ?? '',
    applicationId: parsed.ATLAS_DISCORD_APPLICATION_ID ?? '',
  }

  const linear: LinearConfig = {
    apiKey: parsed.ATLAS_LINEAR_API_KEY ?? '',
    webhookSecret: parsed.ATLAS_LINEAR_WEBHOOK_SECRET ?? '',
  }

  return { ai, redis, postgres, otel, graphiti, slack, discord, linear }
}
