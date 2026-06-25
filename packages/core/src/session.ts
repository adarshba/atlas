import type { Redis } from '@atlas/cache'
import type { Session, PlatformRef } from '@atlas/types'
import { generateId } from '@atlas/primitives'
import { withSpan } from '@atlas/otel'
import { get as cacheGet, set as cacheSet } from '@atlas/cache'

export type SessionStore = {
  readonly create: (platform: string, platformRef: PlatformRef, userId: string, id?: string) => Promise<Session>
  readonly get: (id: string) => Promise<Session | null>
  readonly update: (id: string, patch: Partial<Session>) => Promise<Session | null>
  readonly touch: (id: string) => Promise<void>
}

const SESSION_TTL = 3600

const sessionKey = (id: string): string => `atlas:session:${id}`

export const createSessionStore = (redis: Redis): SessionStore => {
  const create = async (
    platform: string,
    platformRef: PlatformRef,
    userId: string,
    id?: string,
  ): Promise<Session> => {
    return withSpan('session.create', async (span) => {
      span.setAttribute('session.platform', platform)
      const session: Session = {
        id: id ?? generateId(),
        platform,
        platformRef,
        userId,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        messageCount: 0,
        metadata: {
          title: null,
          tags: [],
          custom: {},
        },
      }
      await cacheSet(redis, sessionKey(session.id), JSON.stringify(session), SESSION_TTL)
      return session
    })
  }

  const get = async (id: string): Promise<Session | null> => {
    return withSpan('session.get', async (span) => {
      span.setAttribute('session.id', id)
      const raw = await cacheGet(redis, sessionKey(id))
      if (!raw) return null
      return JSON.parse(raw) as Session
    })
  }

  const update = async (id: string, patch: Partial<Session>): Promise<Session | null> => {
    return withSpan('session.update', async (span) => {
      span.setAttribute('session.id', id)
      const existing = await get(id)
      if (!existing) return null
      const updated: Session = { ...existing, ...patch, lastActiveAt: new Date() }
      await cacheSet(redis, sessionKey(id), JSON.stringify(updated), SESSION_TTL)
      return updated
    })
  }

  const touch = async (id: string): Promise<void> => {
    return withSpan('session.touch', async (span) => {
      span.setAttribute('session.id', id)
      const raw = await cacheGet(redis, sessionKey(id))
      if (!raw) return
      const session = JSON.parse(raw) as Session
      const updated: Session = { ...session, lastActiveAt: new Date() }
      await cacheSet(redis, sessionKey(id), JSON.stringify(updated), SESSION_TTL)
    })
  }

  return { create, get, update, touch }
}
