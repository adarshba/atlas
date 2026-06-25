export type AiConfig = {
  readonly baseURL: string
  readonly apiKey: string
  readonly model: string
}

export type RedisConfig = {
  readonly url: string
  readonly keyPrefix: string
}

export type PostgresConfig = {
  readonly url: string
  readonly maxConnections: number
}

export type OtelConfig = {
  readonly collectorEndpoint: string
  readonly serviceName: string
  readonly serviceVersion: string
  readonly environment: string
}

export type GraphitiConfig = {
  readonly baseURL: string
}

export type SlackConfig = {
  readonly botToken: string
  readonly signingSecret: string
}

export type DiscordConfig = {
  readonly botToken: string
  readonly applicationId: string
}

export type LinearConfig = {
  readonly apiKey: string
  readonly webhookSecret: string
  readonly oauthClientId: string
  readonly oauthClientSecret: string
  readonly oauthRedirectUri: string
}

export type ServerConfig = {
  readonly port: number
}

export type McpServerConfig = {
  readonly name: string
  readonly transport: 'stdio' | 'streamable_http'
  readonly command: string | null
  readonly args: readonly string[]
  readonly env: Readonly<Record<string, string>>
  readonly url: string | null
  readonly headers: Readonly<Record<string, string>>
  readonly cwd: string | null
  readonly enabled: boolean
  readonly timeoutMs: number
}

export type McpConfig = {
  readonly servers: readonly McpServerConfig[]
}

export type AtlasConfig = {
  readonly ai: AiConfig
  readonly redis: RedisConfig
  readonly postgres: PostgresConfig
  readonly otel: OtelConfig
  readonly graphiti: GraphitiConfig
  readonly server: ServerConfig
  readonly slack: SlackConfig
  readonly discord: DiscordConfig
  readonly linear: LinearConfig
  readonly mcp: McpConfig
}
