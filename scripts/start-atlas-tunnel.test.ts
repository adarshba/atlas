import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'

const packageJsonUrl = new URL('../package.json', import.meta.url)
const scriptUrl = new URL('./start-atlas-tunnel.sh', import.meta.url)

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
