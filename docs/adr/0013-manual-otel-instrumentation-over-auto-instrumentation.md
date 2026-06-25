# ADR-013: Manual OTel Instrumentation Over Auto-Instrumentation

Date: 2026-06-25

## Status
Accepted

## Context
OpenTelemetry offers auto-instrumentation via `@opentelemetry/auto-instrumentations-node`, which patches Node's `Module._load` to automatically instrument HTTP, Redis, PostgreSQL, and other libraries. This is convenient but relies on monkey-patching module loading internals.

Bun implements its own require interception mechanism, which can have edge cases with ESM-only modules. Auto-instrumentation that patches `Module._load` may not work reliably on Bun, creating runtime-compat risk. The safer approach is manual instrumentation where we have full control over what gets instrumented.

## Decision
Use manual instrumentation — create tracer/meter/logger providers, use `withSpan()` helper, OTLP HTTP exporter. Do not use the `--require` auto-instrumentation register hook. Pin recent OTel versions. Use `@grpc/grpc-js` (pure JS) if gRPC export is needed.

## Consequences
- Positive: No `Module._load` patching — avoids Bun edge cases with module interception.
- Positive: Full control over what is instrumented and how.
- Positive: More predictable behavior across runtime updates.
- Negative: More boilerplate — must manually add spans for each operation.
- Negative: Must discipline ourselves to instrument every important operation.
- Negative: Cannot auto-capture HTTP/Redis/PostgreSQL traces — must wrap manually or use instrumented client wrappers.
