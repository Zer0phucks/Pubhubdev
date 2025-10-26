# 🚨 Fix Supabase 404 Error - URGENT

## Problem Identified

The Supabase project with ID `vcdfzxjlahsajulpxzsn` returns a **404 Not Found** error, which means:
- The project was deleted or never existed
- The project was paused due to inactivity
- The project URL/ID is incorrect

## Solution Steps

### Option 1: Create New Supabase Project (Recommended)

#### Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - Project name: `pubhub` (or your preferred name)
   - Database Password: (save this securely!)
   - Region: Choose closest to your users
4. Click **"Create Project"**
5. Wait for project to be ready (2-3 minutes)

#### Step 2: Get Your Credentials
Once the project is ready:
1. Go to **Settings → API** in your Supabase project
2. Copy these values:
   - **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (long string)
   - **Service Role Key**: `eyJhbGc...` (different long string - keep secret!)

#### Step 3: Update Local Configuration

1. **Update `.env` file**:
```bash
# Replace with your actual values
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Update `src/utils/supabase/info.tsx`**:
```typescript
export const projectId = "YOUR_PROJECT_ID"
export const publicAnonKey = "your_anon_key_here"
```

#### Step 4: Set Vercel Environment Variables

1. Go to [Vercel Project Settings](https://vercel.com/pubhub/pubhub/settings/environment-variables)

2. Add these environment variables for **Production**:
```
VITE_SUPABASE_URL = https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_key_here
```

3. Add for Edge Functions (if using):
```
SUPABASE_URL = https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
```

#### Step 5: Initialize Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a simple KV store table for the application
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kv_store_expires_at ON kv_store(expires_at);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_kv_store_updated_at
BEFORE UPDATE ON kv_store
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### Step 6: Configure Authentication

In Supabase Dashboard:
1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. For OAuth providers (Google, Twitter, etc.):
   - Enable each provider you want
   - Add OAuth credentials
   - Set callback URL: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

#### Step 7: Deploy to Vercel

```bash
# Rebuild and deploy
npm run build
vercel deploy --prod
```

### Option 2: Check Existing Supabase Projects

If you think you already have a Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Check if you have any existing projects
3. If found, get the correct credentials and update configuration

### Quick Commands

```bash
# Test locally with new credentials
npm run dev

# Check if Supabase is working
node scripts/check-supabase.js

# Deploy to production
vercel deploy --prod

# View production logs
vercel logs --prod
```

## Verification Steps

After fixing, verify everything works:

1. **Local Testing**:
```bash
npm run dev
# Navigate to http://localhost:3000
# Try to sign up/sign in
```

2. **Check Diagnostics**:
```bash
node scripts/check-supabase.js
# Should show "✅ Connection successful"
```

3. **Production Testing**:
- Visit your production URL
- Open browser console (F12)
- Try to sign up/sign in
- Check for any 404 errors

## Common Issues

### Still Getting 404?
- Double-check the project ID in both `.env` and `info.tsx`
- Ensure no typos in the URL
- Make sure the project is not paused in Supabase

### Environment Variables Not Loading?
- In Vercel, redeploy after adding environment variables
- Clear browser cache
- Check browser console for which URL is being used

### Authentication Not Working?
- Check that auth providers are enabled in Supabase
- Verify callback URLs are correct
- Check browser console for specific error messages

## Need Help?

1. **Supabase Status**: Check [status.supabase.com](https://status.supabase.com)
2. **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
3. **Vercel Support**: [vercel.com/support](https://vercel.com/support)

## Emergency Fallback

If you need the app running immediately without authentication:

1. Create a mock auth service (temporary solution)
2. Disable auth requirements in the app
3. Deploy with limited functionality

**Note**: This should only be temporary while fixing the Supabase connection.

---

**Action Required**: You need to either create a new Supabase project or find your existing one and update the credentials everywhere (local `.env`, `info.tsx`, and Vercel environment variables).