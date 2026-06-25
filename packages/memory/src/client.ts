import type {
  GraphitiConfig,
  AddMessagesRequest,
  SearchRequest,
  GetMemoryRequest,
  MemorySearchResult,
  Episode,
  MemoryFact,
  MemoryMessage,
} from '@atlas/types'

export type GraphitiClient = {
  readonly baseURL: string
  addMessages: (request: AddMessagesRequest) => Promise<void>
  search: (request: SearchRequest) => Promise<MemorySearchResult>
  getMemory: (request: GetMemoryRequest) => Promise<MemorySearchResult>
  getEpisodes: (groupId: string, lastN: number) => Promise<readonly Episode[]>
  healthCheck: () => Promise<boolean>
}

export const createGraphitiClient = (config: GraphitiConfig): GraphitiClient => {
  const baseURL = config.baseURL

  const toApiMessage = (msg: MemoryMessage) => ({
    content: msg.content,
    ...(msg.uuid !== '' ? { uuid: msg.uuid } : { uuid: null }),
    name: msg.name,
    role_type: msg.roleType,
    role: msg.role,
    timestamp: msg.timestamp,
    source_description: msg.sourceDescription ?? '',
  })

  const addMessages = async (request: AddMessagesRequest): Promise<void> => {
    const res = await fetch(`${baseURL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: request.groupId,
        messages: request.messages.map(toApiMessage),
      }),
    })
    if (!res.ok) throw new Error(`Graphiti addMessages failed: ${res.status}`)
  }

  const search = async (request: SearchRequest): Promise<MemorySearchResult> => {
    const res = await fetch(`${baseURL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: request.query,
        group_ids: request.groupIds,
        max_facts: request.maxFacts,
      }),
    })
    if (!res.ok) throw new Error(`Graphiti search failed: ${res.status}`)
    const data = (await res.json()) as { facts: MemoryFact[] }
    return { facts: data.facts, query: request.query }
  }

  const getMemory = async (request: GetMemoryRequest): Promise<MemorySearchResult> => {
    const res = await fetch(`${baseURL}/get-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: request.groupId,
        messages: request.messages.map(toApiMessage),
        max_facts: request.maxFacts,
        center_node_uuid: null,
      }),
    })
    if (!res.ok) throw new Error(`Graphiti getMemory failed: ${res.status}`)
    const data = (await res.json()) as { facts: MemoryFact[] }
    return { facts: data.facts, query: '' }
  }

  const getEpisodes = async (groupId: string, lastN: number): Promise<readonly Episode[]> => {
    const res = await fetch(`${baseURL}/episodes/${groupId}?last_n=${lastN}`)
    if (!res.ok) throw new Error(`Graphiti getEpisodes failed: ${res.status}`)
    return (await res.json()) as readonly Episode[]
  }

  const healthCheck = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${baseURL}/healthcheck`)
      return res.ok
    } catch {
      return false
    }
  }

  return { baseURL, addMessages, search, getMemory, getEpisodes, healthCheck }
}
