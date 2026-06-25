import type { ResponseEnvelope } from '@atlas/types'
import { withSpan } from '@atlas/otel'

type AdapterContext = {
  channel: string
  threadId: string | null
}

type LinearGraphQLResponse = {
  readonly data?: {
    readonly commentCreate?: {
      readonly success: boolean
      readonly comment?: { readonly id: string }
    }
    readonly commentUpdate?: {
      readonly success: boolean
    }
  }
  readonly errors?: readonly { readonly message: string }[]
}

export const createSendResponse = (apiKey: string, apiBase: string, ctx: AdapterContext) => {
  return async (envelope: ResponseEnvelope): Promise<string> => {
    return withSpan('linear.sendResponse', async () => {
      const issueId = envelope.threadId ?? ctx.channel
      const mutation = `mutation { commentCreate(input: { issueId: "${issueId}", body: ${JSON.stringify(envelope.text)} }) { success comment { id } } }`
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
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
      return commentId
    })
  }
}

export const createUpdateResponse = (apiKey: string, apiBase: string, _ctx: AdapterContext) => {
  return async (messageId: string, envelope: ResponseEnvelope): Promise<void> => {
    return withSpan('linear.updateResponse', async () => {
      const mutation = `mutation { commentUpdate(input: { id: "${messageId}", body: ${JSON.stringify(envelope.text)} }) { success } }`
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: {
          Authorization: apiKey,
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
