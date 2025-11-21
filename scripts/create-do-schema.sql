-- DigitalOcean Database Schema
-- Run this directly on your DigitalOcean PostgreSQL database
-- This creates the schema compatible with Clerk authentication

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE (for Clerk integration)
-- ============================================================================
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

-- ============================================================================
-- KV STORE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kv_store_19ccd85e (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_key ON public.kv_store_19ccd85e(key);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX projects_user_id_idx ON projects(user_id);

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Colors
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  palette_keywords TEXT[],

  -- Logos (Storage URLs)
  logo_light_url TEXT,
  logo_dark_url TEXT,
  logo_square_url TEXT,
  logo_keywords TEXT[],

  -- Typography
  primary_font TEXT,
  secondary_font TEXT,

  -- Brand elements
  pillars TEXT[],
  values TEXT[],
  positioning_statement TEXT,
  taglines TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id)
);

CREATE INDEX brands_project_id_idx ON brands(project_id);

-- ============================================================================
-- PERSONAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Store entire CreatorPersona as JSONB
  persona_data JSONB NOT NULL,

  -- Version tracking
  version_major INTEGER DEFAULT 1,
  version_minor INTEGER DEFAULT 0,
  version_patch INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(project_id)
);

CREATE INDEX personas_project_id_idx ON personas(project_id);
CREATE INDEX personas_data_gin_idx ON personas USING GIN(persona_data);

-- ============================================================================
-- CONTENT SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Source info
  platform TEXT, -- 'youtube', 'tiktok', 'blog', 'twitter', 'instagram', 'manual_url'
  url TEXT NOT NULL,
  title TEXT,

  -- Content
  raw_content TEXT,
  processed_content TEXT,
  content_type TEXT, -- 'article', 'video_transcript', 'social_post', 'pdf'

  -- Metadata (platform-specific data, author, date, etc.)
  metadata JSONB,

  -- Processing status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,

  -- Timestamps
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX content_sources_project_id_idx ON content_sources(project_id);
CREATE INDEX content_sources_status_idx ON content_sources(status);
CREATE INDEX content_sources_platform_idx ON content_sources(platform);

-- ============================================================================
-- VECTOR STORAGE TABLE (pgvector)
-- ============================================================================
CREATE TABLE IF NOT EXISTS persona_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_source_id UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Vector embedding (512 dimensions for OpenAI text-embedding-3-small)
  embedding vector(512),

  -- Chunk info
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,

  -- Metadata for filtering
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX persona_vectors_project_id_idx ON persona_vectors(project_id);
CREATE INDEX persona_vectors_content_source_id_idx ON persona_vectors(content_source_id);

-- Create ivfflat index for similarity search
CREATE INDEX persona_vectors_embedding_idx ON persona_vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set current user ID from JWT claims (for RLS)
CREATE OR REPLACE FUNCTION set_current_user_id(user_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_kv_store_updated_at
  BEFORE UPDATE ON public.kv_store_19ccd85e
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.kv_store_19ccd85e ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_vectors ENABLE ROW LEVEL SECURITY;

-- KV Store: Allow authenticated access (will be set via set_current_user_id)
CREATE POLICY "Allow authenticated access to kv_store"
  ON public.kv_store_19ccd85e
  FOR ALL
  USING (true)
  WITH CHECK (true);

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

-- Brands: Users can access brands for their projects
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

-- Personas: Users can access personas for their projects
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

-- Content Sources: Users can access content sources for their projects
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

-- Persona Vectors: Users can access vectors for their projects
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

-- ============================================================================
-- VECTOR SEARCH FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION match_persona_vectors(
  query_embedding vector(512),
  match_threshold float,
  match_count int,
  filter_project_id uuid
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
AS $$
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
$$;

