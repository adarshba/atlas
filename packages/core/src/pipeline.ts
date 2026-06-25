import type { InboundMessage } from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { observe } from './observe'
import { retrieveContext } from './retrieve'
import { plan } from './plan'
import { executeTools } from './execute'
import { generateResponse } from './respond'
import { persistMemory } from './persist'
import { getRuntimeServices } from './locator'

export const runPipeline = async (message: InboundMessage, sessionId: string): Promise<string> => {
  return withSpan('core.pipeline', async (span) => {
    span.setAttribute('session.id', sessionId)
    span.setAttribute('message.id', message.id)

    const observation = observe(message, sessionId)
    span.setAttribute('observation.platform', observation.platform)

    const context = await retrieveContext(sessionId, observation.messageText)

    const decision = plan(observation)
    span.setAttribute('plan.shouldUseTools', decision.shouldUseTools)

    const toolResults = await executeTools(decision, observation)

    const response = await generateResponse(observation, context, toolResults)
    span.setAttribute('response.length', response.length)

    await persistMemory(sessionId, observation.messageText, response)

    const { eventBus } = getRuntimeServices()
    await eventBus.publish(
      'ResponseGenerated',
      {
        sessionId,
        text: response,
        toolsUsed: decision.toolsRequired,
        tokenUsage: null,
      },
      {
        correlationId: message.id,
        causationId: null,
        userId: message.user.id,
        sessionId,
        platform: message.platform,
      },
    )

    return response
  })
}
