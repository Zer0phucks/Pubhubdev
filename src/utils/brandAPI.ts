/**
 * Brand API utilities
 * Handles all brand-related database operations
 */

import { apiCall } from './api';
import type { Brand, CreateBrandInput, UpdateBrandInput } from '@/types';

/**
 * Fetch brand for a project
 */
export async function fetchBrand(projectId: string): Promise<Brand | null> {
  try {
    const response = await apiCall(`/brands/${projectId}`);
    return response.brand || null;
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return null;
    }
    console.error('Error fetching brand:', error);
    throw error;
  }
}

/**
 * Create a new brand for a project
 */
export async function createBrand(brand: CreateBrandInput): Promise<Brand> {
  try {
    const response = await apiCall('/brands', {
      method: 'POST',
      body: JSON.stringify(brand),
    });
    return response.brand;
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
    const response = await apiCall(`/brands/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.brand;
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
    const existing = await fetchBrand(brand.project_id);
    if (existing) {
      return await updateBrand(brand.project_id, brand);
    } else {
      return await createBrand(brand);
    }
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
    await apiCall(`/brands/${projectId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    throw error;
  }
}

/**
 * Upload logo to DigitalOcean Spaces
 */
export async function uploadLogo(
  projectId: string,
  file: File,
  variant: 'light' | 'dark' | 'square'
): Promise<string> {
  try {
    const { getAuthToken, API_URL } = await import('./api');
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('variant', variant);
    
    const response = await fetch(`${API_URL}/upload/project-logo/${projectId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

/**
 * Delete logo from DigitalOcean Spaces
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

    await apiCall('/upload/project-logo/delete', {
      method: 'DELETE',
      body: JSON.stringify({ filePath }),
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    throw error;
  }
}
