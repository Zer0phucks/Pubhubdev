import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAGQueryRequest {
  query: string;
  project_id: string;
  top_k?: number;
  similarity_threshold?: number;
  filters?: {
    platform?: string;
    content_type?: string;
  };
  use_persona?: boolean;
}

interface RAGQueryResponse {
  answer: string;
  sources: Array<{
    content_source_id: string;
    chunk_text: string;
    similarity: number;
    metadata: any;
  }>;
  persona_used: boolean;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const {
      query,
      project_id,
      top_k = 5,
      similarity_threshold = 0.7,
      filters = {},
      use_persona = true,
    }: RAGQueryRequest = await req.json();

    if (!query || !project_id) {
      return new Response(
        JSON.stringify({ error: 'query and project_id are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Azure OpenAI credentials
    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    const azureDeployment = Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME');
    const azureApiVersion = Deno.env.get('AZURE_OPENAI_API_VERSION');

    if (!azureEndpoint || !azureApiKey || !azureDeployment || !azureApiVersion) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    console.log(`Processing RAG query for project: ${project_id}`);
    console.log(`Query: "${query}"`);

    // Generate embedding for the query using Azure OpenAI
    const embeddingUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/embeddings?api-version=${azureApiVersion}`;
    const embeddingResponse = await fetch(embeddingUrl, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        dimensions: 512,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      throw new Error(`Azure OpenAI Embeddings API error: ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Generated query embedding');

    // Perform vector similarity search
    // Note: We'll use a RPC function for efficient vector search
    const { data: similarChunks, error: searchError } = await supabase.rpc(
      'match_persona_vectors',
      {
        query_embedding: queryEmbedding,
        match_threshold: similarity_threshold,
        match_count: top_k,
        filter_project_id: project_id,
      }
    );

    if (searchError) {
      console.error('Vector search error:', searchError);
      // Fallback to basic search if RPC doesn't exist yet
      const { data: fallbackChunks, error: fallbackError } = await supabase
        .from('persona_vectors')
        .select('*')
        .eq('project_id', project_id)
        .limit(top_k);

      if (fallbackError) throw fallbackError;

      // Calculate similarity manually (simplified)
      const chunksWithSimilarity = (fallbackChunks || []).map((chunk: any) => ({
        ...chunk,
        similarity: 0.8, // Placeholder similarity
      }));

      var retrievedChunks = chunksWithSimilarity;
    } else {
      var retrievedChunks = similarChunks || [];
    }

    console.log(`Retrieved ${retrievedChunks.length} relevant chunks`);

    if (retrievedChunks.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'I don\'t have enough information to answer that question based on your content.',
          sources: [],
          persona_used: false,
          confidence: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch persona if requested
    let personaContext = '';
    let personaUsed = false;

    if (use_persona) {
      const { data: personaData, error: personaError } = await supabase
        .from('personas')
        .select('persona_data')
        .eq('project_id', project_id)
        .single();

      if (!personaError && personaData) {
        const persona = personaData.persona_data;
        personaUsed = true;

        // Build persona context for the LLM
        personaContext = `
Creator Persona Context:
- Name: ${persona.identity?.display_name || 'Unknown'}
- Bio: ${persona.identity?.bio_summary || ''}
- Expertise: ${persona.identity?.expertise_domains?.join(', ') || ''}
- Voice Tone: ${JSON.stringify(persona.voice?.tone_axes || {})}
- Signature Phrases: ${persona.voice?.lexical_preferences?.signature_phrases?.join(', ') || ''}
- Primary Topics: ${persona.topics?.primary_topics?.join(', ') || ''}
- Writing Style: ${persona.style?.sentence_structure || ''}
`;
      }
    }

    // Build context from retrieved chunks
    const contextChunks = retrievedChunks
      .map((chunk: any, idx: number) => `[${idx + 1}] ${chunk.chunk_text}`)
      .join('\n\n');

    // Generate answer using GPT-4o-mini
    const systemPrompt = personaUsed
      ? `You are an AI assistant helping answer questions based on the creator's own content.
${personaContext}

Answer questions in a style that matches the creator's voice and expertise.
Use the provided context chunks to support your answer.
If the context doesn't contain relevant information, say so.`
      : `You are an AI assistant helping answer questions based on the provided context.
Use the context chunks to support your answer.
If the context doesn't contain relevant information, say so.`;

    const userPrompt = `Context from creator's content:
${contextChunks}

Question: ${query}

Provide a comprehensive answer based on the context above.`;

    console.log('Generating answer with Azure OpenAI...');

    const chatUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    const chatResponse = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`Azure OpenAI Chat API error: ${errorText}`);
    }

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    // Calculate confidence based on similarity scores
    const avgSimilarity =
      retrievedChunks.reduce((sum: number, chunk: any) => sum + (chunk.similarity || 0), 0) /
      retrievedChunks.length;
    const confidence = Math.min(avgSimilarity * 1.2, 1.0); // Boost slightly, cap at 1.0

    // Prepare sources
    const sources = retrievedChunks.map((chunk: any) => ({
      content_source_id: chunk.content_source_id,
      chunk_text: chunk.chunk_text.substring(0, 200) + '...', // Truncate for response
      similarity: chunk.similarity || 0,
      metadata: chunk.metadata || {},
    }));

    const response: RAGQueryResponse = {
      answer,
      sources,
      persona_used: personaUsed,
      confidence,
    };

    console.log(`Generated answer with confidence: ${(confidence * 100).toFixed(0)}%`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in rag-query function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
