import { Worker, type Job } from 'bullmq'
import type { Redis } from '@atlas/cache'
import { withSpan } from '@atlas/otel'
import { QUEUE_NAMES, type QueueName } from './queues'

export type JobHandler = (job: Job) => Promise<void>

export const createWorker = (
  redis: Redis,
  queueName: QueueName,
  handler: JobHandler,
): Worker => {
  const connection = {
    host: redis.options.host ?? 'localhost',
    port: redis.options.port ?? 6379,
  }
  return new Worker(
    queueName,
    async (job: Job) => {
      return withSpan(`jobs.work.${queueName}`, async (span) => {
        span.setAttribute('job.id', job.id ?? '')
        span.setAttribute('job.name', job.name)
        await handler(job)
      })
    },
    { connection },
  )
}
