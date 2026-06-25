import { generateText, tool as aiTool, stepCountIs } from 'ai'
import type { ToolSet } from 'ai'
import type { AiProvider } from './provider'
import type { ToolDefinition, TokenUsage } from '@atlas/types'
import { withSpan, withSpanEvent } from '@atlas/otel'
import { withRetry } from './retry'

export type GenerateWithToolsOptions = {
  readonly model: string
  readonly system?: string
  readonly prompt: string
  readonly tools: readonly ToolDefinition[]
  readonly maxSteps?: number
  readonly maxRetries?: number
}

export type GenerateWithToolsResult = {
  readonly text: string
  readonly toolsUsed: readonly string[]
  readonly usage: TokenUsage | null
  readonly model: string
  readonly steps: number
}

export const generateWithTools = async (
  provider: AiProvider,
  options: GenerateWithToolsOptions,
): Promise<GenerateWithToolsResult> => {
  return withSpan('ai.generateWithTools', async (span) => {
    span.setAttribute('ai.model', options.model)
    span.setAttribute('ai.tools.count', options.tools.length)
    const toolsMap: ToolSet = {}
    for (const t of options.tools) {
      toolsMap[t.name] = aiTool<unknown, unknown>({
        description: t.description,
        inputSchema: t.inputSchema,
        execute: async (input) => {
          const result = await t.execute(input, { sessionId: '', correlationId: '', platform: '' })
          return result.output
        },
      })
    }
    return withRetry(async () => {
      const result = await generateText({
        model: provider(options.model),
        ...(options.system !== undefined ? { system: options.system } : {}),
        prompt: options.prompt,
        tools: toolsMap,
        stopWhen: stepCountIs(options.maxSteps ?? 10),
      })
      const toolsUsed = result.steps.flatMap((s) => s.toolCalls).map((tc) => tc.toolName)
      withSpanEvent(span, 'ai.response', {
        'ai.usage.input_tokens': result.usage?.inputTokens ?? 0,
        'ai.usage.output_tokens': result.usage?.outputTokens ?? 0,
        'ai.tools.used': toolsUsed.join(','),
        'ai.steps': result.steps.length,
      })
      return {
        text: result.text,
        toolsUsed,
        usage: {
          promptTokens: result.usage.inputTokens ?? 0,
          completionTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        },
        model: options.model,
        steps: result.steps.length,
      }
    }, options.maxRetries)
  })
}
