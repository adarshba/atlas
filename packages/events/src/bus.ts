import type { Database } from '@atlas/db'
import type { Redis } from '@atlas/cache'
import type {
  Event,
  EventType,
  EventHandler,
  EventSubscription,
  EventMetadata,
  EventPayloadMap,
} from '@atlas/types'

export type EventBusOptions = {
  readonly db: Database
  readonly redis: Redis
  readonly channelName?: string
}

export type EventBus = {
  readonly publish: <T extends EventType>(
    type: T,
    payload: EventPayloadMap[T],
    metadata: EventMetadata,
  ) => Promise<Event<T>>
  readonly subscribe: <T extends EventType>(type: T, handler: EventHandler<T>) => EventSubscription
  readonly close: () => Promise<void>
}
