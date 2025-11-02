# 🚀 Deploy Edge Function to Supabase - PowerShell Script
# This script copies the updated edge function files and deploys to Supabase

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🚀 PubHub Edge Function Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Supabase CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
}

# Check if function source exists
if (-not (Test-Path "src\supabase\functions\server\index.tsx")) {
    Write-Host "❌ Edge function source not found!" -ForegroundColor Red
    Write-Host "Expected: src\supabase\functions\server\index.tsx" -ForegroundColor Yellow
    exit 1
}

# Create function directory if it doesn't exist
if (-not (Test-Path "supabase\functions\make-server-19ccd85e")) {
    Write-Host "Creating edge function directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "supabase\functions\make-server-19ccd85e" | Out-Null
}

# Copy function files
Write-Host "Copying function files..." -ForegroundColor Yellow
Copy-Item -Path "src\supabase\functions\server\*" -Destination "supabase\functions\make-server-19ccd85e\" -Recurse -Force

# Check if Supabase is linked
Write-Host "Checking Supabase project link..." -ForegroundColor Yellow
$linkStatus = supabase status 2>&1
if ($LASTEXITCODE -ne 0 -or $linkStatus -match "not linked") {
    Write-Host "⚠️  Project not linked. Linking now..." -ForegroundColor Yellow
    supabase link --project-ref ykzckfwdvmzuzxhezthv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        Write-Host "Please run manually: supabase link --project-ref ykzckfwdvmzuzxhezthv" -ForegroundColor Yellow
        exit 1
    }
}

# Deploy the function
Write-Host ""
Write-Host "Deploying Edge Function..." -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ""

supabase functions deploy make-server-19ccd85e --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Function URL:" -ForegroundColor Green
    Write-Host "https://ykzckfwdvmzuzxhezthv.supabase.co/functions/v1/make-server-19ccd85e" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "Wait 30-60 seconds for the function to be fully available, then test the OAuth flow." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above and try again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Deploy via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/functions" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
