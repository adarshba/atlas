import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { z } from 'zod'
import type { McpServerConfig, ToolRegistry } from '@atlas/types'

const createMcpTransport = (server: McpServerConfig) => {
  if (server.transport === 'stdio') {
    return new StdioClientTransport({
      command: server.command ?? '',
      args: [...server.args],
      ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
      ...(server.cwd !== null ? { cwd: server.cwd } : {}),
      stderr: 'pipe',
    })
  }

  const requestInit = Object.keys(server.headers).length > 0 ? { headers: server.headers } : {}
  return new StreamableHTTPClientTransport(new URL(server.url ?? ''), { requestInit })
}

export const registerMcpServers = async (
  servers: readonly McpServerConfig[],
  tools: ToolRegistry,
): Promise<readonly (() => Promise<void>)[]> => {
  const closeMcpClients: Array<() => Promise<void>> = []

  for (const server of servers) {
    if (!server.enabled) {
      continue
    }

    const client = new Client({ name: 'atlas', version: '0.0.1' })
    const transport = createMcpTransport(server)

    if (transport instanceof StdioClientTransport) {
      transport.stderr?.on('data', (chunk: Buffer) => {
        console.error(`[mcp:${server.name}] ${chunk.toString().trimEnd()}`)
      })
    }

    try {
      await client.connect(transport as unknown as Transport, { timeout: server.timeoutMs })
      const result = await client.listTools({}, { timeout: server.timeoutMs })
      for (const tool of result.tools) {
        const toolName = `${server.name}.${tool.name}`
        tools.register({
          name: toolName,
          description: tool.description ?? `MCP tool ${tool.name} from ${server.name}`,
          inputSchema: z.record(z.unknown()),
          execute: async (input: unknown) => {
            const argumentsValue: Record<string, unknown> =
              input !== null && typeof input === 'object' && !Array.isArray(input)
                ? { ...input }
                : {}
            const response = await client.callTool(
              { name: tool.name, arguments: argumentsValue },
              undefined,
              { timeout: server.timeoutMs },
            )

            return {
              success: !response.isError,
              output: response.content,
              error: response.isError ? `MCP tool ${toolName} returned an error` : null,
            }
          },
        })
      }

      closeMcpClients.push(() => client.close())
      console.log(`  MCP:       ${server.name} registered ${result.tools.length} tool(s)`)
    } catch (error: unknown) {
      await client.close().catch(() => undefined)
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`  MCP:       ${server.name} unavailable (${message})`)
    }
  }

  return closeMcpClients
}
