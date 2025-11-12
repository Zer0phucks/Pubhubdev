# Content Repurposing System Implementation Tasks

## Overview
Implement comprehensive Brand + Persona management with RAG-powered content analysis for personalized content generation.

---

## Phase 1: Data Model & Database Schema

### 1.1 Database Schema Design

#### Projects Table (if multi-project)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Brands Table
```sql
CREATE TABLE brands (
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

  -- Brand elements (from persona schema)
  pillars TEXT[],
  values TEXT[],
  positioning_statement TEXT,
  taglines TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id)
);
```

#### Personas Table
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Store entire persona as JSONB (matches CreatorPersona schema)
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
```

#### Content Sources Table
```sql
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Source info
  platform TEXT, -- 'youtube', 'blog', 'twitter', 'linkedin', 'manual_url'
  url TEXT NOT NULL,
  title TEXT,

  -- Content
  raw_content TEXT,
  processed_content TEXT,
  content_type TEXT, -- 'article', 'video_transcript', 'social_post', 'pdf'

  -- Metadata
  metadata JSONB, -- platform-specific data, author, date, etc.

  -- Processing status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,

  -- Timestamps
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Vector Storage Table (pgvector)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE persona_vectors (
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

-- Create index for similarity search
CREATE INDEX persona_vectors_embedding_idx ON persona_vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### Tasks
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_persona_system.sql`
- [ ] Add projects table (if multi-project confirmed)
- [ ] Add brands table with visual + brand elements
- [ ] Add personas table with JSONB storage
- [ ] Add content_sources table
- [ ] Enable pgvector extension
- [ ] Add persona_vectors table with vector(1536) column
- [ ] Create similarity search index (ivfflat)
- [ ] Set up RLS policies:
  - [ ] Users can only access their own projects
  - [ ] Users can only access brands/personas for their projects
  - [ ] Users can only access their content_sources
  - [ ] Users can only query vectors for their projects
- [ ] Test migration locally with `supabase db reset`

### 1.2 TypeScript Types

Create `src/types/persona.ts` with complete CreatorPersona schema types:

```typescript
export interface CreatorPersona {
  id: string;
  version?: {
    major: number;
    minor: number;
    patch: number;
    updated_at: string;
  };
  identity: {
    display_name: string;
    aliases?: string[];
    bio_summary?: string;
    expertise_domains?: string[];
    audience_profile?: {
      primary_audience?: string;
      audience_needs?: string[];
      reading_level?: 'casual' | 'intermediate' | 'advanced';
    };
  };
  brand?: {
    pillars?: string[];
    values?: string[];
    positioning_statement?: string;
    taglines?: string[];
    visual_notes?: {
      palette_keywords?: string[];
      logo_keywords?: string[];
    };
  };
  voice?: {
    tone_axes?: {
      formal?: number; // 0-1
      playful?: number;
      confident?: number;
      empathetic?: number;
      direct?: number;
      provocative?: number;
    };
    lexical_preferences?: {
      signature_phrases?: string[];
      preferred_terms?: string[];
      avoid_terms?: string[];
      jargon_level?: 'low' | 'medium' | 'high';
      emoji_usage?: 'none' | 'light' | 'moderate' | 'heavy';
      punctuation_style?: string;
    };
    rhetorical_moves?: Array<{
      name: string;
      pattern: string;
      when_to_use?: string;
    }>;
    humor_style?: string;
  };
  style?: {
    content_structures?: Array<{
      format: string;
      section_order?: string[];
      length_targets?: {
        words?: number;
        minutes_speaking?: number;
      };
      cadence?: string;
      call_to_action_patterns?: string[];
      linking_and_citation_style?: string;
    }>;
    story_patterns?: Array<{
      name: string;
      beats?: string[];
    }>;
    formatting_preferences?: {
      headings?: string;
      lists?: string;
      code_blocks?: string;
      quotations?: string;
    };
  };
  topics?: {
    core_topics?: string[];
    edge_topics?: string[];
    taboo_topics?: string[];
    stances?: Array<{
      topic: string;
      position: string;
      nuance?: string;
    }>;
  };
  content_signals?: {
    sources?: Array<{
      platform: 'youtube' | 'blog' | 'podcast' | 'newsletter' | 'social' | 'other';
      url?: string;
      content_ids?: string[];
      coverage_window?: string;
    }>;
    quantitative?: {
      avg_sentence_length?: number;
      readability_index?: number;
      type_token_ratio?: number;
      question_rate?: number;
      exclamation_rate?: number;
    };
    qualitative?: {
      common_openers?: string[];
      common_closers?: string[];
      signature_examples?: string[];
      negative_examples?: string[];
    };
    embeddings?: Array<{
      store_name?: string;
      index_id?: string;
      namespace?: string;
      dimension?: number;
    }>;
  };
  dos_and_donts?: {
    do?: string[];
    dont?: string[];
  };
  constraints?: {
    legal?: string[];
    platform_specific?: string[];
    content_boundaries?: string[];
  };
  safety_and_ethics: {
    consent_status: 'granted' | 'revoked' | 'unknown';
    attribution_rules?: string;
    refusal_conditions?: string[];
    disclosure_rules?: string;
  };
  prompting?: {
    global_instructions?: string;
    format_recipes?: Array<{
      format: string;
      system_preamble?: string;
      style_directives?: string[];
      checklist?: string[];
    }>;
  };
  evaluation?: {
    acceptance_tests?: Array<{
      test_name: string;
      input_prompt: string;
      expected_traits?: string[];
      automatic_metrics?: {
        style_similarity_threshold?: number;
        toxicity_limit?: number;
      };
    }>;
    human_review_guidelines?: string;
  };
  provenance: {
    created_at: string;
    created_by?: string;
    source_digest?: string;
    data_summary: string;
    notes?: string;
  };
}

export interface Brand {
  id: string;
  project_id: string;

  // Colors
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  palette_keywords?: string[];

  // Logos
  logo_light_url?: string;
  logo_dark_url?: string;
  logo_square_url?: string;
  logo_keywords?: string[];

  // Typography
  primary_font?: string;
  secondary_font?: string;

  // Brand elements
  pillars?: string[];
  values?: string[];
  positioning_statement?: string;
  taglines?: string[];

  created_at: string;
  updated_at: string;
}

export interface ContentSource {
  id: string;
  project_id: string;
  platform: 'youtube' | 'blog' | 'twitter' | 'linkedin' | 'manual_url' | string;
  url: string;
  title?: string;
  raw_content?: string;
  processed_content?: string;
  content_type?: 'article' | 'video_transcript' | 'social_post' | 'pdf';
  metadata?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  ingested_at: string;
  processed_at?: string;
  created_at: string;
}

export interface VectorDocument {
  id: string;
  content_source_id: string;
  project_id: string;
  embedding: number[];
  chunk_text: string;
  chunk_index?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

#### Tasks
- [ ] Create `src/types/persona.ts` with all types above
- [ ] Create `src/types/brand.ts` or include Brand in persona.ts
- [ ] Create `src/types/content.ts` for ContentSource and VectorDocument
- [ ] Export all types from `src/types/index.ts`
- [ ] Ensure types match database schema exactly

---

## Phase 2: Brand Management

### 2.1 Brand Page UI (`src/components/BrandSettings.tsx`)
- [ ] Create Brand page component
- [ ] Color picker for primary/secondary/accent colors
- [ ] Logo upload component (with preview)
  - [ ] Support multiple variants (light/dark mode)
  - [ ] Image optimization and storage (Supabase Storage)
- [ ] Font selector (dropdown with web-safe fonts + Google Fonts?)
- [ ] Live preview panel showing brand elements
- [ ] Save/Cancel buttons with form validation
- [ ] Loading states and error handling

### 2.2 Brand Integration
- [ ] Add "Brand" to View type in App.tsx
- [ ] Add Brand menu item to sidebar
- [ ] Create brand context/hooks for accessing brand settings globally
- [ ] Apply brand colors to theme system (if applicable)

---

## Phase 3: Persona Management

### 3.1 Persona Page UI (`src/components/PersonaSettings.tsx`)
- [ ] Create Persona page component
- [ ] Editable form for all persona fields
  - [ ] Text inputs for string fields
  - [ ] Dropdowns for enum/option fields
  - [ ] Textareas for longer text fields
  - [ ] Nested object editing UI (if applicable)
- [ ] "Add Content" button → opens URL input modal
- [ ] URL input modal component
  - [ ] Input field(s) for URLs (support up to 20)
  - [ ] URL validation
  - [ ] Submit/Cancel buttons
  - [ ] Progress indicator during ingestion
- [ ] Display ingested content sources (list/table)
- [ ] Save/Cancel/Reset buttons
- [ ] Loading states and error handling

### 3.2 Persona API & Services
- [ ] Create `src/utils/personaAPI.ts`
  - [ ] `fetchPersona(projectId)` - Get current persona
  - [ ] `updatePersona(projectId, persona)` - Update persona
  - [ ] `generatePersona(projectId, sources)` - AI generation
  - [ ] `ingestContent(projectId, urls)` - Add new content sources
- [ ] Create Supabase Edge Function: `generate-persona`
  - [ ] Accept content sources (text/URLs)
  - [ ] Call Azure OpenAI to analyze content
  - [ ] Generate persona JSON from analysis
  - [ ] Return structured persona object

---

## Phase 4: Onboarding Persona Creation

### 4.1 Onboarding Flow Updates
- [ ] Add persona creation step to onboarding wizard
- [ ] Check if user has connected platforms
  - [ ] **If yes**: Scrape connected platforms for content
    - [ ] Determine which platforms to scrape
    - [ ] Implement platform content fetchers
    - [ ] Fetch last N posts per platform
  - [ ] **If no**: Show URL input form (up to 20 URLs)
- [ ] Show loading indicator during AI analysis
- [ ] Display generated persona preview
- [ ] Allow user to edit before saving
- [ ] Save persona to database

### 4.2 Platform Content Scrapers
- [ ] **PENDING**: Confirm which platforms to scrape
- [ ] Twitter/X scraper (using OAuth API)
- [ ] LinkedIn scraper (using OAuth API)
- [ ] Blog/WordPress scraper (RSS/API)
- [ ] Instagram scraper (if supported by OAuth)
- [ ] Generic URL scraper (fallback for manual URLs)

---

## Phase 5: RAG Implementation

### 5.1 Vector Database Setup
- [ ] **PENDING**: Confirm vector DB choice (pgvector vs external)
- [ ] Enable pgvector extension in Supabase (if using)
- [ ] Create vector storage schema
- [ ] Set up embedding generation pipeline
  - [ ] Choose embedding model (OpenAI, sentence-transformers, etc.)
  - [ ] Create `generateEmbedding(text)` utility
  - [ ] Batch processing for multiple documents

### 5.2 Content Ingestion Pipeline
- [ ] Create Supabase Edge Function: `ingest-content`
  - [ ] Accept URLs array
  - [ ] Fetch content from URLs (web scraping)
  - [ ] Extract text content
  - [ ] Chunk content for embedding (if needed)
  - [ ] Generate embeddings
  - [ ] Store in vector database
  - [ ] Link to project/persona
- [ ] Create client-side API wrapper: `ingestContent(urls)`
- [ ] Handle errors and retries
- [ ] Progress tracking for batch ingestion

### 5.3 RAG Query System
- [ ] Create Supabase Edge Function: `rag-query`
  - [ ] Accept query text + project_id
  - [ ] Generate query embedding
  - [ ] Similarity search in vector DB
  - [ ] Retrieve top-K relevant documents
  - [ ] Construct prompt with context + persona
  - [ ] Call Azure OpenAI for generation
  - [ ] Return generated content
- [ ] Create client-side API wrapper: `queryRAG(query, projectId)`
- [ ] Integrate RAG into content generation flows
  - [ ] ContentComposer integration
  - [ ] AI chat integration (AIChatDialog)

---

## Phase 6: Integration & Testing

### 6.1 Navigation & Routing
- [ ] Add "Brand" to sidebar menu
- [ ] Add "Persona" to sidebar menu
- [ ] Add keyboard shortcuts (optional)
  - [ ] `B` for Brand?
  - [ ] `P` for Persona?
- [ ] Update CommandPalette with new pages

### 6.2 State Management
- [ ] Create brand context/hooks if needed
- [ ] Create persona context/hooks if needed
- [ ] Manage project-level state (if multi-project)
- [ ] Cache persona/brand data to reduce API calls

### 6.3 Testing
- [ ] Unit tests for persona generation logic
- [ ] Unit tests for vector operations
- [ ] E2E tests for Brand page
- [ ] E2E tests for Persona page
- [ ] E2E tests for onboarding persona creation
- [ ] E2E tests for URL ingestion flow
- [ ] Test RAG query accuracy

### 6.4 Documentation
- [ ] Update CLAUDE.md with new features
- [ ] Document persona schema
- [ ] Document RAG architecture
- [ ] Add troubleshooting guide for vector DB

---

## Phase 7: Multi-Project Support (If Needed)

### 7.1 Project Model
- [ ] **PENDING**: Clarify if multi-project is needed
- [ ] Create `projects` table (id, user_id, name, created_at)
- [ ] Update all tables with project_id foreign keys
- [ ] Create project switcher UI component
- [ ] Update App.tsx with project context
- [ ] Migrate existing data to default project (if applicable)

---

## ✅ Confirmed Decisions

1. **Persona Schema**: Using comprehensive CreatorPersona JSON schema (see Untitled-1)
2. **Platform Scraping**: OAuth API calls when possible, URL scraping as fallback
3. **Vector DB**: Supabase pgvector extension
4. **Project Model**: Multi-project architecture - one persona per project, one brand per project
5. **Embedding Model**: OpenAI `text-embedding-3-small` (512 dimensions, cost-effective)
6. **AI Model**: GPT-4o-mini for persona generation (fast, affordable, good quality)
7. **Platform Priority**: YouTube → TikTok → Blog → Twitter → Instagram
8. **Content Types**: Web pages + YouTube transcripts initially (PDF/audio later)

---

## Estimated Complexity

- **Phase 1**: 4-6 hours (database schema)
- **Phase 2**: 6-8 hours (Brand page)
- **Phase 3**: 8-12 hours (Persona page + API)
- **Phase 4**: 10-15 hours (onboarding + scrapers)
- **Phase 5**: 15-20 hours (RAG implementation)
- **Phase 6**: 8-10 hours (integration + testing)
- **Phase 7**: 6-10 hours (if multi-project needed)

**Total**: ~60-80 hours for full implementation

---

## Next Steps

1. User provides persona JSON schema
2. User answers clarification questions
3. Prioritize phases (can implement incrementally)
4. Begin Phase 1: Database schema design
