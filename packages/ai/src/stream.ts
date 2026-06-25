import { streamText } from 'ai'
import type { AiProvider } from './provider'
import { withSpan, withSpanEvent } from '@atlas/otel'

export type StreamOptions = {
  readonly model: string
  readonly system?: string
  readonly prompt: string
  readonly temperature?: number
}

export type StreamResult = {
  readonly stream: AsyncGenerator<{ content: string }>
  readonly model: string
}

export const stream = async (
  provider: AiProvider,
  options: StreamOptions,
): Promise<StreamResult> => {
  return withSpan('ai.stream', async (span) => {
    span.setAttribute('ai.model', options.model)
    const abortController = new AbortController()
    const result = streamText({
      model: provider(options.model),
      ...(options.system !== undefined ? { system: options.system } : {}),
      prompt: options.prompt,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      abortSignal: abortController.signal,
    })
    const stream_gen = async function* () {
      try {
        for await (const chunk of result.textStream) {
          yield { content: chunk }
        }
      } finally {
        abortController.abort()
      }
      withSpanEvent(span, 'ai.stream.complete')
    }
    return { stream: stream_gen(), model: options.model }
  })
}
