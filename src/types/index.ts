// Core application types

export type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
export type PlatformFilter = "all" | Platform;

export type View = "home" | "compose" | "inbox" | "calendar" | "settings";
export type InboxView = "all" | "unread" | "comments" | "messages";

export type PostStatus = "scheduled" | "published" | "draft" | "failed";

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
