# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PubHub is a multi-platform social media management dashboard built with React, TypeScript, Vite, and Supabase. It provides content creation, scheduling, analytics, and cross-platform publishing capabilities for creators managing multiple social media accounts.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + SWC
- UI: Radix UI components + Tailwind CSS v4
- Backend: Supabase (Auth, Database, Edge Functions)
- Testing: Vitest (unit), Playwright (E2E)
- Monitoring: Sentry
- Deployment: Vercel

## Development Commands

### Essential Commands
```bash
# Development
npm run dev                    # Start dev server on port 3000

# Build
npm run build                  # Production build to ./build directory

# Testing
npm run test                   # Run Vitest unit tests (watch mode)
npm run test:run               # Run unit tests once
npm run test:ui                # Vitest UI interface
npm run test:coverage          # Generate coverage report
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Playwright UI mode
npm run test:e2e:headed        # Playwright headed mode
npm run test:all               # Run all tests (unit + E2E)
npm run test:oauth:smoke       # OAuth flow smoke test

# Supabase Local Development
supabase start                 # Start local Supabase (requires Docker)
supabase stop                  # Stop local Supabase
supabase db reset              # Reset local database
supabase functions serve       # Serve Edge Functions locally
supabase functions deploy      # Deploy Edge Functions

# Utility Scripts
node scripts/check-supabase.js           # Verify Supabase configuration
node scripts/test-oauth.js               # Test OAuth integrations
bash scripts/check-oauth-secrets.sh      # Verify OAuth secrets
```

## Architecture Overview

### Global State Management (App.tsx)
App.tsx manages all application-level state through useState hooks:
- **currentView**: Active page/section (View type)
- **selectedPlatform**: Currently selected social platform (Platform type)
- **theme**: Light/dark mode
- **aiChatOpen**: AI chat dialog visibility
- **commandPaletteOpen**: Command palette (ÁK) visibility
- **settingsPanelOpen**: Settings panel visibility

State flows downward via props and callbacks - no external state management library is used.

### Component Architecture

**Core Layout:**
- `App.tsx` - Main container, global state, keyboard shortcuts
- `AppHeader.tsx` - Dynamic title, breadcrumbs, platform selector, search, notifications, user menu
- `Sidebar` (shadcn/ui) - Navigation menu with 6 main items

**Feature Components (src/components/):**
- `DashboardOverview.tsx` - Analytics dashboard
- `ContentComposer.tsx` - Multi-platform post creation
- `UnifiedInbox.tsx` - Centralized message management
- `ContentCalendar.tsx` - Visual scheduling interface
- `PlatformConnections.tsx` - Social account management
- `AIChatDialog.tsx` - AI assistant (K)

**Utility Components:**
- `CommandPalette.tsx` - Quick navigation (ÁK)
- `EmptyState.tsx`, `LoadingState.tsx` - Reusable UI states
- `PlatformIcon.tsx` - Platform-specific icons with brand colors

### Authentication & OAuth Flow

**Auth Components:**
- `AuthContext.tsx` - Auth state provider with Supabase integration
- `AuthPage.tsx` - Sign-up/sign-in UI with email + OAuth providers (Google, Facebook, Twitter, LinkedIn)
- `OAuthCallback.tsx` - OAuth redirect handler at `/oauth/callback`

**OAuth Providers Configured:**
- Google (YouTube API)
- Facebook
- Twitter (X)
- LinkedIn
- WordPress (custom integration)
- Pinterest

OAuth redirect URL: `https://pubhub.dev/oauth/callback`

### Supabase Integration

**Client Setup:**
- Single shared client instance at `src/utils/supabase/client.ts`
- Prevents "Multiple GoTrueClient instances" warning
- Auto-refresh tokens, session persistence enabled

**Database:**
- Local development: Port 54322
- Migrations in `supabase/migrations/`
- KV store tables for state management

**Edge Functions:**
- Located in `supabase/functions/`
- Deploy with `supabase functions deploy <function-name>`
- Current function: `make-server-19ccd85e` (AI assistant backend)

**Configuration:**
- `supabase/config.toml` - Project configuration
- OAuth providers configured with env variables
- Redirect URLs: `https://pubhub.dev`, `https://*.vercel.app`

### Routing & Navigation

**URL Structure:**
App uses component-based routing via currentView state (not react-router):
- `/` - Landing page
- `/oauth/callback` - OAuth redirect handler
- Main app sections switched via View type

**Keyboard Shortcuts (Global):**
- `K` - Open AI chat assistant
- `ÁK` - Open command palette (quick navigation)
- `,` - Open settings
- `N` - New post (navigate to composer)
- `D` - Dashboard
- `I` - Inbox
- `C` - Calendar (when not in text input)

### Platform Support

**Supported Platforms:**
- Twitter/X
- Instagram
- LinkedIn
- Facebook
- YouTube
- TikTok
- Pinterest
- Reddit
- Blog/WordPress

Platform selection persists across Compose, Calendar, and Analytics views.

## Testing Strategy

### Unit Tests (Vitest)
- Setup file: `src/test/setup.ts`
- Config: `vitest.config.ts`
- Run: `npm run test`
- Coverage excludes: `src/test/`, `tests/e2e/`, `**/*.config.*`

### E2E Tests (Playwright)
- Test directories: `e2e/`, `tests/e2e/`
- Config: `playwright.config.ts`
- Base URL: `https://pubhub.dev` (override with `BASE_URL` env var)
- Browsers: Chromium, Firefox, WebKit
- CI: Retries enabled (2x), parallel disabled
- Reports: HTML, JUnit, JSON

### OAuth Testing
- Smoke test: `npm run test:oauth:smoke`
- Full test suite: `node scripts/test-oauth.js`
- Verify secrets: `bash scripts/check-oauth-secrets.sh`

## Build & Deployment

### Vite Build Configuration

**Build Output:**
- Target: `esnext`
- Output directory: `build/`
- Code splitting strategy:
  - `vendor`: React core
  - `ui`: Radix UI components
  - `charts`: Recharts
  - `supabase`: Supabase clients
  - `forms`: Form libraries
  - `utils`: Utility libraries
  - `icons`: Lucide React

**Dev Server:**
- Port: 3000
- Auto-open browser
- Path alias: `@/` í `./src/`

### Vercel Deployment
- Config: `vercel.json`
- Environment variables required:
  - Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - OAuth credentials for all providers
  - Sentry: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

### Sentry Integration
- Config: `src/sentry.ts`, `src/instrumentation.js`
- Source maps uploaded via `@sentry/vite-plugin`
- Automatic error tracking and performance monitoring

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- Path alias: `@/` maps to `src/`
- File extensions: `.ts`, `.tsx` for React components

### Component Patterns
- Functional components with hooks (no class components)
- Props passed down from App.tsx via callbacks
- State management: useState at component or App.tsx level
- No global state library (Redux, Zustand, etc.)

### Styling
- Tailwind CSS v4 with custom typography
- Mobile-first responsive design (`p-4` í `md:p-6` í `lg:p-8`)
- shadcn/ui components for consistent UI patterns
- Theme: Emerald/teal gradient brand colors

### Performance
- Code splitting via Vite manual chunks
- React.memo() for expensive components (when needed)
- useMemo() / useCallback() for optimization (when needed)

## Environment Variables

Required `.env` variables:
```bash
# Supabase
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=

# Sentry
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Azure OpenAI (for AI features)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=
```

Separate `.env.functions` for Supabase Edge Functions.

## Adding New Features

### Adding a New View
1. Add to View type in App.tsx
2. Create component in `src/components/`
3. Add menu item to sidebar menuItems array
4. Add case to renderContent() switch statement
5. Optional: Add keyboard shortcut
6. Optional: Add to CommandPalette pages array

### Adding a New Platform
1. Add to Platform type in App.tsx
2. Add icon to PlatformIcon component
3. Add to platforms array in App.tsx
4. Update platform-specific components (ContentComposer, etc.)
5. Configure OAuth if applicable (supabase/config.toml + secrets)

### Adding a New OAuth Provider
1. Configure provider in Supabase dashboard
2. Add credentials to `.env` and Supabase secrets
3. Update `supabase/config.toml` with provider config
4. Add sign-in method to AuthContext.tsx
5. Add button to AuthPage.tsx
6. Test with `npm run test:oauth:smoke`

## Common Issues & Solutions

### Supabase "Multiple GoTrueClient instances"
- Use `getSupabaseClient()` from `src/utils/supabase/client.ts`
- Never create new client instances with `createClient()`

### OAuth Redirect Errors
- Verify redirect URLs in provider settings match `https://pubhub.dev/oauth/callback`
- Check Supabase Auth settings allow additional redirect URLs
- Run `bash scripts/check-oauth-secrets.sh` to verify configuration

### Build Errors
- Clear `.vite` cache: `rm -rf node_modules/.vite`
- Reinstall dependencies: `npm install`
- Check TypeScript errors: Build will fail on type errors

### E2E Test Failures
- Ensure production site is accessible: `https://pubhub.dev`
- For local testing: Override `BASE_URL=http://localhost:3000`
- Check Playwright browsers installed: `npx playwright install`

## Project Structure Reference

```
src/
   components/          # All React components
      ui/             # shadcn/ui components
      calendar/       # Calendar-specific components
      figma/          # Figma design system components
      *.tsx           # Feature components
   pages/              # Page-level components
   utils/              # Utility functions
      supabase/       # Supabase client & config
      api.ts          # API helpers
      platformAPI.ts  # Platform integrations
      validation.ts   # Input validation
   types/              # TypeScript type definitions
   styles/             # Global styles
   test/               # Test setup and utilities
   App.tsx             # Main application container

supabase/
   config.toml         # Supabase project config
   functions/          # Edge Functions
   migrations/         # Database migrations

tests/
   e2e/               # Playwright E2E tests
   ...                # Other test files

scripts/               # Utility scripts
claudedocs/            # Project documentation
```

## Documentation

Extensive documentation in `claudedocs/`:
- `architecture/` - System architecture and integration guides
- `oauth-auth/` - OAuth setup and troubleshooting
- `features/` - Feature-specific documentation
- `deployment/` - Deployment guides and checklists
- `testing/` - Testing strategies and guides
- `troubleshooting/` - Common issues and fixes
