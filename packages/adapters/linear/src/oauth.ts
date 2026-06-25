import type { Redis } from '@atlas/cache'
import type { LinearOAuthConfig, LinearTokenResponse } from '@atlas/types'

const TOKEN_KEY = 'linear:oauth:access_token'

export const buildAuthorizeUrl = (config: LinearOAuthConfig, state: string): string => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
    scope: 'read,write',
  })
  return `https://linear.app/oauth/authorize?${params.toString()}`
}

export const exchangeCodeForToken = async (
  config: LinearOAuthConfig,
  code: string,
): Promise<LinearTokenResponse> => {
  const res = await fetch('https://api.linear.app/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Linear OAuth token exchange failed: ${res.status} ${body}`)
  }
  return (await res.json()) as LinearTokenResponse
}

export const storeToken = async (redis: Redis, token: string): Promise<void> => {
  await redis.set(TOKEN_KEY, token)
}

export const getToken = async (redis: Redis): Promise<string | null> => {
  return await redis.get(TOKEN_KEY)
}
