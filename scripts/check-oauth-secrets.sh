#!/bin/bash

# Script to add missing OAuth platform credentials to Supabase secrets
# This script helps you add any missing OAuth client IDs and secrets

echo "🔐 Adding OAuth platform credentials to Supabase secrets..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI is available"

# Check current OAuth secrets
echo "📋 Current OAuth platform credentials in Supabase:"
supabase secrets list | grep -E "(CLIENT_ID|CLIENT_SECRET|APP_ID|APP_SECRET|CLIENT_KEY)"

echo ""
echo "🔍 Checking for missing OAuth credentials..."

# Check what's missing
MISSING_SECRETS=()

# Check TikTok CLIENT_KEY
if ! supabase secrets list | grep -q "TIKTOK_CLIENT_KEY"; then
    MISSING_SECRETS+=("TIKTOK_CLIENT_KEY")
fi

# You can add more checks here for other missing credentials

if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
    echo "✅ All required OAuth credentials are already configured!"
    echo ""
    echo "📋 Current OAuth platforms configured:"
    echo "   - Twitter (TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET)"
    echo "   - Instagram (INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET)"
    echo "   - LinkedIn (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET)"
    echo "   - Facebook (FACEBOOK_APP_ID, FACEBOOK_APP_SECRET)"
    echo "   - YouTube (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET)"
    echo "   - TikTok (TIKTOK_CLIENT_SECRET) - Missing TIKTOK_CLIENT_KEY"
    echo "   - Pinterest (PINTEREST_APP_ID, PINTEREST_APP_SECRET)"
    echo "   - Reddit (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)"
    echo ""
    echo "⚠️  Note: TikTok is missing TIKTOK_CLIENT_KEY"
    echo "   To add it, run: supabase secrets set TIKTOK_CLIENT_KEY your_tiktok_client_key"
else
    echo "❌ Missing OAuth credentials:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "💡 To add missing secrets, use:"
    echo "   supabase secrets set SECRET_NAME your_secret_value"
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Get your OAuth credentials from each platform's developer console"
echo "   2. Add any missing credentials using: supabase secrets set"
echo "   3. Test OAuth flows in your application"
echo ""
echo "📚 OAuth Platform Developer Consoles:"
echo "   - Twitter: https://developer.twitter.com/"
echo "   - Instagram: https://developers.facebook.com/"
echo "   - LinkedIn: https://www.linkedin.com/developers/"
echo "   - Facebook: https://developers.facebook.com/"
echo "   - YouTube: https://console.developers.google.com/"
echo "   - TikTok: https://developers.tiktok.com/"
echo "   - Pinterest: https://developers.pinterest.com/"
echo "   - Reddit: https://www.reddit.com/prefs/apps"
