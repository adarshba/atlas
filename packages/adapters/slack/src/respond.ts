import type { ResponseEnvelope, AdapterContext, SlackApiResponse } from '@atlas/types'
import { withSpan } from '@atlas/otel'

export const createSendResponse = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (envelope: ResponseEnvelope): Promise<string> => {
    return withSpan('slack.sendResponse', async () => {
      const threadId = envelope.threadId ?? ctx.threadId
      const payload = {
        channel: ctx.channel,
        text: envelope.text,
        ...(threadId ? { thread_ts: threadId } : {}),
        ...(envelope.blocks ? { blocks: envelope.blocks } : {}),
      }
      const res = await fetch(`${apiBase}/chat.postMessage`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as SlackApiResponse
      if (!data.ok || !data.ts) {
        throw new Error(`Slack sendResponse failed: ${data.error ?? 'unknown'}`)
      }
      return data.ts
    })
  }
}

export const createUpdateResponse = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (messageId: string, envelope: ResponseEnvelope): Promise<void> => {
    return withSpan('slack.updateResponse', async () => {
      const payload = {
        channel: ctx.channel,
        ts: messageId,
        text: envelope.text,
        ...(envelope.blocks ? { blocks: envelope.blocks } : {}),
      }
      const res = await fetch(`${apiBase}/chat.update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as SlackApiResponse
      if (!data.ok) {
        throw new Error(`Slack updateResponse failed: ${data.error ?? 'unknown'}`)
      }
    })
  }
}
