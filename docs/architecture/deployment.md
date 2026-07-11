# CareLoop Deployment Guide

## Environments

| Environment | Branch    | URL                          |
| ----------- | --------- | ---------------------------- |
| Development | `develop` | localhost                    |
| Staging     | `main`    | staging.careloop.example.com |
| Production  | tags `v*` | careloop.example.com         |

## Prerequisites

- Docker & Docker Compose (local dev)
- pnpm 9+
- Node.js 22+
- kubectl + kubeconfig (for k8s deploy)
- Terraform 1.5+ (for infra changes)

## Local Development

```bash
pnpm install
docker compose up -d   # Start postgres + redis
pnpm dev               # Start all apps via turbo
```

## Docker Build

Images are built from `infrastructure/docker/`:

```bash
# From repo root
docker build -f infrastructure/docker/api.Dockerfile -t careloop/api .
docker build -f infrastructure/docker/web.Dockerfile -t careloop/web .
docker build -f infrastructure/docker/worker.Dockerfile -t careloop/worker .
```

## Kubernetes Deploy

```bash
kubectl apply -f infrastructure/kubernetes/postgres/
kubectl apply -f infrastructure/kubernetes/redis/
kubectl apply -f infrastructure/kubernetes/api/
kubectl apply -f infrastructure/kubernetes/worker/
kubectl apply -f infrastructure/kubernetes/web/
kubectl apply -f infrastructure/kubernetes/ingress/
```

## CI/CD

- `.github/workflows/ci.yml` — runs on every PR: lint, typecheck, build, test
- `.github/workflows/deploy-staging.yml` — deploys to staging on push to `main`
- `.github/workflows/deploy-prod.yml` — deploys to production on version tags

## Environment Variables

See `.env.example` in the repo root. Required secrets are stored in:

- Local: `.env.local` per app
- Staging/Prod: Kubernetes `careloop-secrets` Secret
