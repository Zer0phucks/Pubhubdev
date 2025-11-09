# React Router - Quick Reference Guide

## Developer Quick Start

### Navigation Patterns

**Before (Old Pattern)**:
```typescript
// DON'T: This no longer works
setCurrentView('compose');
onNavigate('dashboard');
```

**After (New Pattern)**:
```typescript
// DO: Use React Router hooks
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/compose');
navigate('/dashboard');
```

### Reading Current Route

```typescript
import { useLocation } from 'react-router-dom';

const location = useLocation();
const currentPath = location.pathname; // e.g., '/compose'
```

### URL Parameters

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();

// Read platform param
const platform = searchParams.get('platform') || 'all';

// Set platform param
searchParams.set('platform', 'twitter');
setSearchParams(searchParams);

// Result: /compose?platform=twitter
```

### Accessing Outlet Context

```typescript
import { useOutletContext } from 'react-router-dom';

interface OutletContext {
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
}

const { selectedPlatform } = useOutletContext<OutletContext>();
```

### Creating New Routes

1. **Add route to `src/routes/index.tsx`**:
```typescript
{
  path: '/new-feature',
  lazy: async () => {
    const { NewFeatureRoute } = await import('../components/routes/NewFeatureRoute');
    return { Component: NewFeatureRoute };
  },
}
```

2. **Create route component in `src/components/routes/NewFeatureRoute.tsx`**:
```typescript
import { Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const NewFeature = lazy(() => import('../NewFeature').then(m => ({ default: m.NewFeature })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

export function NewFeatureRoute() {
  const { selectedPlatform } = useOutletContext<any>();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewFeature selectedPlatform={selectedPlatform} />
    </Suspense>
  );
}
```

3. **Add to sidebar in `src/components/ProtectedLayout.tsx`**:
```typescript
const menuItems = [
  // ... existing items
  { path: '/new-feature', label: 'New Feature', icon: YourIcon },
];
```

4. **Add keyboard shortcut (optional)**:
```typescript
// In ProtectedLayout.tsx keyboard shortcuts section
if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
  e.preventDefault();
  navigate('/new-feature');
}
```

### URL Structure Reference

| Route | Component | Auth Required | Platform Filter |
|-------|-----------|---------------|-----------------|
| `/` | Landing | No | No |
| `/auth` | AuthPage | No | No |
| `/dashboard` | Home | Yes | Yes |
| `/compose` | ContentComposer | Yes | Yes |
| `/inbox` | UnifiedInbox | Yes | Yes |
| `/calendar` | ContentCalendar | Yes | Yes |
| `/analytics` | Analytics | Yes | Yes |
| `/library` | MediaLibrary | Yes | Yes |
| `/notifications` | Notifications | Yes | No |
| `/ebooks` | EbookGenerator | Yes | No |
| `/trending` | Trending | Yes | Yes |
| `/competition` | CompetitionWatch | Yes | Yes |
| `/settings` | ProjectSettings | Yes | No |
| `/oauth/callback` | OAuthCallback | No | No |

### Common Tasks

#### Programmatic Navigation
```typescript
// Navigate to route
navigate('/compose');

// Navigate with params
navigate('/compose?platform=twitter');

// Navigate with state
navigate('/compose', { state: { from: 'dashboard' } });

// Go back
navigate(-1);

// Replace current entry
navigate('/dashboard', { replace: true });
```

#### Link Components
```typescript
import { Link, NavLink } from 'react-router-dom';

// Basic link
<Link to="/compose">Create Post</Link>

// NavLink with active state
<NavLink
  to="/dashboard"
  className={({ isActive }) => isActive ? 'active' : ''}
>
  Dashboard
</NavLink>
```

#### Conditional Rendering Based on Route
```typescript
import { useLocation } from 'react-router-dom';

function MyComponent() {
  const location = useLocation();
  const isComposePage = location.pathname === '/compose';

  return isComposePage ? <ComposerTools /> : null;
}
```

#### Redirect Users
```typescript
import { Navigate } from 'react-router-dom';

function ProtectedPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <PageContent />;
}
```

### Testing Routes

```typescript
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

test('renders dashboard', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App />
    </MemoryRouter>
  );
});
```

### Debugging Tips

**Check current route**:
```typescript
console.log('Current path:', location.pathname);
console.log('Search params:', Object.fromEntries(searchParams));
```

**Check if route is active**:
```typescript
const isActive = location.pathname === '/compose';
```

**Monitor navigation**:
```typescript
useEffect(() => {
  console.log('Navigated to:', location.pathname);
}, [location]);
```

### Common Pitfalls

❌ **DON'T**: Use old View state pattern
```typescript
const [currentView, setCurrentView] = useState('dashboard');
```

✅ **DO**: Use React Router navigation
```typescript
const navigate = useNavigate();
navigate('/dashboard');
```

❌ **DON'T**: Hardcode navigation callbacks
```typescript
<Button onClick={() => setCurrentView('compose')}>
```

✅ **DO**: Use navigate
```typescript
<Button onClick={() => navigate('/compose')}>
```

❌ **DON'T**: Forget to handle auth guard
```typescript
// Missing auth check - anyone can access
<Route path="/dashboard" element={<Dashboard />} />
```

✅ **DO**: Nest under ProtectedLayout
```typescript
// Auth guard automatically applied
{
  path: '/',
  element: <ProtectedLayout />,
  children: [
    { path: 'dashboard', element: <Dashboard /> }
  ]
}
```

### Migration Checklist

When updating existing components:

- [ ] Replace `setCurrentView()` with `navigate()`
- [ ] Replace `onNavigate` callbacks with `navigate()`
- [ ] Update links to use `<Link>` or `<NavLink>`
- [ ] Add route to `src/routes/index.tsx`
- [ ] Create route wrapper if needed
- [ ] Update sidebar if navigation item needed
- [ ] Add keyboard shortcut if appropriate
- [ ] Test direct URL access
- [ ] Test browser back/forward
- [ ] Test with authentication

### Resources

- React Router Docs: https://reactrouter.com
- Implementation Details: `claudedocs/react-router-implementation.md`
- Migration Summary: `claudedocs/routing-migration-summary.md`
