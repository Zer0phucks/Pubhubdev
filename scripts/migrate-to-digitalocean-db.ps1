# Database Migration Script: Supabase to DigitalOcean (PowerShell)
# Migrates schema and data from Supabase to DigitalOcean Managed PostgreSQL "pubhub-db"
#
# Prerequisites:
# - psql installed and in PATH
# - Supabase connection string (SUPABASE_DB_URL)
# - DigitalOcean database connection string (DO_DB_URL)

param(
    [Parameter(Mandatory=$true)]
    [string]$SupabaseDbUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$DoDbUrl
)

$ErrorActionPreference = "Stop"

Write-Host "=== Supabase to DigitalOcean Database Migration ===" -ForegroundColor Green
Write-Host ""

# Extract database name from DO URL
$doDbName = ($DoDbUrl -split '/')[-1] -replace '\?.*', ''
Write-Host "Target Database: $doDbName" -ForegroundColor Yellow
Write-Host ""

# Step 1: Export schema from Supabase
Write-Host "[1/6] Exporting schema from Supabase..." -ForegroundColor Green
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$schemaFile = "supabase_schema_$timestamp.sql"

& pg_dump $SupabaseDbUrl `
    --schema-only `
    --no-owner `
    --no-privileges `
    --file=$schemaFile `
    --exclude-table=auth.* `
    --exclude-table=storage.* `
    --exclude-table=realtime.* `
    --exclude-table=extensions.* `
    --exclude-schema=auth `
    --exclude-schema=storage `
    --exclude-schema=realtime `
    --exclude-schema=extensions

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error exporting schema" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Schema exported to $schemaFile" -ForegroundColor Green
Write-Host ""

# Step 2: Export data from Supabase
Write-Host "[2/6] Exporting data from Supabase..." -ForegroundColor Green
$dataFile = "supabase_data_$timestamp.sql"

& pg_dump $SupabaseDbUrl `
    --data-only `
    --no-owner `
    --no-privileges `
    --file=$dataFile `
    --exclude-table=auth.* `
    --exclude-table=storage.* `
    --exclude-table=realtime.* `
    --exclude-table=extensions.* `
    --exclude-schema=auth `
    --exclude-schema=storage `
    --exclude-schema=realtime `
    --exclude-schema=extensions `
    --table=public.projects `
    --table=public.brands `
    --table=public.personas `
    --table=public.content_sources `
    --table=public.persona_vectors `
    --table=public.kv_store_19ccd85e

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error exporting data" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Data exported to $dataFile" -ForegroundColor Green
Write-Host ""

# Step 3: Prepare schema for DigitalOcean
Write-Host "[3/6] Preparing schema for DigitalOcean..." -ForegroundColor Green
$preparedSchema = "do_schema_$timestamp.sql"

# Read schema file and prepare it
$schemaContent = Get-Content $schemaFile -Raw

# Replace auth.users references
$schemaContent = $schemaContent -replace 'REFERENCES auth\.users\(id\)', 'REFERENCES users(id)'
$schemaContent = $schemaContent -replace 'auth\.uid\(\)', "current_setting('app.current_user_id', true)::uuid"

# Create prepared schema with users table
$preparedContent = @"
-- DigitalOcean Database Schema
-- Migrated from Supabase
-- Note: auth.users references updated to use Clerk user IDs

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for Clerk integration
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX users_clerk_id_idx ON users(clerk_user_id);

-- Function to set current user ID from JWT claims (for RLS)
CREATE OR REPLACE FUNCTION set_current_user_id(user_id UUID)
RETURNS void AS `$$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
`$$ LANGUAGE plpgsql;

$schemaContent

-- Updated RLS policies using app.current_user_id instead of auth.uid()
-- (Policies are included in the schema file but may need adjustment)
"@

Set-Content -Path $preparedSchema -Value $preparedContent

Write-Host "✓ Schema prepared for DigitalOcean" -ForegroundColor Green
Write-Host ""

# Step 4: Apply schema to DigitalOcean
Write-Host "[4/6] Applying schema to DigitalOcean database..." -ForegroundColor Green
& psql $DoDbUrl -f $preparedSchema

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error applying schema. Please check the error above." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Schema applied successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Import data to DigitalOcean
Write-Host "[5/6] Importing data to DigitalOcean..." -ForegroundColor Green
& psql $DoDbUrl -f $dataFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Some data import errors may occur if user_id mappings are needed" -ForegroundColor Yellow
    Write-Host "You may need to manually map Supabase user IDs to Clerk user IDs" -ForegroundColor Yellow
}

Write-Host "✓ Data import completed" -ForegroundColor Green
Write-Host ""

# Step 6: Verify migration
Write-Host "[6/6] Verifying migration..." -ForegroundColor Green
Write-Host "Checking table counts..."

$tables = @("projects", "brands", "personas", "content_sources", "persona_vectors", "kv_store_19ccd85e")

foreach ($table in $tables) {
    $supabaseCount = & psql $SupabaseDbUrl -t -c "SELECT COUNT(*) FROM public.$table;" 2>$null
    $supabaseCount = $supabaseCount.Trim()
    
    $doCount = & psql $DoDbUrl -t -c "SELECT COUNT(*) FROM public.$table;" 2>$null
    $doCount = $doCount.Trim()
    
    if ($supabaseCount -eq $doCount) {
        Write-Host "  ✓ $table`: $doCount rows" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $table`: Supabase=$supabaseCount, DigitalOcean=$doCount" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Map Supabase auth.users IDs to Clerk user IDs in the users table"
Write-Host "2. Update user_id references in projects table to use new user IDs"
Write-Host "3. Update application connection strings to use DO_DB_URL"
Write-Host "4. Test application with new database"
Write-Host ""
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  - $schemaFile (original Supabase schema)"
Write-Host "  - $dataFile (original Supabase data)"
Write-Host "  - $preparedSchema (prepared schema for DigitalOcean)"

