# PubHub

An AI-powered content repurposing platform that helps creators transform one piece of content into multiple platform-optimized versions automatically. Manage, schedule, and repurpose your content across 9 social media platforms from one unified dashboard.

![PubHub Dashboard](https://pubhub.dev)

## Features

### Core Functionality
- **AI-Powered Content Repurposing** - Transform one piece of content into multiple platform-optimized versions automatically
- **Multi-Platform Publishing** - Manage Twitter/X, Instagram, LinkedIn, Facebook, YouTube, TikTok, Pinterest, Reddit, and WordPress from one dashboard
- **Content Composer** - Create and schedule posts with rich text, media, and platform-specific optimizations
- **Content Calendar** - Visual scheduling interface with drag-and-drop functionality
- **Unified Inbox** - Centralized message management across all connected platforms
- **Performance Analytics** - Real-time performance metrics and insights for creators

### AI Features
- **Ask PubHub (AI Assistant)** - Built-in AI chat for content suggestions and strategy (⌘K)
- **Content Brainstorm** - Get AI-powered content ideas aligned with your niche and content type
- **Ebook Generator** - AI-powered ebook creation with outline generation and cover design
- **AI Text Generator** - Generate content with AI assistance
- **Content Transformation** - Remix and transform content across formats (Video → Blog, Video → Thread, etc.)

### Automation & Workflows
- **Automation Rules** - Set up workflows to automatically repurpose video content (e.g., TikTok → Blog Post)
- **Template Library** - Reusable content templates for consistent posting
- **Scheduled Publishing** - Schedule posts across multiple platforms

### User Experience
- **Multi-Project Support** - Organize content by projects/workspaces
- **Dark Mode** - Full dark/light theme support
- **Command Palette** - Quick navigation and actions (⌘K)
- **OAuth Integration** - Secure platform connections with Google, Facebook, Twitter, LinkedIn, and more
- **Responsive Design** - Optimized for desktop and mobile devices

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite + SWC for blazing fast builds
- React Router v7 for routing with lazy loading
- Tailwind CSS v4 for styling
- Radix UI for accessible components
- shadcn/ui component library
- Recharts for analytics visualization
- SWR for data fetching and caching

**Authentication:**
- Clerk for user authentication and session management

**Backend:**
- DigitalOcean App Platform for hosting
- Node.js + Hono for API service
- PostgreSQL database (DigitalOcean Managed Database) with Row Level Security (RLS)
- DigitalOcean Spaces for file storage
- Azure OpenAI for AI features

**Testing:**
- Vitest for unit tests
- Playwright for E2E tests
- Testing Library for component tests
- MSW (Mock Service Worker) for API mocking

**Monitoring & Analytics:**
- Sentry for error tracking and performance monitoring
- PostHog for product analytics (optional)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clerk account (for authentication)
- DigitalOcean account (for hosting)
- Azure OpenAI account (for AI features, optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pubhub.git
cd pubhub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration. See [Environment Variables](#environment-variables) section for complete list.

4. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see the app.

### Local API Development

For local API development:

1. Navigate to the API service directory:
```bash
cd services/api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see `.env.example`)

4. Start the API server:
```bash
npm run dev
```

The API will be available at `http://localhost:8080`

## Development Commands

```bash
# Development
npm run dev                    # Start dev server on port 3000

# Build
npm run build                  # Production build to ./build directory

# Testing
npm run test                   # Run unit tests (watch mode)
npm run test:run               # Run unit tests once
npm run test:ui                # Vitest UI interface
npm run test:coverage          # Generate coverage report
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Playwright UI mode
npm run test:e2e:headed        # Playwright headed mode
npm run test:all               # Run all tests (unit + E2E)
npm run test:oauth:smoke       # OAuth flow smoke test

# API Service Development
cd services/api && npm run dev  # Start API service locally

# Linting & Type Checking
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint errors
npm run type-check             # TypeScript type checking

# Utility Scripts
node scripts/test-oauth.js               # Test OAuth integrations
bash scripts/check-oauth-secrets.sh      # Verify OAuth secrets
bash scripts/apply-do-migrations.sh      # Apply database migrations to DigitalOcean
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (Radix UI primitives)
│   ├── calendar/       # Calendar-specific components
│   ├── routes/          # Route-level components
│   ├── AIChatDialog.tsx      # AI assistant chat interface
│   ├── ContentComposer.tsx   # Content creation interface
│   ├── ContentCalendar.tsx    # Calendar scheduling
│   ├── UnifiedInbox.tsx       # Message management
│   ├── Analytics.tsx           # Performance metrics
│   ├── MediaLibrary.tsx       # Media asset management
│   ├── ProjectSettings.tsx    # Project configuration
│   └── ...
├── routes/             # React Router configuration
│   └── index.tsx       # Route definitions with lazy loading
├── utils/              # Utility functions
│   ├── api.ts          # API client utilities
│   ├── personaAPI.ts   # Persona API calls
│   ├── contentAPI.ts   # Content API calls
│   ├── brandAPI.ts     # Brand API calls
│   └── swr-config.ts   # SWR configuration
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── styles/             # Global styles
├── test/               # Test setup and utilities
└── App.tsx             # Main application container

services/
├── api/                # API service (Node.js + Hono)
│   ├── src/
│   │   ├── index.ts    # Main API server
│   │   ├── routes/     # API route handlers
│   │   ├── db/         # Database client
│   │   ├── middleware/ # Auth, rate limiting
│   │   └── storage/    # DigitalOcean Spaces integration
│   └── package.json

scripts/
├── apply-do-migrations.sh  # Apply migrations to DigitalOcean PostgreSQL

tests/
├── e2e/               # Playwright E2E tests
└── accessibility/     # Accessibility tests

scripts/               # Utility scripts
claudedocs/            # Project documentation
```

## Environment Variables

### Required Variables

**Frontend (.env):**
```bash
# Clerk Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# API Service (Required)
VITE_API_BASE_URL=https://api.pubhub.dev
```

**Backend (services/api/.env):**
```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Clerk (Required)
CLERK_SECRET_KEY=your-clerk-secret-key

# DigitalOcean Spaces (Required)
SPACES_ACCESS_KEY=your-spaces-access-key
SPACES_SECRET_KEY=your-spaces-secret-key
SPACES_BUCKET=pubhub-uploads
SPACES_REGION=nyc3
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com

# Frontend URL (Required)
FRONTEND_URL=https://pubhub.dev
```

### Optional Variables

```bash
# Azure OpenAI (for AI features)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=

# OAuth Providers (for platform integrations)
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

# Sentry (for error tracking)
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
VITE_SENTRY_DSN=

# PostHog (for product analytics)
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=

# Azure OpenAI (for AI features)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=
AZURE_OPENAI_API_VERSION=

# OAuth Providers (for platform integrations)
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=
PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=
```

**Note:** Create a `.env` file in the root directory with these variables. For production, configure these in your hosting platform's environment variable settings.

## Testing

### Unit Tests

Run Vitest unit tests:
```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

### E2E Tests

Run Playwright E2E tests:
```bash
npm run test:e2e         # Headless
npm run test:e2e:headed  # With browser UI
npm run test:e2e:ui      # Interactive UI mode
```

### OAuth Testing

Test OAuth integrations:
```bash
npm run test:oauth:smoke           # Quick smoke test
node scripts/test-oauth.js         # Full OAuth test suite
bash scripts/check-oauth-secrets.sh # Verify secrets
```

## Deployment

### DigitalOcean App Platform (Recommended)

1. **Set up DigitalOcean App Platform:**
   - Create a new app in DigitalOcean App Platform
   - Connect your GitHub repository
   - Use the `do-app-spec.yaml` configuration file

2. **Configure Environment Variables:**
   - Add all required environment variables in the DigitalOcean dashboard
   - See `do-app-spec.yaml` for the complete list

3. **Set up DigitalOcean Spaces:**
   - Create a Spaces bucket named `pubhub-uploads`
   - Generate access keys and add to environment variables
   - Configure CORS for your frontend domain

4. **Apply Database Migrations:**
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   bash scripts/apply-do-migrations.sh
   ```

5. **Deploy:**
   - Push to the `main` branch to trigger automatic deployment
   - Or use DigitalOcean CLI:
   ```bash
   doctl apps create --spec do-app-spec.yaml
   ```

The `do-app-spec.yaml` configuration includes:
- Frontend static site component
- API service component
- Database component
- Ingress rules for routing
- Health checks
- Environment variables

### Manual Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Build the API service:
```bash
cd services/api
npm run build
```

3. Deploy both to your hosting provider

**Build Output:**
- Frontend: Optimized chunks with code splitting in `build/` directory
- API: Compiled TypeScript in `services/api/dist/` directory
- Asset optimization (images, fonts)
- Source maps for debugging (can be disabled for smaller bundles)
- Performance budgets enforced (600KB per chunk warning)

## Architecture

### State Management

PubHub uses a combination of state management approaches:
- **SWR** for server state (data fetching, caching, revalidation)
- **React Context** for global UI state (AuthContext, ProjectContext)
- **Local State** (useState) for component-level state
- **React Router** for navigation and route-based state

**Context Providers:**
- `AuthProvider` - Authentication state and user session
- `ProjectProvider` - Current project/workspace context
- `SWRConfig` - Global SWR configuration for data fetching

### Authentication

Authentication is primarily handled by **Clerk** with:
- Email/password authentication
- Social OAuth providers (Google, Facebook, Twitter, LinkedIn)
- Session management with automatic token refresh
- Protected routes via `ProtectedLayout` component
- Legacy Supabase Auth support for migration compatibility

**Auth Routes:**
- `/sign-in/*` - Clerk sign-in page
- `/sign-up/*` - Clerk sign-up page
- `/auth/callback` - Auth callback handler
- `/oauth/callback` - OAuth callback handler

### Routing

React Router v7 with:
- Lazy-loaded route components for code splitting
- Protected routes requiring authentication
- Route-based code splitting for optimal bundle sizes
- Client-side routing with browser history

**Main Routes:**
- `/` - Landing page
- `/dashboard` - Project overview
- `/compose` - Content composer
- `/inbox` - Unified inbox
- `/calendar` - Content calendar
- `/analytics` - Performance analytics
- `/library` - Media library
- `/trending` - Trending content
- `/settings` - Project settings
- `/brand` - Brand settings
- `/persona` - Persona settings

### Database

PostgreSQL database hosted on DigitalOcean with:
- Row Level Security (RLS) for data protection
- Vector search support (pgvector) for RAG functionality
- Database migrations in `scripts/apply-do-migrations.sh`
- Multi-project/workspace support
- Clerk user ID mapping via `users` table

### API Service

Node.js + Hono API service for:
- RESTful API endpoints (`/api/*`)
- Authentication middleware (Clerk)
- Rate limiting
- File uploads to DigitalOcean Spaces
- AI chat endpoints (`/ai/chat`)
- OAuth callback handling
- Persona generation and management
- Content ingestion and RAG queries
- Brand management

API service is located in `services/api/` and runs on DigitalOcean App Platform.

## Keyboard Shortcuts

### Global Shortcuts
- `⌘K` / `Ctrl+K` - Open command palette / Ask PubHub
- `K` - Open AI chat assistant
- `,` - Open settings panel
- `Esc` - Close dialogs/modals

### Navigation Shortcuts
- `N` - New post (navigate to composer)
- `D` - Dashboard
- `I` - Inbox
- `C` - Calendar (when not in text input)
- `A` - Analytics
- `L` - Library

**Note:** Navigation shortcuts are disabled when typing in text inputs.

## Documentation

Comprehensive documentation is available in `claudedocs/`:
- [Architecture Guide](claudedocs/architecture/)
- [OAuth Setup](claudedocs/oauth-auth/)
- [Feature Documentation](claudedocs/features/)
- [Deployment Guide](claudedocs/deployment/)
- [Testing Guide](claudedocs/testing/)
- [Troubleshooting](claudedocs/troubleshooting/)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features (unit tests with Vitest, E2E with Playwright)
- Update documentation as needed
- Ensure all tests pass before submitting PR (`npm run test:all`)
- Use TypeScript strict mode
- Follow accessibility best practices (test with `npm run test:accessibility`)
- Run linting and type checking (`npm run lint && npm run type-check`)

### Code Style

- Use TypeScript for all new code
- Prefer functional components with hooks
- Use SWR for data fetching
- Follow React Router v7 patterns for routing
- Use shadcn/ui components from `src/components/ui/`
- Maintain consistent naming conventions (see workspace rules)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support & Documentation

- **Project Documentation**: Comprehensive docs in [`claudedocs/`](claudedocs/)
  - [Architecture Guide](claudedocs/architecture/)
  - [OAuth Setup](claudedocs/oauth-auth/)
  - [Feature Documentation](claudedocs/features/)
  - [Deployment Guide](claudedocs/deployment/)
  - [Testing Guide](claudedocs/testing/)
  - [Troubleshooting](claudedocs/troubleshooting/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/pubhub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/pubhub/discussions)

## Performance

The application is optimized for performance:
- Code splitting by route and feature
- Lazy loading of components
- Optimized bundle sizes with performance budgets
- SWR caching for efficient data fetching
- Image and asset optimization
- Source maps for production debugging

## Acknowledgments

- Original design: [Creator Dashboard Design](https://www.figma.com/design/kPALXFlckKnp3360kKGaE4/Creator-Dashboard-Design)
- Built with [React](https://react.dev/), [Vite](https://vite.dev/), and [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
- UI components from [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)

---

Made with ❤️ for content creators
