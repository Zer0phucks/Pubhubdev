/**
 * TypeScript types for Creator Persona System
 * Based on CreatorPersona JSON Schema
 */

// ============================================================================
// CREATOR PERSONA (Complete Schema)
// ============================================================================

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
      playful?: number; // 0-1
      confident?: number; // 0-1
      empathetic?: number; // 0-1
      direct?: number; // 0-1
      provocative?: number; // 0-1
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

// ============================================================================
// BRAND
// ============================================================================

export interface Brand {
  id: string;
  project_id: string;

  // Colors
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  palette_keywords?: string[];

  // Logos (Supabase Storage URLs)
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

// ============================================================================
// CONTENT SOURCE
// ============================================================================

export type ContentPlatform = 'youtube' | 'tiktok' | 'blog' | 'twitter' | 'instagram' | 'manual_url';
export type ContentType = 'article' | 'video_transcript' | 'social_post' | 'pdf';
export type ContentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ContentSource {
  id: string;
  project_id: string;
  platform: ContentPlatform;
  url: string;
  title?: string;
  raw_content?: string;
  processed_content?: string;
  content_type?: ContentType;
  metadata?: Record<string, any>;
  status: ContentStatus;
  error_message?: string;
  ingested_at: string;
  processed_at?: string;
  created_at: string;
}

// ============================================================================
// VECTOR DOCUMENT
// ============================================================================

export interface VectorDocument {
  id: string;
  content_source_id: string;
  project_id: string;
  embedding: number[]; // 512-dimensional vector for text-embedding-3-small
  chunk_text: string;
  chunk_index?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// PROJECT
// ============================================================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PERSONA DATABASE RECORD
// ============================================================================

export interface PersonaRecord {
  id: string;
  project_id: string;
  persona_data: CreatorPersona; // JSONB column
  version_major: number;
  version_minor: number;
  version_patch: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

// For creating/updating personas
export type CreatePersonaInput = Omit<CreatorPersona, 'id' | 'provenance'> & {
  provenance?: Partial<CreatorPersona['provenance']>;
};

export type UpdatePersonaInput = Partial<CreatePersonaInput>;

// For creating/updating brands
export type CreateBrandInput = Omit<Brand, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBrandInput = Partial<CreateBrandInput>;

// For creating/updating projects
export type CreateProjectInput = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'user_id'>>;

// For creating content sources
export type CreateContentSourceInput = Omit<
  ContentSource,
  'id' | 'status' | 'created_at' | 'ingested_at' | 'processed_at'
>;

// ============================================================================
// RAG QUERY TYPES
// ============================================================================

export interface RAGQueryRequest {
  query: string;
  project_id: string;
  top_k?: number; // Number of similar documents to retrieve (default: 5)
  similarity_threshold?: number; // Minimum similarity score (default: 0.7)
  filters?: {
    platform?: ContentPlatform;
    content_type?: ContentType;
  };
}

export interface RAGQueryResponse {
  generated_content: string;
  sources: Array<{
    content_source_id: string;
    chunk_text: string;
    similarity_score: number;
    url?: string;
    platform?: ContentPlatform;
  }>;
  persona_applied: boolean;
  metadata: {
    query: string;
    model_used: string;
    tokens_used?: number;
    processing_time_ms: number;
  };
}

// ============================================================================
// PERSONA GENERATION TYPES
// ============================================================================

export interface GeneratePersonaRequest {
  project_id: string;
  content_source_ids?: string[]; // Specific sources to analyze
  analyze_all?: boolean; // Analyze all project content
  update_existing?: boolean; // Update existing persona or create new
}

export interface GeneratePersonaResponse {
  persona: CreatorPersona;
  confidence_score: number; // 0-1
  sources_analyzed: number;
  analysis_summary: string;
  recommendations?: string[];
}

// ============================================================================
// URL INGESTION TYPES
// ============================================================================

export interface IngestURLRequest {
  project_id: string;
  urls: string[];
  platform?: ContentPlatform; // Auto-detect if not provided
}

export interface IngestURLResponse {
  success: boolean;
  ingested: Array<{
    url: string;
    content_source_id: string;
    status: ContentStatus;
  }>;
  failed: Array<{
    url: string;
    error: string;
  }>;
}
