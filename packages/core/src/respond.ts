import type { Observation, PlannerContext, ToolResult } from '@atlas/types'
import { generate } from '@atlas/ai'
import { withSpan } from '@atlas/otel'
import { getRuntimeServices } from './locator'

const SYSTEM_PROMPT =
  'You are Atlas, a helpful AI assistant. Use the provided context to answer questions accurately and concisely.'

export const generateResponse = async (
  observation: Observation,
  context: PlannerContext,
  toolResults: readonly ToolResult[],
): Promise<string> => {
  return withSpan('core.respond', async (span) => {
    span.setAttribute('session.id', observation.sessionId)
    const { aiProvider, model } = getRuntimeServices()

    const factsBlock =
      context.relevantFacts.length > 0
        ? `\n\nRelevant facts:\n${context.relevantFacts.map((f) => `- ${f}`).join('\n')}`
        : ''

    const historyBlock =
      context.recentMessages.length > 0
        ? `\n\nRecent conversation:\n${context.recentMessages.join('\n')}`
        : ''

    const toolBlock =
      toolResults.length > 0
        ? `\n\nTool results:\n${toolResults.map((r) => `- ${JSON.stringify(r.output)}`).join('\n')}`
        : ''

    const prompt = `User message: ${observation.messageText}${factsBlock}${historyBlock}${toolBlock}`

    const result = await generate(aiProvider, {
      model,
      system: SYSTEM_PROMPT,
      prompt,
    })

    return result.text
  })
}
