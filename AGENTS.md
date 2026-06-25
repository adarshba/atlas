# AGENTS.md

Coding standards for Atlas. Follow these rules when writing or modifying code.

## TypeScript

- **`type` aliases only** — never `interface`. Use `type Foo = { ... }`.
- **No `any`** — ESLint enforces `@typescript-eslint/no-explicit-any`. Use `unknown` and narrow.
- **Explicit type imports** — `import type { Foo }` for types, `import { foo }` for values. `verbatimModuleSyntax` is on.
- **`readonly` on all type properties** — `{ readonly foo: string }`, not `{ foo: string }`.
- **`exactOptionalPropertyTypes: true`** — optional props are `string | undefined`, not just `string`. Use conditional spread for optional params: `...(foo !== undefined ? { foo } : {})`.
- **`noUncheckedIndexedAccess: true`** — `arr[0]` returns `T | undefined`. Guard before use.
- **No local type definitions in app files** — types belong in the package that owns the domain. If you need a structural type, import the real type from the package, don't redefine it locally.
- **No classes** — use factory functions: `createX(options): X` returns an object literal with methods.

## Code Style

- **Zero comments** — code should be self-documenting. No inline comments, no block comments, no JSDoc.
- **No dead code** — every import, variable, and function must be used.
- **Semi-free** — no semicolons (Prettier enforced).
- **Single quotes** — `'foo'`, not `"foo"`.
- **Trailing commas** — always (Prettier enforced).
- **100 char width** — Prettier enforced.
- **2-space indent** — Prettier enforced.
- **Consolidate imports** — one import statement per module path. Don't import from the same package on two lines.
- **Factory pattern** — `createX()` returns typed object, not `class X`. All packages follow this.
- **Immutable events** — `Object.freeze(event)` after creation. Events are append-only.

## Architecture

- **Bare package folders** — `packages/types`, `packages/core`, not `packages/atlas-types`.
- **`@atlas/` scope** — all workspace packages use `@atlas/name` in package.json.
- **Platform-agnostic core** — `packages/core` knows nothing about Slack, Discord, or Linear. Adapters implement `PlatformAdapter`.
- **No ORMs** — raw SQL via postgres.js. Migrations are plain `.sql` files in `packages/db/migrations/`.
- **`Result<T, E>` for fallible operations** — from `@atlas/primitives`. Don't throw for expected failures.
- **Manual OTel only** — no auto-instrumentation. Use `withSpan` from `@atlas/otel`.
- **Event bus** — EventEmitter + PG persistence + Redis pub/sub. Events have correlation IDs and are immutable.
- **Service locator** — `RuntimeServices` set once at startup via `setRuntimeServices()`, retrieved via `getRuntimeServices()` in pipeline steps.
- **Types in `@atlas/types`** — shared domain types live here. Config types, event types, platform types, tool types, memory types, planner types, session types.

## Tooling

- **Bun** — runtime, package manager, test runner. No Node, no pnpm.
- **`bun run build`** — builds all packages via `scripts/build.ts`.
- **`bunx tsc --noEmit -p tsconfig.base.json`** — typecheck everything.
- **`bun run lint`** — ESLint via `eslint.config.ts`.
- **`bash compose.sh up -d`** — start infra (PostgreSQL, Redis, FalkorDB, Graphiti, OTel Collector). Auto-detects Podman or Docker.

## Git

- **Conventional commits** — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- **`--no-verify` needed for push** — GitGuardian blocks pushes otherwise.
- **Never commit `.env`** — only `.env.example`.
- **Never commit without explicit user approval** — stage changes, show the user what's staged, and let them decide. Do not commit proactively.
- **Verify before staging** — always run `bun run lint`, `bunx tsc --noEmit -p tsconfig.base.json`, and `bun run build` before considering work done. Fix all errors. Only then stage.
- **Run `bun run format`** after changes to keep Prettier compliance.

## What NOT to Do

- Don't define types in app entry files that duplicate package exports
- Don't use `interface` — use `type`
- Don't add comments
- Don't leave unused imports or variables
- Don't use classes — use factory functions
- Don't import from the same package on multiple lines
- Don't use ORMs or query builders — raw SQL only
- Don't use `any` — use `unknown` and narrow
- Don't put mutable state at module scope when it can be a closure
- Don't skip health checks or migrations on startup
