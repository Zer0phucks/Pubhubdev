/**
 * RAG (Retrieval Augmented Generation) API utilities
 * Handles vector similarity search and AI-powered Q&A
 */

import { supabase } from './supabase/client';
import type {
  RAGQueryRequest,
  RAGQueryResponse,
  ContentPlatform,
} from '@/types';

/**
 * Query the RAG system for AI-powered answers based on project content
 */
export async function queryRAG(request: RAGQueryRequest): Promise<RAGQueryResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('rag-query', {
      body: request,
    });

    if (error) throw error;

    return data as RAGQueryResponse;
  } catch (error) {
    console.error('Error querying RAG:', error);
    throw error;
  }
}

/**
 * Query with default parameters
 */
export async function simpleQuery(
  projectId: string,
  query: string
): Promise<RAGQueryResponse> {
  return await queryRAG({
    query,
    project_id: projectId,
    top_k: 5,
    similarity_threshold: 0.7,
    use_persona: true,
  });
}

/**
 * Query with platform filter
 */
export async function queryByPlatform(
  projectId: string,
  query: string,
  platform: ContentPlatform
): Promise<RAGQueryResponse> {
  return await queryRAG({
    query,
    project_id: projectId,
    top_k: 5,
    similarity_threshold: 0.7,
    filters: { platform },
    use_persona: true,
  });
}

/**
 * Query without persona context (pure RAG)
 */
export async function queryWithoutPersona(
  projectId: string,
  query: string
): Promise<RAGQueryResponse> {
  return await queryRAG({
    query,
    project_id: projectId,
    top_k: 5,
    similarity_threshold: 0.7,
    use_persona: false,
  });
}

/**
 * Advanced query with custom parameters
 */
export async function advancedQuery(
  projectId: string,
  query: string,
  options: {
    topK?: number;
    similarityThreshold?: number;
    platform?: ContentPlatform;
    contentType?: string;
    usePersona?: boolean;
  }
): Promise<RAGQueryResponse> {
  return await queryRAG({
    query,
    project_id: projectId,
    top_k: options.topK || 5,
    similarity_threshold: options.similarityThreshold || 0.7,
    filters: {
      platform: options.platform,
      content_type: options.contentType,
    },
    use_persona: options.usePersona ?? true,
  });
}
