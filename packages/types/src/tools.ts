import type { z } from 'zod'

export type ToolDefinition = {
  readonly name: string
  readonly description: string
  readonly inputSchema: z.ZodType
  execute: (input: unknown, context: ToolExecutionContext) => Promise<ToolResult>
}

export type ToolExecutionContext = {
  readonly sessionId: string
  readonly correlationId: string
  readonly platform: string
}

export type ToolResult = {
  readonly success: boolean
  readonly output: unknown
  readonly error: string | null
}

export type ToolExecution = {
  readonly id: string
  readonly toolName: string
  readonly input: unknown
  readonly output: unknown
  readonly duration: number
  readonly success: boolean
  readonly error: string | null
  readonly timestamp: Date
}

export type ToolRegistry = {
  register: (tool: ToolDefinition) => void
  get: (name: string) => ToolDefinition | null
  list: () => readonly ToolDefinition[]
}
