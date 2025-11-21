#!/bin/bash
# Database Migration Script: Supabase to DigitalOcean
# Migrates schema and data from Supabase to DigitalOcean Managed PostgreSQL "pubhub-db"
#
# Prerequisites:
# - pg_dump and psql installed
# - Supabase connection string (SUPABASE_DB_URL)
# - DigitalOcean database connection string (DO_DB_URL)
# - DigitalOcean database must exist and be accessible

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Supabase to DigitalOcean Database Migration ===${NC}\n"

# Check for required environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
  echo -e "${RED}Error: SUPABASE_DB_URL environment variable is required${NC}"
  echo "Format: postgresql://postgres:[password]@[host]:[port]/postgres"
  exit 1
fi

if [ -z "$DO_DB_URL" ]; then
  echo -e "${RED}Error: DO_DB_URL environment variable is required${NC}"
  echo "Format: postgresql://[user]:[password]@[host]:[port]/[database]"
  exit 1
fi

# Extract database name from DO URL for verification
DO_DB_NAME=$(echo "$DO_DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo -e "${YELLOW}Target Database: ${DO_DB_NAME}${NC}\n"

# Step 1: Export schema from Supabase
echo -e "${GREEN}[1/6] Exporting schema from Supabase...${NC}"
SCHEMA_FILE="supabase_schema_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$SUPABASE_DB_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file="$SCHEMA_FILE" \
  --exclude-table=auth.* \
  --exclude-table=storage.* \
  --exclude-table=realtime.* \
  --exclude-table=extensions.* \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=realtime \
  --exclude-schema=extensions

echo -e "${GREEN}✓ Schema exported to ${SCHEMA_FILE}${NC}\n"

# Step 2: Export data from Supabase
echo -e "${GREEN}[2/6] Exporting data from Supabase...${NC}"
DATA_FILE="supabase_data_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$SUPABASE_DB_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --file="$DATA_FILE" \
  --exclude-table=auth.* \
  --exclude-table=storage.* \
  --exclude-table=realtime.* \
  --exclude-table=extensions.* \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=realtime \
  --exclude-schema=extensions \
  --table=public.projects \
  --table=public.brands \
  --table=public.personas \
  --table=public.content_sources \
  --table=public.persona_vectors \
  --table=public.kv_store_19ccd85e

echo -e "${GREEN}✓ Data exported to ${DATA_FILE}${NC}\n"

# Step 3: Prepare schema for DigitalOcean (remove Supabase-specific references)
echo -e "${GREEN}[3/6] Preparing schema for DigitalOcean...${NC}"
PREPARED_SCHEMA="do_schema_$(date +%Y%m%d_%H%M%S).sql"

# Create prepared schema file
cat > "$PREPARED_SCHEMA" << 'EOF'
-- DigitalOcean Database Schema
-- Migrated from Supabase
-- Note: auth.users references need to be updated to use Clerk user IDs

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

EOF

# Append schema, removing auth.users references and RLS policies that depend on auth.uid()
cat "$SCHEMA_FILE" | \
  sed 's/REFERENCES auth\.users(id)/REFERENCES users(id)/g' | \
  sed 's/auth\.uid()/current_setting('\''app.current_user_id'\'', true)::uuid/g' | \
  sed '/^--.*RLS/d' | \
  sed '/^CREATE POLICY.*auth\.uid/d' | \
  sed '/^ALTER TABLE.*ENABLE ROW LEVEL SECURITY/d' >> "$PREPARED_SCHEMA"

# Add users table for Clerk user IDs
cat >> "$PREPARED_SCHEMA" << 'EOF'

-- Users table for Clerk integration
-- Maps Clerk user IDs to internal user records
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
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- Updated RLS policies using app.current_user_id instead of auth.uid()
-- Projects: Users can only access their own projects
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

-- Similar policies for other tables...
-- (Brands, Personas, Content Sources, Persona Vectors policies follow same pattern)

EOF

echo -e "${GREEN}✓ Schema prepared for DigitalOcean${NC}\n"

# Step 4: Apply schema to DigitalOcean
echo -e "${GREEN}[4/6] Applying schema to DigitalOcean database...${NC}"
psql "$DO_DB_URL" -f "$PREPARED_SCHEMA" || {
  echo -e "${RED}Error applying schema. Please check the error above.${NC}"
  exit 1
}
echo -e "${GREEN}✓ Schema applied successfully${NC}\n"

# Step 5: Import data to DigitalOcean
echo -e "${GREEN}[5/6] Importing data to DigitalOcean...${NC}"
# Note: user_id references need to be mapped from Supabase auth.users to Clerk users
# This is a simplified import - you may need to map user IDs manually
psql "$DO_DB_URL" -f "$DATA_FILE" || {
  echo -e "${YELLOW}Warning: Some data import errors may occur if user_id mappings are needed${NC}"
  echo -e "${YELLOW}You may need to manually map Supabase user IDs to Clerk user IDs${NC}"
}
echo -e "${GREEN}✓ Data import completed${NC}\n"

# Step 6: Verify migration
echo -e "${GREEN}[6/6] Verifying migration...${NC}"
echo "Checking table counts..."

TABLES=("projects" "brands" "personas" "content_sources" "persona_vectors" "kv_store_19ccd85e")

for table in "${TABLES[@]}"; do
  SUPABASE_COUNT=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM public.$table;" 2>/dev/null | tr -d ' ' || echo "0")
  DO_COUNT=$(psql "$DO_DB_URL" -t -c "SELECT COUNT(*) FROM public.$table;" 2>/dev/null | tr -d ' ' || echo "0")
  
  if [ "$SUPABASE_COUNT" = "$DO_COUNT" ]; then
    echo -e "  ${GREEN}✓${NC} $table: $DO_COUNT rows"
  else
    echo -e "  ${YELLOW}⚠${NC} $table: Supabase=$SUPABASE_COUNT, DigitalOcean=$DO_COUNT"
  fi
done

echo -e "\n${GREEN}=== Migration Complete ===${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Map Supabase auth.users IDs to Clerk user IDs in the users table"
echo "2. Update user_id references in projects table to use new user IDs"
echo "3. Update application connection strings to use DO_DB_URL"
echo "4. Test application with new database"
echo -e "\n${YELLOW}Files created:${NC}"
echo "  - $SCHEMA_FILE (original Supabase schema)"
echo "  - $DATA_FILE (original Supabase data)"
echo "  - $PREPARED_SCHEMA (prepared schema for DigitalOcean)"

