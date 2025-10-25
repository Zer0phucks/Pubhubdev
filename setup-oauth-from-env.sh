#!/bin/bash

# 🚀 QUICK OAUTH SETUP FROM .ENV FILE
# This script copies all OAuth credentials from .env to Supabase

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🚀 Setting OAuth from .env file${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

echo -e "${YELLOW}Adding OAuth credentials to Supabase...${NC}\n"

# Twitter
echo -e "${GREEN}Setting Twitter credentials...${NC}"
supabase secrets set TWITTER_CLIENT_ID="$TWITTER_CLIENT_ID"
supabase secrets set TWITTER_CLIENT_SECRET="$TWITTER_CLIENT_SECRET"

# Instagram
echo -e "${GREEN}Setting Instagram credentials...${NC}"
supabase secrets set INSTAGRAM_CLIENT_ID="$INSTAGRAM_CLIENT_ID"
supabase secrets set INSTAGRAM_CLIENT_SECRET="$INSTAGRAM_CLIENT_SECRET"
supabase secrets set INSTAGRAM_REDIRECT_URI="$INSTAGRAM_REDIRECT_URI"

# LinkedIn
echo -e "${GREEN}Setting LinkedIn credentials...${NC}"
supabase secrets set LINKEDIN_CLIENT_ID="$LINKEDIN_CLIENT_ID"
supabase secrets set LINKEDIN_CLIENT_SECRET="$LINKEDIN_CLIENT_SECRET"
supabase secrets set LINKEDIN_REDIRECT_URI="$LINKEDIN_REDIRECT_URI"

# Facebook
echo -e "${GREEN}Setting Facebook credentials...${NC}"
supabase secrets set FACEBOOK_APP_ID="$FACEBOOK_APP_ID"
supabase secrets set FACEBOOK_APP_SECRET="$FACEBOOK_APP_SECRET"
supabase secrets set FACEBOOK_REDIRECT_URI="$FACEBOOK_REDIRECT_URI"

# YouTube/Google
echo -e "${GREEN}Setting YouTube credentials...${NC}"
supabase secrets set YOUTUBE_CLIENT_ID="$YOUTUBE_CLIENT_ID"
supabase secrets set YOUTUBE_CLIENT_SECRET="$YOUTUBE_CLIENT_SECRET"
supabase secrets set YOUTUBE_REDIRECT_URI="$YOUTUBE_REDIRECT_URI"
# Also set as GOOGLE variants (for compatibility)
supabase secrets set GOOGLE_CLIENT_ID="$YOUTUBE_CLIENT_ID"
supabase secrets set GOOGLE_CLIENT_SECRET="$YOUTUBE_CLIENT_SECRET"

# TikTok
echo -e "${GREEN}Setting TikTok credentials...${NC}"
supabase secrets set TIKTOK_CLIENT_KEY="$TIKTOK_CLIENT_KEY"
supabase secrets set TIKTOK_CLIENT_SECRET="$TIKTOK_CLIENT_SECRET"
supabase secrets set TIKTOK_REDIRECT_URI="$TIKTOK_REDIRECT_URI"

# Pinterest
echo -e "${GREEN}Setting Pinterest credentials...${NC}"
supabase secrets set PINTEREST_APP_ID="$PINTEREST_APP_ID"
supabase secrets set PINTEREST_APP_SECRET="$PINTEREST_APP_SECRET"
supabase secrets set PINTEREST_REDIRECT_URI="$PINTEREST_REDIRECT_URI"

# Reddit
echo -e "${GREEN}Setting Reddit credentials...${NC}"
supabase secrets set REDDIT_CLIENT_ID="$REDDIT_CLIENT_ID"
supabase secrets set REDDIT_CLIENT_SECRET="$REDDIT_CLIENT_SECRET"
supabase secrets set REDDIT_REDIRECT_URI="$REDDIT_REDIRECT_URI"

# Frontend URL (using the APP_URL)
echo -e "${GREEN}Setting Frontend URL...${NC}"
supabase secrets set FRONTEND_URL="${NEXT_PUBLIC_APP_URL:-https://pubhub.dev}"

# OAuth redirect URL
echo -e "${GREEN}Setting OAuth redirect URL...${NC}"
supabase secrets set OAUTH_REDIRECT_URL="$OAUTH_REDIRECT_URL"

echo -e "\n${GREEN}✅ All OAuth credentials have been set!${NC}"
echo -e "${YELLOW}Now run: ./deploy-edge-functions.sh${NC}"