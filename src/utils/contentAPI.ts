/**
 * Content Source API utilities
 * Handles content ingestion, management, and vector operations
 */

import { supabase } from './supabase/client';
import type {
  ContentSource,
  CreateContentSourceInput,
  IngestURLRequest,
  IngestURLResponse,
  ContentPlatform,
  ContentStatus,
} from '@/types';

/**
 * Fetch all content sources for a project
 */
export async function fetchContentSources(
  projectId: string,
  options?: {
    platform?: ContentPlatform;
    status?: ContentStatus;
    limit?: number;
    offset?: number;
  }
): Promise<ContentSource[]> {
  try {
    let query = supabase
      .from('content_sources')
      .select('*')
      .eq('project_id', projectId)
      .order('ingested_at', { ascending: false });

    if (options?.platform) {
      query = query.eq('platform', options.platform);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as ContentSource[];
  } catch (error) {
    console.error('Error fetching content sources:', error);
    throw error;
  }
}

/**
 * Fetch a single content source by ID
 */
export async function fetchContentSource(id: string): Promise<ContentSource | null> {
  try {
    const { data, error } = await supabase
      .from('content_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as ContentSource;
  } catch (error) {
    console.error('Error fetching content source:', error);
    throw error;
  }
}

/**
 * Create a new content source
 */
export async function createContentSource(
  source: CreateContentSourceInput
): Promise<ContentSource> {
  try {
    const { data, error } = await supabase
      .from('content_sources')
      .insert({
        ...source,
        status: 'pending',
        ingested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data as ContentSource;
  } catch (error) {
    console.error('Error creating content source:', error);
    throw error;
  }
}

/**
 * Update content source status
 */
export async function updateContentSourceStatus(
  id: string,
  status: ContentStatus,
  errorMessage?: string
): Promise<ContentSource> {
  try {
    const updates: Partial<ContentSource> = {
      status,
      error_message: errorMessage,
    };

    if (status === 'completed') {
      updates.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('content_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as ContentSource;
  } catch (error) {
    console.error('Error updating content source status:', error);
    throw error;
  }
}

/**
 * Update content source with extracted content
 */
export async function updateContentSourceContent(
  id: string,
  content: {
    title?: string;
    raw_content?: string;
    processed_content?: string;
    content_type?: string;
    metadata?: Record<string, any>;
  }
): Promise<ContentSource> {
  try {
    const { data, error } = await supabase
      .from('content_sources')
      .update(content)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as ContentSource;
  } catch (error) {
    console.error('Error updating content source content:', error);
    throw error;
  }
}

/**
 * Delete a content source (and associated vectors via CASCADE)
 */
export async function deleteContentSource(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('content_sources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting content source:', error);
    throw error;
  }
}

/**
 * Ingest URLs and process them into content sources
 * This calls a Supabase Edge Function
 */
export async function ingestURLs(request: IngestURLRequest): Promise<IngestURLResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ingest-content', {
      body: request,
    });

    if (error) throw error;

    return data as IngestURLResponse;
  } catch (error) {
    console.error('Error ingesting URLs:', error);
    throw error;
  }
}

/**
 * Get content source statistics for a project
 */
export async function getContentSourceStats(projectId: string): Promise<{
  total: number;
  by_platform: Record<ContentPlatform, number>;
  by_status: Record<ContentStatus, number>;
}> {
  try {
    const sources = await fetchContentSources(projectId);

    const stats = {
      total: sources.length,
      by_platform: {} as Record<ContentPlatform, number>,
      by_status: {} as Record<ContentStatus, number>,
    };

    sources.forEach((source) => {
      // Count by platform
      if (!stats.by_platform[source.platform as ContentPlatform]) {
        stats.by_platform[source.platform as ContentPlatform] = 0;
      }
      stats.by_platform[source.platform as ContentPlatform]++;

      // Count by status
      if (!stats.by_status[source.status]) {
        stats.by_status[source.status] = 0;
      }
      stats.by_status[source.status]++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting content source stats:', error);
    throw error;
  }
}

/**
 * Detect platform from URL
 */
export function detectPlatformFromURL(url: string): ContentPlatform {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  }
  if (urlLower.includes('instagram.com')) {
    return 'instagram';
  }
  if (urlLower.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (urlLower.includes('medium.com') || urlLower.includes('substack.com')) {
    return 'blog';
  }

  return 'manual_url';
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Batch create content sources from URLs
 */
export async function batchCreateContentSources(
  projectId: string,
  urls: string[]
): Promise<ContentSource[]> {
  try {
    const sources = urls.map((url) => ({
      project_id: projectId,
      url,
      platform: detectPlatformFromURL(url),
      status: 'pending' as ContentStatus,
      ingested_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('content_sources')
      .insert(sources)
      .select();

    if (error) throw error;

    return data as ContentSource[];
  } catch (error) {
    console.error('Error batch creating content sources:', error);
    throw error;
  }
}
