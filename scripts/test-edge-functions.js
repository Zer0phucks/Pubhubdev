/**
 * Edge Functions Testing Script
 * Tests all persona system Edge Functions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test project ID (create a test project first)
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'test-project-id';

async function testIngestContent() {
  console.log('\n📥 Testing ingest-content function...');

  const testURLs = [
    'https://example.com/article-1',
    'https://example.com/article-2',
  ];

  try {
    const { data, error } = await supabase.functions.invoke('ingest-content', {
      body: {
        project_id: TEST_PROJECT_ID,
        urls: testURLs,
      },
    });

    if (error) {
      console.error('❌ Ingest content failed:', error);
      return false;
    }

    console.log('✅ Ingest content succeeded');
    console.log('Ingested:', data.ingested.length);
    console.log('Failed:', data.failed.length);
    console.log('Details:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Ingest content error:', error.message);
    return false;
  }
}

async function testGeneratePersona() {
  console.log('\n🤖 Testing generate-persona function...');

  try {
    const { data, error } = await supabase.functions.invoke('generate-persona', {
      body: {
        project_id: TEST_PROJECT_ID,
        analyze_all: true,
        max_sources: 10,
      },
    });

    if (error) {
      console.error('❌ Generate persona failed:', error);
      return false;
    }

    console.log('✅ Generate persona succeeded');
    console.log('Sources analyzed:', data.sources_analyzed);
    console.log('Confidence:', (data.confidence * 100).toFixed(0) + '%');
    console.log('Summary:', data.analysis_summary);
    console.log('Persona preview:', JSON.stringify(data.persona.identity, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Generate persona error:', error.message);
    return false;
  }
}

async function testRAGQuery() {
  console.log('\n🔍 Testing rag-query function...');

  const testQuery = 'What are the main topics this creator writes about?';

  try {
    const { data, error } = await supabase.functions.invoke('rag-query', {
      body: {
        query: testQuery,
        project_id: TEST_PROJECT_ID,
        top_k: 5,
        similarity_threshold: 0.7,
        use_persona: true,
      },
    });

    if (error) {
      console.error('❌ RAG query failed:', error);
      return false;
    }

    console.log('✅ RAG query succeeded');
    console.log('Query:', testQuery);
    console.log('Answer:', data.answer);
    console.log('Sources:', data.sources.length);
    console.log('Confidence:', (data.confidence * 100).toFixed(0) + '%');
    console.log('Persona used:', data.persona_used);
    return true;
  } catch (error) {
    console.error('❌ RAG query error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Edge Functions Tests');
  console.log('===================================');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Test Project ID:', TEST_PROJECT_ID);

  const results = {
    ingest: await testIngestContent(),
    generate: await testGeneratePersona(),
    rag: await testRAGQuery(),
  };

  console.log('\n📊 Test Results');
  console.log('===============');
  console.log('Ingest Content:', results.ingest ? '✅ PASS' : '❌ FAIL');
  console.log('Generate Persona:', results.generate ? '✅ PASS' : '❌ FAIL');
  console.log('RAG Query:', results.rag ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every((r) => r === true);
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
