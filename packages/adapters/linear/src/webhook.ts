import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PlatformAdapter, WebhookHandler, WebhookHandlerResult } from '@atlas/types'
import type { LinearConfig } from './adapter'

const verifySignature = (body: string, signature: string, secret: string): boolean => {
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  if (signature.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export const createWebhookHandler = (
  config: LinearConfig,
  adapter: PlatformAdapter,
): WebhookHandler => {
  return async (request): Promise<WebhookHandlerResult> => {
    const body = await request.text()

    if (config.webhookSecret) {
      const signature =
        request.headers.get('Linear-Signature') ?? request.headers.get('X-Linear-Signature') ?? ''
      if (!signature || !verifySignature(body, signature, config.webhookSecret)) {
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
        'Linear webhook normalize error:',
        err instanceof Error ? err.message : String(err),
      )
      return { ok: false, response: new Response('Bad request', { status: 400 }) }
    }
  }
}
