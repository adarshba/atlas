import type { PlatformAdapter, PlatformUser } from '@atlas/types'
import { withSpan } from '@atlas/otel'
import { DISCORD_CAPABILITIES } from './capabilities'
import { createNormalizeInbound, fetchDiscordUser } from './normalize'
import { createSendResponse, createUpdateResponse } from './respond'
import { createStartStream, createAppendStream, createStopStream } from './stream'
import { createSetStatus, createClearStatus } from './status'

export type DiscordConfig = {
  readonly botToken: string
  readonly applicationId: string
}

type AdapterContext = {
  channel: string
  threadId: string | null
}

export const createDiscordAdapter = (config: DiscordConfig): PlatformAdapter => {
  const token = config.botToken
  const apiBase = 'https://discord.com/api/v10'

  const ctx: AdapterContext = {
    channel: '',
    threadId: null,
  }

  const normalizeInbound = createNormalizeInbound(ctx)
  const sendResponse = createSendResponse(token, apiBase, ctx)
  const updateResponse = createUpdateResponse(token, apiBase, ctx)
  const startStream = createStartStream(token, apiBase, ctx)
  const appendStream = createAppendStream(token, apiBase, ctx)
  const stopStream = createStopStream(token, apiBase, ctx)
  const setStatus = createSetStatus()
  const clearStatus = createClearStatus()

  const getCapabilities = () => DISCORD_CAPABILITIES

  const resolveUser = async (
    platformUserId: string,
    _teamId: string,
  ): Promise<PlatformUser> => {
    return withSpan('discord.resolveUser', async (): Promise<PlatformUser> => {
      return fetchDiscordUser(token, apiBase, platformUserId)
    })
  }

  return {
    platform: 'discord',
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
