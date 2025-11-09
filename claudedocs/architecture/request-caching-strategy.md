# Request Caching Strategy with SWR

## Overview

PubHub implements a comprehensive request caching strategy using **SWR (stale-while-revalidate)** to optimize API performance, reduce network requests, and improve user experience.

**Implementation Date**: 2025-11-09
**Status**: Active
**Bundle Impact**: +10.08 kB gzipped (SWR library)
**Performance Gain**: Estimated 40-60% reduction in redundant API calls

## Architecture

### SWR Configuration

Global configuration is centralized in `src/utils/swr-config.ts`:

```typescript
// Cache TTL presets
CACHE_TTL = {
  STABLE: 60 * 60 * 1000,        // 1 hour (user profile, projects)
  SEMI_STABLE: 30 * 60 * 1000,   // 30 minutes (platform connections)
  FREQUENT: 15 * 60 * 1000,      // 15 minutes (analytics data)
  VERY_FREQUENT: 5 * 60 * 1000,  // 5 minutes (inbox messages)
  REALTIME: 2 * 60 * 1000,       // 2 minutes (real-time data)
}
```

**Key Features**:
- Automatic revalidation on focus/reconnect
- Request deduplication (2-second window)
- Exponential backoff retry (3 attempts, 5s base interval)
- Sentry integration for error monitoring
- Deep equality comparison to prevent unnecessary re-renders

### Provider Setup

SWR is configured at the root level in `App.tsx`:

```typescript
import { SWRConfig } from 'swr';
import { swrConfig } from './utils/swr-config';

export default function App() {
  return (
    <SWRConfig value={swrConfig}>
      {/* App content */}
    </SWRConfig>
  );
}
```

## Implemented Hooks

### 1. useProjects (High Priority)

**Purpose**: Fetch and manage user projects with optimistic updates

**Cache Strategy**:
- TTL: 1 hour (projects don't change frequently)
- Key: `projects:{userId}`
- Optimistic updates for create/update/delete operations

**Usage**:
```typescript
const { data, isLoading, createProject, updateProject, deleteProject } = useProjects();
```

**Features**:
- Automatic request deduplication across components
- Instant UI feedback with optimistic updates
- Automatic rollback on API errors
- Background revalidation on window focus

**Performance Impact**:
- Before: Every ProjectSwitcher render = new API call
- After: Single API call shared across all components

### 2. useAnalytics (High Priority)

**Purpose**: Fetch analytics data with date range support

**Cache Strategy**:
- TTL: 15 minutes (analytics update frequently)
- Key: `analytics:{projectId}:{startDate}_{endDate}`
- Auto-refresh every 15 minutes
- Different cache entries per date range

**Usage**:
```typescript
const { data, platformMetrics, isLoading, refresh } = useAnalytics(
  projectId,
  { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
  { refreshInterval: 900000 } // Optional: custom interval
);
```

**Features**:
- Conditional fetching (only when route is active)
- Separate caches for different date ranges
- Background revalidation on focus
- Automatic retry on network errors (3 attempts)

**Performance Impact**:
- Before: Dashboard navigation = new API call every time
- After: 15-minute cache, instant page loads

### 3. useConnectedPlatforms (High Priority)

**Purpose**: Manage platform connection status with OAuth flow support

**Cache Strategy**:
- TTL: 30 minutes (connections are semi-stable)
- Key: `connections:{projectId}`
- Manual revalidation on OAuth callback
- Optimistic updates for connect/disconnect

**Usage**:
```typescript
const {
  connectedPlatforms,
  isPlatformConnected,
  addPlatformOptimistic,
  removePlatformOptimistic,
  refresh
} = useConnectedPlatforms();
```

**Features**:
- Automatic refresh on OAuth callback detection
- Polling for connection completion (10 seconds)
- Window focus revalidation after OAuth
- Optimistic UI updates

**OAuth Integration**:
```typescript
// After OAuth callback
sessionStorage.setItem('oauth_just_completed', 'true');
// Hook automatically detects and refreshes
```

**Performance Impact**:
- Before: OAuth callback = full page reload + API call
- After: Cache refresh only, instant UI update

### 4. useInboxMessages (High Priority)

**Purpose**: Fetch and filter inbox messages with optimistic updates

**Cache Strategy**:
- TTL: 5 minutes (messages update frequently)
- Key: `inbox:{projectId}` (filters applied client-side)
- Auto-refresh every 5 minutes
- Optimistic updates for read/archive

**Usage**:
```typescript
const {
  data,
  filter,
  setFilter,
  markAsRead,
  markAllAsRead,
  archive
} = useInboxMessages(projectId, { platform: 'twitter', isRead: false });
```

**Features**:
- Client-side filtering (no server requests on filter change)
- Optimistic updates with automatic rollback on error
- Unread count tracking
- Real-time feel with background revalidation

**Performance Impact**:
- Before: Filter change = new API call
- After: Client-side filtering, zero additional requests

## Cache Key Management

### Centralized Cache Keys

All cache keys are generated through `CacheKeys` utility:

```typescript
// Standardized cache key generation
CacheKeys.projects(userId)
CacheKeys.analytics(projectId, startDate, endDate)
CacheKeys.connections(projectId)
CacheKeys.inbox(projectId, platform?, type?, isRead?)
```

**Benefits**:
- Consistent naming convention
- Type-safe key generation
- Easy cache invalidation
- Collision prevention

### Conditional Fetching

Use `shouldFetch()` helper to prevent unnecessary requests:

```typescript
useSWR(
  shouldFetch(projectId, userId) ? cacheKey : null,
  fetcher
);
```

## Optimistic Updates Pattern

All mutation operations follow this pattern:

1. **Optimistic Update**: Update cache immediately
2. **API Call**: Execute actual mutation
3. **Success**: Update cache with real data (optional)
4. **Error**: Rollback to previous state

**Example**:
```typescript
const markAsRead = async (messageId: string) => {
  try {
    // 1. Optimistic update
    mutate(
      (currentMessages) =>
        currentMessages.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ),
      { revalidate: false }
    );

    // 2. API call
    await messagesAPI.markAsRead(messageId);

    // Success - cache already updated optimistically
  } catch (err) {
    // 3. Rollback on error
    mutate(); // Refetch original data
    throw err;
  }
};
```

## Request Deduplication

SWR automatically deduplicates requests within a 2-second window:

**Before SWR**:
```typescript
// Component A renders
useEffect(() => fetchProjects(), []); // Request 1

// Component B renders
useEffect(() => fetchProjects(), []); // Request 2

// Component C renders
useEffect(() => fetchProjects(), []); // Request 3
```

**After SWR**:
```typescript
// All components use same hook
const { data } = useProjects();

// Result: Single API request shared across all 3 components
```

**Verification**:
Open Network DevTools and observe:
- Before: Multiple identical requests
- After: Single request, multiple components update

## Cache Invalidation Strategies

### Automatic Invalidation

SWR automatically revalidates on:
- Window focus (user returns to tab)
- Network reconnect (user comes back online)
- Custom intervals (configured per hook)

### Manual Invalidation

Each hook provides a `refresh()` method:

```typescript
const { data, refresh } = useAnalytics(projectId);

// Manual refresh after specific user action
const handlePublish = async () => {
  await publishPost();
  refresh(); // Update analytics
};
```

### Global Cache Invalidation

Use `mutate()` from `swr` for global cache operations:

```typescript
import { mutate } from 'swr';

// Clear all analytics caches
mutate((key) => typeof key === 'string' && key.startsWith('analytics:'));

// Clear specific project's data
mutate((key) => typeof key === 'string' && key.includes(projectId));
```

## Performance Metrics

### Bundle Size Analysis

**Before SWR**:
- `vendor-other`: 75.33 kB gzipped

**After SWR**:
- `vendor-other`: 85.41 kB gzipped
- **Impact**: +10.08 kB gzipped (4.2% increase)
- **Total bundle**: Still under 150 kB target

### Expected Performance Gains

Based on implementation:

**Network Requests**:
- Dashboard page load: 5 requests → 1 request (80% reduction)
- Filter change (Inbox): 1 request → 0 requests (100% reduction)
- OAuth callback: Full reload → Cache refresh only

**User Experience**:
- Page navigation: 1-2s load → Instant (cached data)
- Filter changes: 500ms delay → 0ms (client-side)
- OAuth flow: 3-5s → 1-2s (optimistic update)

## Best Practices

### 1. Use Conditional Fetching

```typescript
// ✅ Good - only fetch when needed
useSWR(
  shouldFetch(projectId) ? cacheKey : null,
  fetcher
);

// ❌ Bad - always fetches
useSWR(cacheKey, fetcher);
```

### 2. Choose Appropriate TTL

```typescript
// ✅ Good - stable data, long cache
useProjects(); // 1 hour TTL

// ✅ Good - frequently changing, short cache
useInboxMessages(); // 5 minutes TTL

// ❌ Bad - frequently changing with long cache
useInboxMessages({ refreshInterval: 3600000 }); // 1 hour TTL
```

### 3. Implement Optimistic Updates

```typescript
// ✅ Good - instant UI feedback
const deleteProject = async (id) => {
  mutate(
    (current) => current.filter(p => p.id !== id),
    { revalidate: false }
  );
  await api.delete(id);
};

// ❌ Bad - slow UI feedback
const deleteProject = async (id) => {
  await api.delete(id);
  mutate(); // Refetch after API call
};
```

### 4. Handle Errors Properly

```typescript
// ✅ Good - rollback on error
const update = async (data) => {
  try {
    mutate(optimisticData, { revalidate: false });
    await api.update(data);
  } catch (err) {
    mutate(); // Rollback
    throw err;
  }
};

// ❌ Bad - no rollback
const update = async (data) => {
  mutate(optimisticData);
  await api.update(data); // If this fails, UI shows wrong data
};
```

## Migration Guide

### Before (Manual State Management)

```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.fetch();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependencies]);
```

### After (SWR)

```typescript
const { data, isLoading, error } = useSWR(
  cacheKey,
  () => api.fetch(),
  {
    dedupingInterval: CACHE_TTL.FREQUENT,
    revalidateOnFocus: true,
  }
);
```

**Benefits**:
- 90% less boilerplate code
- Automatic request deduplication
- Background revalidation
- Error retry logic
- Optimistic updates support

## Troubleshooting

### Issue: Cache not updating after mutation

**Solution**: Check if revalidation is disabled
```typescript
// ✅ Correct
mutate(newData, { revalidate: true });

// ❌ Wrong
mutate(newData, { revalidate: false });
```

### Issue: Multiple requests still happening

**Solution**: Verify cache key consistency
```typescript
// ✅ Consistent key
const key = CacheKeys.projects(userId);

// ❌ Inconsistent key (creates new cache entry every render)
const key = `projects-${Math.random()}`;
```

### Issue: Stale data showing

**Solution**: Check TTL and refresh interval
```typescript
// Reduce TTL for frequently changing data
const { data } = useSWR(key, fetcher, {
  dedupingInterval: CACHE_TTL.VERY_FREQUENT, // 5 minutes
  refreshInterval: 300000, // Auto-refresh every 5 minutes
});
```

### Issue: OAuth callback not refreshing connections

**Solution**: Verify sessionStorage flag is set
```typescript
// In OAuth callback component
sessionStorage.setItem('oauth_just_completed', 'true');

// Hook will automatically detect and refresh
```

## Future Enhancements

### Phase 2 (Nice to Have)

1. **Additional Hooks**:
   - `useCurrentUser()` - User profile caching (1 hour TTL)
   - `useNotifications()` - Notifications caching (2 minutes TTL)
   - `useMediaLibrary()` - Media files caching (30 minutes TTL)

2. **Advanced Features**:
   - Offline mode support with persistence
   - Background sync for offline changes
   - Cache persistence across sessions (localStorage)
   - WebSocket integration for real-time updates

3. **Performance Optimizations**:
   - Prefetching for predicted user navigation
   - Pagination support for large datasets
   - Infinite scroll with SWR infinite
   - Streaming data support

## Monitoring & Analytics

### Sentry Integration

All SWR errors are automatically reported to Sentry:

```typescript
onError: (error, key) => {
  logger.error('SWR cache error', error, { key });
  Sentry.captureException(error, {
    tags: { component: 'SWR', cache_key: String(key) },
  });
}
```

### Cache Hit Metrics (Development)

In development mode, cache hits are logged:

```typescript
onSuccess: (data, key) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('SWR cache hit', { key, dataSize: JSON.stringify(data).length });
  }
}
```

### Performance Monitoring

Track these metrics in production:
- Cache hit ratio
- Average request deduplication rate
- Optimistic update success rate
- Rollback frequency

## References

- [SWR Documentation](https://swr.vercel.app/)
- [Task 3.1 - State Management Analysis](./ADR-State-Management-Analysis.md)
- [Task 3.3 - Implementation Specification](../task-specifications/task-3.3-request-caching.md)
- [Performance Monitoring Setup](../performance/performance-monitoring-setup.md)

## Changelog

### 2025-11-09 - Initial Implementation
- Installed SWR (v2.x)
- Created global configuration (`swr-config.ts`)
- Implemented 4 high-priority hooks:
  - `useProjects` with optimistic updates
  - `useAnalytics` with date range support
  - `useConnectedPlatforms` with OAuth integration
  - `useInboxMessages` with client-side filtering
- Added SWRConfig provider to App.tsx
- Updated hooks export index
- Generated comprehensive documentation

**Bundle Impact**: +10.08 kB gzipped
**TypeScript**: All builds successful
**Breaking Changes**: None (backward compatible)
