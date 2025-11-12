import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePersonaRequest {
  project_id: string;
  analyze_all?: boolean;
  max_sources?: number;
}

interface GeneratePersonaResponse {
  persona: any;
  confidence: number;
  sources_analyzed: number;
  analysis_summary: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { project_id, analyze_all = true, max_sources = 50 }: GeneratePersonaRequest = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
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

    console.log(`Generating persona for project: ${project_id}`);

    // Fetch completed content sources
    let query = supabase
      .from('content_sources')
      .select('*')
      .eq('project_id', project_id)
      .eq('status', 'completed')
      .order('ingested_at', { ascending: false });

    if (!analyze_all && max_sources) {
      query = query.limit(max_sources);
    }

    const { data: contentSources, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!contentSources || contentSources.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No completed content sources found for this project' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${contentSources.length} content sources to analyze`);

    // Fetch representative text chunks from vectors
    const { data: vectorChunks, error: vectorError } = await supabase
      .from('persona_vectors')
      .select('chunk_text, metadata')
      .eq('project_id', project_id)
      .limit(100); // Sample 100 chunks for analysis

    if (vectorError) {
      throw vectorError;
    }

    // Prepare content summary for analysis
    const contentSummary = {
      total_sources: contentSources.length,
      platforms: [...new Set(contentSources.map(s => s.platform))],
      content_types: [...new Set(contentSources.map(s => s.content_type))],
      sample_titles: contentSources.slice(0, 10).map(s => s.title),
      sample_chunks: vectorChunks?.slice(0, 20).map(v => v.chunk_text) || [],
      full_content_sample: contentSources.slice(0, 3).map(s => ({
        title: s.title,
        content: s.processed_content?.substring(0, 2000), // First 2000 chars
        metadata: s.metadata,
      })),
    };

    // Generate persona using GPT-4o-mini
    const systemPrompt = `You are an expert content analyst specializing in creator persona analysis.
Analyze the provided content samples to extract a comprehensive creator persona.

Your task is to generate a JSON object matching the CreatorPersona schema with these sections:
- identity: display_name, bio_summary, expertise_domains, audience_profile
- voice: tone_axes (0-1 scales), lexical_preferences, signature_phrases
- topics: primary_topics, content_themes, recurring_subjects
- style: sentence_structure, paragraph_style, formatting_preferences
- dos_and_donts: best_practices, pitfalls_to_avoid
- constraints: brand_guidelines, platform_constraints
- safety_and_ethics: content_policies, sensitive_topics

Base your analysis on:
1. Writing style patterns (tone, formality, structure)
2. Vocabulary and phrase usage
3. Topic expertise and focus areas
4. Audience engagement style
5. Content formatting preferences

Return ONLY valid JSON matching the CreatorPersona schema. Be specific and data-driven.`;

    const userPrompt = `Analyze this creator's content and generate a comprehensive persona:

**Content Summary:**
- Total pieces: ${contentSummary.total_sources}
- Platforms: ${contentSummary.platforms.join(', ')}
- Content types: ${contentSummary.content_types.join(', ')}

**Sample Titles:**
${contentSummary.sample_titles.join('\n')}

**Sample Content Chunks:**
${contentSummary.sample_chunks.slice(0, 10).join('\n\n---\n\n')}

**Full Content Samples:**
${JSON.stringify(contentSummary.full_content_sample, null, 2)}

Generate a complete CreatorPersona JSON object based on this content.`;

    console.log('Calling Azure OpenAI API for persona generation...');

    const chatUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    const azureResponse = await fetch(chatUrl, {
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
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      throw new Error(`Azure OpenAI API error: ${errorText}`);
    }

    const azureData = await azureResponse.json();
    const generatedPersona = JSON.parse(azureData.choices[0].message.content);

    // Calculate confidence score based on content analyzed
    const confidence = Math.min(
      0.5 + (contentSources.length / 20) * 0.3 + (vectorChunks?.length || 0) / 100 * 0.2,
      1.0
    );

    // Ensure persona has required structure
    const persona = {
      id: crypto.randomUUID(),
      version: {
        major: 1,
        minor: 0,
        patch: 0,
        updated_at: new Date().toISOString(),
      },
      ...generatedPersona,
    };

    const analysisSummary = `Analyzed ${contentSources.length} content sources across ${contentSummary.platforms.length} platforms.
Generated persona with ${confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low'} confidence (${(confidence * 100).toFixed(0)}%).`;

    console.log(analysisSummary);

    const response: GeneratePersonaResponse = {
      persona,
      confidence,
      sources_analyzed: contentSources.length,
      analysis_summary: analysisSummary,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-persona function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
