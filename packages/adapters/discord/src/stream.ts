import type {
  PlatformRef,
  ResponseEnvelope,
  StreamHandle,
  AdapterContext,
  DiscordMessageResponse,
} from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { generateId } from '@atlas/primitives'

const postMessage = async (
  token: string,
  apiBase: string,
  channel: string,
  text: string,
): Promise<string> => {
  const res = await fetch(`${apiBase}/channels/${channel}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: text }),
  })
  if (!res.ok) {
    throw new Error(`Discord postMessage failed: ${res.status}`)
  }
  const data = (await res.json()) as DiscordMessageResponse
  return data.id
}

const editMessage = async (
  token: string,
  apiBase: string,
  channel: string,
  messageId: string,
  text: string,
): Promise<void> => {
  const res = await fetch(`${apiBase}/channels/${channel}/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: text }),
  })
  if (!res.ok) {
    throw new Error(`Discord editMessage failed: ${res.status}`)
  }
}

export const createStartStream = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (platformRef: PlatformRef): Promise<StreamHandle> => {
    return withSpan('discord.startStream', async () => {
      const channel = platformRef.channelId || ctx.channel
      const messageId = await postMessage(token, apiBase, channel, '\u2026')
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
    return withSpan('discord.appendStream', async () => {
      if (!handle.messageId) return
      const channel = handle.platformRef.channelId || ctx.channel
      await editMessage(token, apiBase, channel, handle.messageId, content)
    })
  }
}

export const createStopStream = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (handle: StreamHandle, finalEnvelope: ResponseEnvelope): Promise<void> => {
    return withSpan('discord.stopStream', async () => {
      if (!handle.messageId) return
      const channel = handle.platformRef.channelId || ctx.channel
      await editMessage(token, apiBase, channel, handle.messageId, finalEnvelope.text)
    })
  }
}
