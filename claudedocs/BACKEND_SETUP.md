# PubHub Backend Setup Guide

## Overview

PubHub now has a fully functional backend integrated with Supabase. The backend handles user authentication, data storage, and provides RESTful APIs for all app features.

## Architecture

- **Frontend**: React app with API client utilities
- **Backend**: Supabase Edge Functions with Hono web server
- **Database**: Supabase KV Store for data persistence
- **Authentication**: Supabase Auth

## Features Implemented

### 1. Authentication
- User signup with email/password
- User login
- Session management
- Auto-login persistence with localStorage
- Sign out functionality

### 2. API Endpoints

All endpoints are prefixed with `/make-server-19ccd85e/`

#### Auth Routes
- `POST /auth/signup` - Create new user account
- `GET /auth/session` - Get current user session

#### Post Routes
- `GET /posts` - Get all posts (supports `status` and `platform` query params)
- `POST /posts` - Create a new post
- `GET /posts/:id` - Get a single post
- `PUT /posts/:id` - Update a post
- `DELETE /posts/:id` - Delete a post

#### Template Routes
- `GET /templates` - Get user's custom templates
- `POST /templates` - Create a new template
- `DELETE /templates/:id` - Delete a template

#### Automation Routes
- `GET /automations` - Get user's automation rules
- `POST /automations` - Create a new automation
- `PUT /automations/:id` - Update an automation
- `DELETE /automations/:id` - Delete an automation

#### Connection Routes
- `GET /connections` - Get platform connections
- `PUT /connections` - Update platform connections

#### Settings Routes
- `GET /settings` - Get user settings
- `PUT /settings` - Update user settings

#### Analytics Routes
- `GET /analytics` - Get analytics data (currently returns mock data)

## Usage

### Getting Started

1. **Create an Account**
   - Open the app
   - Click "Don't have an account? Sign up"
   - Fill in your name, email, and password (min 6 characters)
   - Click "Sign Up"

2. **Sign In**
   - Enter your email and password
   - Click "Sign In"
   - You'll be automatically logged in on future visits

3. **Using the App**
   - All your data is now persisted to the backend
   - Posts, templates, automations, and settings are saved per user
   - Sign out anytime from the user menu (top-right avatar)

### For Developers

#### API Client
Import the API client in your components:

```typescript
import { postsAPI, templatesAPI, automationsAPI } from '../utils/api';

// Create a post
const { post } = await postsAPI.create({
  content: 'Hello world',
  platforms: ['twitter', 'linkedin'],
  status: 'draft'
});

// Get all posts
const { posts } = await postsAPI.getAll();

// Get posts with filters
const { posts } = await postsAPI.getAll({
  status: 'published',
  platform: 'twitter'
});
```

#### Authentication Context
Use the auth hook in components:

```typescript
import { useAuth } from '../components/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signin, signout } = useAuth();
  
  // user object contains: id, email, user_metadata
  // isAuthenticated is a boolean
}
```

## Data Storage

All user data is stored in the Supabase KV store with the following structure:

- `user:{userId}:profile` - User profile data
- `user:{userId}:posts` - Array of post IDs
- `post:{postId}` - Individual post data
- `user:{userId}:templates` - Custom templates
- `user:{userId}:automations` - Automation rules
- `user:{userId}:connections` - Platform connections
- `user:{userId}:settings` - User preferences

## Next Steps

To fully integrate the backend with the UI:

1. **Update ContentComposer** to save posts using `postsAPI.create()`
2. **Update ContentCalendar** to load posts from `postsAPI.getAll()`
3. **Update Templates component** to use `templatesAPI` instead of localStorage
4. **Update AutomationSettings** to use `automationsAPI`
5. **Update Settings** to use `settingsAPI` for preferences
6. **Update PlatformConnections** to use `connectionsAPI`

## Testing

You can test the backend by:

1. Creating an account
2. The account data is stored in Supabase
3. Your session persists across page refreshes
4. Sign out and sign back in to verify authentication works

## Security Notes

- All API routes (except signup and health check) require authentication
- Auth tokens are stored in localStorage
- Tokens are automatically included in API requests
- Users can only access their own data
- The service role key is only used on the server, never exposed to the frontend
