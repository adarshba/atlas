import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'

const packageJsonUrl = new URL('../package.json', import.meta.url)
const scriptUrl = new URL('../scripts/start-atlas-tunnel.sh', import.meta.url)
const appPackageJsonUrl = new URL('../apps/atlas/package.json', import.meta.url)
const mcpTomlUrl = new URL('../mcp.toml', import.meta.url)

describe('Atlas tunnel startup', () => {
  test('exposes the tunnel startup command through package.json', async () => {
    const packageJson = await readFile(packageJsonUrl, 'utf8')

    expect(packageJson).toContain('"dev:tunnel": "bash scripts/start-atlas-tunnel.sh"')
  })

  test('starts the Atlas dev server behind the named Cloudflare tunnel', async () => {
    const script = await readFile(scriptUrl, 'utf8')

    expect(script).toContain('ATLAS_PORT="${ATLAS_PORT:-3000}"')
    expect(script).toContain('ATLAS_TUNNEL_NAME="${ATLAS_TUNNEL_NAME:-atlas}"')
    expect(script).toContain('ATLAS_PUBLIC_DOMAIN="${ATLAS_PUBLIC_DOMAIN:-atlas.kaizenops.in}"')
    expect(script).toContain('ATLAS_PORT="$ATLAS_PORT" bun run dev &')
    expect(script).toContain(
      'cloudflared tunnel run --url "$ATLAS_TUNNEL_URL" "$ATLAS_TUNNEL_NAME" &',
    )
  })
})

describe('Atlas MCP startup', () => {
  test('ships configurable MCP servers', async () => {
    const mcpToml = await readFile(mcpTomlUrl, 'utf8')

    expect(mcpToml).toContain('[mcp_servers.filesystem]')
    expect(mcpToml).toContain('[mcp_servers.github]')
    expect(mcpToml).toContain('[mcp_servers.bitbucket]')
    expect(mcpToml).toContain('type = "http"')
    expect(mcpToml).toContain('type = "stdio"')
    expect(mcpToml).toContain('url = "https://api.githubcopilot.com/mcp/"')
    expect(mcpToml).toContain('@nexus2520/bitbucket-mcp-server')
    expect(mcpToml).toContain('bearer_token_env = "GITHUB_PERSONAL_ACCESS_TOKEN"')
    expect(mcpToml).toContain('BITBUCKET_USERNAME')
    expect(mcpToml).toContain('enabled = false')
  })

  test('declares the stable MCP SDK dependency for the Atlas app', async () => {
    const packageJson = await readFile(appPackageJsonUrl, 'utf8')

    expect(packageJson).toContain('"@modelcontextprotocol/sdk": "^1.29.0"')
  })
})
