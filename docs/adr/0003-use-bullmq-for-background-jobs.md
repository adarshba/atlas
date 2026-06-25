# ADR-003: Use BullMQ for Background Jobs

Date: 2026-06-25

## Status
Accepted

## Context
Atlas needs background jobs for memory updates, tool execution, and async responses. AI workflows often decompose into parent-child job flows (e.g., a message triggers memory search, tool execution, and response generation as dependent steps). LLM API calls need rate limiting to avoid hitting provider quotas.

Redis is already required in the Atlas infrastructure. Two Redis-based job queue libraries were evaluated: BullMQ and Graphile Worker (PostgreSQL-based). BullMQ has a larger community (9k stars vs 2.3k) and supports parent-child job flows (DAGs) which map directly to AI pipelines. BullMQ also has built-in rate limiting essential for LLM API calls.

## Decision
Use BullMQ with ioredis (not the native Bun Redis adapter which has open bugs). Parent-child flows for AI pipelines. Rate limiting for LLM calls.

## Consequences
- Positive: Parent-child job flows map naturally to AI pipelines.
- Positive: Built-in rate limiting for LLM API calls.
- Positive: Zero new infrastructure — Redis is already required.
- Positive: Larger community, lower abandonment risk than alternatives.
- Negative: BullMQ native Bun adapter has open type/shutdown bugs (#4212).
- Negative: Must use the ioredis path until the native adapter stabilizes.
- Neutral: Redis persistence is less strong than PostgreSQL ACID transactions, but acceptable for job queue semantics.
