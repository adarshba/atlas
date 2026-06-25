export type LinearOAuthConfig = {
  readonly clientId: string
  readonly clientSecret: string
  readonly redirectUri: string
}

export type LinearTokenResponse = {
  readonly access_token: string
  readonly token_type: string
  readonly expires_in: number
  readonly scope: string
}

export type LinearUserResponse = {
  readonly data?: {
    readonly user?: {
      readonly id: string
      readonly name: string
      readonly email?: string
    }
  }
  readonly errors?: readonly { readonly message: string }[]
}

export type LinearWebhookData = {
  readonly id?: string
  readonly body?: string
  readonly userId?: string
  readonly issueId?: string
  readonly issue?: {
    readonly id: string
    readonly identifier: string
  }
  readonly user?: {
    readonly id: string
    readonly name: string
    readonly email?: string
  }
}

export type LinearWebhookEvent = {
  readonly type?: string
  readonly data?: LinearWebhookData
}

export type LinearGraphQLResponse = {
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
