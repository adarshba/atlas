import type { Runtime } from '@atlas/core'
import type { ServerOptions } from '@atlas/types'

export const createServer = (options: ServerOptions<Runtime>) => {
  const routes = options.routes ?? []

  return Bun.serve({
    port: options.port,
    async fetch(req): Promise<Response> {
      const url = new URL(req.url)

      if (req.method === 'GET' && url.pathname === '/health') {
        return Response.json({ status: 'ok' })
      }

      const route = routes.find((r) => r.method === req.method && r.path === url.pathname)
      if (route) {
        return route.handler(req, url)
      }

      if (req.method === 'POST') {
        const webhookRoute = options.webhooks.find((w) => w.path === url.pathname)
        if (!webhookRoute) return new Response('Not found', { status: 404 })

        const result = await webhookRoute.handler(req)
        if (!result.ok) return result.response

        const channelId = result.message.platformRef.channelId
        void options.runtime
          .handleMessage(result.message)
          .then(async (response) => {
            await webhookRoute.adapter.sendResponse({
              text: response,
              blocks: null,
              threadId: channelId,
            })
          })
          .catch((err: unknown) => {
            console.error(
              `${webhookRoute.platform} webhook processing error:`,
              err instanceof Error ? err.message : String(err),
            )
          })

        return new Response('OK', { status: 200 })
      }

      return new Response('Not found', { status: 404 })
    },
  })
}
