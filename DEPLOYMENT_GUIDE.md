# DigitalOcean Deployment Guide

This guide covers the remaining manual steps to complete the migration to DigitalOcean.

## Prerequisites

- DigitalOcean account with App Platform access
- `doctl` CLI installed and authenticated (optional, for CLI operations)
- Access to Clerk dashboard for secret keys
- Access to OAuth provider dashboards for credentials

## Step 1: Create DigitalOcean Spaces Bucket

1. **Navigate to DigitalOcean Console**
   - Go to https://cloud.digitalocean.com/spaces
   - Click "Create a Space"

2. **Configure the Space**
   - **Name**: `pubhub-uploads`
   - **Region**: `San Francisco (sfo3)` (must match app region)
   - **CDN**: Enable if you want CDN (optional)
   - Click "Create a Space"

3. **Configure CORS**
   - In the Space settings, go to "Settings" → "CORS Configurations"
   - Add the following CORS rule:
   ```json
   {
     "AllowedOrigins": ["https://pubhub.dev", "https://www.pubhub.dev"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
     "AllowedHeaders": ["*"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3000
   }
   ```

4. **Generate Access Keys**
   - Go to https://cloud.digitalocean.com/account/api/spaces
   - Click "Generate New Key"
   - **Name**: `pubhub-spaces-key`
   - **Spaces Access**: Select your `pubhub-uploads` space
   - Copy the **Access Key** and **Secret Key** (you'll need these for Step 2)

## Step 2: Set Environment Variables in App Platform

1. **Navigate to App Platform**
   - Go to https://cloud.digitalocean.com/apps
   - Click on the `pubhub` app
   - Go to "Settings" → "App-Level Environment Variables"

2. **Add Required Secrets**
   Click "Edit" and add the following variables (mark as "Encrypted" for secrets):

   **Authentication:**
   - `CLERK_SECRET_KEY` - From Clerk dashboard (Settings → API Keys)

   **Storage:**
   - `SPACES_ACCESS_KEY` - From Step 1.4
   - `SPACES_SECRET_KEY` - From Step 1.4

   **Azure OpenAI:**
   - `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint
   - `AZURE_OPENAI_API_KEY` - Your Azure OpenAI API key
   - `AZURE_OPENAI_DEPLOYMENT_NAME` - Your deployment name
   - `AZURE_OPENAI_API_VERSION` - API version (e.g., "2024-02-15-preview")

   **OAuth Providers** (add as needed):
   - `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
   - `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`
   - `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`
   - `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET`
   - `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`
   - `TIKTOK_CLIENT_ID` / `TIKTOK_CLIENT_SECRET`
   - `PINTEREST_CLIENT_ID` / `PINTEREST_CLIENT_SECRET`
   - `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`

3. **Save Changes**
   - Click "Save" - this will trigger a new deployment

## Step 3: Apply Database Migrations

The database migrations need to be applied to the DigitalOcean PostgreSQL database.

### Option A: Using App Platform Console (Recommended)

1. **Get Database Connection String**
   - In App Platform, go to your app → "Components" → "pubhub-db"
   - Copy the connection string (or use the "Connection Details" section)

2. **Run Migration Script**
   ```bash
   # Set the DATABASE_URL environment variable
   export DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
   
   # Run the migration script
   bash scripts/apply-do-migrations.sh
   ```

### Option B: Using DigitalOcean Database Console

1. **Access Database via Console**
   - Go to App Platform → Components → pubhub-db
   - Click "Open in Database" or use the connection string

2. **Run SQL Manually**
   - Copy the SQL from `scripts/apply-do-migrations.sh`
   - Execute it in the database console

### Option C: Using a One-Time Job (Future Enhancement)

You can add a one-time job to the `do-app-spec.yaml`:
```yaml
jobs:
  - name: run-migrations
    github:
      repo: Zer0phucks/Pubhubdev
      branch: main
    source_dir: /
    run_command: bash scripts/apply-do-migrations.sh
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: DATABASE_URL
        value: ${pubhub-db.DATABASE_URL}
```

## Step 4: Update App Spec and Deploy

The app spec has been updated in `do-app-spec.yaml`. To deploy:

### Option A: Via GitHub (Automatic)

If you have GitHub integration enabled:
1. Push changes to the `main` branch
2. DigitalOcean will automatically detect and deploy

### Option B: Via CLI

```bash
# Update the app with the new spec
doctl apps update aff826e7-0fa7-4ba5-b326-ec4d84546475 --spec do-app-spec.yaml
```

### Option C: Via Console

1. Go to App Platform → Your App → "Settings" → "App Spec"
2. Copy the contents of `do-app-spec.yaml`
3. Paste and click "Save Changes"
4. This will trigger a new deployment

## Step 5: Verify Deployment

1. **Check Deployment Status**
   - Go to App Platform → Your App → "Deployments"
   - Wait for deployment to complete (should show "Active")

2. **Verify Services**
   - Frontend: https://pubhub.dev
   - API: https://pubhub.dev/api/health
   - Database: Check connection in App Platform

3. **Test Functionality**
   - Sign in with Clerk
   - Test file uploads (should use Spaces)
   - Test API endpoints
   - Verify database operations

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set in the API service
- Check database component is running
- Verify network connectivity

### Spaces Upload Issues
- Verify `SPACES_ACCESS_KEY` and `SPACES_SECRET_KEY` are set
- Check bucket name matches (`pubhub-uploads`)
- Verify CORS is configured correctly
- Check region matches (`sfo3`)

### API Service Not Starting
- Check build logs in App Platform
- Verify all required environment variables are set
- Check health endpoint: `/api/health`
- Review service logs in App Platform

### Migration Errors
- Ensure `uuid-ossp`, `vector`, and `pgcrypto` extensions are enabled
- Check PostgreSQL version is 17
- Verify database user has CREATE privileges

## Next Steps

After successful deployment:
1. Test all authentication flows
2. Verify file uploads work with Spaces
3. Test RAG queries and persona generation
4. Monitor logs for any errors
5. Set up monitoring and alerts

## Rollback Plan

If issues occur:
1. Previous deployment is automatically kept
2. Go to "Deployments" → Select previous deployment → "Rollback"
3. Or revert the GitHub commit to trigger a new deployment

