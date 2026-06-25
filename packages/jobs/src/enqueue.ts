import type { Queues } from './queues'
import type { Job } from 'bullmq'
import { withSpan } from '@atlas/otel'

export const enqueueMemoryUpdate = async (
  queues: Queues,
  data: { sessionId: string; content: string },
): Promise<Job> => {
  return withSpan('jobs.enqueue.memoryUpdate', async (span) => {
    span.setAttribute('job.session_id', data.sessionId)
    return queues.memoryUpdate.add('memory-update', data)
  })
}

export const enqueueToolExecution = async (
  queues: Queues,
  data: { toolName: string; input: unknown; sessionId: string },
): Promise<Job> => {
  return withSpan('jobs.enqueue.toolExecution', async (span) => {
    span.setAttribute('job.tool_name', data.toolName)
    span.setAttribute('job.session_id', data.sessionId)
    return queues.toolExecution.add('tool-execution', data)
  })
}

export const enqueueResponseGeneration = async (
  queues: Queues,
  data: { sessionId: string; message: string },
): Promise<Job> => {
  return withSpan('jobs.enqueue.responseGeneration', async (span) => {
    span.setAttribute('job.session_id', data.sessionId)
    return queues.responseGeneration.add('response-generation', data)
  })
}
