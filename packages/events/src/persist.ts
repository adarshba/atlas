import type { Database } from '@atlas/db'
import type { Event } from '@atlas/types'
import { withSpan } from '@atlas/otel'

export const persistEvent = async (db: Database, event: Event): Promise<void> => {
  return withSpan('events.persist', async (span) => {
    span.setAttribute('event.type', event.type)
    span.setAttribute('event.id', event.id)
    await db`
      INSERT INTO events (id, type, timestamp, correlation_id, causation_id, user_id, session_id, platform, payload)
      VALUES (${event.id}, ${event.type}, ${event.timestamp}, ${event.metadata.correlationId}, ${event.metadata.causationId}, ${event.metadata.userId}, ${event.metadata.sessionId}, ${event.metadata.platform}, ${JSON.stringify(event.payload)})
    `
  })
}
