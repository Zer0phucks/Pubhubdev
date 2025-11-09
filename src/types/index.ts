// Core application types

export type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
export type PlatformFilter = "all" | Platform;

export type View = "home" | "compose" | "inbox" | "calendar" | "settings";
export type InboxView = "all" | "unread" | "comments" | "messages";

export type PostStatus = "scheduled" | "published" | "draft" | "failed";

// Recurrence
export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly";

export interface Recurrence {
  frequency: RecurrenceFrequency;
  // Optional future extensions: end conditions, interval, etc.
  // interval?: number; // every N days/weeks/months
  // endAfterOccurrences?: number;
  // endByDate?: string; // ISO date string
  // daysOfWeek?: number[]; // 0-6 for weekly
}

export interface ScheduledPost {
  id: string;
  date: Date;
  time: string;
  platform: Platform;
  content: string;
  status: PostStatus;
  isAiGenerated?: boolean;
  attachments?: Attachment[];
  crossPostTo?: Platform[];
  recurrence?: Recurrence; // Optional recurrence metadata
}

// Backend post format from API
export interface BackendPost {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
  attachments?: Attachment[];
  recurrence?: Recurrence;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  name: string;
  size: number;
  type: string;
}

export interface InboxMessage {
  id: string;
  platform: Platform;
  type: "comment" | "message" | "mention";
  from: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  avatar?: string;
  postContext?: string;
}

// Platform-specific constraints
export interface PlatformConstraints {
  maxLength: number;
  maxImages: number;
  maxVideos: number;
  supportsThreads: boolean;
  supportsHashtags: boolean;
  maxHashtags?: number;
}

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraints> = {
  twitter: {
    maxLength: 280,
    maxImages: 4,
    maxVideos: 1,
    supportsThreads: true,
    supportsHashtags: true,
    maxHashtags: 5
  },
  instagram: {
    maxLength: 2200,
    maxImages: 10,
    maxVideos: 1,
    supportsThreads: false,
    supportsHashtags: true,
    maxHashtags: 30
  },
  linkedin: {
    maxLength: 3000,
    maxImages: 9,
    maxVideos: 1,
    supportsThreads: false,
    supportsHashtags: true,
    maxHashtags: 10
  },
  facebook: {
    maxLength: 63206,
    maxImages: 10,
    maxVideos: 1,
    supportsThreads: false,
    supportsHashtags: true
  },
  youtube: {
    maxLength: 5000,
    maxImages: 1, // thumbnail
    maxVideos: 1,
    supportsThreads: false,
    supportsHashtags: true,
    maxHashtags: 15
  },
  tiktok: {
    maxLength: 2200,
    maxImages: 35, // for slideshows
    maxVideos: 1,
    supportsThreads: false,
    supportsHashtags: true,
    maxHashtags: 10
  },
  pinterest: {
    maxLength: 500,
    maxImages: 1,
    maxVideos: 1,
    supportsThreads: false,
    supportsHashtags: true
  },
  reddit: {
    maxLength: 40000,
    maxImages: 20,
    maxVideos: 1,
    supportsThreads: true,
    supportsHashtags: false
  },
  blog: {
    maxLength: 100000,
    maxImages: 50,
    maxVideos: 10,
    supportsThreads: false,
    supportsHashtags: true
  }
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: "Twitter",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  reddit: "Reddit",
  blog: "Blog"
};

// Content Template Types
export type TemplateCategory = "announcement" | "educational" | "promotional" | "engagement" | "behind-scenes" | "storytelling";

export interface ContentTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  content: string;
  platforms: Platform[];
  hashtags?: string[];
  emoji?: string;
}

// ============= API TYPES =============

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

// Post creation/update payload
export interface PostPayload {
  content: string;
  platform: Platform | Platform[];
  scheduledAt?: string;
  status?: PostStatus;
  attachments?: Attachment[];
  crossPostTo?: Platform[];
  recurrence?: Recurrence;
  projectId?: string;
}

// Template creation payload
export interface TemplatePayload {
  title: string;
  category: TemplateCategory;
  content: string;
  platforms: Platform[];
  hashtags?: string[];
  emoji?: string;
}

// Automation payload
export interface AutomationPayload {
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  projectId?: string;
}

// Connection update payload
export interface ConnectionPayload {
  platform: Platform;
  connected: boolean;
  accountId?: string;
  accountName?: string;
  metadata?: Record<string, unknown>;
}

// Settings payload
export interface SettingsPayload {
  theme?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  timezone?: string;
  language?: string;
  [key: string]: unknown;
}

// OAuth types
export interface OAuthAuthorizationResponse {
  authUrl: string;
  state: string;
}

export interface OAuthCallbackPayload {
  code: string;
  state: string;
  platform: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string[];
}

// ============= VALIDATION TYPES =============

// Validation result with generic sanitized value
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: T;
}

// Validation rule definition
export interface ValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  sanitize?: (value: T) => T;
}

// Field validation input
export interface FieldValidation<T = unknown> {
  value: T;
  rule: ValidationRule<T>;
}

// Multiple field validation result
export interface FieldsValidationResult<T = Record<string, unknown>> {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedValues: T;
}

// File upload options
export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

// JSON schema type (simplified)
export interface JsonSchema {
  [key: string]: {
    required?: boolean;
    type?: string;
    [key: string]: unknown;
  };
}

// Rate limit data
export interface RateLimitData {
  count: number;
  resetTime: number;
}

// ============= PUBLISH API TYPES =============

// Platform publish result
export interface PlatformPublishResult {
  platform: Platform;
  success: boolean;
  url?: string;
  error?: string;
  postId?: string;
}

// Publish response from API
export interface PublishResponse {
  success: boolean;
  results?: PlatformPublishResult[];
  error?: string;
}

// ============= ERROR TYPES =============

// Standard error interface for catch blocks
export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

// Type guard for AppError
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error;
}

// Safe error conversion utility
export function toAppError(error: unknown): AppError {
  if (error instanceof Error) {
    return error as AppError;
  }
  if (typeof error === 'string') {
    return new Error(error) as AppError;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message)) as AppError;
  }
  return new Error('An unknown error occurred') as AppError;
}

// Application view types (for routing)
export type AppView = 
  | "project-overview"
  | "compose"
  | "inbox"
  | "calendar"
  | "analytics"
  | "library"
  | "notifications"
  | "ebooks"
  | "trending"
  | "competition"
  | "project-settings";

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
}
