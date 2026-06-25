# ADR-005: Event Bus Architecture

Date: 2026-06-25

## Status

Accepted

## Context

Atlas is an event-driven system. Everything is an event — MessageReceived, ToolExecuted, MemoryStored, etc. Events must be immutable to ensure auditability and reproducibility. The runtime needs both in-process event handling (for immediate reactions within a single process) and cross-process notification (for horizontal scaling).

Correlation IDs are essential for tracing events across the AI pipeline — a single user message may trigger dozens of downstream events that all need to be linked.

## Decision

In-process event bus extending EventEmitter with PostgreSQL persistence. Events are immutable (readonly properties, Object.freeze). Each event has: id, type, timestamp, correlationId, payload. Redis pub/sub for cross-process notification. OTel span per published event.

## Consequences

- Positive: Simple in-process dispatch with durability via PostgreSQL.
- Positive: Correlation IDs enable tracing across the entire pipeline.
- Positive: Events are immutable and auditable.
- Positive: Redis pub/sub enables cross-process scaling.
- Negative: In-process bus is single-process — Redis pub/sub is required for multi-process scenarios.
- Neutral: PostgreSQL write on every event — acceptable for Phase 1 volume, may need optimization for high throughput later.
