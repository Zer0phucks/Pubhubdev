# State Management Decision Matrix

**Quick reference for state management decisions in PubHub**

---

## Current Recommendation: Context API ✅

**Last Updated**: 2025-01-09
**Decision**: Keep React Context API with improvements
**Review Date**: When routes > 50 OR performance issues arise

---

## Decision Tree

```
                    Adding new state?
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        Server-side data?       Client-side UI state?
        (API, database)         (theme, modals, filters)
                │                       │
        ┌───────┴────────┐             │
        │                │             │
        ▼                ▼             ▼
    Real-time      Cached data     Use UIContext
    updates?       (projects,       (src/contexts/
                   analytics)        UIContext.tsx)
        │                │
        ▼                ▼
    Supabase        Use SWR
    Realtime       (Task 3.3)
```

---

## State Type Guidelines

### 1. Authentication State → AuthContext
**Use for**:
- User object
- Authentication status
- Login/logout operations
- OAuth flows
- Session tokens

**Location**: `src/contexts/AuthContext.tsx`

**Example**:
```typescript
const { user, isAuthenticated, signin, signout } = useAuth();
```

**Persistence**: Supabase session storage

---

### 2. Project State → ProjectContext
**Use for**:
- Current project
- Projects list
- Project CRUD operations
- Project switching

**Location**: `src/contexts/ProjectContext.tsx`

**Example**:
```typescript
const { currentProject, projects, setCurrentProject } = useProject();
```

**Persistence**: localStorage (projectId), API for data

**Note**: Consider moving to SWR in Task 3.3 for caching

---

### 3. UI State → UIContext
**Use for**:
- Theme (light/dark/system)
- Selected platform filter
- Modal/dialog open states
- Command palette state
- Sub-view selections (inbox view, settings tabs)

**Location**: `src/contexts/UIContext.tsx`

**Example**:
```typescript
const { theme, setTheme, selectedPlatform, commandPaletteOpen } = useUI();
```

**Persistence**:
- Theme → localStorage
- Platform → URL search params
- Modals → Memory only

---

### 4. Local Component State → useState
**Use for**:
- Form inputs
- Temporary UI state (dropdown open, loading)
- Component-specific filters
- Search queries

**Example**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

**Persistence**: None (ephemeral)

---

### 5. Cached Server Data → SWR (Task 3.3)
**Use for**:
- API responses
- Analytics data
- Platform connections
- Content library
- Scheduled posts

**Location**: `src/hooks/use*.ts` (custom hooks)

**Example**:
```typescript
const { data: projects, error, mutate } = useSWR('/api/projects');
```

**Persistence**: SWR cache (configurable TTL)

---

## When to Use What

| State Type | Context API | SWR | useState | Supabase Realtime |
|------------|-------------|-----|----------|-------------------|
| User auth | ✅ AuthContext | ❌ | ❌ | ❌ |
| Theme | ✅ UIContext | ❌ | ❌ | ❌ |
| Platform filter | ✅ UIContext | ❌ | ❌ | ❌ |
| Form input | ❌ | ❌ | ✅ useState | ❌ |
| Projects list | ⚠️ Context (now) | ✅ SWR (future) | ❌ | ❌ |
| Analytics | ❌ | ✅ SWR | ❌ | ❌ |
| Live notifications | ❌ | ❌ | ❌ | ✅ Realtime |

---

## Context vs SWR Decision

```
                Is the data from an API?
                            │
                    ┌───────┴───────┐
                    │               │
                   YES              NO
                    │               │
                    ▼               ▼
            Does it change      UIContext
            frequently?        (theme, platform,
                    │           modals, etc.)
            ┌───────┴───────┐
            │               │
           YES              NO
            │               │
            ▼               ▼
        Use SWR         Use SWR with
        (short TTL)     longer TTL

        Examples:           Examples:
        - Analytics         - Projects list
        - Live metrics      - User profile
        - Recent posts      - Settings
```

---

## Re-evaluation Triggers

### Migrate to Zustand if:

1. **Scale Threshold**
   - ✅ Routes > 50 (current: 11)
   - ✅ Components > 200 (current: ~100)

2. **Performance Issues**
   - ✅ Context re-renders cause lag (>200ms)
   - ✅ Profiler shows >15% unnecessary re-renders
   - ✅ User complaints about UI responsiveness

3. **Developer Experience**
   - ✅ Props drilling depth > 5 levels
   - ✅ Team struggles with Context debugging
   - ✅ State synchronization across tabs needed

4. **Feature Requirements**
   - ✅ Undo/redo functionality needed
   - ✅ Time travel debugging required
   - ✅ Complex state machines

### Current Status
- Routes: 11 ❌ (far below threshold)
- Props drilling: 0 levels ✅ (after UIContext)
- Performance: Excellent ✅
- Re-renders: Minimal ✅

**Verdict**: Context API is sufficient ✅

---

## Migration Path (If Needed)

### Phase 1: Migrate UI State Only
```typescript
// Before (Context API)
const { theme, selectedPlatform } = useUI();

// After (Zustand)
import { useUIStore } from '@/store/ui-store';
const { theme, selectedPlatform } = useUIStore();
```

**Effort**: 1 day
**Risk**: Low
**Bundle**: +3.5 kB gzipped

### Phase 2: Keep Auth & Project Contexts
```typescript
// Auth and Project stay as Context API
// Only UI migrates to Zustand
```

**Rationale**: Server-sync state works well in Context

### Phase 3: Monitor & Evaluate
- Measure performance improvement
- Track bundle size impact
- Gather team feedback
- Decide on further migration

---

## Performance Benchmarks

### Context API (Current)
| Metric | Value | Status |
|--------|-------|--------|
| Build time | 3.64s | ✅ Excellent |
| Bundle size | 138 kB gzipped | ✅ Good |
| Theme change re-renders | 2-3 components | ✅ Optimal |
| Platform change re-renders | 5-8 components | ✅ Acceptable |
| Modal toggle re-renders | 1-2 components | ✅ Optimal |

### If Migrating to Zustand
| Metric | Before | After | Difference |
|--------|--------|-------|------------|
| Build time | 3.64s | ~3.7s | +0.06s |
| Bundle size | 138 kB | 141.5 kB | +3.5 kB |
| Re-renders | Baseline | -10-20% | ✅ Better |
| DevTools | React only | React + Zustand | ✅ Better |

---

## Code Examples

### Adding New UI State

**Wrong**:
```typescript
// ❌ Don't add to ProtectedLayout
const [newUIState, setNewUIState] = useState(false);
```

**Right**:
```typescript
// ✅ Add to UIContext.tsx
export function UIProvider({ children }) {
  const [newUIState, setNewUIState] = useState(false);

  return (
    <UIContext.Provider value={{ newUIState, setNewUIState, ... }}>
      {children}
    </UIContext.Provider>
  );
}

// Use in components
const { newUIState, setNewUIState } = useUI();
```

### Adding New API Data

**Wrong**:
```typescript
// ❌ Don't use Context for API data
const [apiData, setApiData] = useState(null);
useEffect(() => {
  fetch('/api/data').then(res => setApiData(res));
}, []);
```

**Right (Task 3.3)**:
```typescript
// ✅ Use SWR for API data
import useSWR from 'swr';

const { data, error, isLoading } = useSWR('/api/data', fetcher);
```

---

## Quick Reference Commands

### Check Current State Architecture
```bash
# Find all contexts
find src/contexts -name "*.tsx"

# Count state variables in UIContext
grep "useState" src/contexts/UIContext.tsx | wc -l

# Check bundle size
npm run build | grep "vendor-react"
```

### Performance Profiling
```bash
# 1. Build production bundle
npm run build

# 2. Analyze bundle
npx vite-bundle-visualizer

# 3. Profile in browser
# Open React DevTools > Profiler
# Record session > Perform actions > Stop
# Look for unnecessary re-renders
```

### Migration Decision Checklist
```bash
# Run this script to check migration triggers
cat << 'EOF' > check-migration-triggers.sh
#!/bin/bash
echo "=== State Management Migration Check ==="

# Count routes
ROUTES=$(find src/components/routes -name "*Route.tsx" | wc -l)
echo "Routes: $ROUTES (threshold: 50)"

# Count components
COMPONENTS=$(find src/components -name "*.tsx" | wc -l)
echo "Components: $COMPONENTS (threshold: 200)"

# Check bundle size
BUILD_SIZE=$(npm run build 2>&1 | grep "vendor-react" | awk '{print $3}')
echo "React bundle: $BUILD_SIZE (target: <150 kB gzipped)"

# Props drilling depth (manual check needed)
echo "Props drilling: Check manually with 'grep -r \"onPlatformChange\" src/'"

echo ""
if [ $ROUTES -lt 50 ] && [ $COMPONENTS -lt 200 ]; then
  echo "✅ Context API is still appropriate"
else
  echo "⚠️  Consider evaluating Zustand"
fi
EOF

chmod +x check-migration-triggers.sh
./check-migration-triggers.sh
```

---

## State Management Health Check

### Monthly Review Questions

1. **Performance**
   - [ ] Build time < 5 seconds?
   - [ ] Bundle size < 150 kB gzipped?
   - [ ] No user-reported lag issues?

2. **Scalability**
   - [ ] Routes < 50?
   - [ ] Props drilling < 5 levels?
   - [ ] Context re-renders acceptable?

3. **Developer Experience**
   - [ ] Easy to add new state?
   - [ ] Easy to debug state issues?
   - [ ] Clear where state lives?

4. **Code Quality**
   - [ ] Contexts well-organized?
   - [ ] State properly categorized?
   - [ ] No duplicate state?

**If all ✅**: Keep Context API
**If 2+ ❌**: Consider Zustand migration

---

## Common Mistakes to Avoid

### ❌ Don't: Mix concerns
```typescript
// Bad: UI state in ProjectContext
const ProjectContext = createContext({
  currentProject,
  theme, // ❌ Wrong place!
});
```

### ✅ Do: Separate by concern
```typescript
// Good: UI state in UIContext
const UIContext = createContext({ theme });
const ProjectContext = createContext({ currentProject });
```

---

### ❌ Don't: Use Context for derived state
```typescript
// Bad: Storing computed value
const [sortedProjects, setSortedProjects] = useState([]);
useEffect(() => {
  setSortedProjects(projects.sort(...));
}, [projects]);
```

### ✅ Do: Compute on render
```typescript
// Good: Derive in component
const sortedProjects = useMemo(
  () => projects.sort(...),
  [projects]
);
```

---

### ❌ Don't: Over-contextualize
```typescript
// Bad: Context for local state
const DropdownContext = createContext({ open, setOpen });

function Dropdown() {
  return (
    <DropdownContext.Provider>
      {/* Only used in this component tree */}
    </DropdownContext.Provider>
  );
}
```

### ✅ Do: Use local state
```typescript
// Good: useState for local state
function Dropdown() {
  const [open, setOpen] = useState(false);
  // Pass as props to children
}
```

---

## Summary

| State Type | Solution | Location | Persistence |
|------------|----------|----------|-------------|
| **Auth** | AuthContext | `src/contexts/AuthContext.tsx` | Supabase session |
| **Project** | ProjectContext → SWR | `src/contexts/ProjectContext.tsx` | API + localStorage |
| **UI** | UIContext | `src/contexts/UIContext.tsx` | localStorage + URL |
| **API Data** | SWR (Task 3.3) | Custom hooks | SWR cache |
| **Local** | useState | Component | None |

**Current Recommendation**: Context API ✅

**Future Recommendation**: Context (client) + SWR (server) ✅

**Migration Trigger**: Routes > 50 OR performance issues

---

**Last Review**: 2025-01-09
**Next Review**: When routes exceed 30 (currently 11)
**Decision Maker**: System Architect Agent
