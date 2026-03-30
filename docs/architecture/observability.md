# CareLoop Observability

## Metrics

- Application metrics via `prom-client` (NestJS API)
- Infrastructure metrics via Prometheus + Grafana
- Key metrics:
  - `http_request_duration_seconds` (p50, p95, p99)
  - `http_requests_total` (by route, method, status)
  - `bullmq_job_completed_total` / `failed_total` (by queue)
  - `db_query_duration_seconds`
  - `active_sessions_total`

## Logging

- Structured JSON logs (pino in api, console in worker)
- Log levels: `error`, `warn`, `info`, `debug`
- Shipped to: stdout → Fluentd/Datadog/CloudWatch
- Sensitive fields masked: passwords, tokens, SSN

## Tracing

- OpenTelemetry (future) — trace IDs attached to every request
- Correlation ID header: `X-Correlation-Id`

## Alerts

| Alert | Threshold | Severity |
|---|---|---|
| API error rate | >1% over 5m | critical |
| API p99 latency | >2s over 5m | warning |
| Appointment reminder queue depth | >100 jobs | warning |
| Failed jobs | >5 in 1m | critical |
| DB connection pool exhausted | >90% | critical |
| Disk usage (postgres PVC) | >80% | warning |

## Health Checks

- `GET /health` — liveness + dependency check (db, redis)
- Readiness probe: same endpoint with stricter checks
