# Webhook Route Registry Refactor

- [x] Add shared `WebhookHandler` type in `@atlas/types`
- [x] Add `createWebhookHandler(config, adapter)` exports in Linear and Slack adapters
- [x] Refactor `apps/atlas/src/server.ts` to accept a route registry
- [x] Refactor `apps/atlas/src/index.ts` to register adapters generically
- [x] Remove unused `@atlas/slack` dependency and update `banner.ts`
- [x] Run `bun run format`, `bun run lint`, `bunx tsc --noEmit -p tsconfig.base.json`, and `bun run build`

## Review

- All verification passed: lint clean, typecheck clean, build clean, 3/3 tests pass
- `WebhookHandler` / `WebhookHandlerResult` / `WebhookRoute` types added to `@atlas/types`
- Linear and Slack adapters each export `createWebhookHandler(config, adapter)` with platform-specific signature verification
- `server.ts` is now platform-agnostic: routes via `webhooks: readonly WebhookRoute[]`
- `index.ts` builds the route registry generically from configured adapters
- `@atlas/slack` removed from `apps/atlas/package.json` deps (adapter package still exists for future use)
- `banner.ts` shows Linear/Slack adapter status
- TDD: failing tests written first, verified red, then implemented to green
