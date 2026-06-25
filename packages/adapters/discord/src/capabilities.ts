import type { PlatformCapabilities } from '@atlas/types'

export const DISCORD_CAPABILITIES: PlatformCapabilities = {
  supportsStreaming: true,
  supportsThreads: true,
  supportsReactions: false,
  supportsFileUploads: true,
  supportsMessageEditing: true,
  supportsStatusIndicators: false,
}
