import IORedis from 'ioredis'
import type { RedisConfig } from '@atlas/types'

export const createRedis = (config: RedisConfig): IORedis => {
  return new IORedis(config.url, {
    keyPrefix: config.keyPrefix,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  })
}

export type Redis = IORedis
