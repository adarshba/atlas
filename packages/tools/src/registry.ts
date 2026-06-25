import type { ToolDefinition, ToolRegistry } from '@atlas/types'

export const createToolRegistry = (): ToolRegistry => {
  const tools = new Map<string, ToolDefinition>()

  const register = (tool: ToolDefinition): void => {
    tools.set(tool.name, tool)
  }

  const get = (name: string): ToolDefinition | null => {
    return tools.get(name) ?? null
  }

  const list = (): readonly ToolDefinition[] => {
    return Array.from(tools.values())
  }

  return { register, get, list }
}
