# Complete Migration Implementation Guide

## Quick Start

### Step 1: Database Migration

1. Get your DigitalOcean database connection string
2. Run the migration script:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   bash scripts/apply-do-migrations.sh
   ```

### Step 2: Set Up DigitalOcean Spaces

1. Go to DigitalOcean Console → Spaces
2. Create a new Space: `pubhub-uploads`
3. Region: `nyc3` (or your preferred region)
4. Generate access keys
5. Add to environment variables:
   - `SPACES_ACCESS_KEY`
   - `SPACES_SECRET_KEY`
   - `SPACES_BUCKET=pubhub-uploads`
   - `SPACES_REGION=nyc3`

### Step 3: Deploy API Service

The API service is configured in `do-app-spec.yaml`. To deploy:

**Option A: Via DigitalOcean Console**
1. Go to Apps → pubhub
2. Click "Edit" or "Create Deployment"
3. Upload/update the `do-app-spec.yaml`
4. Add all environment variables
5. Deploy

**Option B: Via CLI**
```bash
doctl apps update <app-id> --spec do-app-spec.yaml
```

### Step 4: Verify Deployment

1. Check API health: `https://pubhubdev.ondigitalocean.app/health`
2. Test authentication with Clerk
3. Test API endpoints

## File Structure

```
.
├── services/api/              # New API service
│   ├── src/
│   │   ├── index.ts          # Main server (all routes)
│   │   ├── db/               # Database utilities
│   │   ├── storage/          # DO Spaces integration
│   │   └── middleware/      # Auth, rate limiting
│   ├── package.json
│   └── tsconfig.json
├── scripts/
│   └── apply-do-migrations.sh  # Database migration script
├── do-app-spec.yaml          # Updated with API service
└── src/
    ├── components/
    │   └── AuthContext.tsx   # Migrated to Clerk
    └── utils/
        ├── api.ts            # Updated API client
        └── csp.ts            # Updated CSP
```

## Key Changes Made

### Authentication
- **Before**: Supabase Auth (`supabase.auth.signInWithPassword`)
- **After**: Clerk (`useAuth`, `useUser` hooks)
- **Migration**: `src/components/AuthContext.tsx` now uses Clerk

### API Client
- **Before**: Direct Supabase client calls (`supabase.from('table')`)
- **After**: REST API calls to DigitalOcean backend (`fetch` to API service)
- **Migration**: `src/utils/api.ts` updated to use `VITE_API_BASE_URL`

### Storage
- **Before**: Supabase Storage (`supabase.storage.from('bucket')`)
- **After**: DigitalOcean Spaces (S3-compatible API)
- **Migration**: `services/api/src/storage/spaces.ts` implements Spaces integration

### Database
- **Before**: Supabase PostgREST (automatic REST API)
- **After**: Direct PostgreSQL queries via `pg` library
- **Migration**: `services/api/src/db/client.ts` and route handlers

### Edge Functions
- **Before**: Supabase Edge Functions (Deno runtime)
- **After**: DigitalOcean App Platform Service (Node.js runtime)
- **Migration**: `services/api/src/index.ts` contains all routes

## Testing Checklist

- [ ] Database migrations applied successfully
- [ ] API service health check returns 200
- [ ] Clerk authentication works (sign up, sign in, sign out)
- [ ] User profile initialization works
- [ ] Posts CRUD operations work
- [ ] Projects CRUD operations work
- [ ] File uploads work (profile picture, project logo)
- [ ] AI text generation works
- [ ] AI chat works
- [ ] Settings can be saved/retrieved
- [ ] Connections can be updated

## Troubleshooting

### API Service Not Starting
- Check `DATABASE_URL` is set correctly
- Verify `CLERK_SECRET_KEY` is set
- Check logs in DigitalOcean console

### Authentication Failing
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set in frontend
- Check Clerk dashboard for correct publishable key
- Verify API service has `CLERK_SECRET_KEY`

### Database Connection Issues
- Verify `DATABASE_URL` format is correct
- Check database is accessible from App Platform
- Verify VPC configuration if using private database

### Storage Upload Failing
- Verify Spaces access keys are correct
- Check bucket name matches `SPACES_BUCKET`
- Verify region matches `SPACES_REGION`
- Check bucket permissions

## Rollback Plan

If issues occur:
1. Keep Supabase project active during migration
2. Revert `do-app-spec.yaml` to previous version
3. Revert frontend environment variables
4. Revert `src/components/AuthContext.tsx` if needed
5. Monitor error rates and user feedback

## Support

For issues:
1. Check DigitalOcean App Platform logs
2. Check API service logs
3. Verify all environment variables are set
4. Test database connectivity
5. Test Spaces connectivity

