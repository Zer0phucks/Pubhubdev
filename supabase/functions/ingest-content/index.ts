import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { fetchURL, isValidURL } from '../_shared/contentFetcher.ts';
import { chunkText, calculateReadabilityMetrics } from '../_shared/textUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngestRequest {
  project_id: string;
  urls: string[];
  platform?: string;
}

interface IngestResponse {
  success: boolean;
  ingested: Array<{
    url: string;
    content_source_id: string;
    status: 'completed' | 'failed';
  }>;
  failed: Array<{
    url: string;
    error: string;
  }>;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { project_id, urls }: IngestRequest = await req.json();

    if (!project_id || !urls || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'project_id and urls are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate URLs
    const invalidURLs = urls.filter(url => !isValidURL(url));
    if (invalidURLs.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid URLs: ${invalidURLs.join(', ')}` }),
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

    const results: IngestResponse = {
      success: true,
      ingested: [],
      failed: [],
    };

    // Process each URL
    for (const url of urls) {
      try {
        console.log(`Processing URL: ${url}`);

        // Fetch content from URL
        const content = await fetchURL(url);

        // Calculate metrics
        const metrics = calculateReadabilityMetrics(content.text);

        // Create content source record
        const { data: contentSource, error: insertError } = await supabase
          .from('content_sources')
          .insert({
            project_id,
            url,
            platform: content.metadata.platform || 'manual_url',
            title: content.title,
            raw_content: content.text,
            processed_content: content.text,
            content_type: content.contentType,
            metadata: {
              ...content.metadata,
              metrics,
            },
            status: 'processing',
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Generate embeddings for content chunks
        const chunks = chunkText(content.text, 1000, 200);
        console.log(`Generated ${chunks.length} chunks for ${url}`);

        const embeddings: Array<{
          content_source_id: string;
          project_id: string;
          chunk_text: string;
          chunk_index: number;
          embedding: number[];
          metadata: any;
        }> = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          try {
            // Call Azure OpenAI Embeddings API
            const embeddingUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/embeddings?api-version=${azureApiVersion}`;
            const embeddingResponse = await fetch(embeddingUrl, {
              method: 'POST',
              headers: {
                'api-key': azureApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                input: chunk,
                dimensions: 512, // Match our database schema
              }),
            });

            if (!embeddingResponse.ok) {
              const errorText = await embeddingResponse.text();
              throw new Error(`Azure OpenAI API error: ${errorText}`);
            }

            const embeddingData = await embeddingResponse.json();
            const embedding = embeddingData.data[0].embedding;

            embeddings.push({
              content_source_id: contentSource.id,
              project_id,
              chunk_text: chunk,
              chunk_index: i,
              embedding,
              metadata: {
                url,
                title: content.title,
                chunk_length: chunk.length,
              },
            });
          } catch (embError) {
            console.error(`Failed to generate embedding for chunk ${i}:`, embError);
            // Continue with other chunks
          }
        }

        // Insert embeddings into database
        if (embeddings.length > 0) {
          const { error: embeddingError } = await supabase
            .from('persona_vectors')
            .insert(embeddings);

          if (embeddingError) {
            console.error('Failed to insert embeddings:', embeddingError);
            throw embeddingError;
          }
        }

        // Update content source status to completed
        await supabase
          .from('content_sources')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', contentSource.id);

        results.ingested.push({
          url,
          content_source_id: contentSource.id,
          status: 'completed',
        });

        console.log(`Successfully processed ${url}: ${embeddings.length} embeddings created`);
      } catch (error) {
        console.error(`Failed to process ${url}:`, error);

        // Try to update content source status to failed
        try {
          const { data: existingSource } = await supabase
            .from('content_sources')
            .select('id')
            .eq('url', url)
            .eq('project_id', project_id)
            .single();

          if (existingSource) {
            await supabase
              .from('content_sources')
              .update({
                status: 'failed',
                error_message: error.message,
              })
              .eq('id', existingSource.id);
          }
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
        }

        results.failed.push({
          url,
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ingest-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
