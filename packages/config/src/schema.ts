import { z } from 'zod'

const aiSchema = z.object({
  ATLAS_AI_BASE_URL: z.string().url().default('http://localhost:4000'),
  ATLAS_AI_API_KEY: z.string().min(1),
  ATLAS_AI_MODEL: z.string().min(1).default('openai/gpt-4o-mini'),
})

const redisSchema = z.object({
  ATLAS_REDIS_URL: z.string().default('redis://localhost:6379'),
  ATLAS_REDIS_KEY_PREFIX: z.string().default('atlas:'),
})

const postgresSchema = z.object({
  ATLAS_POSTGRES_URL: z.string().default('postgres://atlas:atlas@localhost:5432/atlas'),
  ATLAS_POSTGRES_MAX_CONNECTIONS: z.coerce.number().min(1).max(100).default(10),
})

const otelSchema = z.object({
  ATLAS_OTEL_COLLECTOR_ENDPOINT: z.string().default('http://localhost:4318'),
  ATLAS_OTEL_SERVICE_NAME: z.string().default('atlas'),
  ATLAS_OTEL_SERVICE_VERSION: z.string().default('0.0.1'),
  ATLAS_OTEL_ENVIRONMENT: z.string().default('development'),
})

const graphitiSchema = z.object({
  ATLAS_GRAPHITI_BASE_URL: z.string().url().default('http://localhost:8000'),
})

const serverSchema = z.object({
  ATLAS_PORT: z.coerce.number().min(1).max(65535).default(3000),
})

const slackSchema = z.object({
  ATLAS_SLACK_BOT_TOKEN: z.string().optional(),
  ATLAS_SLACK_SIGNING_SECRET: z.string().optional(),
})

const discordSchema = z.object({
  ATLAS_DISCORD_BOT_TOKEN: z.string().optional(),
  ATLAS_DISCORD_APPLICATION_ID: z.string().optional(),
})

const linearSchema = z.object({
  ATLAS_LINEAR_API_KEY: z.string().optional(),
  ATLAS_LINEAR_WEBHOOK_SECRET: z.string().optional(),
  ATLAS_LINEAR_OAUTH_CLIENT_ID: z.string().optional(),
  ATLAS_LINEAR_OAUTH_CLIENT_SECRET: z.string().optional(),
  ATLAS_LINEAR_OAUTH_REDIRECT_URI: z.string().optional(),
})

export const envSchema = z.object({
  ...aiSchema.shape,
  ...redisSchema.shape,
  ...postgresSchema.shape,
  ...otelSchema.shape,
  ...graphitiSchema.shape,
  ...serverSchema.shape,
  ...slackSchema.shape,
  ...discordSchema.shape,
  ...linearSchema.shape,
})

export type RawEnv = z.infer<typeof envSchema>
