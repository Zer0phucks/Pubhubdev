#!/bin/bash

echo "🚀 Pushing OAuth secrets to Supabase..."

# Source .env file
set -a
source .env
set +a

# Push each secret
echo ""
echo "📋 Pushing secrets..."
echo ""

# Frontend
echo "Setting FRONTEND_URL..."
npx supabase secrets set FRONTEND_URL="https://pubhub.dev"

echo "Setting OAUTH_REDIRECT_URL..."
npx supabase secrets set OAUTH_REDIRECT_URL="https://pubhub.dev/api/oauth/callback"

# Twitter
echo "Setting Twitter secrets..."
npx supabase secrets set TWITTER_CLIENT_ID="$TWITTER_CLIENT_ID"
npx supabase secrets set TWITTER_CLIENT_SECRET="$TWITTER_CLIENT_SECRET"
npx supabase secrets set TWITTER_REDIRECT_URI="$TWITTER_REDIRECT_URI"

# Instagram
echo "Setting Instagram secrets..."
npx supabase secrets set INSTAGRAM_CLIENT_ID="$INSTAGRAM_CLIENT_ID"
npx supabase secrets set INSTAGRAM_CLIENT_SECRET="$INSTAGRAM_CLIENT_SECRET"
npx supabase secrets set INSTAGRAM_REDIRECT_URI="$INSTAGRAM_REDIRECT_URI"

# Facebook
echo "Setting Facebook secrets..."
npx supabase secrets set FACEBOOK_APP_ID="$FACEBOOK_APP_ID"
npx supabase secrets set FACEBOOK_APP_SECRET="$FACEBOOK_APP_SECRET"
npx supabase secrets set FACEBOOK_REDIRECT_URI="$FACEBOOK_REDIRECT_URI"

# LinkedIn
echo "Setting LinkedIn secrets..."
npx supabase secrets set LINKEDIN_CLIENT_ID="$LINKEDIN_CLIENT_ID"
npx supabase secrets set LINKEDIN_CLIENT_SECRET="$LINKEDIN_CLIENT_SECRET"
npx supabase secrets set LINKEDIN_REDIRECT_URI="$LINKEDIN_REDIRECT_URI"

# YouTube
echo "Setting YouTube secrets..."
npx supabase secrets set YOUTUBE_CLIENT_ID="$YOUTUBE_CLIENT_ID"
npx supabase secrets set YOUTUBE_CLIENT_SECRET="$YOUTUBE_CLIENT_SECRET"
npx supabase secrets set YOUTUBE_REDIRECT_URI="$YOUTUBE_REDIRECT_URI"

# Google (same as YouTube)
npx supabase secrets set GOOGLE_CLIENT_ID="$YOUTUBE_CLIENT_ID"
npx supabase secrets set GOOGLE_CLIENT_SECRET="$YOUTUBE_CLIENT_SECRET"

# TikTok
echo "Setting TikTok secrets..."
npx supabase secrets set TIKTOK_CLIENT_KEY="$TIKTOK_CLIENT_KEY"
npx supabase secrets set TIKTOK_CLIENT_SECRET="$TIKTOK_CLIENT_SECRET"
npx supabase secrets set TIKTOK_REDIRECT_URI="$TIKTOK_REDIRECT_URI"

# Pinterest
echo "Setting Pinterest secrets..."
npx supabase secrets set PINTEREST_APP_ID="$PINTEREST_APP_ID"
npx supabase secrets set PINTEREST_APP_SECRET="$PINTEREST_APP_SECRET"
npx supabase secrets set PINTEREST_REDIRECT_URI="$PINTEREST_REDIRECT_URI"

# Reddit
echo "Setting Reddit secrets..."
npx supabase secrets set REDDIT_CLIENT_ID="$REDDIT_CLIENT_ID"
npx supabase secrets set REDDIT_CLIENT_SECRET="$REDDIT_CLIENT_SECRET"
npx supabase secrets set REDDIT_REDIRECT_URI="$REDDIT_REDIRECT_URI"

echo ""
echo "✅ All secrets pushed!"
echo ""

