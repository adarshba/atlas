import type { Observation, PlannerDecision } from '@atlas/types'

const TOOL_KEYWORDS: readonly (readonly [string, string])[] = [
  ['search', 'search'],
  ['find', 'search'],
  ['look up', 'search'],
  ['http', 'http'],
  ['url', 'http'],
  ['fetch', 'http'],
  ['remind', 'reminder'],
  ['schedule', 'reminder'],
]

export const plan = (observation: Observation): PlannerDecision => {
  const text = observation.messageText.toLowerCase()

  const toolsRequired: string[] = []
  for (const [keyword, toolName] of TOOL_KEYWORDS) {
    if (text.includes(keyword) && !toolsRequired.includes(toolName)) {
      toolsRequired.push(toolName)
    }
  }

  return {
    shouldRespond: true,
    shouldUseTools: toolsRequired.length > 0,
    toolsRequired,
    reasoning: toolsRequired.length > 0
      ? `Message suggests tool usage: ${toolsRequired.join(', ')}`
      : 'Direct response, no tools needed',
    estimatedSteps: toolsRequired.length > 0 ? toolsRequired.length + 1 : 1,
  }
}
