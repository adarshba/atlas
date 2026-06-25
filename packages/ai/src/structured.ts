import { generateObject } from 'ai'
import type { z } from 'zod'
import type { AiProvider } from './provider'
import { withSpan, withSpanEvent } from '@atlas/otel'
import { withRetry } from './retry'

export type StructuredOptions<T> = {
  readonly model: string
  readonly system?: string
  readonly prompt: string
  readonly schema: z.ZodType<T>
  readonly maxRetries?: number
  readonly temperature?: number
}

export const generateStructured = async <T>(
  provider: AiProvider,
  options: StructuredOptions<T>,
): Promise<T> => {
  return withSpan('ai.generateStructured', async (span) => {
    span.setAttribute('ai.model', options.model)
    return withRetry(async () => {
      const result = await generateObject<z.ZodType<T>, 'object', T>({
        model: provider(options.model),
        ...(options.system !== undefined ? { system: options.system } : {}),
        prompt: options.prompt,
        schema: options.schema,
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      })
      withSpanEvent(span, 'ai.response')
      return result.object
    }, options.maxRetries)
  })
}
