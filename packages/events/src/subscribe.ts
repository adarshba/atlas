import type { Redis } from '@atlas/cache'
import type { Event } from '@atlas/types'

export const subscribeCrossProcess = async (
  redis: Redis,
  channel: string,
  handler: (event: Event) => void,
): Promise<void> => {
  const subscriber = redis.duplicate()
  await subscriber.subscribe(channel)
  subscriber.on('message', (_channel: string, message: string) => {
    const event = JSON.parse(message) as Event
    Object.freeze(event)
    handler(event)
  })
}
