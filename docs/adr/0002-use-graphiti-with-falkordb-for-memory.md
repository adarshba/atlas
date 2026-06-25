# ADR-002: Use Graphiti with FalkorDB for Memory

Date: 2026-06-25

## Status
Accepted

## Context
Atlas needs persistent memory — episodic, semantic, graph, entity relationships, and long-term recall. The spec mandates Graphiti exclusively for this purpose. Graphiti requires a graph database backend: either Neo4j or FalkorDB. Redis is already required in the Atlas infrastructure for caching and job queues.

Running Neo4j alongside Redis would add a second heavy infrastructure component. FalkorDB, being Redis-based, can run on the same Redis instance or a similar deployment, minimizing additional infrastructure.

Graphiti provides temporal knowledge graphs with bi-temporal tracking, hybrid retrieval (semantic + BM25 + graph traversal), and entity/edge relationship modeling — all critical for AI memory.

## Decision
Use Graphiti REST API server with FalkorDB as the graph database backend. FalkorDB is Redis-based, reducing infrastructure since Redis is already required. Integrate via REST client since Graphiti has no TypeScript SDK.

## Consequences
- Positive: Minimal additional infrastructure — FalkorDB runs on Redis.
- Positive: Temporal knowledge graphs with bi-temporal tracking.
- Positive: Hybrid retrieval combining semantic search, BM25, and graph traversal.
- Negative: Graphiti is Python-only — integration must go through a REST API.
- Negative: Custom entity/edge types are not configurable via REST (fixed schema).
- Negative: REST server processes messages asynchronously (202 Accepted), requiring polling or webhooks for completion.
- Negative: Advanced search recipes are not exposed via the REST API.
