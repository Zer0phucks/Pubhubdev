#!/bin/bash
# Apply migrations to DigitalOcean PostgreSQL with Clerk support
# This script creates the complete database schema for PubHub

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
echo -e "${GREEN}[1/6] Enabling required extensions...${NC}"
psql "$DATABASE_URL" <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
echo -e "${GREEN}✓ Extensions enabled${NC}\n"

# Step 2: Create users table for Clerk integration
echo -e "${GREEN}[2/6] Creating users table for Clerk...${NC}"
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

# Step 3: Create KV store table
echo -e "${GREEN}[3/6] Creating KV store table...${NC}"
psql "$DATABASE_URL" <<EOF
-- KV Store for backward compatibility
CREATE TABLE IF NOT EXISTS kv_store_19ccd85e (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kv_store_created_at_idx ON kv_store_19ccd85e(created_at);
EOF
echo -e "${GREEN}✓ KV store table created${NC}\n"

# Step 4: Create persona system tables
echo -e "${GREEN}[4/6] Creating persona system tables...${NC}"
psql "$DATABASE_URL" <<EOF
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  palette_keywords TEXT[],
  logo_light_url TEXT,
  logo_dark_url TEXT,
  logo_square_url TEXT,
  logo_keywords TEXT[],
  primary_font TEXT,
  secondary_font TEXT,
  pillars TEXT[],
  values TEXT[],
  positioning_statement TEXT,
  taglines TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS brands_project_id_idx ON brands(project_id);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  persona_data JSONB NOT NULL,
  version_major INTEGER DEFAULT 1,
  version_minor INTEGER DEFAULT 0,
  version_patch INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS personas_project_id_idx ON personas(project_id);
CREATE INDEX IF NOT EXISTS personas_data_gin_idx ON personas USING GIN(persona_data);

-- Content sources table
CREATE TABLE IF NOT EXISTS content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT,
  url TEXT NOT NULL,
  title TEXT,
  raw_content TEXT,
  processed_content TEXT,
  content_type TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_sources_project_id_idx ON content_sources(project_id);
CREATE INDEX IF NOT EXISTS content_sources_status_idx ON content_sources(status);
CREATE INDEX IF NOT EXISTS content_sources_platform_idx ON content_sources(platform);

-- Persona vectors table
CREATE TABLE IF NOT EXISTS persona_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_source_id UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  embedding vector(512),
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS persona_vectors_project_id_idx ON persona_vectors(project_id);
CREATE INDEX IF NOT EXISTS persona_vectors_content_source_id_idx ON persona_vectors(content_source_id);

-- Create ivfflat index for similarity search (only if table has data)
-- This will be created automatically when vectors are inserted
EOF
echo -e "${GREEN}✓ Persona system tables created${NC}\n"

# Step 5: Create vector search function
echo -e "${GREEN}[5/6] Creating vector search function...${NC}"
psql "$DATABASE_URL" <<EOF
CREATE OR REPLACE FUNCTION match_persona_vectors(
  query_embedding vector(512),
  filter_project_id uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content_source_id uuid,
  project_id uuid,
  chunk_text text,
  chunk_index int,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS \$\$
BEGIN
  RETURN QUERY
  SELECT
    persona_vectors.id,
    persona_vectors.content_source_id,
    persona_vectors.project_id,
    persona_vectors.chunk_text,
    persona_vectors.chunk_index,
    persona_vectors.metadata,
    1 - (persona_vectors.embedding <=> query_embedding) AS similarity
  FROM persona_vectors
  WHERE persona_vectors.project_id = filter_project_id
    AND 1 - (persona_vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY persona_vectors.embedding <=> query_embedding
  LIMIT match_count;
END;
\$\$;
EOF
echo -e "${GREEN}✓ Vector search function created${NC}\n"

# Step 6: Create RLS policies and triggers
echo -e "${GREEN}[6/6] Creating RLS policies and triggers...${NC}"
psql "$DATABASE_URL" <<EOF
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_vectors ENABLE ROW LEVEL SECURITY;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (using app.current_user_id)
-- Projects policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

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

-- Brands policies (via projects)
DROP POLICY IF EXISTS "Users can view brands for their projects" ON brands;
DROP POLICY IF EXISTS "Users can insert brands for their projects" ON brands;
DROP POLICY IF EXISTS "Users can update brands for their projects" ON brands;
DROP POLICY IF EXISTS "Users can delete brands for their projects" ON brands;

CREATE POLICY "Users can view brands for their projects"
  ON brands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can insert brands for their projects"
  ON brands FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can update brands for their projects"
  ON brands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete brands for their projects"
  ON brands FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Personas policies (via projects)
DROP POLICY IF EXISTS "Users can view personas for their projects" ON personas;
DROP POLICY IF EXISTS "Users can insert personas for their projects" ON personas;
DROP POLICY IF EXISTS "Users can update personas for their projects" ON personas;
DROP POLICY IF EXISTS "Users can delete personas for their projects" ON personas;

CREATE POLICY "Users can view personas for their projects"
  ON personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can insert personas for their projects"
  ON personas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can update personas for their projects"
  ON personas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete personas for their projects"
  ON personas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Content sources policies (via projects)
DROP POLICY IF EXISTS "Users can view content sources for their projects" ON content_sources;
DROP POLICY IF EXISTS "Users can insert content sources for their projects" ON content_sources;
DROP POLICY IF EXISTS "Users can update content sources for their projects" ON content_sources;
DROP POLICY IF EXISTS "Users can delete content sources for their projects" ON content_sources;

CREATE POLICY "Users can view content sources for their projects"
  ON content_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can insert content sources for their projects"
  ON content_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can update content sources for their projects"
  ON content_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete content sources for their projects"
  ON content_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Persona vectors policies (via projects)
DROP POLICY IF EXISTS "Users can view vectors for their projects" ON persona_vectors;
DROP POLICY IF EXISTS "Users can insert vectors for their projects" ON persona_vectors;
DROP POLICY IF EXISTS "Users can update vectors for their projects" ON persona_vectors;
DROP POLICY IF EXISTS "Users can delete vectors for their projects" ON persona_vectors;

CREATE POLICY "Users can view vectors for their projects"
  ON persona_vectors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can insert vectors for their projects"
  ON persona_vectors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can update vectors for their projects"
  ON persona_vectors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete vectors for their projects"
  ON persona_vectors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );
EOF
echo -e "${GREEN}✓ RLS policies and triggers created${NC}\n"

echo -e "${GREEN}=== Migration Complete ===${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Verify tables exist: projects, brands, personas, content_sources, persona_vectors, kv_store_19ccd85e, users"
echo "2. Test database connectivity from backend service"
echo "3. Create IVFFlat index on persona_vectors.embedding when you have data:"
echo "   CREATE INDEX persona_vectors_embedding_idx ON persona_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);"
