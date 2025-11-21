#!/bin/bash
# Apply Supabase migrations to DigitalOcean PostgreSQL with Clerk support
# This script adapts Supabase migrations to work with Clerk authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Applying Migrations to DigitalOcean PostgreSQL ===${NC}\n"

# Check for required environment variable
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable is required${NC}"
  echo "Format: postgresql://[user]:[password]@[host]:[port]/[database]"
  exit 1
fi

# Extract database name for verification
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo -e "${YELLOW}Target Database: ${DB_NAME}${NC}\n"

# Step 1: Enable required extensions
echo -e "${GREEN}[1/5] Enabling required extensions...${NC}"
psql "$DATABASE_URL" <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
echo -e "${GREEN}✓ Extensions enabled${NC}\n"

# Step 2: Create users table for Clerk integration
echo -e "${GREEN}[2/5] Creating users table for Clerk...${NC}"
psql "$DATABASE_URL" <<EOF
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

CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON users(clerk_user_id);

-- Function to set current user ID from JWT claims (for RLS)
CREATE OR REPLACE FUNCTION set_current_user_id(user_id UUID)
RETURNS void AS \$\$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
\$\$ LANGUAGE plpgsql;
EOF
echo -e "${GREEN}✓ Users table created${NC}\n"

# Step 3: Apply KV store migration (adapted for Clerk)
echo -e "${GREEN}[3/5] Applying KV store migration...${NC}"
psql "$DATABASE_URL" -f supabase/migrations/20231125_create_kv_store.sql
# Apply the fix migration
psql "$DATABASE_URL" -f supabase/migrations/20231126_fix_kv_store_policies.sql
echo -e "${GREEN}✓ KV store migration applied${NC}\n"

# Step 4: Apply persona system migration (adapted for Clerk)
echo -e "${GREEN}[4/5] Applying persona system migration (with Clerk adaptations)...${NC}"

# Create a temporary file with adapted migration
TEMP_MIGRATION=$(mktemp)
cat supabase/migrations/20251111152300_create_persona_system.sql | \
  sed 's/REFERENCES auth\.users(id)/REFERENCES users(id)/g' | \
  sed 's/auth\.uid()/current_setting('\''app.current_user_id'\'', true)::uuid/g' > "$TEMP_MIGRATION"

psql "$DATABASE_URL" -f "$TEMP_MIGRATION"
rm "$TEMP_MIGRATION"
echo -e "${GREEN}✓ Persona system migration applied${NC}\n"

# Step 5: Apply vector search function
echo -e "${GREEN}[5/5] Applying vector search function...${NC}"
psql "$DATABASE_URL" -f supabase/migrations/20251111155755_add_vector_search_function.sql
echo -e "${GREEN}✓ Vector search function applied${NC}\n"

# Step 6: Update RLS policies to use Clerk user IDs
echo -e "${GREEN}[6/6] Updating RLS policies for Clerk...${NC}"
psql "$DATABASE_URL" <<EOF
-- Drop old policies that reference auth.uid()
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Recreate policies using app.current_user_id
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (current_setting('app.current_user_id', true)::uuid = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (current_setting('app.current_user_id', true)::uuid = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (current_setting('app.current_user_id', true)::uuid = user_id)
  WITH CHECK (current_setting('app.current_user_id', true)::uuid = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (current_setting('app.current_user_id', true)::uuid = user_id);

-- Update other table policies similarly
-- (Brands, Personas, Content Sources, Persona Vectors)
-- These use EXISTS subqueries, so they should work with the updated projects policies
EOF
echo -e "${GREEN}✓ RLS policies updated${NC}\n"

echo -e "${GREEN}=== Migration Complete ===${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Verify tables exist: projects, brands, personas, content_sources, persona_vectors, kv_store_19ccd85e, users"
echo "2. Test database connectivity from backend service"
echo "3. Map existing Supabase user IDs to Clerk user IDs if migrating data"

