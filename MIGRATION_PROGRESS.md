# Supabase to DigitalOcean Migration Progress

## Completed Tasks

### Phase 1: Infrastructure Setup ✅
- [x] Created database migration script (`scripts/apply-do-migrations.sh`)
- [x] Updated `do-app-spec.yaml` with API service configuration
- [x] Removed Supabase environment variables from frontend config
- [x] Added `VITE_API_BASE_URL` environment variable

### Phase 2: API Service Creation ✅
- [x] Created `services/api/` directory structure
- [x] Set up Node.js/Hono API server (`services/api/src/index.ts`)
- [x] Created database client (`services/api/src/db/client.ts`)
- [x] Created KV store wrapper (`services/api/src/db/kv-store.ts`)
- [x] Created DigitalOcean Spaces integration (`services/api/src/storage/spaces.ts`)
- [x] Created Clerk authentication middleware (`services/api/src/middleware/auth.ts`)
- [x] Created rate limiting middleware (`services/api/src/middleware/rate-limit.ts`)
- [x] Implemented basic routes: health, uploads, auth, posts, projects

### Phase 3: Frontend Authentication Migration ✅
- [x] Updated `AuthContext.tsx` to use Clerk hooks instead of Supabase
- [x] Updated `src/utils/api.ts` to remove Supabase dependency
- [x] Updated CSP (`src/utils/csp.ts`) to remove Supabase domains
- [x] Added DigitalOcean Spaces and Clerk domains to CSP

## Remaining Tasks

### Phase 4: Complete API Routes
- [ ] Add all remaining routes to API service:
  - [ ] Templates routes
  - [ ] Automations routes
  - [ ] Connections routes
  - [ ] Settings routes
  - [ ] Analytics routes
  - [ ] Trending routes
  - [ ] OAuth routes
  - [ ] AI routes (generate-text, chat)
  - [ ] Ebook routes
  - [ ] Inbox routes

### Phase 5: Update Frontend API Utilities
These files still use Supabase client directly and need to be converted to use REST API:
- [ ] `src/utils/projectAPI.ts` - Convert to REST API calls
- [ ] `src/utils/personaAPI.ts` - Convert to REST API calls
- [ ] `src/utils/contentAPI.ts` - Convert to REST API calls
- [ ] `src/utils/brandAPI.ts` - Convert to REST API calls
- [ ] `src/utils/platformAPI.ts` - Convert to REST API calls
- [ ] `src/utils/ragAPI.ts` - Convert to REST API calls

### Phase 6: Database Migration
- [ ] Run `scripts/apply-do-migrations.sh` to apply schema to DigitalOcean Postgres
- [ ] Verify all tables exist
- [ ] Test RLS policies with Clerk user IDs
- [ ] Map existing Supabase user IDs to Clerk user IDs (if migrating data)

### Phase 7: Storage Migration
- [ ] Create DigitalOcean Spaces bucket
- [ ] Configure Spaces access keys
- [ ] Migrate existing files from Supabase Storage to DO Spaces (if any)
- [ ] Update all file URLs in database

### Phase 8: Specialized Functions Migration
- [ ] Convert `generate-persona` function to Node.js
- [ ] Convert `ingest-content` function to Node.js
- [ ] Convert `rag-query` function to Node.js
- [ ] Deploy as API routes or workers

### Phase 9: Testing
- [ ] Test authentication flows
- [ ] Test all CRUD operations
- [ ] Test file uploads
- [ ] Test AI features
- [ ] Update E2E tests for Clerk
- [ ] Update unit tests

### Phase 10: Cleanup
- [ ] Remove `@supabase/supabase-js` from `package.json`
- [ ] Remove Supabase-related scripts
- [ ] Delete `src/utils/supabase/` directory
- [ ] Update documentation

## Notes

### API Service Structure
The API service is located at `services/api/` and uses:
- Hono for routing
- PostgreSQL via `pg` library
- DigitalOcean Spaces for storage
- Clerk for authentication

### Database Schema
The migration script adapts Supabase migrations to work with Clerk:
- Replaces `auth.users` references with `users` table
- Updates RLS policies to use `app.current_user_id` instead of `auth.uid()`
- Creates `users` table mapping Clerk user IDs

### Environment Variables Required

**Frontend:**
- `VITE_CLERK_PUBLISHABLE_KEY` ✅
- `VITE_API_BASE_URL` ✅
- `VITE_SENTRY_DSN` ✅

**Backend API:**
- `DATABASE_URL` (from DigitalOcean database)
- `CLERK_SECRET_KEY`
- `SPACES_ACCESS_KEY`
- `SPACES_SECRET_KEY`
- `SPACES_BUCKET`
- `SPACES_REGION`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT_NAME`
- `AZURE_OPENAI_API_VERSION`
- `FRONTEND_URL`

## Next Steps

1. Complete remaining API routes in `services/api/src/index.ts`
2. Convert frontend API utilities to use REST API
3. Run database migration script
4. Set up DigitalOcean Spaces
5. Test end-to-end
6. Deploy and verify

