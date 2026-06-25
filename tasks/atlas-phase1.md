# Atlas Phase 1 — Implementation Plan

## Overview

Build Atlas, an event-driven AI teammate platform. Phase 1 covers project structure, architecture, event bus, configuration, OpenTelemetry, PostgreSQL, Redis, Graphiti, AI abstraction, and three platform adapters (Slack, Discord, Linear).

## Technology Stack

| Layer           | Choice                                                        | Rationale                                            |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Runtime         | Bun                                                           | Native TS, fast startup, built-in test runner        |
| Package manager | Bun (`--linker isolated`)                                     | pnpm-style strictness, workspace protocol            |
| Workspaces      | `package.json` `"workspaces"` field                           | Bun-native                                           |
| TS execution    | Bun native                                                    | Runs `.ts` directly, reads tsconfig paths at runtime |
| Build           | `bun build --packages external` + `tsc --emitDeclarationOnly` | ESM output for libs, .d.ts via tsc                   |
| Test            | `bun test`                                                    | Fast, jest-compatible, zero config                   |
| SQL             | postgres.js                                                   | Works with Bun, battle-tested, no ORM                |
| Redis           | ioredis                                                       | Battle-tested with Bun, BullMQ stable path           |
| Jobs            | BullMQ (via ioredis)                                          | Parent-child flows, rate limiting, Redis-based       |
| AI SDK          | Vercel AI SDK (`ai` + `@ai-sdk/openai`)                       | LiteLLM-compatible via OpenAI provider               |
| Memory          | Graphiti REST API + FalkorDB                                  | Redis-based graph DB, minimal infra                  |
| Observability   | OpenTelemetry (manual instrumentation)                        | OTLP HTTP exporter, single collector                 |
| Container       | Podman (docker-compatible)                                    | User has podman, not docker                          |
| Types           | `type` aliases only, no `interface`                           | Spec requirement                                     |

## Package Structure

```
atlas/
packages/
  types/              @atlas/types — Pure types, zero deps
  primitives/         @atlas/primitives — Cross-cutting primitives, zero deps
  config/             @atlas/config — Zod-validated config
  otel/               @atlas/otel — OTel setup, manual instrumentation
  db/                 @atlas/db — PostgreSQL (postgres.js)
  cache/              @atlas/cache — Redis (ioredis)
  events/             @atlas/events — Event bus + persistence
  ai/                 @atlas/ai — AI abstraction (Vercel SDK)
  memory/             @atlas/memory — Graphiti REST client
  tools/              @atlas/tools — Tool registry
  jobs/               @atlas/jobs — BullMQ queues
  core/               @atlas/core — Runtime engine (NO adapter deps)
  adapters/
    slack/            @atlas/slack — Slack adapter
    discord/          @atlas/discord — Discord adapter
    linear/           @atlas/linear — Linear adapter
apps/
  atlas/              @atlas/atlas — HTTP runtime + wiring
docs/
  adr/                Architecture Decision Records
docker/
  compose.yaml  PostgreSQL, Redis, FalkorDB, Graphiti, OTEL Collector
```

Naming: Folder names are bare (types, core, events). Package names are scoped (@atlas/types, @atlas/core).

## ADRs

| #   | Title                                                 |
| --- | ----------------------------------------------------- |
| 001 | Use Bun as runtime and package manager                |
| 002 | Use Graphiti with FalkorDB for memory                 |
| 003 | Use BullMQ for background jobs                        |
| 004 | Use PostgreSQL without an ORM                         |
| 005 | Event bus architecture                                |
| 006 | Platform adapter pattern with capabilities            |
| 007 | Vercel AI SDK with OpenAI-compatible provider         |
| 008 | OpenTelemetry for all observability                   |
| 009 | Type aliases only (no interfaces)                     |
| 010 | Graphiti REST API integration approach                |
| 011 | Package naming and monorepo structure                 |
| 012 | Bun workspaces with isolated linker                   |
| 013 | Manual OTel instrumentation over auto-instrumentation |
| 014 | ioredis over Bun native Redis client                  |

## Implementation Steps

### Step 1: Monorepo Foundation + ADRs

- bun init, root package.json with workspaces
- tsconfig.base.json — strict, ESM, Preserve, bundler resolution, noUncheckedIndexedAccess, exactOptionalPropertyTypes, types: ["bun"]
- bunfig.toml — linker isolated
- .gitignore, .editorconfig, git init
- ESLint + Prettier config
- compose.sh — podman/docker detection script
- Write all 14 ADRs in docs/adr/

### Step 2: types (@atlas/types)

Domain-organized type definitions using type aliases only:

- events/ — Event, MessageReceived, MentionReceived, ThreadCreated, ReactionAdded, ToolExecuted, MemoryStored, MemoryRetrieved, ResponseGenerated
- messages/ — InboundMessage, ResponseEnvelope
- platform/ — PlatformAdapter, PlatformCapabilities, PlatformType
- tools/ — ToolDefinition, ToolExecution, ToolResult
- memory/ — Episode, MemorySearchResult, MemoryFact
- planner/ — Plan, PlannerStep, PlannerDecision
- config/ — ConfigSections

### Step 3: primitives (@atlas/primitives)

- result/ — Result type, ok(), err()
- async/ — withTimeout(), race(), defer()
- time/ — now(), formatDuration(), timestamp()
- id/ — generateId() (UUID v7)

### Step 4: config (@atlas/config)

- Zod schemas for each section (ai, redis, postgres, otel, graphiti, slack, discord, linear)
- loadConfig() — validates process.env, returns strongly typed config
- Single .env for local dev, env vars for production

### Step 5: otel (@atlas/otel)

- Manual OTel SDK setup (TracerProvider, MeterProvider, LoggerProvider)
- OTLP HTTP exporters — single collector endpoint
- withSpan() — wraps operations in traced spans
- withSpanEvent() — adds events to current span
- Graceful shutdown on SIGTERM

### Step 6: db (@atlas/db)

- PostgreSQL connection pool via postgres.js
- query() — traced SQL execution with OTel
- Migration runner — numbered SQL files, \_migrations table
- Initial migrations: 001_events.sql, 002_sessions.sql
- healthCheck() — SELECT 1

### Step 7: cache (@atlas/cache)

- Redis client via ioredis
- get(), set(), delete(), expire() — all traced
- publish(), subscribe() — pub/sub for cross-process events
- healthCheck() — PING

### Step 8: events (@atlas/events)

- In-process event bus (extends EventEmitter)
- Immutable events (readonly, Object.freeze)
- publish() — emit + persist to PostgreSQL
- subscribe() — register handler for event type
- Events have: id, type, timestamp, correlationId, payload
- OTel span per published event

### Step 9: ai (@atlas/ai)

- Provider config: baseURL, apiKey, model (OpenAI-compatible for LiteLLM)
- generate() — single completion with retry (exponential backoff)
- stream() — streaming with chunk queue + consumer-driven abort
- generateStructured() — structured output via Zod schema
- generateWithTools() — tool calling, multi-step
- All operations traced with OTel

### Step 10: memory (@atlas/memory)

- Graphiti REST client wrapper
- addEpisode() — store conversation as episode
- search() — hybrid search for facts
- getMemory() — compose query from messages
- getEpisodes() — retrieve recent episodes
- healthCheck() — Graphiti healthcheck endpoint
- All operations traced with OTel

### Step 11: tools (@atlas/tools)

- Tool registry — register(), get(), list()
- Tool definition: name, description, inputSchema (Zod), execute()
- Tool output truncation — prevent context overflow
- OTel span per tool execution
- Initial tools: search, http, git, reminder, knowledge

### Step 12: jobs (@atlas/jobs)

- BullMQ queue setup via ioredis
- Queue definitions: memory-update, tool-execution, response-generation
- Parent-child job flows (BullMQ FlowProducer)
- enqueue(), process() — traced with OTel
- Rate limiting for LLM calls
- Graceful shutdown — drain queues on SIGTERM

### Step 13: core (@atlas/core)

- Runtime engine — the heart of Atlas
- Planner pipeline: Observe -> Retrieve Context -> Plan -> Execute Tools -> Generate Response -> Persist Memory
- Service locator — break circular deps
- Session management — per-conversation state
- Zero platform-specific code — depends only on types

### Step 14: adapters/slack (@atlas/slack)

- Implements PlatformAdapter from @atlas/types
- normalizeInbound() — Slack event -> InboundMessage
- sendResponse() — ResponseEnvelope -> Slack message
- startStream(), appendStream(), stopStream() — streaming
- getCapabilities() — supportsStreaming, supportsThreads, supportsReactions
- Uses @slack/bolt for event receiving

### Step 15: adapters/discord (@atlas/discord)

- Implements PlatformAdapter
- Uses discord.js for event receiving
- Capabilities: supportsStreaming (via message editing), supportsThreads

### Step 16: adapters/linear (@atlas/linear)

- Implements PlatformAdapter
- Webhook-based event receiving
- Linear API client for responses
- Capabilities: supportsStreaming = false

### Step 17: apps/atlas (@atlas/atlas)

- HTTP runtime — receive webhooks, expose health check, see full pipeline execute
- bun run entry point with --watch
- Wires all packages + adapters together
- Shows OTel span tree in console for debugging

### Step 18: Docker Compose (podman)

- PostgreSQL 16
- Redis 7 (serves cache + FalkorDB backend)
- FalkorDB (Redis-based graph DB for Graphiti)
- Graphiti REST server (Python FastAPI)
- OTEL Collector (OTLP receiver, configurable exporters)
- compose.sh — detects podman or docker, runs appropriate compose command

### Step 19: Verification

- bun run typecheck — tsc --noEmit across all packages
- bun test — unit tests for each package
- bun run dev — Atlas HTTP runtime boots, health check responds
- podman compose up — all services healthy
- End-to-end: send message via CLI -> event flows through pipeline -> response generated

## Patterns Reused from Reference Repos

### From Curator

1. Platform Adapter + Capabilities — adapters declare what they support via flags
2. Service Locator — break circular deps without DI framework
3. Graceful degradation — Promise.allSettled for optional components
4. Fire-and-forget side effects — non-critical ops don't block response

### From Neurolink

5. Retry with exponential backoff — withRetry() infrastructure for AI calls
6. Tool output truncation — prevent context overflow from large tool results
7. Consumer-driven abort — AbortController fires when stream iterator closes early
8. Deferred analytics — streaming usage/finish resolved when stream completes
