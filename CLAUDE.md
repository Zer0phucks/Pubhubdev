# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# IMPORTANT RULE

There  is only one rule, and that is to make sure you submit your work to codex whenever  you complete atask, or if you get stuck or need help,but ESPECIALLY before ending a session.

## Project Overview

## Recent Session Summary

**Last Updated**: 2025-10-25 12:27:12

### Session Activities
<!-- Auto-updated by session-end hook -->

**Recent Changes**:
- Add Sentry integration and update package dependencies (78 minutes ago)
- Enhance OAuth handling in AuthCallback and AuthContext (2 hours ago)
- Add OAuth sign-in methods for Google, Facebook, and Twitter (4 hours ago)
- Update dependencies and change script permissions (4 hours ago)
- Update package.json and remove obsolete feature documentation (7 hours ago)

**Modified Files**:
- .mcp.json
- AGENTS.md
- CLAUDE.md
- OAUTH_CONFIGURATION_FIX.md
- build/assets/index-DPY1pKhD.js
- build/index.html
- next.config.js
- src/instrumentation.js
- src/utils/supabase/info.tsx


**Notes**:
- Check `TASKS.md` for remaining work items
- Review modified files before next session

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build
```

## Architecture Overview

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: Tailwind CSS with custom shadcn/ui components
- **State Management**: React Context API (AuthContext, ProjectContext)
- **Routing**: Client-side routing through App.tsx state management

### Backend Stack
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Edge Functions**: Hono framework running on Deno (src/supabase/functions/server/)
- **Storage**: Supabase Storage for file uploads
- **Data Store**: Key-value store pattern for flexible data management

### Key Architectural Patterns

#### 1. Multi-Project Architecture
Each user can have multiple projects, with platform connections scoped to individual projects. This prevents account conflicts and enables team collaboration.

```typescript
// Project hierarchy:
User -> Projects -> [Posts, Templates, Automations, Platform Connections]
```

#### 2. Platform Integration System
OAuth2 integrations with major social platforms:
- Twitter/X, Instagram, LinkedIn, Facebook
- YouTube, TikTok, Pinterest, Reddit
- Each platform connection is project-scoped with conflict detection

#### 3. Component Organization
- **UI Components**: src/components/ui/ - Reusable shadcn/ui components
- **Feature Components**: src/components/ - Business logic components
- **Platform Icons**: Dynamic platform icon system in PlatformIcon.tsx
- **Empty States**: Consistent empty state handling across views

#### 4. Authentication Flow
```
Landing Page -> AuthPage -> Supabase Auth -> Initialize User -> Project Dashboard
```
- OAuth callback handler at /oauth/callback
- Automatic user initialization on first login
- Session management through AuthContext

#### 5. API Structure
All API endpoints follow the pattern: `/make-server-19ccd85e/{resource}`

Key endpoints:
- `/auth/*` - Authentication and profile management
- `/projects/*` - Project CRUD operations
- `/posts/*` - Content management
- `/connections/*` - Platform connections
- `/oauth/*` - OAuth flow handlers
- `/ebooks/*` - AI-powered ebook generation

## Key Features & Implementation Details

### Content Management System
- **ContentComposer**: Multi-platform post creation with AI assistance
- **ContentCalendar**: Visual scheduling interface
- **MediaLibrary**: Asset management with remix capabilities
- **Templates**: Reusable content templates

### AI Integration
- **AI Assistant**: Context-aware content suggestions (Cmd+K)
- **Text Generation**: AI-powered content creation
- **Ebook Generator**: Complete ebook authoring with outline and chapter generation
- **Transform Video**: Content transformation across formats

### Real-time Features
- **UnifiedInbox**: Aggregated social media interactions
- **Analytics Dashboard**: Platform-specific and combined insights
- **Notifications**: Real-time updates system

### Platform-Specific Features
- **Dynamic Filtering**: Platform selection affects all views
- **Connection Status**: Visual indicators for platform connections
- **Trending Analysis**: Platform-specific trending content

## Environment Configuration

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- Platform OAuth credentials for each integration
- Azure OpenAI credentials for AI features

## Development Workflow

### State Management
The app uses a centralized state pattern in App.tsx with prop drilling for simplicity. Key state includes:
- `currentView` - Active navigation view
- `selectedPlatform` - Current platform filter
- `user` - Authenticated user context
- `currentProject` - Active project context

### Keyboard Shortcuts
- `Cmd/Ctrl + K` - Open AI chat
- `Cmd/Ctrl + Shift + K` - Command palette
- `Cmd/Ctrl + ,` - Settings panel
- `Cmd/Ctrl + N` - New post
- Additional shortcuts defined in App.tsx:143-187

### Component Communication
- Parent-child props for direct communication
- Context API for cross-component state (Auth, Project)
- Event handlers passed as props for upward communication

### Error Handling
- Toast notifications via Sonner
- Empty states for missing data
- Graceful OAuth failure handling with user feedback

## Code Conventions

### TypeScript Patterns
```typescript
// Consistent type definitions
type Platform = "twitter" | "instagram" | ...;
interface ProjectSettings { ... }

// Component props interfaces
interface ComponentProps {
  required: string;
  optional?: boolean;
  onAction: (param: Type) => void;
}
```

### Component Structure
```tsx
// Standard component pattern
export function ComponentName({ props }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();

  // Effects
  useEffect(() => {}, []);

  // Handlers
  const handleAction = () => {};

  // Render
  return <div>...</div>;
}
```

### API Integration Pattern
```typescript
// Consistent fetch pattern with auth
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

## Database Schema Patterns

The project uses a key-value store pattern with consistent naming:
- `user:{userId}:profile` - User profile data
- `project:{projectId}` - Project metadata
- `project:{projectId}:posts` - Project posts array
- `post:{postId}` - Individual post data
- `oauth:token:{platform}:{projectId}` - OAuth tokens

## Testing Approach

Currently no test files exist in the project. When adding tests:
- Place tests in a `tests/` directory
- Use `.test.ts` or `.spec.ts` extensions
- Focus on critical business logic and API integrations

## Deployment Considerations

- Frontend runs on port 3000 in development
- Build output goes to `build/` directory
- Supabase Edge Functions deployed separately
- Environment variables required for all integrations
