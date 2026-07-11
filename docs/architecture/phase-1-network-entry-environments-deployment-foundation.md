# CareLoop Phase 1: Network Entry, Environments, and Deployment Foundation

## Scope and Design Goal

This document defines how traffic enters CareLoop, how environments are separated, and how deployment foundations should be set up for a small team handling healthcare-sensitive workloads.

Primary objective:

- Keep operations simple now.
- Keep security and auditability strong from day one.
- Leave a clean path to scale.

Assumed baseline:

- Cloud target: AWS (because the stack needs mature managed networking, certificate lifecycle, and audit controls with low operator burden).
- Runtime path: start with one Kubernetes cluster per environment tier where needed, but avoid unnecessary cluster sprawl during early phase.

---

## 1) Environment Strategy

### What it does

Environment strategy defines lifecycle boundaries for change management, data handling, and blast-radius control.

### Recommended option for CareLoop

Use a Local + Cloud Hybrid model:

- Dev: local-first using Docker Compose and local .env, optional shared cloud dev namespace for integration tests.
- Staging: cloud-hosted, production-like, synthetic or de-identified data only.
- Prod: cloud-hosted, isolated account, isolated VPC, strict IAM and logging controls.

### Why this is optimal

- Local dev keeps iteration speed high for a small team.
- Cloud staging catches real networking and ingress issues before prod.
- Strong prod isolation satisfies healthcare-style risk posture without making dev too heavy.

### Isolation strategy recommendation

Use account-level and network-level separation for prod:

- Prod in separate AWS account and separate VPC.
- Non-prod in separate AWS account and separate VPC.
- In non-prod, use Kubernetes namespaces for dev and staging if budget constrained.
- In prod, use dedicated namespaces per service domain, with strict network policies.

Cluster strategy:

- Phase 1: one non-prod cluster, one prod cluster.
- Do not run prod and non-prod in same cluster.

### Trade-offs vs alternatives

Option A: Shared VPC + namespaces only

- Pros: cheaper and faster to set up.
- Cons: weaker blast-radius control, IAM complexity, higher accidental cross-environment risk.

Option B: Separate VPC per environment and separate cluster per environment

- Pros: strongest isolation.
- Cons: highest cost and ops load for small team.

Recommended middle ground

- Separate prod from non-prod at account and VPC.
- Consolidate dev and staging inside non-prod cluster initially.

### Secrets/config separation

- Use AWS Secrets Manager for secrets and AWS Systems Manager Parameter Store for non-secret config.
- Separate secret paths by environment and service.
- Never share encryption keys between environments.
- Use short-lived workload identity (IRSA) from EKS to fetch secrets.
- Keep local dev secrets in .env.local only, never committed.

### Decision rules

- If data is real patient data or affects billing/compliance: full isolation (separate account + VPC + prod cluster).
- If environment is for integration and QA only: shared non-prod account, namespace isolation acceptable.
- If team size < 8 and monthly cloud budget is constrained: avoid separate dev cluster; use local dev + non-prod shared cluster.
- If audit findings show repeated config drift: move staging to dedicated cluster.

---

## 2) Domain and DNS Architecture

### What it does

DNS maps user and service hostnames to network entry points and controls external versus internal reachability.

### Recommended option for CareLoop

Use Amazon Route 53 for authoritative DNS and split-horizon design:

- Public hosted zone for internet-facing endpoints.
- Private hosted zone for internal-only endpoints and service-to-service references.

Domain layout:

- Internal private zone:
  - careloop.company.internal
  - staging.careloop.company.internal
  - dev.careloop.company.internal
- Public zone (recommended alongside internal naming):
  - app.careloop.company.com (web)
  - api.careloop.company.com (public API)
  - staging-app.careloop.company.com
  - staging-api.careloop.company.com

### Why this is optimal

- Route 53 integrates cleanly with AWS load balancers and health checks.
- Split public/private zones avoids accidental exposure of internal surfaces.
- Internal .internal names avoid ambiguity for private-only traffic.

### Trade-offs vs alternatives

Cloudflare as primary DNS

- Pros: strong edge features and WAF options, great global performance.
- Cons: adds control-plane split when infra is AWS-native; more integration moving parts.

Route 53 as primary DNS

- Pros: native IAM, Terraform flow, health checks, alias targets to ALB/NLB.
- Cons: less edge-centric tooling than Cloudflare unless paired with CloudFront/WAF.

Recommended approach

- Route 53 as primary in Phase 1.
- Add CloudFront later only when edge caching and global acceleration are needed.

### Internal vs external DNS guidance

- Internal DNS: private hosted zone, resolvable only inside VPC or connected networks (VPN/Direct Connect).
- External DNS: public hosted zone, internet resolvable.

### Decision rules

- If endpoint must be accessed by patients/providers on public internet: public zone record.
- If endpoint is ops/admin/internal service only: private zone record.
- If legal/compliance requires strict traffic segregation: use separate subdomain trees per environment and separate TLS certs.
- If a service is partner-facing with stricter contractual boundaries: use a separate subdomain at minimum; separate domain only when legal/contracts require independent lifecycle.

---

## 3) Reverse Proxy and Ingress Layer

### What it does

Ingress controls HTTP(S) entry routing, TLS policy enforcement, and per-request controls before traffic reaches services.

### Option evaluation

Nginx Ingress

- Strengths: mature, flexible, wide community usage, powerful annotations.
- Weaknesses: config sprawl risk, can become hard to govern consistently.
- Operational complexity: medium.
- Performance: strong for common web/API traffic.
- Best fit: teams needing custom routing logic and broad ecosystem familiarity.

Traefik

- Strengths: developer-friendly, dynamic config, easy middleware model.
- Weaknesses: fewer enterprise patterns in some regulated orgs versus Nginx/Envoy ecosystems.
- Operational complexity: low to medium.
- Performance: good for small-mid loads.
- Best fit: fast-moving teams prioritizing simplicity and DX.

Envoy

- Strengths: advanced traffic policy, modern L7 proxy, strong observability hooks, service mesh foundation.
- Weaknesses: steep complexity for small teams.
- Operational complexity: high.
- Performance: excellent at scale.
- Best fit: larger platforms, mesh-heavy architectures, advanced policy control.

Cloud-native ingress (AWS ALB Ingress Controller)

- Strengths: managed L7 load balancing, native TLS with ACM, native WAF integration, low ops burden.
- Weaknesses: cloud lock-in, less custom proxy behavior than self-managed Nginx/Envoy.
- Operational complexity: low.
- Performance: very good for web/API patterns; robust autoscaling support.
- Best fit: AWS-hosted apps where small teams need reliability without running their own edge proxy fleet.

### Primary recommendation for CareLoop

Choose AWS ALB Ingress Controller as the primary ingress for Phase 1.

Why this is best now and later:

- Current scale: minimal operations overhead and fast setup.
- Future scale: supports WAF, multi-AZ resilience, and can coexist with NLB/Envoy for special workloads later.
- Developer experience: fewer moving parts than self-managing Nginx fleet.

### Routing strategy

Use host-based routing as primary, path-based as secondary.

- Host-based examples:
  - app.careloop.company.com -> web service
  - api.careloop.company.com -> api service
- Path-based only inside a single host if needed for migration or backward compatibility.

Decision rule:

- If web and API have separate release cadence or security policy: host-based routing.
- If single product host with minor backend split: path-based can be acceptable.
- Default to host-based for clarity and policy isolation.

---

## 4) HTTPS and TLS Strategy

### What it does

TLS encrypts traffic in transit and provides endpoint identity.

### Recommended option

Use AWS Certificate Manager managed certificates on ALB for all public endpoints.

### Why this is optimal

- Automated renewal and deployment with low failure risk.
- Native integration with ALB and IAM policies.
- Reduces manual cert rotation mistakes.

### Let’s Encrypt vs managed certs

Let’s Encrypt

- Pros: free, portable across clouds.
- Cons: more automation plumbing, rate limits, more renewal failure modes.

ACM managed certs

- Pros: best AWS integration, automatic lifecycle, low ops burden.
- Cons: mainly AWS-bound cert attachment workflow.

Recommendation: ACM for Phase 1.

### TLS termination recommendation

Terminate TLS at ALB in Phase 1, then use TLS in-cluster for sensitive east-west paths as phase 2 hardening.

### Required policies

- Enforce TLS 1.2+ (prefer TLS 1.3 where available).
- Enable HSTS with long max-age only after confirming HTTPS everywhere.
- Add secure headers at app and/or ingress:
  - Strict-Transport-Security
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
- Redirect HTTP to HTTPS at ALB.

### Certificate rotation

- ACM auto-renew for public endpoints.
- Alert on cert expiration anomalies via CloudWatch.
- Run quarterly validation that cert replacement succeeds in staging.

### Decision rules

- If traffic is internet-facing and on AWS ALB: terminate TLS at ALB.
- If compliance requires end-to-end encryption to pod: add re-encryption from ALB to ingress/service.
- If doing service-to-service zero trust later: introduce mTLS (mesh or sidecar policy).

---

## 5) Load Balancing Strategy

### What it does

Load balancing distributes traffic across instances and availability zones, improving uptime and latency.

### L4 vs L7

Layer 4 LB (TCP/UDP)

- Faster and simpler for raw transport and non-HTTP protocols.
- Limited request-aware routing.

Layer 7 LB (HTTP/HTTPS)

- Request-aware routing, host/path rules, auth and header policies.
- Slightly higher complexity and per-request processing overhead.

### Recommended approach

- Start with L7 ALB for web and API.
- Add L4 NLB only for protocol-specific or ultra-low-latency non-HTTP workloads.

### Start simple to scale later roadmap

Phase 1

- Single ALB, multi-AZ target groups, health checks per service.

Phase 2

- Separate ALBs for public web and partner/API traffic if policy needs diverge.
- Add NLB for real-time protocols if required.

Phase 3

- Regional traffic steering with Route 53 latency/weighted routing.

### Decision rules

- If traffic is standard HTTP APIs and web: use L7 ALB.
- If workload needs static IPs or raw TCP performance: introduce NLB.
- If one ALB policy set becomes too broad/risky: split by function.

---

## 6) Request Handling and Security Controls

### What it does

Defines guardrails for request observability and abuse prevention.

### Request logging strategy

- Centralize ingress and app logs into CloudWatch Logs with structured JSON.
- Standard fields required:
  - timestamp, request_id, trace_id, user_id or subject_id (pseudonymous), route, status, latency_ms, source_ip, user_agent.
- Redact PHI and secrets before logs are emitted.
- Retention policy:
  - hot logs 30-90 days
  - archived logs per compliance policy.

### Rate limiting

Apply in two layers:

- Edge/WAF: per-IP baseline rate limits to block volumetric abuse.
- Application/API gateway layer: per-user/per-token quota for fairness and abuse control.

### Request size limits

Set conservative defaults at ingress:

- JSON APIs: 1-2 MB max body.
- Document upload endpoints: explicit higher limits only on dedicated routes.
- Reject oversized payloads early at ALB/ingress/app middleware.

### Security headers

Minimum baseline:

- CSP: strict default-src and script-src policies tailored to frontend assets.
- X-Frame-Options: DENY unless embedded workflow is required.
- X-Content-Type-Options: nosniff.
- Referrer-Policy: strict-origin-when-cross-origin.
- Permissions-Policy: disable unused browser capabilities.

### Healthcare-grade considerations

- Never log full request bodies by default.
- Never log access tokens or session cookies.
- Link access logs with audit logs for privileged endpoints.
- Maintain immutable audit trail for administrative actions.

### Decision rules

- If endpoint handles uploads or rich text: define route-specific body limits.
- If endpoint is authentication or patient lookup: stricter rate limits and anomaly alerts.
- If a header policy breaks required UI behavior: add explicit and minimal exception, not global relaxation.

---

## 7) Performance Layer

### What it does

Improves latency and infrastructure efficiency without reducing correctness.

### Compression recommendation

- Prefer Brotli for static assets at edge/CDN.
- Keep gzip enabled as fallback for clients and dynamic responses.

### Edge caching strategy

Phase 1

- Cache static assets aggressively (hashed JS/CSS/images).
- Do not cache personalized or PHI-related API responses at edge.

### Backend caching (basic)

- Introduce Redis for non-sensitive computed aggregates and idempotent metadata lookups.
- Use short TTLs and cache-key scoping by tenant/user where needed.

### Decision rules

- If response includes patient-specific sensitive data: do not edge-cache.
- If endpoint is public static content: edge-cache aggressively.
- If cache invalidation rules are unclear: defer caching until correctness is guaranteed.

---

## 8) Deployment Entry Point Design

### End-to-end flow

Browser -> Route 53 DNS -> AWS WAF -> AWS ALB (TLS termination via ACM) -> Kubernetes Ingress Rules -> Web/API Services -> Data stores and async systems

### Text architecture diagram

[User Browser / Mobile]
|
v
[Route 53 Public DNS]
|
v
[AWS WAF]
|
v
[AWS ALB: HTTPS 443, ACM cert]
|
+--> Host: app.careloop.company.com --> [Web Service Pods]
|
+--> Host: api.careloop.company.com --> [API Service Pods]
|
+--> [PostgreSQL]
+--> [Redis]
+--> [Queue/Worker]

Internal admin/ops path:
[Corp VPN / SSO] -> [Route 53 Private DNS] -> [Internal ALB or Private Ingress] -> [Admin/Internal Services]

### How new services plug in

- Add new DNS host or route rule.
- Add new ingress rule and service target group.
- Define service-specific rate limit, auth policy, and logging fields.
- Register health checks and alerts before exposing route.

### How scaling works

- Horizontal Pod Autoscaler scales services based on CPU/RPS/latency.
- ALB distributes across healthy pods and AZs.
- Stateless services scale first; stateful services scale via managed DB/Redis tiers.

---

## 9) Minimal Production Setup

### Exact stack recommendation

Cloud and network

- AWS Route 53 (public and private hosted zones)
- AWS WAF attached to ALB
- AWS ALB via AWS Load Balancer Controller
- AWS ACM certificates

Runtime and platform

- EKS (1 prod cluster, 1 non-prod cluster)
- Kubernetes namespaces: non-prod uses dev and staging namespaces
- ExternalDNS for automatic DNS records from ingress manifests

Data and messaging

- Amazon RDS PostgreSQL (Multi-AZ for prod)
- ElastiCache Redis
- Managed queue option (SQS) or existing worker queue integration

Security and observability

- AWS Secrets Manager + Parameter Store
- IAM Roles for Service Accounts (IRSA)
- CloudWatch logs and metrics, OpenTelemetry instrumentation
- Centralized alerting (PagerDuty/Opsgenie/Slack escalation)

### Example configuration overview

- Ingress host rules per service domain.
- TLS policy at ALB with HTTPS redirect.
- Namespace-level network policies denying all by default and allowing explicit traffic.
- Secret access policy scoped per workload identity.
- Baseline WAF managed rules plus custom rate-based rule.

### Implement first vs later

Implement first (must-have)

- Separate prod and non-prod accounts/VPCs.
- ALB + ACM + WAF + Route 53.
- Prod and non-prod clusters.
- Structured logs + request IDs + basic alerting.
- Secrets Manager integration and least-privilege IAM.

Implement later (phase 2+)

- Service mesh and mTLS east-west.
- Multi-region active-passive or active-active.
- Advanced anomaly detection and adaptive rate limiting.
- CDN optimization for global latency.

---

## 10) Future Scaling Path

### Multi-instance

- Scale web and API replicas independently.
- Add queue partitioning and worker autoscaling.
- Separate read-heavy API endpoints behind dedicated autoscaling profile.

### Multi-region

- Start with active-passive disaster recovery.
- Replicate databases using managed cross-region strategy.
- Use Route 53 failover routing with health checks.
- Promote to active-active only when operational maturity and conflict strategy are ready.

### Kubernetes evolution

- Phase 1: simple ingress + namespace policies.
- Phase 2: policy-as-code (OPA/Gatekeeper), GitOps deployment pipeline.
- Phase 3: service mesh for mTLS and traffic shaping if complexity justifies it.

Decision rule:

- If uptime objective remains moderate and team is small: single region with strong DR playbook.
- If business requires near-zero regional outage impact: move to multi-region with tested failover drills.

---

## 11) Common Mistakes (Critical)

1. Running prod and staging in the same cluster without strong policy boundaries.
   Why dangerous: accidental secret reuse and cross-environment blast radius.

2. Exposing internal admin endpoints on public DNS.
   Why dangerous: drastically increases attack surface for privileged functions.

3. Logging full request bodies in healthcare workloads.
   Why dangerous: PHI leakage into logs and backups.

4. Delaying TLS and header hardening until after launch.
   Why dangerous: insecure defaults become entrenched and difficult to remediate safely.

5. No explicit request size limits.
   Why dangerous: trivial denial-of-service vector through oversized payloads.

6. Single shared IAM role for all services.
   Why dangerous: lateral movement risk and poor audit granularity.

7. Overusing path-based routing for everything.
   Why dangerous: policy isolation and ownership become unclear over time.

8. Building multi-region too early.
   Why dangerous: operational complexity exceeds team capacity and reduces reliability.

---

## 12) What Not To Do

- Do not put real patient data in dev or staging.
- Do not store secrets in container images, git, or plain ConfigMaps.
- Do not expose databases directly to internet CIDRs.
- Do not rely on one global wildcard cert for all environments forever.
- Do not skip health checks and readiness probes.
- Do not allow unrestricted egress from all pods.
- Do not deploy without rollback path and basic alerts.
- Do not make caching decisions before data classification.
- Do not run without incident runbooks and restore drills.

---

## Final Recommended Decision Set for Phase 1

1. Environment model

- Local dev + cloud staging/prod.
- Separate prod account and VPC from non-prod.
- One non-prod cluster, one prod cluster.

2. Entry layer

- Route 53 + WAF + ALB + ACM.
- Host-based routing by default.

3. Security baseline

- TLS at ALB, strict headers, rate limiting at WAF and app.
- Secrets Manager with workload identity.
- Structured, redacted centralized logs.

4. Scaling posture

- Single region first, multi-AZ mandatory.
- Multi-region only after SLO-driven trigger and failover rehearsal readiness.
