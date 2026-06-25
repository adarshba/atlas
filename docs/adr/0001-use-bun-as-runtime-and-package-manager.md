# ADR-001: Use Bun as Runtime and Package Manager

Date: 2026-06-25

## Status

Accepted

## Context

Atlas needs a TypeScript runtime for a production monorepo. Node.js + pnpm is the traditional choice. Bun offers native TS execution, faster installs, built-in test runner, and workspace support. Bun 1.x has matured significantly and supports workspaces, isolated linking, and a built-in test runner, making it a viable single-tool solution for the entire build and runtime lifecycle.

The main trade-off is production exposure: Node 22+ has years of battle-testing, while Bun is newer and may have edge cases with niche ecosystem packages. However, for a greenfield project like Atlas, the developer experience and performance gains outweigh the maturity gap.

## Decision

Use Bun 1.x as both runtime and package manager. Use `--linker isolated` for pnpm-style strictness. Use `bun test` for testing. Use `bun build` for library builds.

## Consequences

- Positive: Native TypeScript execution — no tsx or ts-node needed.
- Positive: Fast installs and test execution improve developer velocity.
- Positive: Built-in workspace support reduces tooling surface area.
- Negative: Less long-tail production exposure than Node 22+ — some ecosystem packages may have edge cases.
- Neutral: Must run soak tests for long-running stability to validate Bun's runtime behavior under sustained load.
