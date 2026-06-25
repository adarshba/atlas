# Atlas MCP Configuration

- [x] Add root `mcp.toml` server configuration
- [x] Add typed MCP config to Atlas config
- [x] Load and validate `mcp.toml`
- [x] Connect enabled stdio and streamable HTTP MCP servers during Atlas startup
- [x] Register MCP tools into the Atlas tool registry
- [x] Close MCP clients during shutdown
- [x] Move smoke tests into dedicated `tests/` folder
- [x] Add disabled hosted GitHub streamable HTTP MCP server config
- [x] Add disabled Bitbucket MCP server config
- [x] Add `env_from` support for secret-safe MCP environment inheritance
- [x] Add `bearer_token_env` support for GitHub PAT header inheritance
- [x] Support standard-ish `type = "http"` alias for remote MCP servers
- [x] Move MCP runtime registration out of `apps/atlas/src/index.ts`
- [x] Run format, lint, typecheck, tests, build, and config smoke check

## Review

- `bunx prettier --write apps/atlas/package.json apps/atlas/src/index.ts packages/config/src/loader.ts packages/types/src/config.ts tests/start-atlas-tunnel.test.ts tasks/todo.md` passed.
- `bunx tsc --noEmit -p tsconfig.base.json` passed.
- `bun run test` passed with 4 tests.
- `bun run lint` passed.
- `bun run build` passed.
- `env ATLAS_AI_API_KEY=sk-test bun --print 'import { loadConfig } from "./packages/config/src/index.ts"; const config = loadConfig(); JSON.stringify(config.mcp)'` loaded `mcp.toml`.
