import type {
  PlatformRef,
  ResponseEnvelope,
  StreamHandle,
  AdapterContext,
  SlackApiResponse,
} from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { generateId } from '@atlas/primitives'

const postMessage = async (
  token: string,
  apiBase: string,
  channel: string,
  text: string,
  threadTs?: string,
): Promise<string> => {
  const payload = {
    channel,
    text,
    ...(threadTs ? { thread_ts: threadTs } : {}),
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
    throw new Error(`Slack postMessage failed: ${data.error ?? 'unknown'}`)
  }
  return data.ts
}

const updateMessage = async (
  token: string,
  apiBase: string,
  channel: string,
  ts: string,
  text: string,
): Promise<void> => {
  const res = await fetch(`${apiBase}/chat.update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, ts, text }),
  })
  const data = (await res.json()) as SlackApiResponse
  if (!data.ok) {
    throw new Error(`Slack updateMessage failed: ${data.error ?? 'unknown'}`)
  }
}

export const createStartStream = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (platformRef: PlatformRef): Promise<StreamHandle> => {
    return withSpan('slack.startStream', async () => {
      const channel = platformRef.channelId || ctx.channel
      const threadTs = platformRef.threadId ?? ctx.threadId ?? undefined
      const messageId = await postMessage(token, apiBase, channel, '\u2026', threadTs)
      return {
        id: generateId(),
        platformRef,
        messageId,
      }
    })
  }
}

export const createAppendStream = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (handle: StreamHandle, content: string): Promise<void> => {
    return withSpan('slack.appendStream', async () => {
      if (!handle.messageId) return
      const channel = handle.platformRef.channelId || ctx.channel
      await updateMessage(token, apiBase, channel, handle.messageId, content)
    })
  }
}

export const createStopStream = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (handle: StreamHandle, finalEnvelope: ResponseEnvelope): Promise<void> => {
    return withSpan('slack.stopStream', async () => {
      if (!handle.messageId) return
      const channel = handle.platformRef.channelId || ctx.channel
      await updateMessage(token, apiBase, channel, handle.messageId, finalEnvelope.text)
    })
  }
}
