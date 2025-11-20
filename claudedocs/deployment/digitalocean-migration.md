# DigitalOcean Migration Execution

This document implements the approved migration plan by detailing the Supabase audit, the target DigitalOcean (DO) architecture, auth strategy, backend/frontend porting approach, data migration checklist, and deployment validation steps.

---

## 1. Supabase Usage Audit

### Frontend dependencies

- `src/components/AuthContext.tsx` centralizes Supabase auth: it bootstraps sessions, reacts to `onAuthStateChange`, and calls `supabase.auth.signInWithPassword`, `signUp`, `signOut`, and OAuth helpers. It also proxies `/auth/*` calls to the Supabase Edge Function gateway.

```
```48:133:src/components/AuthContext.tsx
const { data: { session } } = await supabase.auth.getSession();
...
const { error } = await supabase.auth.signInWithOAuth({
``` 

- `src/components/PlatformConnections.tsx`, `ContentComposer.tsx`, `AuthCallback.tsx`, `OAuthCallback.tsx`, `hooks/usePlatformConnection.ts`, and context providers (`ProjectContext`) query Supabase sessions before performing network work.
- `src/utils/*API.ts` modules (`projectAPI`, `contentAPI`, `personaAPI`, `brandAPI`, `platformAPI`, `ragAPI`) all use the shared `supabase` client. They rely on PostgREST filtering, Supabase Functions (`ingest-content`, `generate-persona`, `rag-query`), and Supabase storage signed URLs.
- `src/utils/api.ts`, `AITextGenerator`, and OAuth tooling build URLs to the Hono-based Supabase Edge Function bundle (`functions/v1/make-server-19ccd85e/...`), expecting Supabase JWT auth and rate limiting metadata.
- `src/utils/supabase/client.ts` instantiates the browser client against `https://${projectId}.supabase.co` with anon key caching.
- Tests under `src/test/**` mock Supabase via `vi.mock('@/utils/supabase/client')` and rely on the Supabase SDK shape.
- CSP and Sentry configs whitelist `https://*.supabase.co` domains for APIs, storage, auth iframes, and WebSockets (`src/utils/csp.ts`, `src/sentry.ts`).

### Supabase backend surface area

| Area | Details | References |
| --- | --- | --- |
| Authentication | Supabase Auth (email/password + OAuth). Sessions fetched client-side and validated server-side in Edge Functions via service role key. | `src/components/AuthContext.tsx`, `supabase/functions/make-server-19ccd85e/index.ts` (`requireAuth`) |
| Database tables | `projects`, `brands`, `personas`, `content_sources`, `persona_vectors`, and `kv_store_19ccd85e` plus helper functions/triggers. RLS ties rows to `auth.users`. | `supabase/migrations/20251111152300_create_persona_system.sql`, `20231125_create_kv_store.sql` |
| Storage | Bucket `make-19ccd85e-uploads` stores profile images and logos with signed URLs (1-year expiry). | `supabase/functions/make-server-19ccd85e/index.ts` upload routes |
| Edge Functions | Hono router (`make-server-19ccd85e`) exposing auth/profile bootstrap, posts/templates/automations CRUD via KV, LinkedIn/YouTube upload helpers, OAuth authorize/disconnect, trending feeds, AI entry points, and health checks. Additional Deno functions: `generate-persona`, `ingest-content`, `rag-query`. | `supabase/functions/**` |
| KV emulation | `kv_store.tsx` wraps a SQL table to emulate KV semantics for projects, posts, templates, automations, platform connections, and notifications. | `supabase/functions/make-server-19ccd85e/kv_store.tsx` |
| Vector search | pgvector-backed `persona_vectors` powers persona generation + retrieval; Supabase function `rag-query` queries embeddings. | `supabase/functions/rag-query/index.ts`, migration file |
| Realtime | Not currently used; no `supabase.channel`. Only HTTP polling and functions. |

**Capabilities matrix**

- **Auth flows**: email/password, OAuth, session refresh, server-side verification via service role key.
- **Tables/views**: as listed above with cascading deletes and triggers for `updated_at`.
- **Policies**: project ownership enforced via `auth.uid()` RLS; kv store uses broad authenticated policies.
- **Storage buckets**: `make-19ccd85e-uploads` private bucket with signed URLs.
- **Edge compute**: four Supabase Edge Functions (one large Hono router + three specialized AI/ingest workers).
- **Realtime**: unused; easy to drop.

---

## 2. Target DigitalOcean Architecture

### Proposed components

| Component | DigitalOcean service | Notes | Est. monthly cost* |
| --- | --- | --- | --- |
| Static frontend | App Platform Static Site (Starter) | Deploy `npm run build` output; auto SSL, CDN-backed. | $5 |
| API gateway | App Platform Service (Basic 1 vCPU / 1 GB) running Node 20 + Hono/Express | Replaces Supabase Edge Function bundle. Handles auth, CRUD, uploads, OAuth proxy, AI orchestration. | $12 |
| Worker (optional) | App Platform Worker or DO Functions | For ingest queues, cron-like tasks (content ingestion, vector jobs). Scale to zero on Functions to cut cost if idle. | $0–12 depending on usage |
| Background queue | DO Managed Redis or QStash equivalent | Only if ingestion volume requires queueing. Starter Redis 250 MB plan is $15, skip until necessary. | $0 initial |
| Database | Managed Database for PostgreSQL (Basic 1 vCPU / 1 GB RAM / 15 GB storage) | pgvector supported; apply Supabase migrations verbatim; VPC with App Platform. | $15 |
| Object storage | DO Spaces + CDN | Store user uploads, project logos, AI exports. Equivalent to Supabase Storage. | $5 (includes 250 GB + 1 TB egress) |
| Secrets/config | App Platform env vars + DO Secrets Manager | Store DB credentials, Clerk keys, Azure OpenAI keys. | Included |
| Monitoring | DO App Insights + Sentry (existing) | Add health checks, log forwarding to DO Logs. | Included |

\*Based on November 2025 App Platform pricing. Total baseline ≈ **$37/mo** (static + API + Postgres + Spaces) vs current Vercel Hobby (~$0–$20) + Supabase Pro ($25). Savings primarily come from consolidating into a single provider and eliminating Supabase Pro once data migrates.

### Feature mapping

| Supabase feature | DigitalOcean replacement |
| --- | --- |
| Supabase Auth | Clerk (recommended) or self-hosted GoTrue on App Platform for edge cases. |
| PostgREST CRUD | Custom REST/GraphQL on Node service using Drizzle/Prisma + `pg` with DO Managed Postgres. |
| Supabase Storage | DO Spaces with pre-signed URLs via AWS SDK-compatible `aws-sdk v3` or `@aws-sdk/client-s3`. |
| Edge Functions (Hono) | App Platform Service (Node) with Hono router; same codebase, but move from Deno to Node (via Bun/Hono compatibility) or Hono on Node. |
| Functions (`generate-persona`, etc.) | Deploy as separate App Platform Worker or DO Functions; share code via npm workspace. |
| KV table | Actual Postgres tables or DO Redis. Recommendation: convert kv_store records into typed Postgres tables (projects/posts) or, interim, keep `kv_store_19ccd85e` table. |
| Rate limiting | Use `@upstash/ratelimit` with Redis or implement middleware using DO Functions’ in-memory store + DO Redis if needed. |

---

## 3. Authentication Strategy (Cheapest-first comparison)

| Option | Base cost | Features | Effort | Notes |
| --- | --- | --- | --- | --- |
| **Clerk** | Free up to 10k MAU; then $25 per additional 1k | Email/password, OAuth (Google/Twitter/etc.), MFA, session tokens, user management UI | Low | Best mix of cost + features. SDK for React + Node, easy webhooks, JWT templates for API service. |
| Supabase Auth (self-host GoTrue) | App Platform Basic service ~$12/mo | Same semantics as today; reuse row-level policies | Medium | Requires running GoTrue container + Realtime; still need storage & DB. Defeats purpose of leaving Supabase. |
| Lucia + custom flows | Only infra cost (~$12 service + email/SMS provider) | Total control, BYO OAuth (via `arctic`, `oslo`) | High | Cheapest long-term but high engineering cost (password resets, email templates, SOC2 needs). |
| Stytch | Free up to 5k monthly active, then $0.05/MAU | Rich auth methods, but pay-as-you-go | Medium | Comparable to Clerk but cheaper only if <5k MAU and fewer OAuth providers. |

**Recommendation:** Start with **Clerk** for lowest total cost under 10k MAU while keeping engineering effort low. Re-evaluate vs Lucia if MAU grows beyond 15k and cost pressure increases.

### Clerk integration steps

1. **Create Clerk application** → enable Email+Password, OAuth providers (Google, Twitter, LinkedIn, etc.), create publishable & secret keys (`VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
2. **Frontend changes**
   - Replace Supabase AuthContext with Clerk’s `ClerkProvider` + `useAuth` / `useUser`.
   - Update protected routes to rely on `isSignedIn`.
   - Swap Supabase OAuth buttons with `<SignInButton>` or manual `signIn.authenticateWithRedirect`.
   - Remove Supabase session polling; rely on Clerk session tokens stored in cookies.
3. **Backend changes**
   - Verify requests via Clerk JWTs using `@clerk/clerk-sdk-node`. Replace `requireAuth` to read `Authorization: Bearer <ClerkToken>` and fetch user via `verifyToken`.
   - Map Clerk user IDs to DB rows (`users` table) or store `clerk_user_id` in `projects.user_id`.
4. **Environment variables**
   - Frontend: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.
   - Backend: `CLERK_SECRET_KEY`, `CLERK_JWT_TEMPLATE_ID`, `FRONTEND_URL`, DB credentials, Spaces keys, Azure OpenAI keys.
5. **Session management**
   - Replace Supabase `auth.onAuthStateChange` with Clerk events (e.g., `ClerkProvider` `publishableKey` + `routerPush`).
   - Update local storage keys, tests, and mocks to use Clerk context.

---

## 4. Backend/API Migration Strategy

### Database

1. Provision DO Managed Postgres (enable pgvector extension).
2. Apply Supabase migrations in chronological order (kv store → persona system → vector function). Use `psql -f supabase/migrations/<file>.sql`.
3. Recreate helper roles/policies:
   - Replace `auth.uid()` with JWT claims from Clerk (e.g., `request.jwt.claims.sub`).
   - Create Postgres function `current_user_id()` that reads `jwt.claims.sub` to reuse existing RLS logic.
4. Optional: normalize `kv_store_19ccd85e` into real tables (posts, automations, templates). Interim: keep table as-is.

### API service

1. **Codebase split**
   - Move `supabase/functions/make-server-19ccd85e/**` into `services/api/src`.
   - Replace Deno-specific APIs (`Deno.env`, `File`) with Node equivalents (use `undici`/`fetch`, `formidable`).
   - Replace Supabase Admin client with direct Postgres + DO Spaces + Clerk SDK.
2. **Route mapping**
   - `/auth/*`: now call Postgres + DO Spaces; use Clerk IDs.
   - `/upload/*`: use DO Spaces signed URLs via `@aws-sdk/s3-request-presigner`.
   - `/oauth/*`: keep existing OAuth provider flows but store tokens in Postgres (new tables) instead of kv.
   - `/ai/*`: keep integration with Azure OpenAI; store results in Postgres.
3. **Internal SDK**
   - Create `src/utils/apiClient.ts` with typed functions mirroring the old `supabase` calls (e.g., `getProjects`, `createProject`).
   - Use `fetch`/`axios` to call the DO API; handle Clerk session tokens automatically.
4. **Rate limiting & logging**
   - Use `@upstash/ratelimit` + DO Redis (optional) or `fastify-rate-limit`.
   - Forward logs to DO Logtail or Papertrail.

### Functions & workers

- `generate-persona`: convert to Node worker using same logic (Supabase queries → Postgres queries). Could remain a standalone App Platform Worker triggered via `/ai/persona` queue.
- `ingest-content`: run as DO Function or background worker; triggered from frontend via API.
- `rag-query`: convert to Node route hitting pgvector via SQL (e.g., `SELECT ..., 1 - (embedding <=> query_vector) AS similarity`).

---

## 5. Frontend Refactor Plan

1. **Client removal**
   - Delete `src/utils/supabase/client.ts` & `supabase/info.ts`.
   - Introduce `src/utils/apiClient.ts` that wraps `fetch` with base URL + Clerk `getToken`.
2. **Context updates**
   - `AuthContext`: wrap Clerk context, expose `signInWithPassword`, `signUp`, etc., but call Clerk SDK.
   - `ProjectContext`, `PlatformConnections`, `ContentComposer`, `OAuth*` components: replace Supabase queries with `apiClient` calls to DO backend endpoints.
3. **API utilities**
   - Rewrite `projectAPI`, `contentAPI`, `personaAPI`, `brandAPI`, `platformAPI`, `ragAPI` to call REST endpoints. For data-heavy reads use SWR/React Query caching.
4. **Storage operations**
   - Replace Supabase storage uploads with DO Spaces signed URL workflow:
     1. Request signed URL from backend.
     2. Upload via `fetch` PUT.
     3. Persist resulting CDN URL in Postgres.
5. **CSP & Sentry**
   - Update `src/utils/csp.ts` and `src/sentry.ts` to allow `https://*.digitaloceanspaces.com`, App Platform domains, and Clerk endpoints (`https://*.clerk.accounts.dev`).
6. **Tests**
   - Update Vitest mocks to stub `apiClient` & Clerk context; remove Supabase-specific mocks.
   - Adjust Playwright tests to handle Clerk-hosted auth pages (use test-only key + `CLERK_PUBLISHABLE_KEY` with test instance).
7. **OAuth tooling**
   - Point OAuth tester/debugger components to DO API routes (e.g., `https://api.pubhub.doapp.app/oauth/authorize`). Keep same UI but update `projectId` semantics (Clerk user ID + Postgres project row).

---

## 6. Data & Storage Migration

1. **Dry run**
   - Put Supabase in read-only window.
   - Run `pg_dump --schema-only` + `pg_dump --data-only --table=projects --table=brands ...`.
   - Export `kv_store_19ccd85e` for conversion (optionally flatten into relational tables).
2. **Restore to DO Postgres**
   - `psql <schema.sql>` then `psql <data.sql>`.
   - Verify `SELECT COUNT(*)` per table matches Supabase.
   - Rebuild `persona_vectors` with `COPY` using binary format for speed.
3. **Storage migration**
   - Use `supabase storage list` or `scoop` to download `make-19ccd85e-uploads`.
   - Upload to DO Spaces via `s3cmd sync supabase-bucket/ spaces://pubhub-uploads`.
   - Update stored URLs to DO CDN domain (e.g., `https://pubhub-uploads.nyc3.cdn.digitaloceanspaces.com/...`).
4. **Secrets**
   - Rotate keys; remove Supabase anon/service keys from codebase and CI.
5. **Cutover checklist**
   - Freeze Supabase writes.
   - Deploy DO stack with migrated data.
   - Run smoke tests (auth, CRUD, uploads, AI, OAuth).
   - Update DNS (`app.pubhub.dev` → DO App Platform).
   - Monitor error rates for 24h; keep Supabase snapshot for rollback.

Rollback plan: keep Supabase project paused but intact; if issues arise, repoint DNS to Vercel/Supabase and re-enable writes. Use migration scripts to diff data.

---

## 7. Deployment & Validation

1. **App Platform configuration**
   - Frontend service: `npm install && npm run build`, output `dist`. Env vars: `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SENTRY_DSN`, `VITE_OPENAI_ENABLED`.
   - API service: `npm install && npm run build && npm run start`. Env vars: `DATABASE_URL`, `CLERK_SECRET_KEY`, `SPACES_ACCESS_KEY`, `SPACES_SECRET_KEY`, `SPACES_BUCKET`, `SPACES_REGION`, `FRONTEND_URL`, `AZURE_OPENAI_*`, `SENTRY_DSN`.
   - Worker/Functions: same repo with `npm run build:worker`.
   - Shared env: `NODE_ENV=production`, `LOG_LEVEL=info`.
2. **CI/CD**
   - Update GitHub Actions to use `doctl apps create-deployment`.
   - Remove Vercel + Supabase secrets from `scripts/*.sh`; add DO equivalents.
3. **Testing matrix**
   - Unit: `npm run test` (Vitest) — ensure Clerk mocks in place.
   - Integration: new API tests hitting local DO-like stack (Docker compose for Postgres + MinIO for Spaces).
   - E2E: Playwright test suite updated to log in via Clerk test user (use `CLERK_JWT` for API).
   - OAuth smoke: adapt `scripts/oauth-flow-smoke-test.mjs` to DO endpoints.
4. **Monitoring & logging**
   - Enable App Platform health checks on `/health`.
   - Forward logs to DO Logs or Papertrail; integrate with Sentry release tracking.
   - Set up UptimeRobot ping on frontend + API.
5. **Runbook**
   - Document deployment steps, rollback, and verification in `claudedocs/deployment/DEPLOYMENT_READY.md` (append DO section).
   - Include DNS cutover steps, metrics to watch (error rate, DB CPU, Spaces egress), and contact list.

With this document, each plan task now has actionable guidance to execute the migration end-to-end on DigitalOcean while reducing cost and introducing Clerk-based authentication.

