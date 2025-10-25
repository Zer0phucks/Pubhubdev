# Manual GitHub Secrets Setup Guide

Since Supabase CLI only shows hashes of secrets (for security), you'll need to manually add the actual values to GitHub. Here's how to do it:

## Step 1: Get Your Supabase Credentials

### From Supabase Dashboard:
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project: **pubhub** (vcdfzxjlahsajulpxzsn)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role** key → This is your `SUPABASE_SERVICE_ROLE_KEY`

### Expected Format:
- `SUPABASE_URL`: `https://vcdfzxjlahsajulpxzsn.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)

## Step 2: Add Secrets to GitHub

### Method 1: GitHub Web Interface
1. Go to your repository: https://github.com/Zer0phucks/Pubhubdev
2. Click **Settings** tab
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add these two secrets:

**Secret 1:**
- Name: `SUPABASE_URL`
- Value: `https://vcdfzxjlahsajulpxzsn.supabase.co`

**Secret 2:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `[your-service-role-key-from-supabase-dashboard]`

### Method 2: GitHub CLI (if you have the values)
```bash
# Add SUPABASE_URL
gh secret set SUPABASE_URL --body "https://vcdfzxjlahsajulpxzsn.supabase.co"

# Add SUPABASE_SERVICE_ROLE_KEY (replace with actual key)
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Step 3: Verify Setup

After adding the secrets, you can verify they're working by:

1. **Push a change** to trigger the CI pipeline
2. **Check GitHub Actions** to see if the Supabase tests run successfully
3. **Look for this in the workflow logs:**
   ```
   Run Supabase function tests
   cd src/supabase/functions/server
   deno test --allow-all
   ```

## What These Secrets Are Used For

The GitHub Actions workflow uses these secrets in the `supabase-tests` job:

```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

This allows the CI pipeline to:
- Connect to your Supabase project
- Run tests against your Edge Functions
- Verify database operations
- Test authentication flows

## Security Notes

✅ **Safe to add to GitHub Secrets:**
- `SUPABASE_URL` - This is public information
- `SUPABASE_SERVICE_ROLE_KEY` - This is safe in GitHub Secrets (encrypted)

❌ **Never commit to code:**
- Service role keys in source code
- Any API keys in `.env` files
- Database connection strings

## Troubleshooting

### If tests still fail:
1. **Check secret names** - Must be exactly `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. **Verify project ID** - Should be `vcdfzxjlahsajulpxzsn`
3. **Check Supabase project status** - Make sure it's not paused
4. **Review workflow logs** - Look for specific error messages

### Common Issues:
- **"Project not found"** → Wrong project ID in URL
- **"Invalid service role key"** → Wrong or expired key
- **"Project paused"** → Resume project in Supabase dashboard

## Next Steps

Once you've added the secrets:

1. **Push your changes** to trigger CI
2. **Monitor the workflow** in GitHub Actions
3. **Check test results** to ensure everything passes
4. **Celebrate!** 🎉 Your comprehensive testing suite is now fully operational

The CI pipeline will now run:
- ✅ Unit tests (Vitest)
- ✅ Integration tests (React Testing Library)
- ✅ E2E tests (Playwright)
- ✅ Supabase Edge Function tests (Deno)
- ✅ Linting and type checking
- ✅ Security audits
- ✅ Build verification
