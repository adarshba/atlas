export type DiscordAuthor = {
  readonly id: string
  readonly username: string
  readonly global_name?: string
}

export type DiscordAttachment = {
  readonly id: string
  readonly filename: string
  readonly content_type?: string
  readonly size: number
  readonly url: string
}

export type DiscordMessageData = {
  readonly id?: string
  readonly channel_id?: string
  readonly content?: string
  readonly author?: DiscordAuthor
  readonly attachments?: readonly DiscordAttachment[]
  readonly thread?: { readonly id: string }
}

export type DiscordEventPayload = {
  readonly type?: string
  readonly data?: DiscordMessageData
}

export type DiscordUserResponse = {
  readonly id: string
  readonly username: string
  readonly global_name?: string
}

export type DiscordMessageResponse = {
  readonly id: string
}
