import type { PlannerContext } from '@atlas/types'
import { search, getEpisodes } from '@atlas/memory'
import { withSpan } from '@atlas/otel'
import { getRuntimeServices } from './locator'

export const retrieveContext = async (
  sessionId: string,
  messageText: string,
): Promise<PlannerContext> => {
  return withSpan('core.retrieve', async (span) => {
    span.setAttribute('session.id', sessionId)
    const { memory, tools } = getRuntimeServices()

    const [searchResult, episodes] = await Promise.all([
      search(memory, {
        query: messageText,
        groupIds: [sessionId],
        maxFacts: 10,
      }).catch((err: unknown) => {
        console.error(
          'retrieveContext: search failed, continuing with empty:',
          err instanceof Error ? err.message : String(err),
        )
        return { facts: [], query: messageText }
      }),
      getEpisodes(memory, sessionId, 10).catch((err: unknown) => {
        console.error(
          'retrieveContext: getEpisodes failed, continuing with empty:',
          err instanceof Error ? err.message : String(err),
        )
        return [] as const
      }),
    ])

    return {
      recentMessages: episodes.map((e) => e.content),
      relevantFacts: searchResult.facts.map((f) => f.fact),
      activeTools: tools.list().map((t) => t.name),
    }
  })
}
