# ADR-012: Bun Workspaces with Isolated Linker

Date: 2026-06-25

## Status

Accepted

## Context

Bun supports workspaces via the package.json "workspaces" field. By default, Bun uses a hoisted node_modules layout (like npm/yarn), which can cause phantom dependency issues — packages can accidentally import dependencies they didn't declare because they were hoisted from a sibling package.

pnpm solved this with isolated linking (virtual store + symlinks), ensuring each package can only import what it explicitly declares. Bun supports this mode via `--linker isolated`. Additionally, Bun supports catalogs for centralizing shared dependency versions across packages.

## Decision

Use `bun install --linker isolated` (configured in bunfig.toml) for pnpm-style strict dependency isolation. Use catalogs for version centralization across packages.

## Consequences

- Positive: Prevents phantom dependencies — packages can only import what they declare.
- Positive: Catalogs centralize shared dependency versions for consistency.
- Positive: pnpm-style strictness combined with Bun's install speed.
- Negative: Slightly more complex node_modules layout (virtual store + symlinks).
- Negative: Less mature recursive task runner than `pnpm -r` — use `bun scripts` for task orchestration.
