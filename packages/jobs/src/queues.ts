import { Queue } from 'bullmq'
import type { Redis } from '@atlas/cache'

export const QUEUE_NAMES = {
  MEMORY_UPDATE: 'atlas:memory-update',
  TOOL_EXECUTION: 'atlas:tool-execution',
  RESPONSE_GENERATION: 'atlas:response-generation',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

export const createQueues = (redis: Redis) => {
  const connection = {
    host: redis.options.host ?? 'localhost',
    port: redis.options.port ?? 6379,
  }
  return {
    memoryUpdate: new Queue(QUEUE_NAMES.MEMORY_UPDATE, { connection }),
    toolExecution: new Queue(QUEUE_NAMES.TOOL_EXECUTION, { connection }),
    responseGeneration: new Queue(QUEUE_NAMES.RESPONSE_GENERATION, { connection }),
  }
}

export type Queues = ReturnType<typeof createQueues>
