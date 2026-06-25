import type { PlatformCapabilities } from '@atlas/types'

export const SLACK_CAPABILITIES: PlatformCapabilities = {
  supportsStreaming: true,
  supportsThreads: true,
  supportsReactions: true,
  supportsFileUploads: true,
  supportsMessageEditing: true,
  supportsStatusIndicators: false,
}
