-- Create RPC function for efficient vector similarity search
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
