import type { InboundMessage, Observation } from '@atlas/types'
import { now } from '@atlas/primitives'

export const observe = (message: InboundMessage, sessionId: string): Observation => {
  return {
    sessionId,
    messageText: message.text,
    platform: message.platform,
    userId: message.user.id,
    timestamp: now(),
    context: {
      recentMessages: [],
      relevantFacts: [],
      activeTools: [],
    },
  }
}
