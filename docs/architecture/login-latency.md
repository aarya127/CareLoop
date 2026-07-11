# Login latency — measurements, tuning, and SLA

> Status: 2026-07 · Scope: the login/auth request path, especially when the web
> app is hosted on Vercel and the API on Render.

## The request path

```
Browser → Next.js BFF (/api/auth/login, Vercel) → NestJS API (/auth/login, Render)
        → Postgres (verify password + write session) → Redis (session cache)
```

Login does: 1 DB read (user), 1 bcrypt `compare`, 1 session insert, 1 audit write.
Subsequent authenticated requests validate the session from a **Redis cache (60s TTL)**,
so they avoid a DB round-trip.

## Measured breakdown (local, warm)

| Segment | Time |
|---|---|
| Direct API `POST /auth/login` (DB + bcrypt cost 12 + session) | **~53 ms** |
| Via the Next BFF hop (adds proxy + second network leg) | **+250 ms** (dev-mode; less in prod) |

Takeaway: **the API itself is fast**. The latency users feel in a Vercel deployment is
dominated by the hosting topology, not the code.

## What actually makes login slow on Vercel + Render

Ranked by impact:

1. **Render free-tier cold starts (dominant).** Free services spin down after ~15 min
   idle; the next request pays a **30–60 s** container boot. This is almost certainly the
   "login is slow" symptom. *Fix: a paid always-on instance, or a keep-warm ping (a cron
   hitting `/health` every ~10 min).*
2. **Cross-region network hop.** Vercel functions run in the region nearest the user; the
   API is in Render **Oregon**. A mismatched Vercel region adds a round-trip of tens–hundreds
   of ms on both the BFF→API call and each `requireUser` → `/auth/me` check. *Fix: pin the
   Vercel function region near Render Oregon (e.g. `pdx1`/`sfo1`).*
3. **bcrypt work factor on a weak CPU.** `bcrypt.compare` runs at the cost baked into the
   stored hash. Cost 12 is ~4× cost 10; on Render's shared free CPU that can be a few hundred
   ms per login. *Fix: `BCRYPT_ROUNDS=10` (still ≥ OWASP minimum) — see rehash-on-login below.*
4. **Serverless cold starts (Vercel).** The first hit to a BFF route compiles/boots the
   function. Minor next to Render's, and warms quickly under traffic.

## What we changed in code

- **Rehash-on-login.** `bcrypt.compare` always uses the *stored* hash's cost, so lowering
  `BCRYPT_ROUNDS` does nothing for existing users by itself. On a successful login we now
  re-hash the password to the configured cost **in the background** (never blocking the
  response — see `auth.service.login` + `passwordNeedsRehash`). This lets ops tune the work
  factor and have it actually reduce login latency as users cycle through, and doubles as
  good hygiene (upgrading old/weak hashes).
- **Session validation is Redis-cached** (60 s) so only the login itself pays the bcrypt +
  DB cost; navigation does not.
- **`LatencyInterceptor`** logs any API request ≥ 500 ms as `WARN`, so slow logins are
  visible in production logs.

## Configuration recommendations

| Setting | Recommendation |
|---|---|
| Render plan | Move the API off free tier, **or** add a keep-warm `/health` ping (cron). |
| `BCRYPT_ROUNDS` (API) | `10` on constrained CPUs (free tier); `12` on dedicated. Rehash-on-login migrates existing users. |
| Vercel region | Pin near Render Oregon (`pdx1`/`sfo1`) to cut the cross-region leg. |
| Prisma pooling | Add PgBouncer / a pooled `DATABASE_URL` under multiple API replicas. |
| BFF | Keep it — it's required for the httpOnly session cookie. Minimize per-render `/auth/me` hops. |

## SLA targets (warm)

- API `POST /auth/login` **p95 < 400 ms**.
- End-to-end (browser → BFF → API) **p95 < 700 ms** when both tiers are warm.
- Cold-start latency is explicitly out of the warm SLA; it is addressed operationally
  (keep-warm / paid tier), not in application code.
