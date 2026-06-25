import type { InboundMessage } from '@atlas/types'
import type { RuntimeServices } from './locator'
import { setRuntimeServices, getRuntimeServices } from './locator'
import { createSessionStore, type SessionStore } from './session'
import { runPipeline } from './pipeline'
import { withSpan } from '@atlas/otel'

export type Runtime = {
  readonly handleMessage: (message: InboundMessage) => Promise<string>
  readonly sessionStore: SessionStore
  readonly shutdown: () => Promise<void>
}

export const createRuntime = (services: RuntimeServices): Runtime => {
  setRuntimeServices(services)
  const sessionStore = createSessionStore(services.redis)

  const ensureSession = async (message: InboundMessage): Promise<string> => {
    const threadId = message.threadId
    if (threadId !== null) {
      const existing = await sessionStore.get(threadId)
      if (existing) return threadId
      const created = await sessionStore.create(
        message.platform,
        message.platformRef,
        message.user.id,
        threadId,
      )
      return created.id
    }
    const created = await sessionStore.create(
      message.platform,
      message.platformRef,
      message.user.id,
    )
    return created.id
  }

  const handleMessage = async (message: InboundMessage): Promise<string> => {
    return withSpan('core.handleMessage', async (span) => {
      span.setAttribute('message.id', message.id)
      span.setAttribute('message.platform', message.platform)

      const sessionId = await ensureSession(message)
      span.setAttribute('session.id', sessionId)

      const response = await runPipeline(message, sessionId)

      await sessionStore.touch(sessionId)

      return response
    })
  }

  const shutdown = async (): Promise<void> => {
    const { eventBus } = getRuntimeServices()
    await eventBus.close()
  }

  return { handleMessage, sessionStore, shutdown }
}
