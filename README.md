# PubHub

A multi-platform social media management dashboard for content creators to manage, schedule, and analyze their social media presence across multiple platforms.

![PubHub Dashboard](https://pubhub.dev)

## Features

- **Multi-Platform Publishing** - Manage Twitter/X, Instagram, LinkedIn, Facebook, YouTube, TikTok, Pinterest, Reddit, and WordPress from one dashboard
- **Content Composer** - Create and schedule posts with rich text, media, and platform-specific optimizations
- **Unified Inbox** - Centralized message management across all connected platforms
- **Content Calendar** - Visual scheduling interface with drag-and-drop functionality
- **Analytics Dashboard** - Real-time performance metrics and insights
- **AI Assistant** - Built-in AI chat for content suggestions and strategy (⌘K)
- **OAuth Integration** - Secure platform connections with Google, Facebook, Twitter, LinkedIn, and more
- **Dark Mode** - Full dark/light theme support

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite + SWC for blazing fast builds
- Tailwind CSS v4 for styling
- Radix UI for accessible components
- Recharts for analytics visualization

**Backend:**
- Supabase (Authentication, Database, Edge Functions)
- PostgreSQL database
- Row Level Security (RLS) for data protection

**Testing:**
- Vitest for unit tests
- Playwright for E2E tests
- Testing Library for component tests

**Monitoring:**
- Sentry for error tracking
- Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker (for local Supabase development)
- Supabase account (for production)

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

Edit `.env` and add your configuration:
```bash
# Supabase
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (optional)
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
# ... other OAuth credentials
```

4. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

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

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── calendar/       # Calendar-specific components
│   ├── DashboardOverview.tsx
│   ├── ContentComposer.tsx
│   ├── UnifiedInbox.tsx
│   └── ...
├── pages/              # Page-level components
├── utils/              # Utility functions
│   └── supabase/       # Supabase client & config
├── types/              # TypeScript type definitions
├── styles/             # Global styles
├── test/               # Test setup and utilities
└── App.tsx             # Main application container

supabase/
├── config.toml         # Supabase project config
├── functions/          # Edge Functions
└── migrations/         # Database migrations

tests/
└── e2e/               # Playwright E2E tests

scripts/               # Utility scripts
claudedocs/            # Project documentation
```

## Environment Variables

Required environment variables for full functionality:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (Optional - for platform integrations)
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

# Azure OpenAI (Optional - for AI features)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=

# Sentry (Optional - for error tracking)
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

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

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy:
```bash
vercel --prod
```

### Manual Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `build/` directory to your hosting provider

## Architecture

### State Management

PubHub uses React's built-in state management (useState hooks) managed at the App.tsx level. No external state management library is required.

**Global State (App.tsx):**
- `currentView` - Active page/section
- `selectedPlatform` - Currently selected social platform
- `theme` - Light/dark mode
- `aiChatOpen` - AI chat dialog visibility
- `commandPaletteOpen` - Command palette visibility
- `settingsPanelOpen` - Settings panel visibility

### Authentication

Authentication is handled by Supabase Auth with support for:
- Email/password authentication
- OAuth providers (Google, Facebook, Twitter, LinkedIn)
- Session management with automatic token refresh
- Protected routes with AuthContext

OAuth redirect URL: `https://pubhub.dev/oauth/callback`

### Database

PostgreSQL database hosted on Supabase with:
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates
- Migrations in `supabase/migrations/`

## Keyboard Shortcuts

- `⌘K` (Mac) / `Ctrl+K` (Windows) - Open command palette
- `K` - Open AI chat assistant
- `,` - Open settings
- `N` - New post (navigate to composer)
- `D` - Dashboard
- `I` - Inbox
- `C` - Calendar (when not in text input)

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
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Use TypeScript strict mode

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- Documentation: [claudedocs/](claudedocs/)
- Issues: [GitHub Issues](https://github.com/yourusername/pubhub/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/pubhub/discussions)

## Acknowledgments

- Original design: [Creator Dashboard Design](https://www.figma.com/design/kPALXFlckKnp3360kKGaE4/Creator-Dashboard-Design)
- Built with [React](https://react.dev/), [Vite](https://vite.dev/), and [Supabase](https://supabase.com/)
- UI components from [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)

---

Made with ❤️ for content creators
