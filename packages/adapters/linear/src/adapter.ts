import type { PlatformAdapter, PlatformUser } from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { LINEAR_CAPABILITIES } from './capabilities'
import { createNormalizeInbound } from './normalize'
import { createSendResponse, createUpdateResponse } from './respond'
import { createStartStream, createAppendStream, createStopStream } from './stream'
import { createSetStatus, createClearStatus } from './status'

export type LinearConfig = {
  readonly apiKey: string
  readonly webhookSecret: string
}

type AdapterContext = {
  channel: string
  threadId: string | null
}

type LinearUserResponse = {
  readonly data?: {
    readonly user?: {
      readonly id: string
      readonly name: string
      readonly email?: string
    }
  }
  readonly errors?: readonly { readonly message: string }[]
}

export const createLinearAdapter = (config: LinearConfig): PlatformAdapter => {
  const apiKey = config.apiKey
  const apiBase = 'https://api.linear.app/graphql'

  const ctx: AdapterContext = {
    channel: '',
    threadId: null,
  }

  const normalizeInbound = createNormalizeInbound(apiKey, apiBase, ctx)
  const sendResponse = createSendResponse(apiKey, apiBase, ctx)
  const updateResponse = createUpdateResponse(apiKey, apiBase, ctx)
  const startStream = createStartStream()
  const appendStream = createAppendStream()
  const stopStream = createStopStream()
  const setStatus = createSetStatus()
  const clearStatus = createClearStatus()

  const getCapabilities = () => LINEAR_CAPABILITIES

  const resolveUser = async (
    platformUserId: string,
    _teamId: string,
  ): Promise<PlatformUser> => {
    return withSpan('linear.resolveUser', async (): Promise<PlatformUser> => {
      const query = `query { user(id: "${platformUserId}") { id name email } }`
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: {
          Authorization: apiKey,
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
