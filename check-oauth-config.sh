#!/bin/bash

# Check OAuth Configuration in Supabase Edge Functions

echo "🔍 Checking OAuth Configuration..."
echo ""

# Test if Edge Function exists
echo "1. Checking if Edge Function is deployed..."
curl -s "https://ykzckfwdvmzuzxhezthv.supabase.co/functions/v1/make-server-19ccd85e" \
  -H "Content-Type: application/json" \
  | grep -q "Not Found" && echo "❌ Edge Function not found!" || echo "✅ Edge Function exists"

echo ""
echo "2. Expected environment variables in Supabase:"
echo "   - TWITTER_CLIENT_ID"
echo "   - TWITTER_CLIENT_SECRET"
echo "   - INSTAGRAM_CLIENT_ID"
echo "   - INSTAGRAM_CLIENT_SECRET"
echo "   - FACEBOOK_APP_ID"
echo "   - FACEBOOK_APP_SECRET"
echo "   - LINKEDIN_CLIENT_ID"
echo "   - LINKEDIN_CLIENT_SECRET"
echo "   - YOUTUBE_CLIENT_ID"
echo "   - YOUTUBE_CLIENT_SECRET"
echo "   - TIKTOK_CLIENT_KEY"
echo "   - TIKTOK_CLIENT_SECRET"
echo "   - PINTEREST_APP_ID"
echo "   - PINTEREST_APP_SECRET"
echo "   - REDDIT_CLIENT_ID"
echo "   - REDDIT_CLIENT_SECRET"
echo ""

echo "3. To check your Supabase secrets, run:"
echo "   supabase secrets list"
echo ""

echo "4. To set missing secrets:"
echo "   supabase secrets set TWITTER_CLIENT_ID='your_id_here'"
echo "   supabase secrets set TWITTER_CLIENT_SECRET='your_secret_here'"
echo ""

echo "5. To redeploy Edge Functions:"
echo "   supabase functions deploy make-server-19ccd85e"
echo ""

echo "📋 Go to Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/settings/secrets"
echo ""

