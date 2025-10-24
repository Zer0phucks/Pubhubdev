# PubHub Backend Integration Guide

## Overview

PubHub is a multi-platform content creator dashboard built with React, TypeScript, Tailwind CSS v4, and shadcn/ui components. This guide provides comprehensive information for integrating a backend using **Vercel + Supabase + Inngest**.

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Background Jobs**: Inngest (for scheduling, automation, and async tasks)

---

## Table of Contents

1. [Application Architecture](#application-architecture)
2. [Core Features](#core-features)
3. [Data Models & Types](#data-models--types)
4. [Database Schema](#database-schema)
5. [API Endpoints Required](#api-endpoints-required)
6. [Authentication & Authorization](#authentication--authorization)
7. [Third-Party Integrations](#third-party-integrations)
8. [Inngest Background Jobs](#inngest-background-jobs)
9. [Supabase Configuration](#supabase-configuration)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Environment Variables](#environment-variables)

---

## Application Architecture

### Current UI Structure

```
App.tsx (Main Entry Point)
├── Sidebar Navigation
│   ├── Home (Dashboard Overview)
│   ├── Create (Content Composer)
│   ├── Inbox (Unified Inbox with subviews)
│   ├── Calendar (Content Scheduling)
│   ├── Analytics (Performance Metrics)
│   ├── Media Library (Video Content Management)
│   └── Settings (Platform Connections, Automation, Preferences)
├── AppHeader (Platform selector, Search, AI Chat, Notifications)
├── Command Palette (Quick navigation)
├── AI Chat Dialog (Assistant interface)
└── Settings Panel (Theme, preferences)
```

### Supported Platforms

The app supports 9 social media platforms:
- Twitter/X
- Instagram
- Facebook
- YouTube
- LinkedIn
- TikTok
- Pinterest
- Reddit
- Blog (custom blogging platforms)

---

## Core Features

### 1. **Home / Dashboard**
**File**: `components/Home.tsx`, `components/DashboardOverview.tsx`, `components/CombinedInsights.tsx`

**Features**:
- Platform-specific or aggregated overview
- Key metrics (followers, engagement, posts)
- Recent activity feed
- Quick actions
- Cross-platform insights

**Backend Needs**:
- Fetch aggregated metrics for connected platforms
- Real-time or cached analytics data
- Activity timeline/feed

---

### 2. **Content Composer**
**File**: `components/ContentComposer.tsx`

**Features**:
- Multi-platform content creation
- Platform-specific constraints (character limits, media requirements)
- Media attachments (images, videos)
- Cross-posting to multiple platforms
- Schedule for later
- Save as draft
- Template library integration
- Content transformation from Media Library

**Backend Needs**:
- Store drafts
- Validate content against platform constraints
- Upload and manage media files (Supabase Storage)
- Queue posts for immediate publishing or scheduling
- Track post status (draft, scheduled, published, failed)

---

### 3. **Template Library**
**File**: `components/TemplateLibrary.tsx`, `components/CreateTemplateDialog.tsx`

**Features**:
- Pre-built content templates by category
- Custom user templates
- Template categories: Announcement, Educational, Promotional, Engagement, Behind-the-Scenes, Storytelling
- Create, edit, delete custom templates

**Backend Needs**:
- Store user-created templates
- Retrieve built-in and custom templates
- Template CRUD operations

**Current State**: Uses localStorage (`utils/customTemplates.ts`) - needs migration to database

---

### 4. **Unified Inbox**
**File**: `components/UnifiedInbox.tsx`

**Features**:
- View comments and messages from all platforms in one place
- Filter by platform
- Filter by type (all, unread, comments, messages)
- Mark as read/unread
- Reply to comments/messages
- Delete conversations

**Backend Needs**:
- Poll or webhook-based ingestion of comments/messages from platforms
- Store conversations with metadata (platform, author, timestamp, read status)
- Update read/unread status
- Send replies back to respective platforms via their APIs

---

### 5. **Content Calendar**
**File**: `components/ContentCalendar.tsx`, `components/calendar/*`

**Features**:
- Month and week views
- Schedule posts for specific dates/times
- Visual calendar with platform icons
- Edit and delete scheduled posts
- AI-generated post suggestions
- Cross-posting configuration

**Backend Needs**:
- Store scheduled posts with date, time, platform, content
- Retrieve posts for calendar rendering
- Update/delete scheduled posts
- Trigger publishing at scheduled time (Inngest)
- Handle cross-posting logic

---

### 6. **Analytics**
**File**: `components/Analytics.tsx`

**Features**:
- Platform-specific or aggregated analytics
- Time range selection (7 days, 30 days, 90 days)
- Key metrics: Impressions, Engagement Rate, Followers Growth, Post Frequency
- Engagement trends chart (Recharts)
- Best performing content
- Platform-specific metrics

**Backend Needs**:
- Fetch analytics from platform APIs
- Cache/aggregate metrics in database
- Calculate trends and derived metrics
- Store historical data for time-series analysis

---

### 7. **Media Library**
**File**: `components/MediaLibrary.tsx`, `components/TransformVideoDialog.tsx`

**Features**:
- Import videos from YouTube and TikTok
- View video metadata (views, likes, comments, duration)
- Transform video content into posts for other platforms
- AI-powered content transformation (hooks, threads, clips)
- Automation rules matching

**Backend Needs**:
- Fetch video metadata from YouTube/TikTok APIs
- Store video references and metadata
- Generate transcripts (if needed for AI transformation)
- Apply automation rules to transform content
- Track transformation status

---

### 8. **Platform Connections**
**File**: `components/PlatformConnections.tsx`

**Features**:
- Connect/disconnect social media accounts via OAuth
- View connection status and account details
- Platform-specific metrics at a glance

**Backend Needs**:
- OAuth flow for each platform
- Store access tokens and refresh tokens securely
- Handle token refresh logic
- Validate and monitor connection health

---

### 9. **Automation Settings**
**File**: `components/AutomationSettings.tsx`, `components/CreateAutomationDialog.tsx`

**Features**:
- Create automation rules (e.g., auto-transform YouTube videos)
- Rule conditions: Source platform, content type, keywords
- Actions: Transform and publish, save as draft, notify
- Content transformation instructions
- Enable/disable rules
- Execution tracking

**Backend Needs**:
- Store automation rules per user
- Trigger rules based on new content (webhooks or polling)
- Execute transformations (AI/manual)
- Track rule executions and results
- Send notifications

---

### 10. **AI Assistant**
**File**: `components/AIChatDialog.tsx`

**Features**:
- Context-aware AI chat
- Content suggestions
- Platform-specific advice
- Command shortcuts

**Backend Needs**:
- OpenAI or similar LLM API integration
- Context management (current view, platform, user data)
- Streaming responses
- Rate limiting

---

### 11. **Notifications**
**File**: `components/Notifications.tsx`

**Features**:
- System notifications (post published, automation triggered, etc.)
- Platform notifications (new comments, messages)
- Notification preferences
- Mark as read/unread
- Delete notifications

**Backend Needs**:
- Store notifications per user
- Real-time notification delivery (Supabase Realtime)
- Notification preferences storage
- CRUD operations

---

## Data Models & Types

### Current TypeScript Types
**File**: `types/index.ts`

Key interfaces:

```typescript
// Platforms
type Platform = "twitter" | "instagram" | "facebook" | "youtube" | "linkedin" | "tiktok" | "pinterest" | "reddit" | "blog";

// Content & Posts
interface ScheduledPost {
  id: string;
  date: Date;
  time: string;
  platform: Platform;
  content: string;
  status: "scheduled" | "published" | "draft" | "failed";
  attachments?: Attachment[];
  crossPostTo?: Platform[];
  isAiGenerated?: boolean;
  lastTriggered?: Date;
}

interface Attachment {
  name: string;
  size: number;
  type: string;
  url?: string;
}

// Templates
interface ContentTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  content: string;
  platforms: Platform[];
  hashtags?: string[];
  emoji?: string;
}

type TemplateCategory = "announcement" | "educational" | "promotional" | "engagement" | "behind-scenes" | "storytelling";

// Inbox
interface Message {
  id: string;
  platform: Platform;
  type: "comment" | "message" | "mention";
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  postReference?: string;
  replies?: number;
}

// Automation
interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  sourcePlatform: Platform;
  contentType: string;
  action: "transform-and-publish" | "transform-and-save" | "notify" | "auto-publish";
  targetPlatforms: Platform[];
  transformationInstructions?: string;
  keywords?: string[];
  createdAt: Date;
  lastTriggered?: Date;
  executionCount: number;
}

// Platform Connections
interface PlatformConnection {
  platform: Platform;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  followers?: number;
  engagement?: number;
  lastSync?: Date;
  status?: "active" | "error" | "expired";
}

// Analytics
interface AnalyticsMetrics {
  impressions: number;
  impressionsChange: number;
  engagement: number;
  engagementChange: number;
  followers: number;
  followersChange: number;
  posts: number;
  postsChange: number;
}

// Notifications
interface NotificationItem {
  id: string;
  type: "success" | "info" | "warning" | "error" | "platform";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  platform?: Platform;
  actionUrl?: string;
}
```

---

## Database Schema

### Recommended Supabase Tables

#### 1. **users** (Supabase Auth built-in)
```sql
-- Extended user profile
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **platform_connections**
```sql
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'facebook', 'youtube', 'linkedin', 'tiktok', 'pinterest', 'reddit', 'blog')),
  account_name TEXT,
  account_id TEXT,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  followers INTEGER,
  engagement_rate DECIMAL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'error', 'expired')),
  last_sync TIMESTAMPTZ,
  metadata JSONB, -- Platform-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

#### 3. **posts**
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ,
  published_time TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  attachments JSONB, -- Array of attachment objects
  cross_post_to TEXT[], -- Array of platform names
  is_ai_generated BOOLEAN DEFAULT FALSE,
  external_id TEXT, -- Post ID on the platform after publishing
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_status ON posts(user_id, status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_time) WHERE status = 'scheduled';
```

#### 4. **templates**
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  platforms TEXT[],
  hashtags TEXT[],
  emoji TEXT,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user ON templates(user_id);
```

#### 5. **inbox_messages**
```sql
CREATE TABLE inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('comment', 'message', 'mention')),
  external_id TEXT NOT NULL, -- ID from the platform
  author_name TEXT NOT NULL,
  author_id TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  post_reference TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  replied BOOLEAN DEFAULT FALSE,
  reply_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

CREATE INDEX idx_inbox_user_platform ON inbox_messages(user_id, platform);
CREATE INDEX idx_inbox_unread ON inbox_messages(user_id, is_read);
```

#### 6. **automation_rules**
```sql
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  source_platform TEXT NOT NULL,
  content_type TEXT,
  action TEXT NOT NULL CHECK (action IN ('transform-and-publish', 'transform-and-save', 'notify', 'auto-publish')),
  target_platforms TEXT[],
  transformation_instructions TEXT,
  keywords TEXT[],
  execution_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_user_enabled ON automation_rules(user_id, enabled);
```

#### 7. **automation_logs**
```sql
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_content_id TEXT,
  target_post_id UUID REFERENCES posts(id),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. **notifications**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error', 'platform')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  platform TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

#### 9. **analytics_snapshots**
```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  metrics JSONB, -- Platform-specific metrics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, date)
);

CREATE INDEX idx_analytics_user_platform_date ON analytics_snapshots(user_id, platform, date DESC);
```

#### 10. **media_library**
```sql
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok')),
  external_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  published_at TIMESTAMPTZ,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  duration TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processed', 'scheduled')),
  has_transcript BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

CREATE INDEX idx_media_user_platform ON media_library(user_id, platform);
```

---

## API Endpoints Required

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Platform Connections
- `GET /api/connections` - Get all platform connections for user
- `POST /api/connections/:platform/connect` - Initiate OAuth flow
- `GET /api/connections/:platform/callback` - OAuth callback handler
- `DELETE /api/connections/:platform` - Disconnect platform
- `POST /api/connections/:platform/refresh` - Refresh platform data
- `POST /api/connections/:platform/validate` - Validate connection health

### Posts & Content
- `GET /api/posts` - Get all posts (with filters: status, platform, date range)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post (draft or scheduled)
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post immediately
- `POST /api/posts/:id/schedule` - Schedule post for later
- `POST /api/posts/upload-media` - Upload media file to Supabase Storage

### Templates
- `GET /api/templates` - Get all templates (built-in + custom)
- `POST /api/templates` - Create custom template
- `PUT /api/templates/:id` - Update custom template
- `DELETE /api/templates/:id` - Delete custom template

### Inbox
- `GET /api/inbox` - Get all inbox messages (with filters)
- `PUT /api/inbox/:id/read` - Mark message as read
- `PUT /api/inbox/:id/unread` - Mark message as unread
- `POST /api/inbox/:id/reply` - Reply to message/comment
- `DELETE /api/inbox/:id` - Delete message
- `POST /api/inbox/sync` - Trigger sync from platforms

### Calendar
- `GET /api/calendar` - Get scheduled posts for calendar (date range)
- Reuses `/api/posts` endpoints for CRUD

### Analytics
- `GET /api/analytics/overview` - Get overview metrics (with filters: platform, date range)
- `GET /api/analytics/trends` - Get engagement trends data
- `GET /api/analytics/top-posts` - Get best performing posts
- `GET /api/analytics/:platform` - Get platform-specific analytics
- `POST /api/analytics/refresh` - Trigger analytics sync from platforms

### Media Library
- `GET /api/media` - Get all media items (YouTube, TikTok videos)
- `GET /api/media/:id` - Get single media item
- `POST /api/media/import` - Import video from platform
- `POST /api/media/:id/transform` - Transform video content to posts
- `POST /api/media/sync` - Sync videos from connected platforms

### Automation
- `GET /api/automation/rules` - Get all automation rules
- `POST /api/automation/rules` - Create automation rule
- `PUT /api/automation/rules/:id` - Update automation rule
- `DELETE /api/automation/rules/:id` - Delete automation rule
- `POST /api/automation/rules/:id/toggle` - Enable/disable rule
- `GET /api/automation/logs` - Get automation execution logs
- `POST /api/automation/execute/:ruleId` - Manually trigger rule

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/clear-all` - Clear all notifications

### AI Assistant
- `POST /api/ai/chat` - Send message to AI assistant
- `POST /api/ai/suggest-content` - Get content suggestions
- `POST /api/ai/optimize` - Optimize content for platform
- `POST /api/ai/transform` - Transform content between platforms

---

## Authentication & Authorization

### Supabase Auth Setup

1. **Enable Auth Providers**:
   - Email/Password (built-in)
   - OAuth providers (Google, GitHub, etc.) - optional

2. **Row Level Security (RLS)**:
   Enable RLS on all tables and create policies:

```sql
-- Example: posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

3. **Token Management**:
   - Store access tokens encrypted in `platform_connections` table
   - Use Supabase Vault for encryption keys
   - Implement token refresh logic

### Frontend Auth Flow

```typescript
// utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Usage in components
const { data: { user } } = await supabase.auth.getUser()
```

---

## Third-Party Integrations

### Platform APIs

Each platform requires OAuth integration and API implementation:

#### Twitter/X API
- **OAuth**: OAuth 2.0
- **Endpoints**: POST /tweets, GET /users/:id/tweets, GET /tweets/:id/replies
- **Rate Limits**: Consider tiered access
- **Docs**: https://developer.twitter.com/en/docs

#### Instagram API
- **OAuth**: Instagram Graph API via Facebook
- **Endpoints**: POST /media, GET /user/media, GET /comments
- **Note**: Requires Facebook App approval
- **Docs**: https://developers.facebook.com/docs/instagram-api

#### Facebook API
- **OAuth**: Facebook Login
- **Endpoints**: POST /me/feed, GET /me/posts, GET /comments
- **Docs**: https://developers.facebook.com/docs/graph-api

#### LinkedIn API
- **OAuth**: OAuth 2.0
- **Endpoints**: POST /ugcPosts, GET /me
- **Docs**: https://learn.microsoft.com/en-us/linkedin/

#### YouTube API
- **OAuth**: Google OAuth 2.0
- **Endpoints**: POST /videos, GET /channels, GET /comments
- **Docs**: https://developers.google.com/youtube/v3

#### TikTok API
- **OAuth**: TikTok Login Kit
- **Endpoints**: POST /share/video, GET /user/info
- **Note**: Limited API access, application required
- **Docs**: https://developers.tiktok.com/

#### Pinterest API
- **OAuth**: OAuth 2.0
- **Endpoints**: POST /pins, GET /boards
- **Docs**: https://developers.pinterest.com/

#### Reddit API
- **OAuth**: OAuth 2.0
- **Endpoints**: POST /api/submit, GET /user/{username}/submitted
- **Docs**: https://www.reddit.com/dev/api

---

## Inngest Background Jobs

### Use Cases for Inngest

1. **Scheduled Post Publishing**
   ```typescript
   // functions/publish-scheduled-posts.ts
   import { inngest } from "./client";

   export const publishScheduledPosts = inngest.createFunction(
     { id: "publish-scheduled-posts" },
     { cron: "*/5 * * * *" }, // Every 5 minutes
     async ({ event, step }) => {
       const posts = await step.run("fetch-due-posts", async () => {
         return await supabase
           .from("posts")
           .select("*")
           .eq("status", "scheduled")
           .lte("scheduled_time", new Date().toISOString());
       });

       for (const post of posts.data || []) {
         await step.run(`publish-post-${post.id}`, async () => {
           // Publish to platform API
           // Update post status
           // Send notification
         });
       }
     }
   );
   ```

2. **Platform Analytics Sync**
   ```typescript
   export const syncAnalytics = inngest.createFunction(
     { id: "sync-analytics" },
     { cron: "0 0 * * *" }, // Daily at midnight
     async ({ event, step }) => {
       // Fetch analytics from each connected platform
       // Store in analytics_snapshots table
     }
   );
   ```

3. **Inbox Message Polling**
   ```typescript
   export const pollInboxMessages = inngest.createFunction(
     { id: "poll-inbox-messages" },
     { cron: "*/15 * * * *" }, // Every 15 minutes
     async ({ event, step }) => {
       // Poll each platform for new messages/comments
       // Store in inbox_messages table
       // Create notifications for new items
     }
   );
   ```

4. **Automation Rule Execution**
   ```typescript
   export const executeAutomationRule = inngest.createFunction(
     { id: "execute-automation-rule" },
     { event: "automation/rule.triggered" },
     async ({ event, step }) => {
       const { ruleId, sourceContentId } = event.data;
       
       // Fetch rule
       // Apply transformations (AI if needed)
       // Create target posts
       // Log execution
     }
   );
   ```

5. **Token Refresh**
   ```typescript
   export const refreshPlatformTokens = inngest.createFunction(
     { id: "refresh-platform-tokens" },
     { cron: "0 */6 * * *" }, // Every 6 hours
     async ({ event, step }) => {
       // Check expiring tokens
       // Refresh using refresh_token
       // Update database
     }
   );
   ```

6. **Content Transformation**
   ```typescript
   export const transformContent = inngest.createFunction(
     { id: "transform-content" },
     { event: "content/transform.requested" },
     async ({ event, step }) => {
       // Use AI to transform content
       // Apply automation rules
       // Create draft posts
     }
   );
   ```

---

## Supabase Configuration

### 1. Storage Buckets

```sql
-- Create buckets for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('post-media', 'post-media', false),
  ('user-avatars', 'user-avatars', true);

-- Set up storage policies
CREATE POLICY "Users can upload own media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'post-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 2. Realtime Subscriptions

Enable realtime for notifications:

```typescript
// Subscribe to notifications
const notificationsSubscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Show toast notification
      toast.info(payload.new.title);
    }
  )
  .subscribe();
```

### 3. Edge Functions (if needed)

```bash
# Create edge function for webhook handlers
supabase functions new platform-webhook

# Deploy
supabase functions deploy platform-webhook
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ Set up Vercel project
2. ✅ Set up Supabase project
3. ✅ Configure environment variables
4. ✅ Implement Supabase Auth
5. ✅ Create database schema
6. ✅ Enable RLS policies
7. ✅ Set up Inngest project

### Phase 2: Core Features (Week 3-5)
1. **Platform Connections**
   - OAuth flows for each platform
   - Token storage and refresh logic
   - Connection health monitoring

2. **Content Management**
   - Post CRUD operations
   - Media upload to Supabase Storage
   - Draft and schedule functionality

3. **Publishing**
   - Platform API integrations
   - Inngest job for scheduled publishing
   - Cross-posting logic
   - Error handling and retry logic

### Phase 3: Inbox & Communication (Week 6-7)
1. **Inbox Sync**
   - Polling or webhook ingestion
   - Message/comment storage
   - Reply functionality

2. **Notifications**
   - Notification generation
   - Realtime updates
   - Notification preferences

### Phase 4: Analytics (Week 8-9)
1. **Analytics Sync**
   - Fetch metrics from platforms
   - Store snapshots
   - Calculate trends

2. **Dashboard**
   - Aggregate metrics
   - Time-series charts
   - Best performing content

### Phase 5: Advanced Features (Week 10-12)
1. **Media Library**
   - YouTube/TikTok video import
   - Metadata storage
   - Video transformation UI

2. **Automation**
   - Rule execution engine
   - Content transformation logic
   - Automation logs

3. **AI Integration**
   - OpenAI API integration
   - Context-aware responses
   - Content transformation

4. **Template System**
   - Migrate from localStorage to database
   - Template CRUD

### Phase 6: Polish & Optimization (Week 13-14)
1. Error handling and user feedback
2. Performance optimization
3. Rate limiting
4. Testing
5. Documentation

---

## Environment Variables

### Frontend (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Inngest
NEXT_PUBLIC_INNGEST_EVENT_KEY=your-event-key
```

### Backend (Vercel Environment Variables)

```bash
# Supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Inngest
INNGEST_SIGNING_KEY=your-signing-key
INNGEST_EVENT_KEY=your-event-key

# Platform APIs
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# AI
OPENAI_API_KEY=your-openai-key

# App
APP_URL=https://your-app.vercel.app
JWT_SECRET=your-jwt-secret
```

---

## Key Integration Points

### 1. Update Supabase Info File

**File**: `utils/supabase/info.tsx`

```typescript
export const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0];
export const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

### 2. Create Supabase Client Utility

**File**: `utils/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 3. Integrate API Calls in Components

Replace mock data with actual API calls:

```typescript
// Example: ContentComposer.tsx
import { supabase } from '../utils/supabase/client';

const handleSavePost = async (postData) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([{
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ...postData
    }]);
  
  if (error) {
    toast.error('Failed to save post');
  } else {
    toast.success('Post saved!');
  }
};
```

### 4. Add Loading and Empty States

The UI already has `LoadingState` and `EmptyState` components:

```typescript
import { LoadingState } from './components/LoadingState';
import { EmptyState } from './components/EmptyState';

// Use in data fetching
{loading && <LoadingState message="Loading posts..." />}
{!loading && posts.length === 0 && (
  <EmptyState
    icon={FileText}
    title="No posts yet"
    description="Create your first post to get started"
    actionLabel="Create Post"
    onAction={() => navigate('compose')}
  />
)}
```

---

## Additional Notes

### Current Limitations
- Template library uses localStorage (needs migration)
- All data is currently mock data
- No authentication implemented
- No actual platform integrations

### Testing Strategy
1. Unit tests for utility functions
2. Integration tests for API endpoints
3. E2E tests for critical user flows
4. Mock platform APIs during development

### Security Considerations
1. Never expose service role keys to frontend
2. Encrypt access tokens in database
3. Validate all user inputs
4. Implement rate limiting
5. Use RLS for all database access
6. Sanitize content before publishing

### Performance Optimization
1. Cache analytics data
2. Use Supabase Realtime sparingly
3. Implement pagination for large lists
4. Lazy load media content
5. Debounce search and filter inputs
6. Use Inngest for long-running operations

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Inngest Docs**: https://www.inngest.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Platform API Docs**: (see Third-Party Integrations section)

---

## Contact

For questions about this UI implementation, refer to the existing code documentation in:
- `/ARCHITECTURE.md`
- `/IMPLEMENTATION_SUMMARY.md`
- `/AI_CHAT_FEATURE.md`
- Component-specific files in `/components`

Good luck with the backend implementation! 🚀