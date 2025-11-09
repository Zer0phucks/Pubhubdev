// Automation rule storage and management
import { logger } from './logger';

export type TriggerPlatform = "youtube" | "tiktok";
export type TransformationType = "blog" | "social-thread" | "linkedin-post" | "social-announcement" | "newsletter" | "captions";
export type ActionType = "draft" | "review" | "auto-publish";

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    platform: TriggerPlatform;
    minDuration?: number; // in seconds
    keywords?: string[];
  };
  transformation: TransformationType;
  transformationInstructions?: string; // Custom guidelines for the transformation
  action: ActionType;
  targetPlatforms: string[];
  createdAt: string;
  lastTriggered?: string;
  executionCount: number;
}

const STORAGE_KEY = 'pubhub_automation_rules';

// Get all automation rules
export const getAutomationRules = (): AutomationRule[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Error loading automation rules:', error);
    return [];
  }
};

// Save automation rules
export const saveAutomationRules = (rules: AutomationRule[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (error) {
    logger.error('Error saving automation rules:', error);
  }
};

// Add a new automation rule
export const addAutomationRule = (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>): AutomationRule => {
  const rules = getAutomationRules();
  const newRule: AutomationRule = {
    ...rule,
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    executionCount: 0,
  };
  
  rules.push(newRule);
  saveAutomationRules(rules);
  return newRule;
};

// Update an automation rule
export const updateAutomationRule = (id: string, updates: Partial<AutomationRule>): void => {
  const rules = getAutomationRules();
  const index = rules.findIndex(r => r.id === id);
  
  if (index !== -1) {
    rules[index] = { ...rules[index], ...updates };
    saveAutomationRules(rules);
  }
};

// Delete an automation rule
export const deleteAutomationRule = (id: string): void => {
  const rules = getAutomationRules();
  const filtered = rules.filter(r => r.id !== id);
  saveAutomationRules(filtered);
};

// Toggle automation rule enabled state
export const toggleAutomationRule = (id: string): void => {
  const rules = getAutomationRules();
  const rule = rules.find(r => r.id === id);
  
  if (rule) {
    rule.enabled = !rule.enabled;
    saveAutomationRules(rules);
  }
};

// Record automation execution
export const recordAutomationExecution = (id: string): void => {
  const rules = getAutomationRules();
  const rule = rules.find(r => r.id === id);
  
  if (rule) {
    rule.executionCount += 1;
    rule.lastTriggered = new Date().toISOString();
    saveAutomationRules(rules);
  }
};

// Check if a video matches automation rules
export const matchAutomationRules = (video: {
  platform: TriggerPlatform;
  duration: string;
  title: string;
  description: string;
}): AutomationRule[] => {
  const rules = getAutomationRules().filter(r => r.enabled);
  
  return rules.filter(rule => {
    // Check platform match
    if (rule.trigger.platform !== video.platform) {
      return false;
    }
    
    // Check duration if specified
    if (rule.trigger.minDuration) {
      const [mins, secs] = video.duration.split(':').map(Number);
      const totalSeconds = (mins * 60) + secs;
      if (totalSeconds < rule.trigger.minDuration) {
        return false;
      }
    }
    
    // Check keywords if specified
    if (rule.trigger.keywords && rule.trigger.keywords.length > 0) {
      const content = `${video.title} ${video.description}`.toLowerCase();
      const hasMatch = rule.trigger.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      if (!hasMatch) {
        return false;
      }
    }
    
    return true;
  });
};

// Get transformation type label
export const getTransformationLabel = (type: TransformationType): string => {
  const labels: Record<TransformationType, string> = {
    'blog': 'Blog Post',
    'social-thread': 'Social Media Thread',
    'linkedin-post': 'LinkedIn Article',
    'social-announcement': 'Video Announcement',
    'newsletter': 'Email Newsletter',
    'captions': 'Repurposed Captions',
  };
  return labels[type] || type;
};

// Get action type label
export const getActionLabel = (action: ActionType): string => {
  const labels: Record<ActionType, string> = {
    'draft': 'Save as Draft',
    'review': 'Save for Review',
    'auto-publish': 'Auto-Publish',
  };
  return labels[action] || action;
};
