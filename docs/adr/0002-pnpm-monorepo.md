# ADR-0002: Use pnpm + Turborepo Monorepo

## Status
Accepted

## Context
CareLoop consists of multiple applications (web, api, worker) that share code (types, db client, UI). An npm workspaces monorepo was the initial approach.

## Decision
Adopt **pnpm** as the package manager and **Turborepo** as the build orchestrator. Shared packages live under `packages/`:
- `@careloop/shared` — types, constants, validators, utils
- `@careloop/db` — Prisma client singleton
- `@careloop/ui` — shared React components
- `@careloop/eslint-config` — ESLint configs
- `@careloop/tsconfig` — TypeScript base configs

## Consequences
- **Positive**: pnpm's hard-linking saves disk; strict dependency resolution prevents phantom dependencies
- **Positive**: Turborepo remote cache accelerates CI
- **Positive**: Single install / single lint-typecheck-build command
- **Negative**: All developers must have pnpm installed (`npm i -g pnpm`)
- **Negative**: Some tooling assumes npm; workarounds sometimes needed
