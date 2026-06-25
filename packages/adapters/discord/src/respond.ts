import type { ResponseEnvelope } from '@atlas/types'
import { withSpan } from '@atlas/otel'

type AdapterContext = {
  channel: string
  threadId: string | null
}

type DiscordMessageResponse = {
  readonly id: string
}

export const createSendResponse = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (envelope: ResponseEnvelope): Promise<string> => {
    return withSpan('discord.sendResponse', async () => {
      const channel = envelope.threadId ?? ctx.threadId ?? ctx.channel
      const res = await fetch(`${apiBase}/channels/${channel}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: envelope.text }),
      })
      if (!res.ok) {
        throw new Error(`Discord sendResponse failed: ${res.status}`)
      }
      const data = (await res.json()) as DiscordMessageResponse
      return data.id
    })
  }
}

export const createUpdateResponse = (token: string, apiBase: string, ctx: AdapterContext) => {
  return async (messageId: string, envelope: ResponseEnvelope): Promise<void> => {
    return withSpan('discord.updateResponse', async () => {
      const res = await fetch(`${apiBase}/channels/${ctx.channel}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: envelope.text }),
      })
      if (!res.ok) {
        throw new Error(`Discord updateResponse failed: ${res.status}`)
      }
    })
  }
}
