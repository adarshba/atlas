export type SlackFile = {
  readonly id: string
  readonly name: string
  readonly mimetype: string
  readonly size: number
  readonly url_private?: string
}

export type SlackMessageEvent = {
  readonly type?: string
  readonly user?: string
  readonly text?: string
  readonly channel?: string
  readonly ts?: string
  readonly thread_ts?: string
  readonly files?: readonly SlackFile[]
}

export type SlackEventPayload = {
  readonly type?: string
  readonly event?: SlackMessageEvent
  readonly team_id?: string
}

export type SlackUserResponse = {
  readonly ok: boolean
  readonly user?: {
    readonly id: string
    readonly name: string
    readonly profile?: {
      readonly real_name?: string
      readonly email?: string
    }
  }
}

export type SlackApiResponse = {
  readonly ok: boolean
  readonly ts?: string
  readonly error?: string
}
