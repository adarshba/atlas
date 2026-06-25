export type Episode = {
  readonly id: string
  readonly name: string
  readonly content: string
  readonly source: EpisodeSource
  readonly sourceDescription: string
  readonly timestamp: Date
  readonly groupId: string
}

export type EpisodeSource = 'text' | 'message' | 'json'

export type MemoryFact = {
  readonly uuid: string
  readonly fact: string
  readonly validAt: string | null
  readonly invalidAt: string | null
  readonly sourceNodeUuid: string
  readonly targetNodeUuid: string
}

export type MemorySearchResult = {
  readonly facts: readonly MemoryFact[]
  readonly query: string
}

export type MemoryMessage = {
  readonly uuid: string
  readonly name: string
  readonly role: string
  readonly roleType: string
  readonly content: string
  readonly timestamp: string
  readonly sourceDescription: string | null
}

export type AddMessagesRequest = {
  readonly groupId: string
  readonly messages: readonly MemoryMessage[]
}

export type SearchRequest = {
  readonly query: string
  readonly groupIds: readonly string[]
  readonly maxFacts: number
}

export type GetMemoryRequest = {
  readonly groupId: string
  readonly messages: readonly MemoryMessage[]
  readonly maxFacts: number
}
