# ADR-0001: Use NestJS for API Layer

## Status
Accepted

## Context
The original API was a minimal Fastify server. As features grow (auth, patients, billing, messaging, etc.) we need a more structured framework with:
- Dependency injection
- Module system
- Decorators for controllers/guards/interceptors
- Built-in testability

## Decision
Adopt **NestJS 10** with the Fastify adapter (`@nestjs/platform-fastify`) as the API framework. Each domain area gets its own NestJS module (controller + service + repository pattern).

## Consequences
- **Positive**: Clear module boundaries, built-in DI, decorator-based routing, excellent TypeScript support
- **Positive**: Fastify adapter preserves performance advantages over Express
- **Negative**: Steeper learning curve than plain Fastify
- **Negative**: `reflect-metadata` polyfill required; `emitDecoratorMetadata: true` in tsconfig
