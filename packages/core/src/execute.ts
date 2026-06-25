import type { Observation, PlannerDecision, ToolResult } from '@atlas/types'
import { executeTool } from '@atlas/tools'
import { withSpan } from '@atlas/otel'
import { getRuntimeServices } from './locator'

export const executeTools = async (
  decision: PlannerDecision,
  observation: Observation,
): Promise<readonly ToolResult[]> => {
  if (!decision.shouldUseTools || decision.toolsRequired.length === 0) {
    return []
  }

  return withSpan('core.execute', async (span) => {
    span.setAttribute('session.id', observation.sessionId)
    span.setAttribute('tools.count', decision.toolsRequired.length)

    const { tools } = getRuntimeServices()
    const results: ToolResult[] = []

    for (const toolName of decision.toolsRequired) {
      const tool = tools.get(toolName)
      if (!tool) {
        results.push({
          success: false,
          output: null,
          error: `Tool not found: ${toolName}`,
        })
        continue
      }

      const result = await executeTool(tool, observation.messageText, {
        sessionId: observation.sessionId,
        correlationId: observation.sessionId,
        platform: observation.platform,
      })
      results.push(result)
    }

    return results
  })
}
