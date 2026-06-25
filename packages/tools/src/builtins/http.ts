import { z } from 'zod'
import type { ToolDefinition, ToolResult, ToolExecutionContext } from '@atlas/types'

const httpInputSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
})

export const createHttpTool = (): ToolDefinition => ({
  name: 'http',
  description: 'Make an HTTP request to a URL',
  inputSchema: httpInputSchema,
  execute: async (input: unknown, _context: ToolExecutionContext): Promise<ToolResult> => {
    const parsed = httpInputSchema.parse(input)
    try {
      const response = await fetch(parsed.url, {
        method: parsed.method,
        headers: parsed.headers,
        body: parsed.body,
      })
      const text = await response.text()
      return {
        success: true,
        output: { status: response.status, body: text },
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
})
