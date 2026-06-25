# ADR-011: Package Naming and Monorepo Structure

Date: 2026-06-25

## Status

Accepted

## Context

Atlas is a monorepo with many packages. Package names need to be unambiguous in imports so developers can immediately tell which package a symbol comes from. However, prefixing every folder with `atlas-` (e.g., `atlas-core/`, `atlas-types/`) is redundant when they are already inside the `atlas` repo.

The spec lists modules like atlas-core, atlas-ai, etc. The tension is between clean folder names and unambiguous package names. npm scoped packages with `@atlas/` prefix solve this: the scope provides the namespace, and the package name is clean.

## Decision

Folder names are bare (types, core, events, ai, memory, etc.). Package names use `@atlas/` scope (@atlas/types, @atlas/core, @atlas/events). Imports read as `import { ... } from "@atlas/types"`. Bun workspaces resolve via `workspace:*` protocol.

## Consequences

- Positive: Clean folder structure with no redundant prefix.
- Positive: Scoped package names prevent npm collisions and read clearly in imports.
- Positive: Standard monorepo convention familiar to most developers.
- Neutral: Slight mismatch between folder name and package name — acceptable trade-off for import clarity.
