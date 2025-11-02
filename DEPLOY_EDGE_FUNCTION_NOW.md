# 🚀 Deploy Edge Function - Quick Guide

## Option 1: Supabase Dashboard (Easiest for Windows)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/functions

### Step 2: Find or Create the Function
- Look for function named `make-server-19ccd85e`
- If it doesn't exist, click **"Create a new function"**
- Name it: `make-server-19ccd85e`

### Step 3: Copy the Updated Code
1. Open the file: `src/supabase/functions/server/index.tsx` in your editor
2. **Select ALL** (Ctrl+A) and **Copy** (Ctrl+C)
3. In Supabase Dashboard, **paste** the code into the editor
4. Click **"Deploy"** button

### Step 4: Wait for Deployment
- Wait 30-60 seconds for deployment to complete
- You'll see a success message when done

---

## Option 2: Supabase CLI (If you have it installed)

### Step 1: Install Supabase CLI (if needed)
```powershell
npm install -g supabase
```

### Step 2: Login to Supabase
```powershell
supabase login
```

### Step 3: Link Your Project
```powershell
supabase link --project-ref ykzckfwdvmzuzxhezthv
```

### Step 4: Copy Function Files
The function source is at `src/supabase/functions/server/index.tsx`

You need to copy it to `supabase/functions/make-server-19ccd85e/index.tsx`:

**In PowerShell:**
```powershell
# Create directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "supabase\functions\make-server-19ccd85e"

# Copy all files from server directory
Copy-Item -Path "src\supabase\functions\server\*" -Destination "supabase\functions\make-server-19ccd85e\" -Recurse -Force
```

### Step 5: Deploy
```powershell
supabase functions deploy make-server-19ccd85e --no-verify-jwt
```

---

## Option 3: Using Git Bash or WSL (If Available)

If you have Git Bash or WSL installed, you can use the existing script:

```bash
# In Git Bash or WSL
./deploy-edge-functions.sh
```

---

## Verify Deployment

After deployment, test by:

1. Go to: https://pubhub.dev
2. Try connecting Twitter/X again
3. The OAuth flow should now work with the PKCE fix

---

## Troubleshooting

### "Function not found" error
- Make sure the function name is exactly: `make-server-19ccd85e`
- Check you're logged into the correct Supabase project

### Still getting errors after deployment
- Wait 1-2 minutes for deployment to fully propagate
- Clear browser cache and try again
- Check browser console for specific error messages

---

## What Was Fixed

This deployment includes:
- ✅ Twitter OAuth 2.0 PKCE implementation (code_verifier)
- ✅ Basic Authentication header for Twitter token exchange
- ✅ Improved error handling in API calls
- ✅ Better token verification in OAuth callback

---

**Recommended**: Use Option 1 (Dashboard) - it's the fastest and most reliable for Windows users!
