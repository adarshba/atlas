import type { PlatformAdapter, PlatformUser } from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { SLACK_CAPABILITIES } from './capabilities'
import { createNormalizeInbound } from './normalize'
import { createSendResponse, createUpdateResponse } from './respond'
import { createStartStream, createAppendStream, createStopStream } from './stream'
import { createSetStatus, createClearStatus } from './status'

export type SlackConfig = {
  readonly botToken: string
  readonly signingSecret: string
}

type AdapterContext = {
  channel: string
  threadId: string | null
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

export const createSlackAdapter = (config: SlackConfig): PlatformAdapter => {
  const token = config.botToken
  const apiBase = 'https://slack.com/api'

  const ctx: AdapterContext = {
    channel: '',
    threadId: null,
  }

  const normalizeInbound = createNormalizeInbound(token, apiBase, ctx)
  const sendResponse = createSendResponse(token, apiBase, ctx)
  const updateResponse = createUpdateResponse(token, apiBase, ctx)
  const startStream = createStartStream(token, apiBase, ctx)
  const appendStream = createAppendStream(token, apiBase, ctx)
  const stopStream = createStopStream(token, apiBase, ctx)
  const setStatus = createSetStatus()
  const clearStatus = createClearStatus()

  const getCapabilities = () => SLACK_CAPABILITIES

  const resolveUser = async (
    platformUserId: string,
    _teamId: string,
  ): Promise<PlatformUser> => {
    return withSpan('slack.resolveUser', async (): Promise<PlatformUser> => {
      const res = await fetch(`${apiBase}/users.info`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user=${platformUserId}`,
      })
      const data = (await res.json()) as SlackUserResponse
      if (!data.ok || !data.user) {
        return {
          id: platformUserId,
          platform: 'slack',
          username: platformUserId,
          displayName: platformUserId,
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

  return {
    platform: 'slack',
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
