# GitHub Secrets Configuration Guide

This guide explains how to add your Supabase credentials and other environment variables to GitHub Secrets for the CI/CD pipeline.

## Required GitHub Secrets

### Core Supabase Secrets
Add these secrets to your GitHub repository:

1. **SUPABASE_URL**
   - Value: Your Supabase project URL (e.g., `https://your-project-id.supabase.co`)
   - Used by: Supabase Edge Functions, tests

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (found in Project Settings > API)
   - Used by: Supabase Edge Functions for admin operations
   - ⚠️ **Keep this secret!** Never expose in client-side code

3. **SUPABASE_ANON_KEY**
   - Value: Your Supabase anonymous key (found in Project Settings > API)
   - Used by: Frontend application for client-side operations

### Frontend Configuration
4. **FRONTEND_URL**
   - Value: Your production domain (e.g., `https://your-domain.com`)
   - Used by: OAuth redirects, CORS configuration

### Azure OpenAI (Optional - for AI features)
5. **AZURE_OPENAI_ENDPOINT**
   - Value: Your Azure OpenAI endpoint URL
   - Used by: AI content generation, ebook creation

6. **AZURE_OPENAI_API_KEY**
   - Value: Your Azure OpenAI API key
   - Used by: AI content generation, ebook creation

7. **AZURE_OPENAI_DEPLOYMENT_NAME**
   - Value: Your Azure OpenAI deployment name
   - Used by: AI content generation, ebook creation

8. **AZURE_OPENAI_API_VERSION**
   - Value: API version (e.g., `2024-02-15-preview`)
   - Used by: AI content generation, ebook creation

### OAuth Platform Credentials (Optional)
Add these only if you want to test OAuth integrations in CI:

9. **TWITTER_CLIENT_ID**
10. **TWITTER_CLIENT_SECRET**
11. **INSTAGRAM_CLIENT_ID**
12. **INSTAGRAM_CLIENT_SECRET**
13. **LINKEDIN_CLIENT_ID**
14. **LINKEDIN_CLIENT_SECRET**
15. **FACEBOOK_APP_ID**
16. **FACEBOOK_APP_SECRET**
17. **YOUTUBE_CLIENT_ID**
18. **YOUTUBE_CLIENT_SECRET**
19. **TIKTOK_CLIENT_KEY**
20. **TIKTOK_CLIENT_SECRET**
21. **PINTEREST_APP_ID**
22. **PINTEREST_APP_SECRET**
23. **REDDIT_CLIENT_ID**
24. **REDDIT_CLIENT_SECRET**

## How to Add Secrets to GitHub

### Method 1: GitHub Web Interface
1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

### Method 2: GitHub CLI
```bash
# Install GitHub CLI if you haven't already
# https://cli.github.com/

# Authenticate
gh auth login

# Add secrets
gh secret set SUPABASE_URL --body "https://your-project-id.supabase.co"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "your-service-role-key"
gh secret set SUPABASE_ANON_KEY --body "your-anon-key"
gh secret set FRONTEND_URL --body "https://your-domain.com"
```

### Method 3: Bulk Import from .env file
If you have a `.env` file with your credentials:

```bash
# Create a script to import secrets from .env
cat > import-secrets.sh << 'EOF'
#!/bin/bash

# Read .env file and add secrets to GitHub
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ ! $key =~ ^#.*$ ]] && [[ -n $key ]]; then
    # Remove quotes if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    echo "Adding secret: $key"
    gh secret set "$key" --body "$value"
  fi
done < .env
EOF

chmod +x import-secrets.sh
./import-secrets.sh
```

## Finding Your Supabase Credentials

### 1. Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Supabase CLI (Alternative)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Get project info
supabase status
```

## Testing Secrets in CI

The GitHub Actions workflow will automatically use these secrets. You can verify they're working by:

1. **Check the workflow logs** - Look for successful Supabase connections
2. **Run tests locally** - Use the same environment variables
3. **Monitor Edge Functions** - Check Supabase logs for successful deployments

## Security Best Practices

### ✅ Do:
- Use GitHub Secrets for all sensitive data
- Rotate keys regularly
- Use different keys for different environments
- Monitor secret usage in GitHub audit logs

### ❌ Don't:
- Commit secrets to your repository
- Share secrets in plain text
- Use production secrets in development
- Expose service role keys in client-side code

## Troubleshooting

### Common Issues:

1. **"Secret not found" error**
   - Verify the secret name matches exactly (case-sensitive)
   - Check that the secret was added to the correct repository

2. **"Invalid Supabase credentials" error**
   - Verify the URL format: `https://your-project-id.supabase.co`
   - Check that the service role key is correct
   - Ensure the project is active and not paused

3. **"OAuth not configured" error**
   - Add the required OAuth platform secrets
   - Verify client IDs and secrets are correct
   - Check redirect URIs match your domain

### Verification Commands:
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://YOUR_PROJECT_ID.supabase.co/rest/v1/"

# Check Edge Function deployment
supabase functions deploy --project-ref YOUR_PROJECT_ID
```

## Next Steps

After adding the secrets:

1. **Push your changes** to trigger the CI pipeline
2. **Monitor the workflow** in GitHub Actions
3. **Check Supabase logs** for any connection issues
4. **Test the application** to ensure everything works

The CI pipeline will now be able to:
- Run Supabase Edge Function tests
- Deploy functions with proper credentials
- Test OAuth integrations (if configured)
- Verify the application builds correctly
