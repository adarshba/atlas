import { createOpenAI } from '@ai-sdk/openai'
import type { AiConfig } from '@atlas/types'

export const createProvider = (config: AiConfig) => {
  const openai = createOpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  })
  return openai
}

export type AiProvider = ReturnType<typeof createOpenAI>
