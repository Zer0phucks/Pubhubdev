# Authentication Token Best Practices

## Quick Reference: When to Use Which Token

### ✅ Use `access_token` (User Session Token)

**For:** All authenticated user actions

```typescript
// Get from useAuth hook
const { getToken } = useAuth();
const token = await getToken();

// Or get from Supabase directly
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Use in API calls
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Use Cases:**
- Creating/updating/deleting user content
- OAuth flows (connect/disconnect platforms)
- Uploading files
- User settings
- Project management
- Any route with `requireAuth` middleware

### ❌ NEVER Use `publicAnonKey` for These

**Wrong:**
```typescript
// ❌ DO NOT DO THIS
headers: {
  'Authorization': `Bearer ${publicAnonKey}`
}
```

The `publicAnonKey` is **NOT** an access token. It's for:
- Client-side Supabase SDK initialization
- Public/anonymous database access with RLS
- Unauthenticated operations only

## Common Patterns

### Pattern 1: Component with Auth API Calls

```typescript
import { useAuth } from './AuthContext';

export function MyComponent() {
  const { getToken } = useAuth();
  
  const makeApiCall = async () => {
    const token = await getToken();
    
    if (!token) {
      toast.error('Please sign in to continue');
      return;
    }
    
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };
}
```

### Pattern 2: Using API Utility Functions

```typescript
// In utils/api.ts
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  // Fail fast if no token
  if (!token) {
    throw new Error('Not authenticated. Please sign in first.');
  }
  
  // Use token, never fall back to publicAnonKey
  headers['Authorization'] = `Bearer ${token}`;
}

// In component
import { postsAPI } from '../utils/api';

const posts = await postsAPI.getAll(); // Token handled automatically
```

### Pattern 3: Fresh Token for Sensitive Operations

```typescript
import { createClient } from '@supabase/supabase-js';

// For OAuth callbacks or other sensitive operations
const { data: { session } } = await supabase.auth.getSession();

if (!session?.access_token) {
  throw new Error('Not authenticated');
}

// Use fresh token
await fetch(API_URL, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

## Error Handling

### ✅ Good Error Handling

```typescript
try {
  const token = await getToken();
  
  if (!token) {
    toast.error('Please sign in to continue');
    return;
  }
  
  const response = await fetch(API_URL, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 401) {
      toast.error('Session expired. Please sign in again.');
      // Optionally redirect to login
    } else {
      toast.error(error.message || 'Request failed');
    }
    return;
  }
  
  const data = await response.json();
  // Process data
  
} catch (error) {
  console.error('API call failed:', error);
  toast.error(error.message || 'Something went wrong');
}
```

### ❌ Bad Error Handling

```typescript
// ❌ Silent fallback to invalid token
const token = await getToken() || publicAnonKey;

// ❌ No error handling
const response = await fetch(API_URL, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ❌ Generic error message
catch (error) {
  toast.error('Error');
}
```

## Backend Validation

### Server-Side Token Validation

```typescript
// In Supabase Edge Function
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Unauthorized - No authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Validate with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    console.error('Auth validation failed:', error?.message);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
  
  // Set user context for route handlers
  c.set('userId', user.id);
  c.set('user', user);
  
  await next();
}
```

## Token Storage

### ✅ Correct Storage

```typescript
// In AuthContext.tsx
export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('pubhub_auth_token', token);
  } else {
    localStorage.removeItem('pubhub_auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('pubhub_auth_token');
  }
  return authToken;
}
```

### ❌ Incorrect Storage

```typescript
// ❌ Don't store publicAnonKey as auth token
setAuthToken(publicAnonKey);

// ❌ Don't mix up token types
const token = publicAnonKey || access_token;
```

## Common Mistakes to Avoid

### 1. Using Wrong Token Type

```typescript
// ❌ WRONG
const response = await fetch(API_URL, {
  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
});

// ✅ CORRECT
const token = await getToken();
const response = await fetch(API_URL, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Not Checking Token Exists

```typescript
// ❌ WRONG - Could send 'undefined'
const token = getAuthToken();
headers: { 'Authorization': `Bearer ${token}` }

// ✅ CORRECT - Verify token exists
const token = await getToken();
if (!token) {
  throw new Error('Not authenticated');
}
headers: { 'Authorization': `Bearer ${token}` }
```

### 3. Stale Token in Long-Running Operations

```typescript
// ❌ WRONG - Token might expire during process
const token = await getToken();
for (const item of items) {
  await processItem(item, token); // Token could expire
}

// ✅ CORRECT - Get fresh token for each critical operation
for (const item of items) {
  const token = await getToken(); // Fresh token
  await processItem(item, token);
}
```

### 4. Silent Fallbacks

```typescript
// ❌ WRONG - Hides authentication issues
const token = getAuthToken() || publicAnonKey || '';

// ✅ CORRECT - Fail explicitly
const token = getAuthToken();
if (!token) {
  throw new Error('Not authenticated');
}
```

## Testing Authentication

### Manual Testing Checklist

- [ ] Sign in successfully stores token
- [ ] Token persists across page refreshes
- [ ] API calls use correct token
- [ ] Expired token shows clear error
- [ ] Sign out clears token
- [ ] Unauthenticated API calls fail appropriately

### Test Cases

```typescript
// Test 1: Authenticated API call
test('API call with valid token succeeds', async () => {
  // Sign in
  await signin('test@example.com', 'password');
  
  // Make API call
  const result = await postsAPI.getAll();
  
  expect(result).toBeDefined();
});

// Test 2: Unauthenticated API call
test('API call without token fails', async () => {
  // Sign out
  await signout();
  
  // Make API call
  await expect(postsAPI.getAll()).rejects.toThrow('Not authenticated');
});

// Test 3: Expired token
test('API call with expired token fails', async () => {
  // Set expired token
  setAuthToken('expired-token');
  
  // Make API call
  const response = await fetch(API_URL, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });
  
  expect(response.status).toBe(401);
});
```

## Debugging Token Issues

### Check Token in Browser

```javascript
// In browser console
localStorage.getItem('pubhub_auth_token')
```

### Check Token on Server

```typescript
// In Edge Function
console.log('Received token:', token);
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
console.log('Token validation result:', { user: user?.id, error: error?.message });
```

### Common Debug Scenarios

**Scenario:** "Unauthorized - Invalid token"
```typescript
// Check these:
1. Is user signed in? → Check localStorage for token
2. Is token valid? → Try signing out and in again
3. Is correct token sent? → Check network tab in DevTools
4. Is server validating correctly? → Check server logs
```

**Scenario:** OAuth flow fails
```typescript
// Verify:
1. Fresh token obtained before OAuth call
2. Not using publicAnonKey
3. Token not expired during redirect
4. Callback gets new session from Supabase
```

## Quick Checklist for New Features

When adding a new authenticated feature:

- [ ] Import `useAuth` hook if in component
- [ ] Call `getToken()` before API call
- [ ] Check token exists (not null/undefined)
- [ ] Use token in Authorization header
- [ ] Handle 401 errors appropriately
- [ ] Show clear error messages
- [ ] Never fall back to `publicAnonKey`
- [ ] Test with fresh session
- [ ] Test with expired session
- [ ] Document token requirements

## Summary

| Token Type | Purpose | Use For | Don't Use For |
|------------|---------|---------|---------------|
| `access_token` | User authentication | API calls, OAuth, user actions | Client initialization |
| `publicAnonKey` | SDK initialization | Supabase client setup | API authorization headers |

**Remember:** When in doubt, use `access_token` from `getToken()` for all API calls!

---

**Last Updated:** October 2024  
**Related Docs:** AUTH_ERROR_FIXES.md, OAUTH_ERROR_FIXES.md
