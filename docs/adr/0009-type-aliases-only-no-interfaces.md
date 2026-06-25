# ADR-009: Type Aliases Only (No Interfaces)

Date: 2026-06-25

## Status

Accepted

## Context

The spec explicitly forbids interfaces: "No interfaces." All types must use `type` aliases. This matches the patterns in both the curator and neurolink reference repos. Type aliases are more flexible — they support unions, intersections, conditional types, and mapped types, none of which are available with `interface`.

This is a stylistic and consistency decision. Enforcing a single type definition syntax across the codebase reduces cognitive overhead and ensures all team members follow the same pattern.

## Decision

Use `type` aliases exclusively for all type definitions. Never use `interface`. All type definitions live in dedicated type files organized by domain within packages/types.

## Consequences

- Positive: Consistent and flexible — type aliases support unions, intersections, and conditional types.
- Positive: Matches spec requirement and reference repo patterns.
- Positive: Centralized types in packages/types for easy discovery.
- Negative: Some TypeScript features (declaration merging) are unavailable with type aliases.
- Neutral: Slightly different syntax for generics with defaults compared to interfaces.
