# ADR-006: Platform Adapter Pattern with Capabilities

Date: 2026-06-25

## Status
Accepted

## Context
Atlas must support Slack, Discord, Linear, and future platforms. The runtime must be completely platform-agnostic — it should not know which platform it is serving. Different platforms have different capabilities: some support streaming responses, some support threaded conversations, some support message reactions.

A naive approach would type-check the platform ("if slack, do X"). This couples the runtime to specific platforms and makes adding new platforms difficult. A capability-based approach is cleaner: adapters declare what they can do, and the runtime adapts behavior accordingly.

## Decision
PlatformAdapter type defines the contract. Adapters declare capabilities via flags (supportsStreaming, supportsThreads, supportsReactions). Runtime checks capability flags, never type-checks platform. Adapters only normalize events and send responses — no business logic.

## Consequences
- Positive: Runtime knows nothing about specific platforms.
- Positive: New platforms are added by implementing the adapter contract.
- Positive: Capability-based polymorphism is cleaner than type-checking.
- Positive: Proven pattern from the curator reference repo.
- Negative: Adapters must be comprehensive — handling streaming, status updates, file uploads, etc.
- Negative: Some platforms may not support all capabilities — graceful degradation logic is needed.
