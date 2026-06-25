# ADR-014: ioredis Over Bun Native Redis Client

Date: 2026-06-25

## Status

Accepted

## Context

BullMQ v5.77.0 added a native Bun Redis client adapter (`createBunRedisClient`). However, it has open type/shutdown bugs: issue #4212 reports `null` vs `undefined` mismatches on `onconnect`/`onclose` callbacks, and `ConnectionClosedError` floods during graceful shutdown. These are critical issues for a production system that needs clean shutdown behavior.

The ioredis path is battle-tested on Bun with no known critical issues. It is the stable, well-documented path for BullMQ. The performance difference between ioredis and the native Bun client is negligible for Atlas workloads, which are not Redis-throughput-bound.

## Decision

Use ioredis for all Redis operations and BullMQ. Do not use the native Bun Redis client adapter until #4212 is resolved (likely v5.79+).

## Consequences

- Positive: Battle-tested with no known critical bugs on Bun.
- Positive: BullMQ ioredis path is the stable, well-documented path.
- Negative: Slightly more overhead than the native Bun client — negligible for Atlas workloads.
- Neutral: Must track #4212 and migrate to the native adapter when it stabilizes.
