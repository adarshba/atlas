import postgres from 'postgres'
import type { PostgresConfig } from '@atlas/types'

export const createDatabase = (config: PostgresConfig) => {
  return postgres(config.url, {
    max: config.maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
  })
}

export type Database = ReturnType<typeof postgres>
