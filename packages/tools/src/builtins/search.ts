import { z } from 'zod'
import type { ToolDefinition, ToolResult, ToolExecutionContext } from '@atlas/types'

const searchInputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(10).default(5),
})

export const createSearchTool = (): ToolDefinition => ({
  name: 'search',
  description: 'Search the web for information',
  inputSchema: searchInputSchema,
  execute: async (input: unknown, _context: ToolExecutionContext): Promise<ToolResult> => {
    const parsed = searchInputSchema.parse(input)
    return {
      success: true,
      output: { query: parsed.query, results: [] },
      error: null,
    }
  },
})
