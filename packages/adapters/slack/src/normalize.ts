import type { InboundMessage, InboundFile, PlatformRef, PlatformUser } from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { generateId } from '@atlas/primitives'

type AdapterContext = {
  channel: string
  threadId: string | null
}

type SlackFile = {
  readonly id: string
  readonly name: string
  readonly mimetype: string
  readonly size: number
  readonly url_private?: string
}

type SlackMessageEvent = {
  readonly type?: string
  readonly user?: string
  readonly text?: string
  readonly channel?: string
  readonly ts?: string
  readonly thread_ts?: string
  readonly files?: readonly SlackFile[]
}

type SlackEventPayload = {
  readonly type?: string
  readonly event?: SlackMessageEvent
  readonly team_id?: string
}

type SlackUserResponse = {
  readonly ok: boolean
  readonly user?: {
    readonly id: string
    readonly name: string
    readonly profile?: {
      readonly real_name?: string
      readonly email?: string
    }
  }
}

const fetchSlackUser = async (
  token: string,
  apiBase: string,
  userId: string,
): Promise<PlatformUser> => {
  return withSpan('slack.fetchUser', async () => {
    const res = await fetch(`${apiBase}/users.info`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `user=${userId}`,
    })
    const data = (await res.json()) as SlackUserResponse
    if (!data.ok || !data.user) {
      return {
        id: userId,
        platform: 'slack',
        username: userId,
        displayName: userId,
        email: null,
      }
    }
    return {
      id: data.user.id,
      platform: 'slack',
      username: data.user.name,
      displayName: data.user.profile?.real_name ?? data.user.name,
      email: data.user.profile?.email ?? null,
    }
  })
}

export const createNormalizeInbound = (
  token: string,
  apiBase: string,
  ctx: AdapterContext,
) => {
  return async (rawEvent: unknown): Promise<InboundMessage> => {
    return withSpan('slack.normalizeInbound', async (): Promise<InboundMessage> => {
      const payload = rawEvent as SlackEventPayload
      const event = payload.event ?? (rawEvent as SlackMessageEvent)

      const channel = event.channel ?? ''
      const threadTs = event.thread_ts ?? null
      const messageTs = event.ts ?? null

      ctx.channel = channel
      ctx.threadId = threadTs

      const user: PlatformUser = event.user
        ? await fetchSlackUser(token, apiBase, event.user)
        : {
            id: 'unknown',
            platform: 'slack',
            username: 'unknown',
            displayName: 'unknown',
            email: null,
          }

      const files: readonly InboundFile[] = (event.files ?? []).map((f) => ({
        id: f.id,
        filename: f.name,
        mimeType: f.mimetype,
        size: f.size,
        downloadUrl: f.url_private ?? null,
      }))

      const platformRef: PlatformRef = {
        platform: 'slack',
        channelId: channel,
        threadId: threadTs,
        messageTs,
      }

      return {
        id: messageTs ?? generateId(),
        platform: 'slack',
        platformRef,
        user,
        text: event.text ?? '',
        threadId: threadTs,
        mentions: [],
        files,
        rawEvent,
        timestamp: new Date(),
      }
    })
  }
}
