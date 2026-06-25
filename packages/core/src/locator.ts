import type { EventBus } from '@atlas/events'
import type { Database } from '@atlas/db'
import type { Redis } from '@atlas/cache'
import type { GraphitiClient } from '@atlas/memory'
import type { AiProvider } from '@atlas/ai'
import type { ToolRegistry } from '@atlas/types'

export type Queues = {
  readonly enqueue: (job: unknown) => Promise<void>
}

export type RuntimeServices = {
  readonly eventBus: EventBus
  readonly db: Database
  readonly redis: Redis
  readonly memory: GraphitiClient
  readonly aiProvider: AiProvider
  readonly tools: ToolRegistry
  readonly queues: Queues | null
  readonly model: string
}

let services: RuntimeServices | null = null

export const setRuntimeServices = (s: RuntimeServices): void => {
  services = s
}

export const getRuntimeServices = (): RuntimeServices => {
  if (!services) throw new Error('Runtime services not initialized')
  return services
}
