import type { Redis } from './connection'
import { withSpan } from '@atlas/otel'

export const get = async (redis: Redis, key: string): Promise<string | null> => {
  return withSpan('cache.get', async (span) => {
    span.setAttribute('cache.key', key)
    return redis.get(key)
  })
}

export const set = async (redis: Redis, key: string, value: string, ttlSeconds?: number): Promise<void> => {
  return withSpan('cache.set', async (span) => {
    span.setAttribute('cache.key', key)
    if (ttlSeconds) {
      await redis.set(key, value, 'EX', ttlSeconds)
    } else {
      await redis.set(key, value)
    }
  })
}

export const del = async (redis: Redis, key: string): Promise<void> => {
  return withSpan('cache.del', async (span) => {
    span.setAttribute('cache.key', key)
    await redis.del(key)
  })
}

export const expire = async (redis: Redis, key: string, ttlSeconds: number): Promise<void> => {
  return withSpan('cache.expire', async (span) => {
    span.setAttribute('cache.key', key)
    await redis.expire(key, ttlSeconds)
  })
}

export const exists = async (redis: Redis, key: string): Promise<boolean> => {
  return withSpan('cache.exists', async (span) => {
    span.setAttribute('cache.key', key)
    const result = await redis.exists(key)
    return result === 1
  })
}
