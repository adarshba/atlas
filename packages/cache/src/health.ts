import type { Redis } from './connection'
import { withSpan } from '@atlas/otel'

export const healthCheck = async (redis: Redis): Promise<boolean> => {
  return withSpan('cache.health', async () => {
    const result = await redis.ping()
    return result === 'PONG'
  })
}
