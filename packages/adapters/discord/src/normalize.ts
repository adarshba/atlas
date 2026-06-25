import type {
  InboundMessage,
  InboundFile,
  PlatformRef,
  PlatformUser,
  AdapterContext,
  DiscordAuthor,
  DiscordAttachment,
  DiscordMessageData,
  DiscordEventPayload,
  DiscordUserResponse,
} from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { generateId } from '@atlas/primitives'

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

      const author: DiscordAuthor | undefined = event.author
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

      const files: readonly InboundFile[] = (event.attachments ?? []).map(
        (a: DiscordAttachment) => ({
          id: a.id,
          filename: a.filename,
          mimeType: a.content_type ?? 'application/octet-stream',
          size: a.size,
          downloadUrl: a.url,
        }),
      )

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
