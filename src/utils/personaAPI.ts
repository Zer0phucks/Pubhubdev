/**
 * Persona API utilities
 * Handles all persona-related database operations and AI generation
 */

import { supabase } from './supabase/client';
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
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No persona found - this is okay, return null
        return null;
      }
      throw error;
    }

    const record = data as PersonaRecord;
    return record.persona_data;
  } catch (error) {
    console.error('Error fetching persona:', error);
    throw error;
  }
}

/**
 * Fetch full persona record (includes metadata)
 */
export async function fetchPersonaRecord(projectId: string): Promise<PersonaRecord | null> {
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as PersonaRecord;
  } catch (error) {
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
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Build persona data with provenance
    const personaData: CreatorPersona = {
      id: crypto.randomUUID(),
      ...persona,
      provenance: {
        created_at: new Date().toISOString(),
        created_by: user?.id,
        data_summary: persona.provenance?.data_summary || 'Manually created',
        notes: persona.provenance?.notes,
      },
    };

    const { data, error } = await supabase
      .from('personas')
      .insert({
        project_id: projectId,
        persona_data: personaData,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data as PersonaRecord;
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
    // Fetch existing persona
    const existing = await fetchPersonaRecord(projectId);
    if (!existing) {
      throw new Error('Persona not found');
    }

    // Merge updates with existing data
    const updatedPersonaData: CreatorPersona = {
      ...existing.persona_data,
      ...updates,
      provenance: {
        ...existing.persona_data.provenance,
        ...updates.provenance,
      },
    };

    // Increment patch version
    const { data, error } = await supabase
      .from('personas')
      .update({
        persona_data: updatedPersonaData,
        version_patch: existing.version_patch + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    return data as PersonaRecord;
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
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting persona:', error);
    throw error;
  }
}

/**
 * Generate persona from content sources using AI
 * This calls a Supabase Edge Function
 */
export async function generatePersona(
  request: GeneratePersonaRequest
): Promise<GeneratePersonaResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-persona', {
      body: request,
    });

    if (error) throw error;

    return data as GeneratePersonaResponse;
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
    const existing = await fetchPersonaRecord(projectId);
    if (!existing) {
      throw new Error('Persona not found');
    }

    const updates: Partial<PersonaRecord> = {
      updated_at: new Date().toISOString(),
    };

    if (type === 'major') {
      updates.version_major = existing.version_major + 1;
      updates.version_minor = 0;
      updates.version_patch = 0;
    } else {
      updates.version_minor = existing.version_minor + 1;
      updates.version_patch = 0;
    }

    const { data, error } = await supabase
      .from('personas')
      .update(updates)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    return data as PersonaRecord;
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
