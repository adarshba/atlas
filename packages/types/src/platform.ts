export type PlatformType = 'slack' | 'discord' | 'linear'

export type PlatformCapabilities = {
  readonly supportsStreaming: boolean
  readonly supportsThreads: boolean
  readonly supportsReactions: boolean
  readonly supportsFileUploads: boolean
  readonly supportsMessageEditing: boolean
  readonly supportsStatusIndicators: boolean
}

export type PlatformUser = {
  readonly id: string
  readonly platform: PlatformType
  readonly username: string
  readonly displayName: string
  readonly email: string | null
}

export type PlatformRef = {
  readonly platform: PlatformType
  readonly channelId: string
  readonly threadId: string | null
  readonly messageTs: string | null
}

export type InboundMessage = {
  readonly id: string
  readonly platform: PlatformType
  readonly platformRef: PlatformRef
  readonly user: PlatformUser
  readonly text: string
  readonly threadId: string | null
  readonly mentions: readonly string[]
  readonly files: readonly InboundFile[]
  readonly rawEvent: unknown
  readonly timestamp: Date
}

export type InboundFile = {
  readonly id: string
  readonly filename: string
  readonly mimeType: string
  readonly size: number
  readonly downloadUrl: string | null
}

export type ResponseEnvelope = {
  readonly text: string
  readonly blocks: readonly ResponseBlock[] | null
  readonly threadId: string | null
}

export type ResponseBlock = {
  readonly type: string
  readonly text: string | null
  readonly elements: readonly unknown[] | null
}

export type StreamHandle = {
  readonly id: string
  readonly platformRef: PlatformRef
  readonly messageId: string | null
}

export type StatusUpdate = {
  readonly emoji: string | null
  readonly text: string | null
}

export type WebhookHandlerResult =
  | {
      readonly ok: true
      readonly message: InboundMessage
    }
  | {
      readonly ok: false
      readonly response: Response
    }

export type WebhookHandler = (request: Request) => Promise<WebhookHandlerResult>

export type WebhookRoute = {
  readonly path: string
  readonly platform: PlatformType
  readonly adapter: PlatformAdapter
  readonly handler: WebhookHandler
}

export type PlatformAdapter = {
  readonly platform: PlatformType
  normalizeInbound: (rawEvent: unknown) => Promise<InboundMessage>
  sendResponse: (envelope: ResponseEnvelope) => Promise<string>
  updateResponse: (messageId: string, envelope: ResponseEnvelope) => Promise<void>
  startStream: (platformRef: PlatformRef) => Promise<StreamHandle>
  appendStream: (handle: StreamHandle, content: string) => Promise<void>
  stopStream: (handle: StreamHandle, finalEnvelope: ResponseEnvelope) => Promise<void>
  setStatus: (platformRef: PlatformRef, update: StatusUpdate) => Promise<void>
  clearStatus: (platformRef: PlatformRef) => Promise<void>
  getCapabilities: () => PlatformCapabilities
  resolveUser: (platformUserId: string, teamId: string) => Promise<PlatformUser>
}
