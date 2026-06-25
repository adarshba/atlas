# ADR-007: Vercel AI SDK with OpenAI-Compatible Provider

Date: 2026-06-25

## Status

Accepted

## Context

Atlas uses the Vercel AI SDK as mandated by spec. Development uses LiteLLM as a proxy that exposes an OpenAI-compatible endpoint, allowing switching between different LLM providers (OpenAI, Anthropic, Google, local models) without code changes. LiteLLM supports 100+ providers behind a single OpenAI-compatible API.

Configuration should be minimal: just three values (baseURL, apiKey, model). Switching providers should require only configuration changes, not code changes. To enforce this, the AI SDK should never be called directly from atlas-core — all calls go through the atlas-ai package.

## Decision

Use `@ai-sdk/openai` with custom baseURL pointing to LiteLLM. All AI calls go through the atlas-ai package — atlas-core never directly calls the AI SDK. Provider config is just three values: baseURL, apiKey, model.

## Consequences

- Positive: Provider-agnostic — switch by changing configuration only.
- Positive: LiteLLM proxy supports 100+ providers behind one endpoint.
- Positive: Vercel AI SDK provides streaming, structured output, and tool calling.
- Negative: atlas-ai must wrap all SDK calls, adding a layer of abstraction.
- Negative: Must handle provider-specific quirks (e.g., Google can't do tools + structured output simultaneously).
