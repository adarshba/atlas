import type { GraphitiClient } from './client'
import type {
  AddMessagesRequest,
  SearchRequest,
  GetMemoryRequest,
  MemorySearchResult,
  Episode,
} from '@atlas/types'
import { withSpan } from '@atlas/otel'

export const addMessages = async (
  client: GraphitiClient,
  request: AddMessagesRequest,
): Promise<void> => {
  return withSpan('memory.addMessages', async (span) => {
    span.setAttribute('memory.group_id', request.groupId)
    span.setAttribute('memory.message_count', request.messages.length)
    return client.addMessages(request)
  })
}

export const search = async (
  client: GraphitiClient,
  request: SearchRequest,
): Promise<MemorySearchResult> => {
  return withSpan('memory.search', async (span) => {
    span.setAttribute('memory.query', request.query)
    span.setAttribute('memory.group_count', request.groupIds.length)
    span.setAttribute('memory.max_facts', request.maxFacts)
    return client.search(request)
  })
}

export const getMemory = async (
  client: GraphitiClient,
  request: GetMemoryRequest,
): Promise<MemorySearchResult> => {
  return withSpan('memory.getMemory', async (span) => {
    span.setAttribute('memory.group_id', request.groupId)
    span.setAttribute('memory.message_count', request.messages.length)
    span.setAttribute('memory.max_facts', request.maxFacts)
    return client.getMemory(request)
  })
}

export const getEpisodes = async (
  client: GraphitiClient,
  groupId: string,
  lastN: number,
): Promise<readonly Episode[]> => {
  return withSpan('memory.getEpisodes', async (span) => {
    span.setAttribute('memory.group_id', groupId)
    span.setAttribute('memory.last_n', lastN)
    return client.getEpisodes(groupId, lastN)
  })
}
