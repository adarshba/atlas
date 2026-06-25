import type { GraphitiClient } from './client'
import { withSpan } from '@atlas/otel'

export const healthCheck = async (client: GraphitiClient): Promise<boolean> => {
  return withSpan('memory.healthCheck', async (span) => {
    const healthy = await client.healthCheck()
    span.setAttribute('memory.healthy', healthy)
    return healthy
  })
}
