import type { ToolDefinition, ToolResult, ToolExecutionContext } from '@atlas/types'
import { withSpan } from '@atlas/otel'

const MAX_OUTPUT_SIZE = 50000

export const truncateOutput = (output: unknown): unknown => {
  if (typeof output === 'string' && output.length > MAX_OUTPUT_SIZE) {
    return {
      _truncated: true,
      _originalSize: output.length,
      _preview: output.slice(0, MAX_OUTPUT_SIZE),
    }
  }
  if (typeof output === 'object' && output !== null && !Array.isArray(output)) {
    const obj = output as Record<string, unknown>
    if (typeof obj.content === 'string' && obj.content.length > MAX_OUTPUT_SIZE) {
      return {
        ...obj,
        content: obj.content.slice(0, MAX_OUTPUT_SIZE),
        _truncated: true,
      }
    }
    if (typeof obj.data === 'string' && obj.data.length > MAX_OUTPUT_SIZE) {
      return {
        ...obj,
        data: obj.data.slice(0, MAX_OUTPUT_SIZE),
        _truncated: true,
      }
    }
  }
  return output
}

export const executeTool = async (
  tool: ToolDefinition,
  input: unknown,
  context: ToolExecutionContext,
): Promise<ToolResult> => {
  return withSpan('tool.execute', async (span) => {
    span.setAttribute('tool.name', tool.name)
    const start = Date.now()
    try {
      const result = await tool.execute(input, context)
      const duration = Date.now() - start
      span.setAttribute('tool.duration', duration)
      span.setAttribute('tool.success', result.success)
      return {
        ...result,
        output: truncateOutput(result.output),
      }
    } catch (error) {
      const duration = Date.now() - start
      span.setAttribute('tool.duration', duration)
      span.setAttribute('tool.success', false)
      const errorMsg = error instanceof Error ? error.message : String(error)
      span.recordException(error as Error)
      return {
        success: false,
        output: null,
        error: errorMsg,
      }
    }
  })
}
