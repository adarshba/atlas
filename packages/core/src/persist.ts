import type { MemoryMessage } from '@atlas/types'
import { addMessages } from '@atlas/memory'
import { withSpan } from '@atlas/otel'
import { generateId } from '@atlas/primitives'
import { getRuntimeServices } from './locator'

export const persistMemory = async (
  sessionId: string,
  userMessage: string,
  response: string,
): Promise<void> => {
  return withSpan('core.persist', async (span) => {
    span.setAttribute('session.id', sessionId)
    const { memory } = getRuntimeServices()

    const nowIso = new Date().toISOString()

    const messages: MemoryMessage[] = [
      {
        uuid: generateId(),
        name: 'user',
        role: 'user',
        roleType: 'user',
        content: userMessage,
        timestamp: nowIso,
        sourceDescription: null,
      },
      {
        uuid: generateId(),
        name: 'assistant',
        role: 'assistant',
        roleType: 'assistant',
        content: response,
        timestamp: nowIso,
        sourceDescription: null,
      },
    ]

    await addMessages(memory, {
      groupId: sessionId,
      messages,
    })
  })
}
