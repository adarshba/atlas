export type Session = {
  readonly id: string
  readonly platform: string
  readonly platformRef: import('./platform').PlatformRef
  readonly userId: string
  readonly createdAt: Date
  readonly lastActiveAt: Date
  readonly messageCount: number
  readonly metadata: SessionMetadata
}

export type SessionMetadata = {
  readonly title: string | null
  readonly tags: readonly string[]
  readonly custom: Record<string, unknown>
}

export type SessionState = {
  readonly session: Session
  readonly isActive: boolean
  readonly lastEventId: string | null
}
