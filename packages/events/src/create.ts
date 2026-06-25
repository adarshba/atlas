import { EventEmitter } from 'events'
import type {
  Event,
  EventType,
  EventHandler,
  EventSubscription,
  EventMetadata,
  EventPayloadMap,
} from '@atlas/types'
import { withSpan, incrementCounter } from '@atlas/otel'
import { generateId } from '@atlas/primitives'
import { persistEvent } from './persist'
import type { EventBus, EventBusOptions } from './bus'

export const createEventBus = (options: EventBusOptions): EventBus => {
  const emitter = new EventEmitter()
  const channelName = options.channelName ?? 'atlas:events'
  const publishedIds = new Set<string>()

  const subscriber = options.redis.duplicate()
  void subscriber.subscribe(channelName)

  subscriber.on('message', (_channel: string, message: string) => {
    const event = JSON.parse(message) as Event
    if (publishedIds.has(event.id)) {
      publishedIds.delete(event.id)
      return
    }
    Object.freeze(event)
    emitter.emit(event.type, event)
  })

  const publish = async <T extends EventType>(
    type: T,
    payload: EventPayloadMap[T],
    metadata: EventMetadata,
  ): Promise<Event<T>> => {
    return withSpan('events.publish', async (span) => {
      span.setAttribute('event.type', type)

      const event = {
        id: generateId(),
        type,
        timestamp: new Date(),
        metadata,
        payload,
      } as Event<T>

      Object.freeze(event)

      publishedIds.add(event.id)
      setTimeout(() => {
        publishedIds.delete(event.id)
      }, 10000)

      emitter.emit(type, event)

      await persistEvent(options.db, event)
      await options.redis.publish(channelName, JSON.stringify(event))

      incrementCounter('events.published', 1, { 'event.type': type })

      span.setAttribute('event.id', event.id)

      return event
    })
  }

  const subscribe = <T extends EventType>(type: T, handler: EventHandler<T>): EventSubscription => {
    const listener = (event: Event<T>): void => {
      void handler(event)
    }
    emitter.on(type, listener)

    return {
      eventType: type,
      handler: handler as EventHandler<EventType>,
      unsubscribe: () => {
        emitter.off(type, listener)
      },
    }
  }

  const close = async (): Promise<void> => {
    emitter.removeAllListeners()
    await subscriber.quit()
  }

  return { publish, subscribe, close }
}
