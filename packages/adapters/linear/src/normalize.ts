import type {
  InboundMessage,
  PlatformRef,
  PlatformUser,
  AuthTokenProvider,
  AdapterContext,
  LinearUserResponse,
  LinearWebhookData,
  LinearWebhookEvent,
} from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { generateId } from '@atlas/primitives'

const fetchLinearUser = async (
  getAuthToken: AuthTokenProvider,
  apiBase: string,
  userId: string,
): Promise<PlatformUser> => {
  return withSpan('linear.fetchUser', async () => {
    const token = await getAuthToken()
    const query = `query { user(id: "${userId}") { id name email } }`
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) {
      return {
        id: userId,
        platform: 'linear',
        username: userId,
        displayName: userId,
        email: null,
      }
    }
    const data = (await res.json()) as LinearUserResponse
    const user = data.data?.user
    if (!user) {
      return {
        id: userId,
        platform: 'linear',
        username: userId,
        displayName: userId,
        email: null,
      }
    }
    return {
      id: user.id,
      platform: 'linear',
      username: user.name,
      displayName: user.name,
      email: user.email ?? null,
    }
  })
}

export const createNormalizeInbound = (
  getAuthToken: AuthTokenProvider,
  apiBase: string,
  ctx: AdapterContext,
  sentCommentIds: Set<string>,
) => {
  return async (rawEvent: unknown): Promise<InboundMessage> => {
    return withSpan('linear.normalizeInbound', async (): Promise<InboundMessage> => {
      const payload = rawEvent as LinearWebhookEvent
      const data = payload.data ?? (rawEvent as LinearWebhookData)

      const issueId = data.issueId ?? data.issue?.id ?? ''
      const commentId = data.id ?? generateId()

      if (sentCommentIds.has(commentId)) {
        throw new Error('Skipping comment created by Atlas')
      }

      ctx.channel = issueId
      ctx.threadId = null

      const userId = data.userId ?? data.user?.id ?? 'unknown'
      const user: PlatformUser = data.user
        ? {
            id: data.user.id,
            platform: 'linear',
            username: data.user.name,
            displayName: data.user.name,
            email: data.user.email ?? null,
          }
        : await fetchLinearUser(getAuthToken, apiBase, userId)

      const platformRef: PlatformRef = {
        platform: 'linear',
        channelId: issueId,
        threadId: null,
        messageTs: commentId,
      }

      return {
        id: commentId,
        platform: 'linear',
        platformRef,
        user,
        text: data.body ?? '',
        threadId: null,
        mentions: [],
        files: [],
        rawEvent,
        timestamp: new Date(),
      }
    })
  }
}
