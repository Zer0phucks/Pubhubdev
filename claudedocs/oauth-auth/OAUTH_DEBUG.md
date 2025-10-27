# OAuth Debugging Playbook

Use this checklist whenever a platform connection fails. It covers the Supabase Edge function, environment variables, and local tooling needed to reproduce real OAuth flows end-to-end.

## 1. Backend entrypoint check

- Supabase Edge function: `src/supabase/functions/server/index.tsx`.
- OAuth routes already defined at:
  - `GET /make-server-19ccd85e/oauth/authorize/:platform`
  - `POST /make-server-19ccd85e/oauth/callback`
  - `POST /make-server-19ccd85e/oauth/disconnect`
  - `GET /make-server-19ccd85e/oauth/token/:platform/:projectId`
- All routes are protected by `requireAuth`, so a real Supabase user JWT is mandatory. Calling them with the public anon key will always return 401.

## 2. Environment variables per platform

| Platform  | Required variables (Edge function) |
|-----------|------------------------------------|
| Twitter   | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_REDIRECT_URI` (fallbacks to `FRONTEND_URL` if omitted). |
| Instagram | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`. |
| LinkedIn  | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`. |
| Facebook  | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_REDIRECT_URI`. |
| YouTube   | `YOUTUBE_CLIENT_ID` (or `GOOGLE_CLIENT_ID`), `YOUTUBE_CLIENT_SECRET` (or `GOOGLE_CLIENT_SECRET`), `YOUTUBE_REDIRECT_URI` (or `OAUTH_REDIRECT_URL`). |
| TikTok    | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`. |
| Pinterest | `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, `PINTEREST_REDIRECT_URI`. |
| Reddit    | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI`. |

Configure them inside `.env.local` (for `supabase functions serve`) or the Supabase dashboard → Edge Functions → Secrets. Make sure `FRONTEND_URL` matches the React app URL (default `https://pubhub.dev`).

## 3. Run the Edge function locally

```bash
supabase functions serve src/supabase/functions/server --env-file .env.local
```

- The server becomes available at `http://127.0.0.1:54321/functions/v1/make-server-19ccd85e`.
- Use `supabase functions logs --project-ref <project-id>` in another tab to stream logs while reproducing issues.

## 4. Use the OAuth smoke test

The repository now includes `scripts/oauth-flow-smoke-test.mjs`. It validates that each platform can produce an authorization URL (steps 1–2 of the OAuth flow).

```bash
# required env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_TEST_EMAIL, SUPABASE_TEST_PASSWORD
node scripts/oauth-flow-smoke-test.mjs            # test all providers
node scripts/oauth-flow-smoke-test.mjs reddit     # test one provider
EDGE_FUNCTION_URL=http://127.0.0.1:54321/functions/v1/make-server-19ccd85e \
  node scripts/oauth-flow-smoke-test.mjs twitter
```

What it does:
1. Logs into Supabase using the supplied credentials (or uses `SUPABASE_ACCESS_TOKEN` if already provided).
2. Calls `GET /oauth/authorize/:platform?projectId=...` for each platform.
3. Reports missing environment variables or endpoint errors.

## 5. Manual end-to-end test

1. Start Vite: `npm run dev -- --host 0.0.0.0`.
2. In the dashboard, go to **Settings → Platform Connections** (`src/components/PlatformConnections.tsx`).
3. Click **Connect** on a platform; ensure the request sends a bearer token from `getAuthToken()` rather than the public anon key.
4. After authorizing with the social network, you should be redirected to `/oauth/callback` (`src/components/OAuthCallback.tsx`). Enable DevTools network tab to confirm:
   - Callback POST body contains `code`, `state`, `platform`.
   - State value matches what was stored in `sessionStorage`.
5. Inspect the Edge function logs to ensure:
   - State lookup (`kv.get('oauth:state:<state>')`) succeeds.
   - `oauth:token:<platform>:<projectId>` is stored.
6. Use `GET /oauth/token/:platform/:projectId` to verify refresh-token logic and to retrieve the stored access token for downstream API tests.

## 6. Common failure points

- `Authorization: Bearer <public anon key>` is rejected by `requireAuth`. The React side must pass a real user session token (see `getAuthToken()` in `src/utils/api.ts`).
- Missing redirect URI or mismatched domain between the provider console and `FRONTEND_URL`.
- Reddit requires HTTP basic auth for the token exchange; ensure `REDDIT_CLIENT_ID` and secret are configured as script-type credentials.
- Session state lifetime is 10 minutes. Reuse beyond that window causes “Invalid or expired state”.

Follow this playbook before filing an OAuth bug to ensure the infrastructure is aligned and reproducible locally.
