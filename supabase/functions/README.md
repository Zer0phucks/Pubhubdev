# PubHub Edge Functions

Supabase Edge Functions for the PubHub persona system, including content ingestion, persona generation, and RAG-powered queries.

## Functions Overview

### 1. ingest-content
Ingests URLs, extracts content, generates embeddings, and stores them in the vector database.

**Endpoint**: `/ingest-content`

**Request**:
```json
{
  "project_id": "uuid",
  "urls": ["https://example.com/article1", "https://example.com/article2"]
}
```

**Response**:
```json
{
  "success": true,
  "ingested": [
    {
      "url": "https://example.com/article1",
      "content_source_id": "uuid",
      "status": "completed"
    }
  ],
  "failed": []
}
```

**What it does**:
1. Fetches content from each URL
2. Extracts text from HTML
3. Calculates readability metrics
4. Creates content_sources record
5. Chunks text (1000 chars, 200 char overlap)
6. Generates embeddings using OpenAI text-embedding-3-small (512 dimensions)
7. Stores embeddings in persona_vectors table
8. Updates status to 'completed' or 'failed'

### 2. generate-persona
Analyzes ingested content and generates a comprehensive CreatorPersona object using AI.

**Endpoint**: `/generate-persona`

**Request**:
```json
{
  "project_id": "uuid",
  "analyze_all": true,
  "max_sources": 50
}
```

**Response**:
```json
{
  "persona": {
    "id": "uuid",
    "identity": { ... },
    "voice": { ... },
    "topics": { ... }
  },
  "confidence": 0.85,
  "sources_analyzed": 15,
  "analysis_summary": "Analyzed 15 content sources..."
}
```

**What it does**:
1. Fetches all completed content sources for project
2. Samples representative text chunks from vectors
3. Builds content summary with titles, chunks, metadata
4. Calls GPT-4o-mini with system prompt for persona extraction
5. Generates complete CreatorPersona JSON object
6. Calculates confidence score based on content analyzed
7. Returns persona ready to save to database

### 3. rag-query
Performs vector similarity search and generates AI-powered answers using the persona context.

**Endpoint**: `/rag-query`

**Request**:
```json
{
  "query": "What topics does this creator write about?",
  "project_id": "uuid",
  "top_k": 5,
  "similarity_threshold": 0.7,
  "filters": {
    "platform": "youtube",
    "content_type": "article"
  },
  "use_persona": true
}
```

**Response**:
```json
{
  "answer": "Based on your content, you primarily write about...",
  "sources": [
    {
      "content_source_id": "uuid",
      "chunk_text": "...",
      "similarity": 0.89,
      "metadata": {}
    }
  ],
  "persona_used": true,
  "confidence": 0.87
}
```

**What it does**:
1. Generates query embedding using OpenAI
2. Performs vector similarity search using match_persona_vectors RPC
3. Retrieves top_k most similar chunks
4. Fetches persona for context (if use_persona=true)
5. Builds prompt with context + persona
6. Calls GPT-4o-mini to generate answer
7. Calculates confidence from similarity scores
8. Returns answer with sources

## Shared Utilities

### _shared/textUtils.ts
- `chunkText()` - Split text with overlap for embedding
- `cleanText()` - Normalize whitespace and format
- `extractTextFromHTML()` - Strip HTML tags and decode entities
- `calculateReadabilityMetrics()` - Compute text metrics
- `extractCommonPhrases()` - Find frequent n-grams

### _shared/contentFetcher.ts
- `fetchURL()` - Main entry point for content fetching
- `detectPlatform()` - Identify platform from URL
- `fetchGenericWebContent()` - Scrape articles and blogs
- `fetchYouTubeContent()` - YouTube video metadata (placeholder)
- `fetchTwitterContent()` - Twitter/X post content (placeholder)

## Environment Variables

Required for all functions:
```bash
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Azure OpenAI (configured via Supabase secrets)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

## Local Development

### Prerequisites
- Docker Desktop running
- Supabase CLI installed
- Azure OpenAI deployment with:
  - Embeddings support (512 dimensions)
  - Chat completions support (JSON response format)
  - API key and endpoint configured

### Start Local Supabase
```bash
supabase start
```

### Serve Functions Locally
```bash
supabase functions serve
```

### Test Functions
```bash
# Set environment variables
export VITE_SUPABASE_URL=http://localhost:54321
export SUPABASE_SERVICE_ROLE_KEY=your-local-key
export TEST_PROJECT_ID=test-uuid

# Run test script
node scripts/test-edge-functions.js
```

### Test Individual Function
```bash
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/ingest-content' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "project_id": "test-uuid",
    "urls": ["https://example.com/article"]
  }'
```

## Deployment

### Deploy All Functions
```bash
supabase functions deploy ingest-content
supabase functions deploy generate-persona
supabase functions deploy rag-query
```

### Deploy Single Function
```bash
supabase functions deploy ingest-content --no-verify-jwt
```

### Set Environment Variables
```bash
# Azure OpenAI credentials (if not already set)
supabase secrets set AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
supabase secrets set AZURE_OPENAI_API_KEY=your-azure-key
supabase secrets set AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
supabase secrets set AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### List Deployed Functions
```bash
supabase functions list
```

## Database Setup

### Required Extensions
- `pgvector` - Vector similarity search
- `uuid-ossp` - UUID generation

### Required Tables
- `projects` - Multi-project support
- `brands` - Brand settings per project
- `personas` - JSONB persona storage
- `content_sources` - Ingested content records
- `persona_vectors` - Vector embeddings (512 dimensions)

### Required RPC Function
```sql
CREATE OR REPLACE FUNCTION match_persona_vectors(
  query_embedding vector(512),
  match_threshold float,
  match_count int,
  filter_project_id uuid
)
RETURNS TABLE (...)
```

See `supabase/migrations/` for complete schema.

## API Integration

### Frontend Usage

```typescript
import { supabase } from '@/utils/supabase/client';

// Ingest URLs
const { data } = await supabase.functions.invoke('ingest-content', {
  body: { project_id: 'uuid', urls: ['https://...'] }
});

// Generate persona
const { data } = await supabase.functions.invoke('generate-persona', {
  body: { project_id: 'uuid', analyze_all: true }
});

// RAG query
const { data } = await supabase.functions.invoke('rag-query', {
  body: { query: 'What topics?', project_id: 'uuid' }
});
```

### Using API Utilities
```typescript
import { ingestURLs } from '@/utils/contentAPI';
import { generatePersona } from '@/utils/personaAPI';
import { queryRAG } from '@/utils/ragAPI';

// Ingest content
await ingestURLs({ project_id: 'uuid', urls: ['...'] });

// Generate persona
const result = await generatePersona({ project_id: 'uuid' });

// RAG query
const answer = await queryRAG({ query: '...', project_id: 'uuid' });
```

## Troubleshooting

### Function deployment fails
```bash
# Check function logs
supabase functions logs ingest-content

# Deploy with debug info
supabase functions deploy ingest-content --debug
```

### Azure OpenAI API errors
- Verify credentials are set: `supabase secrets list`
- Check Azure OpenAI deployment is active
- Verify deployment supports embeddings (512 dimensions) and chat completions
- Check API version compatibility

### Vector search not working
- Ensure migrations are applied: `supabase db push`
- Check pgvector extension: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- Verify index exists: `\d persona_vectors` in psql

### No content sources found
- Check content ingestion status in content_sources table
- Verify URLs are accessible and valid
- Check Edge Function logs for errors

## Performance Optimization

### Embedding Generation
- Batch embeddings in groups of 10-20
- Use text-embedding-3-small (faster, cheaper)
- Set dimensions to 512 (balance quality/speed)

### Vector Search
- Create IVFFlat index on embedding column
- Tune `lists` parameter based on data size
- Adjust similarity threshold (0.6-0.8)

### Persona Generation
- Limit max_sources to 50 for faster analysis
- Use sample chunks instead of full content
- Cache generated personas

## Cost Estimation

### Azure OpenAI Costs
- Costs depend on your Azure OpenAI pricing tier and deployment
- Monitor usage in Azure Portal under your OpenAI resource
- Costs are generally similar to standard OpenAI API pricing

### Example: 10 Articles (Approximate)
- Ingestion: ~50K tokens for embeddings
- Persona: ~20K tokens for generation
- RAG Query: ~5K tokens per query
- **Total**: Varies by Azure pricing tier, check Azure Portal for actual costs

## Security

### Authentication
- Functions use service role key for database access
- RLS policies enforce row-level security
- User authentication via Supabase Auth

### Data Privacy
- Content stored in user's Supabase project
- Vectors isolated by project_id
- No data shared between projects

### Rate Limiting
- Implement rate limiting in production
- Monitor OpenAI API usage
- Set reasonable max_sources limits

## Next Steps

1. **Platform Scrapers**: Implement YouTube, Twitter, TikTok content fetchers
2. **Streaming Responses**: Add SSE for real-time persona generation
3. **Batch Processing**: Queue system for large-scale ingestion
4. **Caching**: Redis caching for frequent queries
5. **Monitoring**: Sentry integration for error tracking
