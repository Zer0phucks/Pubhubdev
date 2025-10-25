#!/bin/bash

# Script to add Supabase secrets to GitHub repository
# This script extracts the secrets from Supabase and adds them to GitHub

echo "🔐 Adding Supabase secrets to GitHub repository..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI. Please run: gh auth login"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ GitHub CLI and Supabase CLI are available"

# Get the current repository
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Working with repository: $REPO"

# Extract secrets from Supabase
echo "🔍 Extracting secrets from Supabase..."

# Get SUPABASE_URL
SUPABASE_URL=$(supabase secrets list --format json | jq -r '.[] | select(.name == "SUPABASE_URL") | .value' 2>/dev/null)
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Could not find SUPABASE_URL in Supabase secrets"
    exit 1
fi

# Get SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SERVICE_ROLE_KEY=$(supabase secrets list --format json | jq -r '.[] | select(.name == "SUPABASE_SERVICE_ROLE_KEY") | .value' 2>/dev/null)
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Could not find SUPABASE_SERVICE_ROLE_KEY in Supabase secrets"
    exit 1
fi

echo "✅ Successfully extracted secrets from Supabase"

# Add secrets to GitHub
echo "🚀 Adding secrets to GitHub repository..."

# Add SUPABASE_URL
echo "Adding SUPABASE_URL..."
gh secret set SUPABASE_URL --body "$SUPABASE_URL"

# Add SUPABASE_SERVICE_ROLE_KEY
echo "Adding SUPABASE_SERVICE_ROLE_KEY..."
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE_ROLE_KEY"

echo "✅ Successfully added Supabase secrets to GitHub!"
echo ""
echo "📋 Summary:"
echo "   - SUPABASE_URL: Added"
echo "   - SUPABASE_SERVICE_ROLE_KEY: Added"
echo ""
echo "🎉 Your CI/CD pipeline should now be able to run Supabase tests!"
echo ""
echo "💡 Next steps:"
echo "   1. Push your changes to trigger the CI pipeline"
echo "   2. Check GitHub Actions to verify the tests run successfully"
echo "   3. Monitor the Supabase Edge Function tests in the workflow"
