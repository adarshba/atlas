import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PlatformAdapter, WebhookHandler, WebhookHandlerResult } from '@atlas/types'
import type { SlackConfig } from './adapter'

const verifySignature = (
  body: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean => {
  const expected = `v0=${createHmac('sha256', secret)
    .update(`v0:${timestamp}:${body}`)
    .digest('hex')}`
  if (signature.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export const createWebhookHandler = (
  config: SlackConfig,
  adapter: PlatformAdapter,
): WebhookHandler => {
  return async (request): Promise<WebhookHandlerResult> => {
    const body = await request.text()

    if (config.signingSecret) {
      const timestamp = request.headers.get('X-Slack-Request-Timestamp') ?? ''
      const signature = request.headers.get('X-Slack-Signature') ?? ''
      if (
        !timestamp ||
        !signature ||
        !verifySignature(body, timestamp, signature, config.signingSecret)
      ) {
        return { ok: false, response: new Response('Invalid signature', { status: 401 }) }
      }
    }

    let rawEvent: unknown
    try {
      rawEvent = JSON.parse(body)
    } catch {
      return { ok: false, response: new Response('Invalid JSON', { status: 400 }) }
    }

    try {
      return { ok: true, message: await adapter.normalizeInbound(rawEvent) }
    } catch (err: unknown) {
      console.error(
        'Slack webhook normalize error:',
        err instanceof Error ? err.message : String(err),
      )
      return { ok: false, response: new Response('Bad request', { status: 400 }) }
    }
  }
}
