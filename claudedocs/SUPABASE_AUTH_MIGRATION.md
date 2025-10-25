# Supabase Authentication Migration

## Overview
PubHub has been successfully migrated from Clerk authentication to Supabase authentication. This change provides a more integrated authentication solution using Supabase's built-in auth system.

## Changes Made

### 1. Frontend - AuthContext (`/components/AuthContext.tsx`)
- **Removed**: All Clerk imports (`@clerk/clerk-react`)
- **Added**: Supabase client initialization using `createClient`
- **Updated**: Auth methods to use Supabase auth API:
  - `signin()` - Uses `supabase.auth.signInWithPassword()`
  - `signup()` - Uses `supabase.auth.signUp()` with user metadata for name
  - `signout()` - Uses `supabase.auth.signOut()`
  - `getToken()` - Gets access token from Supabase session
- **Added**: Auth state listener using `onAuthStateChange()`
- **Added**: Session check on mount to restore logged-in state
- **Added**: Profile initialization calls after signup/signin

### 2. Frontend - AuthPage (`/components/AuthPage.tsx`)
- **Removed**: All Clerk hooks (`useSignIn`, `useSignUp`)
- **Removed**: Email verification code flow (Supabase handles this differently)
- **Updated**: Uses `useAuth()` hook instead of Clerk hooks
- **Simplified**: Direct signin/signup calls without intermediate verification steps
- **Updated**: Error handling for Supabase-specific error messages

### 3. Frontend - App.tsx
- **Removed**: `ClerkProvider` wrapper
- **Removed**: `CLERK_PUBLISHABLE_KEY` constant
- **Simplified**: App now only uses `AuthProvider` and `ProjectProvider`

### 4. Frontend - API Utils (`/utils/api.ts`)
- **Removed**: Old auth API endpoints (signup, signin, signout, getSession)
- **Note**: Auth is now handled directly by Supabase client in AuthContext

### 5. Backend - Server (`/supabase/functions/server/index.tsx`)
- **Removed**: Clerk secret key and token verification
- **Updated**: `requireAuth` middleware to use Supabase token verification:
  - Uses `supabaseAdmin.auth.getUser(token)` instead of Clerk API
  - Extracts user ID from Supabase user object
- **Updated**: User initialization logic to use Supabase user metadata:
  - `user.email` instead of `user.email_addresses[0].email_address`
  - `user.user_metadata.name` instead of `user.first_name`

## Authentication Flow

### Sign Up
1. User enters email, password, and name in AuthPage
2. AuthContext calls `supabase.auth.signUp()` with user metadata
3. Supabase creates user account (email confirmation may be required based on Supabase settings)
4. On successful signup, session is created
5. AuthContext calls backend `/auth/profile` endpoint to auto-initialize user data
6. User is logged in and redirected to dashboard

### Sign In
1. User enters email and password in AuthPage
2. AuthContext calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials and returns session
4. AuthContext calls backend `/auth/profile` endpoint to ensure user is initialized
5. User is logged in and redirected to dashboard

### Session Persistence
- Supabase automatically persists session in localStorage
- On app load, AuthContext checks for existing session
- If valid session exists, user is automatically logged in

### Token Verification (Backend)
- Frontend sends Supabase access token in Authorization header
- Backend uses `supabaseAdmin.auth.getUser(token)` to verify token
- Valid tokens return user object with ID and metadata
- Invalid tokens return 401 Unauthorized

## Benefits

1. **Integrated Solution**: Single Supabase stack for database + auth
2. **No Third-Party Dependencies**: No need for Clerk SDK or API keys
3. **Simpler Architecture**: Fewer external services to manage
4. **Cost Effective**: Included with Supabase (no separate auth service costs)
5. **Better Integration**: Direct access to user data in Supabase database

## Configuration

### Frontend
- Uses `projectId` and `publicAnonKey` from `/utils/supabase/info.tsx`
- Supabase client created with: `https://{projectId}.supabase.co`

### Backend
- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables
- Service role key allows admin-level operations like token verification

## Email Confirmation

By default, Supabase may require email confirmation for new signups. You can configure this in your Supabase dashboard:

1. Go to Authentication → Settings
2. Toggle "Enable email confirmations" based on your needs
3. For development, you may want to disable this
4. For production, it's recommended to keep it enabled

## Migration Notes

- **No data migration needed**: User authentication is separate from user data storage
- **Existing users**: N/A (fresh install with Supabase auth)
- **Environment variables**: Removed `CLERK_SECRET_KEY`, now using `SUPABASE_SERVICE_ROLE_KEY`
- **Development warning removed**: No more Clerk development keys warning

## Testing Checklist

- [x] Sign up new user
- [x] Sign in existing user
- [x] Sign out
- [x] Session persistence (reload page)
- [x] Protected routes (backend endpoints)
- [x] User initialization on first login
- [x] Error handling (invalid credentials, duplicate email, etc.)
