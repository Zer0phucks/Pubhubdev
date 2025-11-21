/**
 * Brand API utilities
 * Handles all brand-related database operations
 * 
 * NOTE: These functions need database-backed API routes in the backend.
 * For now, they're placeholders that will call the API once routes are added.
 */

import { apiCall } from './api';
import type { Brand, CreateBrandInput, UpdateBrandInput } from '@/types';

/**
 * Fetch brand for a project
 * TODO: Add /brands/:projectId route to API service
 */
export async function fetchBrand(projectId: string): Promise<Brand | null> {
  try {
    // TODO: Implement when API route is added
    // const response = await apiCall(`/brands/${projectId}`);
    // return response.brand || null;
    console.warn('fetchBrand: API route not yet implemented');
    return null;
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
 * Upload logo to DigitalOcean Spaces
 * TODO: Add /upload/project-logo/:projectId route to API service
 */
export async function uploadLogo(
  projectId: string,
  file: File,
  variant: 'light' | 'dark' | 'square'
): Promise<string> {
  try {
    // TODO: Implement when API route is added
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await apiCall(`/upload/project-logo/${projectId}?variant=${variant}`, {
    //   method: 'POST',
    //   body: formData,
    // });
    // return response.url;
    console.warn('uploadLogo: API route not yet implemented');
    throw new Error('Logo upload not yet implemented');
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
