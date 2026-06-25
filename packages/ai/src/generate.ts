import { generateText } from 'ai'
import type { AiProvider } from './provider'
import type { TokenUsage } from '@atlas/types'
import { withSpan, withSpanEvent } from '@atlas/otel'
import { withRetry } from './retry'

export type GenerateOptions = {
  readonly model: string
  readonly system?: string
  readonly prompt: string
  readonly maxRetries?: number
  readonly temperature?: number
}

export type GenerateResult = {
  readonly text: string
  readonly usage: TokenUsage | null
  readonly model: string
}

export const generate = async (
  provider: AiProvider,
  options: GenerateOptions,
): Promise<GenerateResult> => {
  return withSpan('ai.generate', async (span) => {
    span.setAttribute('ai.model', options.model)
    return withRetry(async () => {
      const result = await generateText({
        model: provider(options.model),
        ...(options.system !== undefined ? { system: options.system } : {}),
        prompt: options.prompt,
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      })
      withSpanEvent(span, 'ai.response', {
        'ai.usage.input_tokens': result.usage?.inputTokens ?? 0,
        'ai.usage.output_tokens': result.usage?.outputTokens ?? 0,
      })
      return {
        text: result.text,
        usage: {
          promptTokens: result.usage.inputTokens ?? 0,
          completionTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        },
        model: options.model,
      }
    }, options.maxRetries)
  })
}
