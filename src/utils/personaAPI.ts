/**
 * Persona API utilities
 * Handles all persona-related database operations and AI generation
 */

import { apiCall } from './api';
import type {
  CreatorPersona,
  PersonaRecord,
  CreatePersonaInput,
  UpdatePersonaInput,
  GeneratePersonaRequest,
  GeneratePersonaResponse,
} from '@/types';

/**
 * Fetch persona for a project
 */
export async function fetchPersona(projectId: string): Promise<CreatorPersona | null> {
  try {
    const response = await apiCall(`/personas/${projectId}`);
    return response.persona?.persona_data || null;
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return null;
    }
    console.error('Error fetching persona:', error);
    throw error;
  }
}

/**
 * Fetch full persona record (includes metadata)
 */
export async function fetchPersonaRecord(projectId: string): Promise<PersonaRecord | null> {
  try {
    const response = await apiCall(`/personas/${projectId}`);
    return response.persona || null;
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return null;
    }
    console.error('Error fetching persona record:', error);
    throw error;
  }
}

/**
 * Create a new persona for a project
 */
export async function createPersona(
  projectId: string,
  persona: CreatePersonaInput
): Promise<PersonaRecord> {
  try {
    const response = await apiCall(`/personas/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ persona }),
    });
    return response.persona;
  } catch (error) {
    console.error('Error creating persona:', error);
    throw error;
  }
}

/**
 * Update an existing persona
 */
export async function updatePersona(
  projectId: string,
  updates: UpdatePersonaInput
): Promise<PersonaRecord> {
  try {
    const response = await apiCall(`/personas/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
    return response.persona;
  } catch (error) {
    console.error('Error updating persona:', error);
    throw error;
  }
}

/**
 * Upsert persona (create or update)
 */
export async function upsertPersona(
  projectId: string,
  persona: CreatePersonaInput
): Promise<PersonaRecord> {
  try {
    const existing = await fetchPersona(projectId);

    if (existing) {
      return await updatePersona(projectId, persona);
    } else {
      return await createPersona(projectId, persona);
    }
  } catch (error) {
    console.error('Error upserting persona:', error);
    throw error;
  }
}

/**
 * Delete a persona
 */
export async function deletePersona(projectId: string): Promise<void> {
  try {
    await apiCall(`/personas/${projectId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting persona:', error);
    throw error;
  }
}

/**
 * Generate persona from content sources using AI
 * This triggers a background worker job
 */
export async function generatePersona(
  request: GeneratePersonaRequest
): Promise<GeneratePersonaResponse> {
  try {
    const response = await apiCall(`/personas/${request.project_id}/generate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  } catch (error) {
    console.error('Error generating persona:', error);
    throw error;
  }
}

/**
 * Update persona version (major/minor bump)
 */
export async function bumpPersonaVersion(
  projectId: string,
  type: 'major' | 'minor'
): Promise<PersonaRecord> {
  try {
    const response = await apiCall(`/personas/${projectId}/bump-version`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
    return response.persona;
  } catch (error) {
    console.error('Error bumping persona version:', error);
    throw error;
  }
}

/**
 * Helper: Create default persona structure
 */
export function createDefaultPersona(displayName: string): Partial<CreatorPersona> {
  return {
    identity: {
      display_name: displayName,
      aliases: [],
      bio_summary: '',
      expertise_domains: [],
      audience_profile: {
        primary_audience: '',
        audience_needs: [],
        reading_level: 'intermediate',
      },
    },
    voice: {
      tone_axes: {
        formal: 0.5,
        playful: 0.5,
        confident: 0.5,
        empathetic: 0.5,
        direct: 0.5,
        provocative: 0.5,
      },
      lexical_preferences: {
        signature_phrases: [],
        preferred_terms: [],
        avoid_terms: [],
        jargon_level: 'medium',
        emoji_usage: 'moderate',
        punctuation_style: '',
      },
      rhetorical_moves: [],
      humor_style: '',
    },
    topics: {
      core_topics: [],
      edge_topics: [],
      taboo_topics: [],
      stances: [],
    },
    dos_and_donts: {
      do: [],
      dont: [],
    },
    safety_and_ethics: {
      consent_status: 'granted',
      attribution_rules: '',
      refusal_conditions: [],
      disclosure_rules: '',
    },
  };
}
