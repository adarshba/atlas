import type { PlatformAdapter, InboundMessage, PlatformType, PlatformRef, PlatformUser } from '@atlas/types'
import { generateId } from '@atlas/primitives'

const CLI_CAPABILITIES = {
  supportsStreaming: false,
  supportsThreads: false,
  supportsReactions: false,
  supportsFileUploads: false,
  supportsMessageEditing: false,
  supportsStatusIndicators: false,
} as const

export const createCliAdapter = (): PlatformAdapter => {
  const platformRef: PlatformRef = {
    platform: 'slack',
    channelId: 'cli',
    threadId: null,
    messageTs: null,
  }

  const lastUser: PlatformUser = {
    id: 'local-user',
    platform: 'slack',
    username: 'you',
    displayName: 'You',
    email: null,
  }

  const normalizeInbound = async (rawEvent: unknown): Promise<InboundMessage> => {
    const text = rawEvent as string
    return Object.freeze({
      id: generateId(),
      platform: 'slack',
      platformRef: { ...platformRef, messageTs: Date.now().toString() },
      user: lastUser,
      text,
      threadId: null,
      mentions: [],
      files: [],
      rawEvent,
      timestamp: new Date(),
    })
  }

  const sendResponse = async (envelope: { readonly text: string }): Promise<string> => {
    console.log(`\nAtlas> ${envelope.text}\n`)
    return generateId()
  }

  const updateResponse = async (): Promise<void> => {}

  const startStream = async (): Promise<{ readonly id: string; readonly platformRef: PlatformRef; readonly messageId: string | null }> => {
    return { id: generateId(), platformRef, messageId: null }
  }

  const appendStream = async (_handle: unknown, content: string): Promise<void> => {
    process.stdout.write(content)
  }

  const stopStream = async (): Promise<void> => {
    process.stdout.write('\n')
  }

  const setStatus = async (): Promise<void> => {}
  const clearStatus = async (): Promise<void> => {}

  const getCapabilities = () => CLI_CAPABILITIES

  const resolveUser = async (): Promise<PlatformUser> => lastUser

  return {
    platform: 'slack',
    normalizeInbound,
    sendResponse,
    updateResponse,
    startStream,
    appendStream,
    stopStream,
    setStatus,
    clearStatus,
    getCapabilities,
    resolveUser,
  }
}

export const PLATFORM_TYPE: PlatformType = 'slack'
