# ADR-015: MCP Server Configuration

Date: 2026-06-26

## Status

Accepted

## Context

Atlas needs to connect external MCP servers and expose their tools through the existing tool registry. The MCP ecosystem commonly represents servers with command, args, env, and url fields, but there is no single repository-local TOML standard that all clients share.

Atlas already uses a typed configuration boundary in `@atlas/config`, and Bun can parse TOML without an extra dependency. A root `mcp.toml` keeps server configuration readable, reviewable, and separate from environment-driven application settings.

Secrets must not be committed. GitHub's hosted MCP endpoint uses streamable HTTP with bearer authentication. Local servers such as filesystem and Bitbucket run over stdio.

## Decision

Use root-level `mcp.toml` as Atlas' app-native MCP configuration file. Support `type = "stdio"` for process-backed servers and `type = "http"` for hosted streamable HTTP servers. Load secrets from environment variables with `env_from` and `bearer_token_env`.

Register enabled MCP tools into Atlas as namespaced tools using `server.tool`, preserving the existing tool registry contract.

## Consequences

- Positive: MCP configuration is easy to read and review.
- Positive: Secrets stay in the environment, not in source control.
- Positive: Atlas supports both local stdio servers and hosted GitHub MCP.
- Positive: Runtime code depends on typed config instead of parsing TOML directly.
- Negative: `mcp.toml` is Atlas-specific, even though its fields intentionally resemble common MCP client config.
- Neutral: Additional transports should be added only when the SDK path is stable and non-deprecated.
