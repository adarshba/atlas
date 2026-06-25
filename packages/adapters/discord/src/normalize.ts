import type { InboundMessage, InboundFile, PlatformRef, PlatformUser } from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { generateId } from '@atlas/primitives'

type AdapterContext = {
  channel: string
  threadId: string | null
}

type DiscordAuthor = {
  readonly id: string
  readonly username: string
  readonly global_name?: string
}

type DiscordAttachment = {
  readonly id: string
  readonly filename: string
  readonly content_type?: string
  readonly size: number
  readonly url: string
}

type DiscordMessageData = {
  readonly id?: string
  readonly channel_id?: string
  readonly content?: string
  readonly author?: DiscordAuthor
  readonly attachments?: readonly DiscordAttachment[]
  readonly thread?: { readonly id: string }
}

type DiscordEventPayload = {
  readonly type?: string
  readonly data?: DiscordMessageData
}

type DiscordUserResponse = {
  readonly id: string
  readonly username: string
  readonly global_name?: string
}

export const createNormalizeInbound = (ctx: AdapterContext) => {
  return async (rawEvent: unknown): Promise<InboundMessage> => {
    return withSpan('discord.normalizeInbound', async (): Promise<InboundMessage> => {
      const payload = rawEvent as DiscordEventPayload
      const event = payload.data ?? (rawEvent as DiscordMessageData)

      const channel = event.channel_id ?? ''
      const threadId = event.thread?.id ?? null
      const messageId = event.id ?? null

      ctx.channel = channel
      ctx.threadId = threadId

      const author = event.author
      const user: PlatformUser = author
        ? {
            id: author.id,
            platform: 'discord',
            username: author.username,
            displayName: author.global_name ?? author.username,
            email: null,
          }
        : {
            id: 'unknown',
            platform: 'discord',
            username: 'unknown',
            displayName: 'unknown',
            email: null,
          }

      const files: readonly InboundFile[] = (event.attachments ?? []).map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.content_type ?? 'application/octet-stream',
        size: a.size,
        downloadUrl: a.url,
      }))

      const platformRef: PlatformRef = {
        platform: 'discord',
        channelId: channel,
        threadId,
        messageTs: messageId,
      }

      return {
        id: messageId ?? generateId(),
        platform: 'discord',
        platformRef,
        user,
        text: event.content ?? '',
        threadId,
        mentions: [],
        files,
        rawEvent,
        timestamp: new Date(),
      }
    })
  }
}

export const fetchDiscordUser = async (
  token: string,
  apiBase: string,
  userId: string,
): Promise<PlatformUser> => {
  return withSpan('discord.fetchUser', async () => {
    const res = await fetch(`${apiBase}/users/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bot ${token}`,
      },
    })
    if (!res.ok) {
      return {
        id: userId,
        platform: 'discord',
        username: userId,
        displayName: userId,
        email: null,
      }
    }
    const data = (await res.json()) as DiscordUserResponse
    return {
      id: data.id,
      platform: 'discord',
      username: data.username,
      displayName: data.global_name ?? data.username,
      email: null,
    }
  })
}
