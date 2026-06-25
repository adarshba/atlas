import type { Redis } from './connection'
import { withSpan } from '@atlas/otel'

export type MessageHandler = (channel: string, message: string) => void | Promise<void>

export type Unsubscribe = () => Promise<void>

export const publish = async (redis: Redis, channel: string, message: string): Promise<number> => {
  return withSpan('cache.publish', async (span) => {
    span.setAttribute('cache.channel', channel)
    return redis.publish(channel, message)
  })
}

export const subscribe = async (
  redis: Redis,
  channel: string,
  handler: MessageHandler,
): Promise<Unsubscribe> => {
  return withSpan('cache.subscribe', async (span) => {
    span.setAttribute('cache.channel', channel)
    await redis.subscribe(channel)
    const listener = (receivedChannel: string, message: string): void => {
      if (receivedChannel === channel) {
        void handler(receivedChannel, message)
      }
    }
    redis.on('message', listener)
    return async () => {
      redis.off('message', listener)
      await redis.unsubscribe(channel)
    }
  })
}
