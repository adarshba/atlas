import type { PlatformType, PlatformRef, PlatformUser, InboundMessage } from './platform'

export type EventType =
  | 'MessageReceived'
  | 'MentionReceived'
  | 'ThreadCreated'
  | 'ReactionAdded'
  | 'ToolExecuted'
  | 'MemoryStored'
  | 'MemoryRetrieved'
  | 'ResponseGenerated'
  | 'SessionStarted'
  | 'SessionEnded'

export type EventMetadata = {
  readonly correlationId: string
  readonly causationId: string | null
  readonly userId: string | null
  readonly sessionId: string | null
  readonly platform: PlatformType | null
}

export type BaseEvent = {
  readonly id: string
  readonly type: EventType
  readonly timestamp: Date
  readonly metadata: EventMetadata
}

export type MessageReceivedPayload = {
  readonly message: InboundMessage
}

export type MentionReceivedPayload = {
  readonly message: InboundMessage
}

export type ThreadCreatedPayload = {
  readonly threadId: string
  readonly platform: PlatformType
  readonly platformRef: PlatformRef
  readonly createdBy: PlatformUser
}

export type ReactionAddedPayload = {
  readonly platformRef: PlatformRef
  readonly user: PlatformUser
  readonly emoji: string
  readonly messageText: string
}

export type ToolExecutedPayload = {
  readonly toolName: string
  readonly input: unknown
  readonly output: unknown
  readonly duration: number
  readonly success: boolean
  readonly error: string | null
}

export type MemoryStoredPayload = {
  readonly episodeId: string
  readonly sessionId: string
  readonly content: string
}

export type MemoryRetrievedPayload = {
  readonly sessionId: string
  readonly query: string
  readonly factCount: number
  readonly facts: readonly string[]
}

export type ResponseGeneratedPayload = {
  readonly sessionId: string
  readonly text: string
  readonly toolsUsed: readonly string[]
  readonly tokenUsage: TokenUsage | null
}

export type SessionStartedPayload = {
  readonly sessionId: string
  readonly platform: PlatformType
  readonly userId: string
}

export type SessionEndedPayload = {
  readonly sessionId: string
  readonly reason: string
}

export type TokenUsage = {
  readonly promptTokens: number
  readonly completionTokens: number
  readonly totalTokens: number
}

export type EventPayloadMap = {
  MessageReceived: MessageReceivedPayload
  MentionReceived: MentionReceivedPayload
  ThreadCreated: ThreadCreatedPayload
  ReactionAdded: ReactionAddedPayload
  ToolExecuted: ToolExecutedPayload
  MemoryStored: MemoryStoredPayload
  MemoryRetrieved: MemoryRetrievedPayload
  ResponseGenerated: ResponseGeneratedPayload
  SessionStarted: SessionStartedPayload
  SessionEnded: SessionEndedPayload
}

export type Event<T extends EventType = EventType> = BaseEvent & {
  readonly payload: EventPayloadMap[T]
}

export type EventHandler<T extends EventType> = (event: Event<T>) => Promise<void>

export type EventSubscription = {
  readonly eventType: EventType
  readonly handler: EventHandler<EventType>
  readonly unsubscribe: () => void
}
