/**
 * Brand API utilities
 * Handles all brand-related database operations
 */

import { supabase } from './supabase/client';
import type { Brand, CreateBrandInput, UpdateBrandInput } from '@/types';

/**
 * Fetch brand for a project
 */
export async function fetchBrand(projectId: string): Promise<Brand | null> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No brand found - this is okay, return null
        return null;
      }
      throw error;
    }

    return data as Brand;
  } catch (error) {
    console.error('Error fetching brand:', error);
    throw error;
  }
}

/**
 * Create a new brand for a project
 */
export async function createBrand(brand: CreateBrandInput): Promise<Brand> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .insert(brand)
      .select()
      .single();

    if (error) throw error;

    return data as Brand;
  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
}

/**
 * Update an existing brand
 */
export async function updateBrand(
  projectId: string,
  updates: UpdateBrandInput
): Promise<Brand> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    return data as Brand;
  } catch (error) {
    console.error('Error updating brand:', error);
    throw error;
  }
}

/**
 * Upsert brand (create or update)
 */
export async function upsertBrand(brand: CreateBrandInput): Promise<Brand> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .upsert(brand, {
        onConflict: 'project_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Brand;
  } catch (error) {
    console.error('Error upserting brand:', error);
    throw error;
  }
}

/**
 * Delete a brand
 */
export async function deleteBrand(projectId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting brand:', error);
    throw error;
  }
}

/**
 * Upload logo to Supabase Storage
 */
export async function uploadLogo(
  projectId: string,
  file: File,
  variant: 'light' | 'dark' | 'square'
): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${variant}-logo.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, file, {
        upsert: true, // Overwrite if exists
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

/**
 * Delete logo from Supabase Storage
 */
export async function deleteLogo(logoUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(logoUrl);
    const pathParts = url.pathname.split('/brand-assets/');
    if (pathParts.length < 2) {
      throw new Error('Invalid logo URL');
    }
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('brand-assets')
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting logo:', error);
    throw error;
  }
}
