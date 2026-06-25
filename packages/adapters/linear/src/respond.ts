import type {
  ResponseEnvelope,
  AuthTokenProvider,
  OAuthChecker,
  AdapterContext,
  LinearGraphQLResponse,
} from '@atlas/types'
import { withSpan } from '@atlas/otel'

const ATLAS_DISPLAY_NAME = 'Atlas'
const ATLAS_DISPLAY_ICON_URL =
  'https://ui-avatars.com/api/?name=Atlas&background=5e6ad2&color=fff&bold=true&size=128'

const buildCreateMutation = (issueId: string, body: string, useOAuth: boolean): string => {
  const baseInput = `issueId: "${issueId}", body: ${JSON.stringify(body)}`
  const oauthFields = useOAuth
    ? `, createAsUser: ${JSON.stringify(ATLAS_DISPLAY_NAME)}, displayIconUrl: ${JSON.stringify(ATLAS_DISPLAY_ICON_URL)}`
    : ''
  return `mutation { commentCreate(input: { ${baseInput}${oauthFields} }) { success comment { id } } }`
}

export const createSendResponse = (
  getAuthToken: AuthTokenProvider,
  isOAuth: OAuthChecker,
  apiBase: string,
  ctx: AdapterContext,
  sentCommentIds: Set<string>,
) => {
  return async (envelope: ResponseEnvelope): Promise<string> => {
    return withSpan('linear.sendResponse', async () => {
      const token = await getAuthToken()
      const useOAuth = await isOAuth()
      const issueId = envelope.threadId ?? ctx.channel
      const mutation = buildCreateMutation(issueId, envelope.text, useOAuth)
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          ...(useOAuth ? { 'Linear-Actor': 'app' } : {}),
        },
        body: JSON.stringify({ query: mutation }),
      })
      const data = (await res.json()) as LinearGraphQLResponse
      if (data.errors) {
        throw new Error(`Linear sendResponse failed: ${data.errors[0]?.message ?? 'unknown'}`)
      }
      const commentId = data.data?.commentCreate?.comment?.id
      if (!commentId) {
        throw new Error('Linear sendResponse: no comment id returned')
      }
      sentCommentIds.add(commentId)
      return commentId
    })
  }
}

export const createUpdateResponse = (
  getAuthToken: AuthTokenProvider,
  apiBase: string,
  _ctx: AdapterContext,
) => {
  return async (messageId: string, envelope: ResponseEnvelope): Promise<void> => {
    return withSpan('linear.updateResponse', async () => {
      const token = await getAuthToken()
      const mutation = `mutation { commentUpdate(input: { id: "${messageId}", body: ${JSON.stringify(envelope.text)} }) { success } }`
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: mutation }),
      })
      const data = (await res.json()) as LinearGraphQLResponse
      if (data.errors) {
        throw new Error(`Linear updateResponse failed: ${data.errors[0]?.message ?? 'unknown'}`)
      }
    })
  }
}
