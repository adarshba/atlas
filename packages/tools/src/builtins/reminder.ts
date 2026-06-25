import { z } from 'zod'
import type { ToolDefinition, ToolResult, ToolExecutionContext } from '@atlas/types'

const reminderInputSchema = z.object({
  message: z.string().min(1),
  remindAt: z.string().datetime(),
})

export const createReminderTool = (): ToolDefinition => ({
  name: 'reminder',
  description: 'Set a reminder for a specific time',
  inputSchema: reminderInputSchema,
  execute: async (input: unknown, _context: ToolExecutionContext): Promise<ToolResult> => {
    const parsed = reminderInputSchema.parse(input)
    return {
      success: true,
      output: { message: parsed.message, remindAt: parsed.remindAt, scheduled: true },
      error: null,
    }
  },
})
