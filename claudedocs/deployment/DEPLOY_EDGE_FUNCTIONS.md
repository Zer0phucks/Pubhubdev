# 🚀 Deploy Supabase Edge Functions

The application is trying to access Edge Functions that aren't deployed yet. Follow these steps to deploy them:

## Prerequisites

1. **Supabase CLI** installed (you have v2.48.3 ✅)
2. **Supabase project** created (you have `ykzckfwdvmzuzxhezthv` ✅)
3. **Service Role Key** from your .env file

## Step 1: Link Your Project

Run this command and follow the prompts:

```bash
supabase link --project-ref ykzckfwdvmzuzxhezthv
```

When prompted for the database password, enter the password you set when creating the project.

## Step 2: Set Environment Variables

Create a `.env.local` file in the `supabase/functions` directory:

```bash
cat > supabase/functions/.env.local << 'EOF'
# Supabase
SUPABASE_URL=https://ykzckfwdvmzuzxhezthv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlremNrZndkdm16dXp4aGV6dGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQxMzY5MiwiZXhwIjoyMDc2OTg5NjkyfQ.zuPtydf-aqvaJTnB1hMaHS0JbZEaUqw8QkRKsjEmprU

# OAuth credentials
TWITTER_CLIENT_ID=UFJHd1A5djg3Q0pxMUhodllmcnE6MTpjaQ
TWITTER_CLIENT_SECRET=aS_PTcyS0FGBnvmJqISYOcdkzrnCvcbFlAkEsp8XV14YSnUntZ
INSTAGRAM_CLIENT_ID=607674182388054
INSTAGRAM_CLIENT_SECRET=3f0b4725900637b532e21bc09e6d4a3d
FACEBOOK_APP_ID=607674182388054
FACEBOOK_APP_SECRET=3f0b4725900637b532e21bc09e6d4a3d
LINKEDIN_CLIENT_ID=86w0sagddzgpqt
LINKEDIN_CLIENT_SECRET=WPL_AP1.72u6v5oSJAn28PWU.JNzjfw==
YOUTUBE_CLIENT_ID=401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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
TIKTOK_CLIENT_KEY=aw5x5i0z1lp91c8k
TIKTOK_CLIENT_SECRET=zB6MFsrLUPLAlIVnDvZYIA0EfzwsX2wn
PINTEREST_APP_ID=1534363
PINTEREST_APP_SECRET=pina_AMAZW2IXABEYAAIAGDAKCCS2LYEADGQBQBIQC6HIOZB7L4RLCKOI7XTUR4ITLLMYGH22BQCNNVP2QH4JUJKPUL5BKNB45HQA
REDDIT_CLIENT_ID=1253F-aBlKGyP4xtIFqJ7A
REDDIT_CLIENT_SECRET=dWGcouy8RwBSL07mC7FYfv0xQJdoIg

# Frontend URL
FRONTEND_URL=https://pubhubdev-5p7cc2lfd-pubhub.vercel.app

# Azure OpenAI
AZURE_OPENAI_API_KEY=EtV8YXPGmUc34UVxwT9hd4pX00hzKQSvNbjVFFoQDK0BRKI5qIuqJQQJ99BIACHYHv6XJ3w3AAAAACOGOBgU
AZURE_OPENAI_ENDPOINT=https://10062537-5848-resource.cognitiveservices.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=model-router
AZURE_OPENAI_API_VERSION=2024-02-15-preview
EOF
```

## Step 3: Deploy the Edge Function

```bash
# Deploy the function
supabase functions deploy make-server-19ccd85e --no-verify-jwt

# Check deployment status
supabase functions list
```

## Step 4: Set Secrets in Production

```bash
# Set all the environment variables as secrets
supabase secrets set TWITTER_CLIENT_ID="UFJHd1A5djg3Q0pxMUhodllmcnE6MTpjaQ"
supabase secrets set TWITTER_CLIENT_SECRET="aS_PTcyS0FGBnvmJqISYOcdkzrnCvcbFlAkEsp8XV14YSnUntZ"
supabase secrets set INSTAGRAM_CLIENT_ID="607674182388054"
supabase secrets set INSTAGRAM_CLIENT_SECRET="3f0b4725900637b532e21bc09e6d4a3d"
supabase secrets set FACEBOOK_APP_ID="607674182388054"
supabase secrets set FACEBOOK_APP_SECRET="3f0b4725900637b532e21bc09e6d4a3d"
supabase secrets set LINKEDIN_CLIENT_ID="86w0sagddzgpqt"
supabase secrets set LINKEDIN_CLIENT_SECRET="WPL_AP1.72u6v5oSJAn28PWU.JNzjfw=="
supabase secrets set YOUTUBE_CLIENT_ID="401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com"
supabase secrets set YOUTUBE_CLIENT_SECRET="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"
supabase secrets set TIKTOK_CLIENT_KEY="aw5x5i0z1lp91c8k"
supabase secrets set TIKTOK_CLIENT_SECRET="zB6MFsrLUPLAlIVnDvZYIA0EfzwsX2wn"
supabase secrets set PINTEREST_APP_ID="1534363"
supabase secrets set PINTEREST_APP_SECRET="pina_AMAZW2IXABEYAAIAGDAKCCS2LYEADGQBQBIQC6HIOZB7L4RLCKOI7XTUR4ITLLMYGH22BQCNNVP2QH4JUJKPUL5BKNB45HQA"
supabase secrets set REDDIT_CLIENT_ID="1253F-aBlKGyP4xtIFqJ7A"
supabase secrets set REDDIT_CLIENT_SECRET="dWGcouy8RwBSL07mC7FYfv0xQJdoIg"
supabase secrets set FRONTEND_URL="https://pubhubdev-5p7cc2lfd-pubhub.vercel.app"
supabase secrets set AZURE_OPENAI_API_KEY="EtV8YXPGmUc34UVxwT9hd4pX00hzKQSvNbjVFFoQDK0BRKI5qIuqJQQJ99BIACHYHv6XJ3w3AAAAACOGOBgU"
supabase secrets set AZURE_OPENAI_ENDPOINT="https://10062537-5848-resource.cognitiveservices.azure.com/"
supabase secrets set AZURE_OPENAI_DEPLOYMENT_NAME="model-router"
supabase secrets set AZURE_OPENAI_API_VERSION="2024-02-15-preview"
```

## Step 5: Test the Function

After deployment, test the Edge Function:

```bash
# Test health endpoint
curl https://ykzckfwdvmzuzxhezthv.supabase.co/functions/v1/make-server-19ccd85e/health

# Should return: {"status":"ok"}
```

## Step 6: Update CORS (if needed)

If you still get CORS errors, update the Edge Function's CORS settings in `supabase/functions/make-server-19ccd85e/index.tsx`:

```typescript
// Update the CORS configuration
cors({
  origin: [
    "https://pubhub.dev",
    "https://pubhubdev-5p7cc2lfd-pubhub.vercel.app",
    "https://*.vercel.app",
    "https://pubhub.dev"
  ],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
})
```

Then redeploy:

```bash
supabase functions deploy make-server-19ccd85e --no-verify-jwt
```

## Alternative: Quick Deploy Script

Create and run this script to do everything automatically:

```bash
#!/bin/bash

# Link to project
supabase link --project-ref ykzckfwdvmzuzxhezthv

# Deploy function
supabase functions deploy make-server-19ccd85e --no-verify-jwt

# Set all secrets
supabase secrets set --env-file .env

echo "Edge Functions deployed!"
```

## Troubleshooting

### "Function not found" error
- Make sure the function name matches exactly: `make-server-19ccd85e`
- Check deployment status: `supabase functions list`

### CORS errors persist
- Clear browser cache
- Check that FRONTEND_URL secret is set correctly
- Verify origin URLs in CORS configuration

### Authentication errors
- Ensure SUPABASE_SERVICE_ROLE_KEY is set as a secret
- Check that the key matches the one in your project settings

## Verification

Once deployed, your app should be able to:
1. Create and manage projects
2. Connect OAuth platforms
3. Post content to social media
4. Store and retrieve data

Test by visiting your app and trying to sign in or create a project.

---

**Note**: The Edge Functions must be deployed for the app to work properly. Without them, all API calls will fail with CORS or 404 errors.