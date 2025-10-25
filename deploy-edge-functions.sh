#!/bin/bash

# 🚀 EDGE FUNCTION DEPLOYMENT SCRIPT
# This script deploys all platform integrations to Supabase

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🚀 PubHub Edge Function Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    npm install -g supabase
fi

# Check if we're in the right directory
if [ ! -f "src/supabase/functions/server/index.tsx" ]; then
    echo -e "${RED}❌ Edge function source not found!${NC}"
    echo -e "${YELLOW}Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local var_value=$(supabase secrets list 2>/dev/null | grep "$var_name" | wc -l)

    if [ "$var_value" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} $var_name"
        return 0
    else
        echo -e "${RED}✗${NC} $var_name - ${YELLOW}Not configured${NC}"
        return 1
    fi
}

# Check OAuth configuration status
echo -e "\n${YELLOW}Checking OAuth Configuration...${NC}"
echo -e "${YELLOW}================================${NC}"

MISSING_CONFIG=0

# Twitter
echo -e "\n${BLUE}Twitter/X:${NC}"
check_env_var "TWITTER_CLIENT_ID" || MISSING_CONFIG=1
check_env_var "TWITTER_CLIENT_SECRET" || MISSING_CONFIG=1

# Instagram
echo -e "\n${BLUE}Instagram:${NC}"
check_env_var "INSTAGRAM_CLIENT_ID" || MISSING_CONFIG=1
check_env_var "INSTAGRAM_CLIENT_SECRET" || MISSING_CONFIG=1

# LinkedIn
echo -e "\n${BLUE}LinkedIn:${NC}"
check_env_var "LINKEDIN_CLIENT_ID" || MISSING_CONFIG=1
check_env_var "LINKEDIN_CLIENT_SECRET" || MISSING_CONFIG=1

# Facebook
echo -e "\n${BLUE}Facebook:${NC}"
check_env_var "FACEBOOK_APP_ID" || MISSING_CONFIG=1
check_env_var "FACEBOOK_APP_SECRET" || MISSING_CONFIG=1

# YouTube
echo -e "\n${BLUE}YouTube:${NC}"
check_env_var "YOUTUBE_CLIENT_ID" || MISSING_CONFIG=1
check_env_var "YOUTUBE_CLIENT_SECRET" || MISSING_CONFIG=1

# TikTok
echo -e "\n${BLUE}TikTok:${NC}"
check_env_var "TIKTOK_CLIENT_KEY" || MISSING_CONFIG=1
check_env_var "TIKTOK_CLIENT_SECRET" || MISSING_CONFIG=1

# Pinterest
echo -e "\n${BLUE}Pinterest:${NC}"
check_env_var "PINTEREST_APP_ID" || MISSING_CONFIG=1
check_env_var "PINTEREST_APP_SECRET" || MISSING_CONFIG=1

# Reddit
echo -e "\n${BLUE}Reddit:${NC}"
check_env_var "REDDIT_CLIENT_ID" || MISSING_CONFIG=1
check_env_var "REDDIT_CLIENT_SECRET" || MISSING_CONFIG=1

# Frontend URL
echo -e "\n${BLUE}Frontend Configuration:${NC}"
check_env_var "FRONTEND_URL" || MISSING_CONFIG=1

if [ $MISSING_CONFIG -eq 1 ]; then
    echo -e "\n${YELLOW}⚠️  Warning: Some OAuth credentials are missing${NC}"
    echo -e "${YELLOW}Run ./setup-oauth.sh to configure missing credentials${NC}"
    echo -e "${YELLOW}Or add them manually in Supabase dashboard${NC}"
    echo ""
    read -p "Continue deployment anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

# Deploy the Edge Function
echo -e "\n${YELLOW}Deploying Edge Function...${NC}"
echo -e "${YELLOW}========================${NC}"

# Create the edge function if it doesn't exist
if [ ! -d "supabase/functions/make-server-19ccd85e" ]; then
    echo -e "${YELLOW}Creating edge function directory...${NC}"
    mkdir -p supabase/functions/make-server-19ccd85e
fi

# Copy the function files
echo -e "${YELLOW}Copying function files...${NC}"
cp -r src/supabase/functions/server/* supabase/functions/make-server-19ccd85e/

# Create a proper index.ts file for Deno
cat > supabase/functions/make-server-19ccd85e/index.ts << 'EOF'
// Re-export from the main server file
export * from "./index.tsx";
EOF

# Deploy to Supabase
echo -e "${YELLOW}Deploying to Supabase...${NC}"
supabase functions deploy make-server-19ccd85e --no-verify-jwt

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Edge Function deployed successfully!${NC}"

    # Get the function URL
    PROJECT_ID=$(supabase status --output json 2>/dev/null | grep -o '"project_id":"[^"]*' | cut -d'"' -f4)

    if [ ! -z "$PROJECT_ID" ]; then
        echo -e "\n${GREEN}Function URL:${NC}"
        echo -e "${BLUE}https://${PROJECT_ID}.supabase.co/functions/v1/make-server-19ccd85e${NC}"

        echo -e "\n${GREEN}Available Endpoints:${NC}"
        echo -e "  ${BLUE}POST /oauth/authorize/:platform${NC} - Start OAuth flow"
        echo -e "  ${BLUE}POST /oauth/callback${NC} - Handle OAuth callback"
        echo -e "  ${BLUE}POST /oauth/disconnect${NC} - Disconnect platform"
        echo -e "  ${BLUE}GET  /oauth/token/:platform/:projectId${NC} - Get access token"
        echo -e "  ${BLUE}POST /posts/publish${NC} - Publish to platforms"
        echo -e "  ${BLUE}GET  /connections${NC} - Get all connections"
        echo -e "  ${BLUE}POST /connections${NC} - Update connections"
    fi

    echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${YELLOW}Platform integrations are ready for launch!${NC}"
else
    echo -e "\n${RED}❌ Deployment failed!${NC}"
    echo -e "${YELLOW}Check the error messages above and try again${NC}"
    exit 1
fi

# Cleanup
echo -e "\n${YELLOW}Cleaning up temporary files...${NC}"
rm -rf supabase/functions/make-server-19ccd85e

echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}✨ Ready to ship next week! ✨${NC}"
echo -e "${BLUE}=====================================${NC}"