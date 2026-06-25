import type { Runtime } from '@atlas/core'
import type { WebhookRoute } from '@atlas/types'

export const createServer = (options: {
  readonly port: number
  readonly runtime: Runtime
  readonly webhooks: readonly WebhookRoute[]
}) => {
  return Bun.serve({
    port: options.port,
    async fetch(req): Promise<Response> {
      const url = new URL(req.url)

      if (req.method === 'GET' && url.pathname === '/health') {
        return Response.json({ status: 'ok' })
      }

      if (req.method === 'POST') {
        const route = options.webhooks.find((webhook) => webhook.path === url.pathname)
        if (!route) return new Response('Not found', { status: 404 })

        const result = await route.handler(req)
        if (!result.ok) return result.response

        const channelId = result.message.platformRef.channelId
        void options.runtime
          .handleMessage(result.message)
          .then(async (response) => {
            await route.adapter.sendResponse({
              text: response,
              blocks: null,
              threadId: channelId,
            })
          })
          .catch((err: unknown) => {
            console.error(
              `${route.platform} webhook processing error:`,
              err instanceof Error ? err.message : String(err),
            )
          })

        return new Response('OK', { status: 200 })
      }

      return new Response('Not found', { status: 404 })
    },
  })
}
