# ADR-008: OpenTelemetry for All Observability

Date: 2026-06-25

## Status

Accepted

## Context

The spec mandates OpenTelemetry everywhere — traces, metrics, and logs. One configurable OTEL Collector endpoint should handle all signals. The runtime should never log directly to console outside OpenTelemetry. Every important operation should be observable.

Using a single collector endpoint means the backend (Jaeger, Prometheus, Loki, Datadog, etc.) is swappable via configuration. This vendor-agnostic approach prevents lock-in and aligns with the spec's observability requirements.

## Decision

Manual OTel instrumentation with OTLP HTTP exporters. Single OTEL Collector endpoint for all signals. `withSpan()` and `withSpanEvent()` helpers. Resource attributes for service identification. Graceful shutdown on SIGTERM.

## Consequences

- Positive: Unified observability — traces, metrics, and logs through one collector.
- Positive: Vendor-agnostic — the collector can export to any backend.
- Positive: Every operation is observable.
- Negative: Manual instrumentation is more work than auto-instrumentation.
- Negative: Must discipline ourselves to add spans everywhere important operations occur.
- Negative: No direct console logging — everything goes through OTel logs.
