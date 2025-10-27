#!/bin/bash

# QUICK OAUTH SETUP - Push credentials from .env to Supabase
# This script pushes all the OAuth credentials found in .env to Supabase Edge Functions

echo "🚀 Setting up OAuth credentials from .env file..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Load .env file
set -a
source .env
set +a

echo "✅ Loaded credentials from .env"
echo ""

# Function to set secret
set_secret() {
    local var_name=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo "⚠️  $var_name is empty, skipping..."
        return
    fi
    
    echo "Setting $var_name..."
    # Remove quotes if present
    value=$(echo $value | sed 's/^"//;s/"$//')
    supabase secrets set "$var_name=$value"
    
    if [ $? -eq 0 ]; then
        echo "✅ $var_name set successfully"
    else
        echo "❌ Failed to set $var_name"
    fi
}

echo "📋 Setting OAuth credentials for each platform..."
echo ""

# Frontend URL
echo "Setting Frontend URL..."
set_secret "FRONTEND_URL" "https://pubhub.dev"
set_secret "OAUTH_REDIRECT_URL" "$OAUTH_REDIRECT_URL"

echo ""
echo "📱 Setting platform credentials..."
echo ""

# Twitter
set_secret "TWITTER_CLIENT_ID" "$TWITTER_CLIENT_ID"
set_secret "TWITTER_CLIENT_SECRET" "$TWITTER_CLIENT_SECRET"
set_secret "TWITTER_REDIRECT_URI" "$TWITTER_REDIRECT_URI"

# Instagram
set_secret "INSTAGRAM_CLIENT_ID" "$INSTAGRAM_CLIENT_ID"
set_secret "INSTAGRAM_CLIENT_SECRET" "$INSTAGRAM_CLIENT_SECRET"
set_secret "INSTAGRAM_REDIRECT_URI" "$INSTAGRAM_REDIRECT_URI"

# Facebook
set_secret "FACEBOOK_APP_ID" "$FACEBOOK_APP_ID"
set_secret "FACEBOOK_APP_SECRET" "$FACEBOOK_APP_SECRET"
set_secret "FACEBOOK_REDIRECT_URI" "$FACEBOOK_REDIRECT_URI"

# LinkedIn
set_secret "LINKEDIN_CLIENT_ID" "$LINKEDIN_CLIENT_ID"
set_secret "LINKEDIN_CLIENT_SECRET" "$LINKEDIN_CLIENT_SECRET"
set_secret "LINKEDIN_REDIRECT_URI" "$LINKEDIN_REDIRECT_URI"

# YouTube
set_secret "YOUTUBE_CLIENT_ID" "$YOUTUBE_CLIENT_ID"
set_secret "YOUTUBE_CLIENT_SECRET" "$YOUTUBE_CLIENT_SECRET"
set_secret "YOUTUBE_REDIRECT_URI" "$YOUTUBE_REDIRECT_URI"
# Also as GOOGLE for compatibility
set_secret "GOOGLE_CLIENT_ID" "$YOUTUBE_CLIENT_ID"
set_secret "GOOGLE_CLIENT_SECRET" "$YOUTUBE_CLIENT_SECRET"

# TikTok
set_secret "TIKTOK_CLIENT_KEY" "$TIKTOK_CLIENT_KEY"
set_secret "TIKTOK_CLIENT_SECRET" "$TIKTOK_CLIENT_SECRET"
set_secret "TIKTOK_REDIRECT_URI" "$TIKTOK_REDIRECT_URI"

# Pinterest
set_secret "PINTEREST_APP_ID" "$PINTEREST_APP_ID"
set_secret "PINTEREST_APP_SECRET" "$PINTEREST_APP_SECRET"
set_secret "PINTEREST_REDIRECT_URI" "$PINTEREST_REDIRECT_URI"

# Reddit
set_secret "REDDIT_CLIENT_ID" "$REDDIT_CLIENT_ID"
set_secret "REDDIT_CLIENT_SECRET" "$REDDIT_CLIENT_SECRET"
set_secret "REDDIT_REDIRECT_URI" "$REDDIT_REDIRECT_URI"

echo ""
echo "✅ Done setting OAuth credentials!"
echo ""
echo "🔧 Next steps:"
echo "1. Deploy Edge Functions: supabase functions deploy make-server-19ccd85e"
echo "2. Test OAuth endpoints to verify they work"
echo ""

