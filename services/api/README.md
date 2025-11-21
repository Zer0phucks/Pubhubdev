# PubHub API Service

Node.js API service for DigitalOcean App Platform. Replaces Supabase Edge Functions.

## Structure

```
services/api/
├── src/
│   ├── index.ts          # Main Hono server
│   ├── db/               # Database utilities
│   │   ├── client.ts     # PostgreSQL connection pool
│   │   └── kv-store.ts  # KV store wrapper
│   ├── storage/          # Storage utilities
│   │   └── spaces.ts    # DigitalOcean Spaces integration
│   └── middleware/       # Middleware
│       ├── auth.ts      # Clerk authentication
│       └── rate-limit.ts # Rate limiting
├── package.json
└── tsconfig.json
```

## Development

```bash
cd services/api
npm install
npm run dev  # Uses tsx watch
```

## Building

```bash
npm run build
```

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk secret key for token verification
- `SPACES_ACCESS_KEY` - DigitalOcean Spaces access key
- `SPACES_SECRET_KEY` - DigitalOcean Spaces secret key
- `SPACES_BUCKET` - Spaces bucket name
- `SPACES_REGION` - Spaces region (e.g., nyc3)
- `FRONTEND_URL` - Frontend URL for CORS
- `AZURE_OPENAI_*` - Azure OpenAI credentials
- `PORT` - Server port (default: 8080)

## Routes

- `GET /health` - Health check
- `POST /upload/profile-picture` - Upload user profile picture
- `POST /upload/project-logo/:projectId` - Upload project logo
- `POST /auth/initialize` - Initialize user profile
- `GET /auth/profile` - Get user profile
- `GET /posts` - List posts
- `POST /posts` - Create post
- `GET /posts/:id` - Get post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `GET /projects` - List projects
- `POST /projects` - Create project

More routes to be added...

## Migration from Supabase

This service replaces:
- Supabase Edge Functions (`make-server-19ccd85e`)
- Supabase Storage (replaced with DO Spaces)
- Supabase Auth (replaced with Clerk)
- Supabase PostgREST (replaced with direct Postgres queries)

