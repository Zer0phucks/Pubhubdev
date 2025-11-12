-- Migration: Create Persona System Tables
-- Description: Multi-project architecture with Brand, Persona, Content Sources, and Vector Storage
-- Created: 2025-11-11

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user project lookups
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

  -- Logos (Supabase Storage paths)
  logo_light_url TEXT,
  logo_dark_url TEXT,
  logo_square_url TEXT,
  logo_keywords TEXT[],

  -- Typography
  primary_font TEXT,
  secondary_font TEXT,

  -- Brand elements (from CreatorPersona schema)
  pillars TEXT[],
  values TEXT[],
  positioning_statement TEXT,
  taglines TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id)
);

-- Index for faster project lookups
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
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(project_id)
);

-- Index for faster project lookups
CREATE INDEX personas_project_id_idx ON personas(project_id);

-- GIN index for JSONB queries (for searching within persona_data)
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

-- Indexes for faster queries
CREATE INDEX content_sources_project_id_idx ON content_sources(project_id);
CREATE INDEX content_sources_status_idx ON content_sources(status);
CREATE INDEX content_sources_platform_idx ON content_sources(platform);

-- ============================================================================
-- VECTOR STORAGE TABLE (pgvector)
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

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

-- Indexes for faster queries
CREATE INDEX persona_vectors_project_id_idx ON persona_vectors(project_id);
CREATE INDEX persona_vectors_content_source_id_idx ON persona_vectors(content_source_id);

-- Create ivfflat index for similarity search
CREATE INDEX persona_vectors_embedding_idx ON persona_vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_vectors ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Brands: Users can access brands for their projects
CREATE POLICY "Users can view brands for their projects"
  ON brands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert brands for their projects"
  ON brands FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update brands for their projects"
  ON brands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete brands for their projects"
  ON brands FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = brands.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Personas: Users can access personas for their projects
CREATE POLICY "Users can view personas for their projects"
  ON personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert personas for their projects"
  ON personas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update personas for their projects"
  ON personas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete personas for their projects"
  ON personas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = personas.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Content Sources: Users can access content sources for their projects
CREATE POLICY "Users can view content sources for their projects"
  ON content_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content sources for their projects"
  ON content_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content sources for their projects"
  ON content_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content sources for their projects"
  ON content_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = content_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Persona Vectors: Users can access vectors for their projects
CREATE POLICY "Users can view vectors for their projects"
  ON persona_vectors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vectors for their projects"
  ON persona_vectors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vectors for their projects"
  ON persona_vectors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vectors for their projects"
  ON persona_vectors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = persona_vectors.project_id
      AND projects.user_id = auth.uid()
    )
  );

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

-- Triggers for updated_at
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
-- SAMPLE DATA (Optional - remove for production)
-- ============================================================================

-- Uncomment to insert sample project for testing
-- INSERT INTO projects (user_id, name, description) VALUES
-- (auth.uid(), 'Default Project', 'My first content repurposing project');
