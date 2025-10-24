import type { ContentTemplate } from "../types";

const STORAGE_KEY = "pubhub_custom_templates";

export function getCustomTemplates(): ContentTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading custom templates:", error);
    return [];
  }
}

export function saveCustomTemplate(template: ContentTemplate): void {
  try {
    const templates = getCustomTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      // Update existing template
      templates[existingIndex] = template;
    } else {
      // Add new template
      templates.push(template);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("Error saving custom template:", error);
    throw new Error("Failed to save template");
  }
}

export function deleteCustomTemplate(templateId: string): void {
  try {
    const templates = getCustomTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting custom template:", error);
    throw new Error("Failed to delete template");
  }
}

export function updateCustomTemplate(templateId: string, updates: Partial<ContentTemplate>): void {
  try {
    const templates = getCustomTemplates();
    const index = templates.findIndex(t => t.id === templateId);
    
    if (index >= 0) {
      templates[index] = { ...templates[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }
  } catch (error) {
    console.error("Error updating custom template:", error);
    throw new Error("Failed to update template");
  }
}
