# ADR-010: Graphiti REST API Integration Approach

Date: 2026-06-25

## Status

Accepted

## Context

Graphiti is a Python-only framework (99.4% Python). There is no native TypeScript SDK for the open-source Graphiti project. Integration options are: (1) REST API server — a FastAPI container exposing endpoints, (2) MCP server — Model Context Protocol, (3) Zep Cloud — managed, paid service.

The REST API server provides a clean service boundary, runs as a Docker container, and exposes the core Graphiti operations. A TypeScript client wrapper in packages/memory provides type-safe access. This avoids any Python dependency in the Atlas codebase.

## Decision

Use Graphiti's REST API server (FastAPI, Docker container) with a TypeScript client wrapper in packages/memory. The client wraps fetch calls to the REST endpoints (/messages, /search, /get-memory, /episodes, /healthcheck).

## Consequences

- Positive: No Python dependency in the Atlas codebase.
- Positive: Clean separation — Graphiti runs as an independent service.
- Positive: TypeScript client provides a type-safe interface for the Atlas team.
- Negative: Custom entity/edge types are not configurable via REST (fixed schema).
- Negative: Advanced search recipes are not exposed via the REST API.
- Negative: REST processes messages asynchronously (202 Accepted), requiring polling for completion.
- Neutral: One more service to manage in Docker Compose.
