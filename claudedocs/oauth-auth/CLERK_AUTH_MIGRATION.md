# Clerk Auth Migration Guide

## Overview
PubHub has been successfully migrated from Supabase Auth to Clerk Auth. This provides a more robust authentication solution with better developer experience and more features out of the box.

## What Changed

### Frontend Changes

#### 1. **Authentication Provider**
- **Before**: Custom `AuthProvider` using Supabase Auth SDK
- **After**: `ClerkProvider` wrapping the app with custom `AuthProvider` for compatibility

#### 2. **Auth Components**
- **Before**: Custom sign-in/sign-up forms
- **After**: Clerk's pre-built `<SignIn />` and `<SignUp />` components with custom styling

#### 3. **Auth Context**
- Updated to use Clerk hooks (`useUser`, `useAuth` from `@clerk/clerk-react`)
- Maintained same interface for backward compatibility
- Added `getToken()` method for getting JWT tokens

#### 4. **Token Management**
- Tokens are now automatically managed by Clerk
- Auth token is automatically updated when user changes
- Stored in localStorage and synced with Clerk session

### Backend Changes

#### 1. **Token Verification**
- **Before**: Supabase Admin SDK `getUser(token)`
- **After**: Clerk API token verification

#### 2. **Auth Middleware**
- Updated `requireAuth` middleware to verify Clerk JWT tokens
- Uses Clerk's token verification API
- Extracts user ID from Clerk token (`sub` claim)

#### 3. **User Initialization**
- New `/auth/initialize` endpoint for first-time user setup
- Auto-initialization in `/auth/profile` endpoint
- Creates default project and user profile automatically

#### 4. **Removed Routes**
- `/auth/signup` - Handled by Clerk UI
- `/auth/signin` - Handled by Clerk UI  
- `/auth/signout` - Handled by Clerk client
- `/auth/session` - Replaced with `/auth/profile`

## Configuration

### Environment Variables

**Frontend** (in App.tsx):
```typescript
const CLERK_PUBLISHABLE_KEY = "pk_test_ZnJhbmstZ2xvd3dvcm0tMTEuY2xlcmsuYWNjb3VudHMuZGV2JA";
```

**Backend** (in Deno environment):
```bash
CLERK_SECRET_KEY=sk_test_kJsJOFrack57i85mGjfALIZIcnGupVwT4ducrFSnZXHere
```

### Clerk Dashboard Setup

1. **Create Clerk Application**
   - Go to https://clerk.com
   - Create a new application
   - Copy the Publishable Key and Secret Key

2. **Configure Application**
   - Enable Email/Password authentication
   - Optionally enable Social Logins (Google, GitHub, etc.)
   - Configure session settings
   - Set up webhooks if needed

3. **Customize Appearance**
   - Use Clerk Dashboard to match your brand
   - Or use appearance prop in components (already configured)

## Component Updates

### App.tsx
```typescript
import { ClerkProvider } from "@clerk/clerk-react";

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthProvider>
        <ProjectProvider>
          <AppContent />
        </ProjectProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}
```

### AuthContext.tsx
```typescript
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken: clerkGetToken } = useClerkAuth();
  
  // Map Clerk user to app User interface
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    user_metadata: {
      name: clerkUser.fullName || clerkUser.firstName || undefined,
    },
  } : null;
  
  // ... rest of implementation
}
```

### AuthPage.tsx
```typescript
import { SignIn, SignUp } from "@clerk/clerk-react";

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  
  return (
    <div>
      {isSignUp ? (
        <SignUp appearance={customAppearance} />
      ) : (
        <SignIn appearance={customAppearance} />
      )}
    </div>
  );
}
```

## Migration Benefits

### Developer Experience
- ✅ Pre-built, customizable UI components
- ✅ Automatic session management
- ✅ Built-in social login support
- ✅ Better error handling
- ✅ Comprehensive documentation

### Security
- ✅ Industry-standard JWT tokens
- ✅ Automatic token rotation
- ✅ Built-in rate limiting
- ✅ Session management
- ✅ Secure token storage

### Features
- ✅ Multi-factor authentication support
- ✅ Social logins (Google, GitHub, etc.)
- ✅ Magic links
- ✅ Organization support (for future team features)
- ✅ User management dashboard
- ✅ Webhooks for user events

## User Experience

### Sign Up Flow
1. User clicks "Sign Up"
2. Clerk's SignUp component appears
3. User enters email/password
4. Email verification (optional)
5. User is automatically signed in
6. Backend auto-initializes user profile and default project

### Sign In Flow
1. User clicks "Sign In"
2. Clerk's SignIn component appears
3. User enters credentials
4. Clerk validates and creates session
5. User is redirected to dashboard
6. Backend verifies token on API calls

### Session Management
- Sessions persist across browser tabs
- Automatic token refresh
- Graceful handling of expired sessions
- Easy sign-out from any page

## API Integration

### Making Authenticated Requests

**Frontend**:
```typescript
const { getToken } = useAuth();

const response = await fetch(`${API_URL}/endpoint`, {
  headers: {
    'Authorization': `Bearer ${await getToken()}`,
  },
});
```

**Backend**:
```typescript
app.get("/protected-route", requireAuth, async (c) => {
  const userId = c.get('userId'); // From Clerk token
  const user = c.get('user');     // Full Clerk user object
  
  // Your logic here
});
```

## Backwards Compatibility

The migration maintains backward compatibility:
- Same `useAuth()` hook interface
- Same user object structure
- Same loading states
- Same `isAuthenticated` flag
- Compatible with existing components

## Testing

### Test User Creation
1. Go to auth page
2. Click "Sign Up"
3. Enter email and password
4. Verify account creation
5. Check backend logs for initialization

### Test Sign In
1. Go to auth page
2. Click "Sign In"  
3. Enter credentials
4. Verify redirect to dashboard
5. Check project initialization

### Test Protected Routes
1. Sign in
2. Navigate to different pages
3. Verify data loads correctly
4. Check console for auth errors
5. Test sign out

## Troubleshooting

### Common Issues

**Issue**: "Invalid token" errors
- **Solution**: Check CLERK_SECRET_KEY is set correctly in backend environment

**Issue**: User profile not initializing
- **Solution**: Check backend logs, ensure `/auth/profile` endpoint is being called

**Issue**: Clerk UI not appearing
- **Solution**: Verify CLERK_PUBLISHABLE_KEY is correct and Clerk is properly imported

**Issue**: CORS errors
- **Solution**: Ensure CORS headers include Authorization header

**Issue**: Token expired
- **Solution**: Clerk automatically refreshes tokens, check network tab for refresh requests

### Debug Mode

Enable debug logging:
```typescript
// In ClerkProvider
<ClerkProvider 
  publishableKey={CLERK_PUBLISHABLE_KEY}
  appearance={customAppearance}
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  afterSignInUrl="/dashboard"
  afterSignUpUrl="/dashboard"
>
```

## Next Steps

### Recommended Enhancements

1. **Social Logins**
   - Enable Google, GitHub, Twitter in Clerk Dashboard
   - Update appearance to style social buttons
   - Add social login buttons to SignIn component

2. **Email Verification**
   - Enable in Clerk Dashboard
   - Configure email templates
   - Add verification status checks

3. **Multi-Factor Authentication**
   - Enable in Clerk Dashboard
   - Add MFA settings to user profile
   - Implement backup codes

4. **Organizations** (Future)
   - Enable for team collaboration
   - Map to project multi-user support
   - Add organization switching

5. **Webhooks**
   - Set up Clerk webhooks for user events
   - Sync user data to backend
   - Track user lifecycle events

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React SDK](https://clerk.com/docs/references/react/overview)
- [Clerk API Reference](https://clerk.com/docs/reference/backend-api)
- [JWT Token Verification](https://clerk.com/docs/backend-requests/handling/manual-jwt)

## Support

For issues or questions:
1. Check Clerk documentation
2. Review backend logs for errors
3. Check browser console for client errors
4. Verify environment variables are set correctly
5. Test with Clerk's test mode first
