# ADR-004: Use PostgreSQL Without an ORM

Date: 2026-06-25

## Status

Accepted

## Context

Atlas uses PostgreSQL for event persistence and session data. ORMs add abstraction layers that hide SQL, introduce performance surprises (N+1 queries, unexpected eager loading), and can leak abstraction in subtle ways. The spec explicitly states "Do not introduce an ORM" and "Prefer lightweight SQL libraries over ORMs."

The team values explicit, auditable data access. Raw SQL with a lightweight driver provides full control and transparency. Type safety is handled centrally in atlas-types rather than through an ORM's model definitions.

## Decision

Use postgres.js (porsager/postgres) for all database access. Raw SQL queries with tagged template literals. Migration runner with numbered SQL files tracked in a `_migrations` table.

## Consequences

- Positive: Full SQL control — no abstraction leak or hidden behavior.
- Positive: Lightweight with no ORM overhead.
- Positive: Explicit data access that is easy to audit and reason about.
- Positive: Works perfectly with Bun.
- Negative: Must write raw SQL — no query builder for complex queries.
- Negative: Must manage migrations manually with a custom runner.
- Neutral: No type-safe query builder — types are defined in atlas-types and applied at the application layer.
