import type {
  PlatformAdapter,
  PlatformUser,
  LinearConfig,
  AuthTokenProvider,
  OAuthChecker,
  AdapterContext,
  LinearUserResponse,
} from '@atlas/types'
import type { Redis } from '@atlas/cache'
import { withSpan } from '@atlas/otel'
import { LINEAR_CAPABILITIES } from './capabilities'
import { createNormalizeInbound } from './normalize'
import { createSendResponse, createUpdateResponse } from './respond'
import { createStartStream, createAppendStream, createStopStream } from './stream'
import { createSetStatus, createClearStatus } from './status'
import { getToken } from './oauth'

export type LinearAdapterOptions = {
  readonly config: LinearConfig
  readonly redis: Redis
}

export const createLinearAdapter = (options: LinearAdapterOptions): PlatformAdapter => {
  const { config, redis } = options
  const fallbackApiKey = config.apiKey
  const apiBase = 'https://api.linear.app/graphql'

  const ctx: AdapterContext = {
    channel: '',
    threadId: null,
  }

  const sentCommentIds = new Set<string>()

  const getAuthToken: AuthTokenProvider = async () => {
    const oauthToken = await getToken(redis)
    if (oauthToken) return `Bearer ${oauthToken}`
    return fallbackApiKey
  }

  const isOAuth: OAuthChecker = async () => {
    const oauthToken = await getToken(redis)
    return oauthToken !== null
  }

  const normalizeInbound = createNormalizeInbound(getAuthToken, apiBase, ctx, sentCommentIds)
  const sendResponse = createSendResponse(getAuthToken, isOAuth, apiBase, ctx, sentCommentIds)
  const updateResponse = createUpdateResponse(getAuthToken, apiBase, ctx)
  const startStream = createStartStream()
  const appendStream = createAppendStream()
  const stopStream = createStopStream()
  const setStatus = createSetStatus()
  const clearStatus = createClearStatus()

  const getCapabilities = () => LINEAR_CAPABILITIES

  const resolveUser = async (platformUserId: string, _teamId: string): Promise<PlatformUser> => {
    return withSpan('linear.resolveUser', async (): Promise<PlatformUser> => {
      const token = await getAuthToken()
      const query = `query { user(id: "${platformUserId}") { id name email } }`
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
          id: platformUserId,
          platform: 'linear',
          username: platformUserId,
          displayName: platformUserId,
          email: null,
        }
      }
      const data = (await res.json()) as LinearUserResponse
      const user = data.data?.user
      if (!user) {
        return {
          id: platformUserId,
          platform: 'linear',
          username: platformUserId,
          displayName: platformUserId,
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

  return {
    platform: 'linear',
    normalizeInbound,
    sendResponse,
    updateResponse,
    startStream,
    appendStream,
    stopStream,
    setStatus,
    clearStatus,
    getCapabilities,
    resolveUser,
  }
}
