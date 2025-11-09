# State Management Implementation Guide

## Recommended Improvements for Context API

**Total Effort**: 4 hours
**Bundle Impact**: 0 kB (native React optimizations)
**Risk Level**: Low

---

## Improvement 1: Organize Contexts Directory (1 hour)

### Step 1.1: Create Context Directory Structure

```bash
mkdir src/contexts
```

### Step 1.2: Move Existing Contexts

```bash
# Move AuthContext
mv src/components/AuthContext.tsx src/contexts/AuthContext.tsx

# Move ProjectContext
mv src/components/ProjectContext.tsx src/contexts/ProjectContext.tsx
```

### Step 1.3: Update Import Paths

**Files to update**:
- `src/App.tsx`
- `src/components/ProtectedLayout.tsx`
- `src/components/AppHeader.tsx`
- `src/components/ProjectSwitcher.tsx`

**Find and replace**:
```typescript
// OLD
import { AuthProvider, useAuth } from './components/AuthContext';
import { ProjectProvider, useProject } from './components/ProjectContext';

// NEW
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
```

**Validation**:
```bash
npm run type-check
npm run dev
```

---

## Improvement 2: Extract UI State to UIContext (2 hours)

### Step 2.1: Create UIContext

**File**: `src/contexts/UIContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Platform, InboxView, ProjectSettingsTab, AccountSettingsTab } from '@/types';

interface UIContextType {
  // Platform & View State
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Modal/Dialog State
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  aiChatOpen: boolean;
  setAIChatOpen: (open: boolean) => void;
  settingsPanelOpen: boolean;
  setSettingsPanelOpen: (open: boolean) => void;
  accountSettingsOpen: boolean;
  setAccountSettingsOpen: (open: boolean) => void;

  // AI Chat State
  aiInitialQuery: string;
  setAIInitialQuery: (query: string) => void;
  aiAutoSubmit: boolean;
  setAIAutoSubmit: (autoSubmit: boolean) => void;

  // Sub-view State
  inboxView: InboxView;
  setInboxView: (view: InboxView) => void;
  inboxOpen: boolean;
  setInboxOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  projectSettingsTab: ProjectSettingsTab;
  setProjectSettingsTab: (tab: ProjectSettingsTab) => void;
  accountSettingsTab: AccountSettingsTab;
  setAccountSettingsTab: (tab: AccountSettingsTab) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Platform state (persisted to URL)
  const [selectedPlatform, setSelectedPlatformState] = useState<Platform>(
    (searchParams.get('platform') as Platform) || 'all'
  );

  // Theme state (persisted to localStorage)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    return savedTheme || 'system';
  });

  // Modal/Dialog state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiChatOpen, setAIChatOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  // AI Chat state
  const [aiInitialQuery, setAIInitialQuery] = useState('');
  const [aiAutoSubmit, setAIAutoSubmit] = useState(false);

  // Sub-view state
  const [inboxView, setInboxView] = useState<InboxView>('unread');
  const [inboxOpen, setInboxOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectSettingsTab, setProjectSettingsTab] = useState<ProjectSettingsTab>('details');
  const [accountSettingsTab, setAccountSettingsTab] = useState<AccountSettingsTab>('profile');

  // Platform persistence to URL
  useEffect(() => {
    if (selectedPlatform !== 'all') {
      searchParams.set('platform', selectedPlatform);
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.delete('platform');
      setSearchParams(searchParams, { replace: true });
    }
  }, [selectedPlatform, searchParams, setSearchParams]);

  // Theme persistence to localStorage + apply to DOM
  useEffect(() => {
    localStorage.setItem('theme', theme);

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemPrefersDark);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handleChange);

      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setSelectedPlatform = (platform: Platform) => {
    setSelectedPlatformState(platform);
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
  };

  const value: UIContextType = {
    selectedPlatform,
    setSelectedPlatform,
    theme,
    setTheme,
    commandPaletteOpen,
    setCommandPaletteOpen,
    aiChatOpen,
    setAIChatOpen,
    settingsPanelOpen,
    setSettingsPanelOpen,
    accountSettingsOpen,
    setAccountSettingsOpen,
    aiInitialQuery,
    setAIInitialQuery,
    aiAutoSubmit,
    setAIAutoSubmit,
    inboxView,
    setInboxView,
    inboxOpen,
    setInboxOpen,
    settingsOpen,
    setSettingsOpen,
    projectSettingsTab,
    setProjectSettingsTab,
    accountSettingsTab,
    setAccountSettingsTab,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
```

### Step 2.2: Update App.tsx

**File**: `src/App.tsx`

```typescript
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { UIProvider } from './contexts/UIContext';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <UIProvider>
          <RouterProvider router={router} />
        </UIProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}
```

### Step 2.3: Update ProtectedLayout.tsx

**Find and replace**:

```typescript
// REMOVE all these useState declarations:
const [selectedPlatform, setSelectedPlatform] = useState<Platform>(...);
const [inboxView, setInboxView] = useState<InboxView>('unread');
const [projectSettingsTab, setProjectSettingsTab] = useState<ProjectSettingsTab>('details');
const [accountSettingsTab, setAccountSettingsTab] = useState<AccountSettingsTab>('profile');
const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
const [inboxOpen, setInboxOpen] = useState(false);
const [settingsOpen, setSettingsOpen] = useState(false);
const [theme, setTheme] = useState<"light" | "dark" | "system">(...);
const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
const [aiChatOpen, setAIChatOpen] = useState(false);
const [aiInitialQuery, setAIInitialQuery] = useState<string>("");
const [aiAutoSubmit, setAIAutoSubmit] = useState(false);

// REMOVE all theme useEffect hooks (lines 92-119)
// REMOVE platform persistence useEffect (lines 121-130)

// ADD at top of component:
import { useUI } from '../contexts/UIContext';

export function ProtectedLayout() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get all UI state from context
  const {
    selectedPlatform,
    setSelectedPlatform,
    theme,
    setTheme,
    commandPaletteOpen,
    setCommandPaletteOpen,
    aiChatOpen,
    setAIChatOpen,
    aiInitialQuery,
    setAIInitialQuery,
    aiAutoSubmit,
    setAIAutoSubmit,
    settingsPanelOpen,
    setSettingsPanelOpen,
    accountSettingsOpen,
    setAccountSettingsOpen,
    accountSettingsTab,
    setAccountSettingsTab,
    inboxView,
    setInboxView,
    inboxOpen,
    setInboxOpen,
    settingsOpen,
    setSettingsOpen,
    projectSettingsTab,
    setProjectSettingsTab,
  } = useUI();

  // Rest of component stays the same
  // Keyboard shortcuts, auth guard, render logic unchanged
}
```

### Step 2.4: Update Route Components (Optional)

Routes can now use `useUI()` instead of outlet context:

```typescript
// src/components/routes/DashboardRoute.tsx
import { useUI } from '../../contexts/UIContext';

export function DashboardRoute() {
  const { selectedPlatform } = useUI(); // Instead of useOutletContext()

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home
        selectedPlatform={selectedPlatform}
        onNavigate={(view) => navigate(`/${view}`)}
      />
    </Suspense>
  );
}
```

### Step 2.5: Validation

```bash
# Type check
npm run type-check

# Run dev server
npm run dev

# Test all UI interactions:
# - Platform switching
# - Theme toggle
# - Command palette (Cmd+Shift+K)
# - AI chat (Cmd+K)
# - Settings panel (Cmd+,)
# - Inbox collapsible
# - Project settings tabs
```

**Expected Results**:
- ✅ No TypeScript errors
- ✅ All UI state works identically
- ✅ Platform persists to URL
- ✅ Theme persists to localStorage
- ✅ ProtectedLayout reduced from 499 → ~300 lines

---

## Improvement 3: Add React.memo() Optimization (30 minutes)

### Step 3.1: Optimize AppHeader

**File**: `src/components/AppHeader.tsx`

```typescript
import { memo } from 'react';

// Wrap entire component export
export const AppHeader = memo(function AppHeader({
  currentView,
  selectedPlatform,
  onPlatformChange,
  onNavigate,
  onOpenAccountSettings,
  onOpenCommandPalette,
  onOpenAIChat,
}: AppHeaderProps) {
  // Component logic unchanged
  // ...
});
```

### Step 3.2: Optimize CommandPalette

**File**: `src/components/CommandPalette.tsx`

```typescript
import { memo } from 'react';

export const CommandPalette = memo(function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onPlatformSelect,
  onOpenSettings,
}: CommandPaletteProps) {
  // Component logic unchanged
  // ...
});
```

### Step 3.3: Optimize SettingsPanel

**File**: `src/components/SettingsPanel.tsx`

```typescript
import { memo } from 'react';

export const SettingsPanel = memo(function SettingsPanel({
  open,
  onOpenChange,
  theme,
  onThemeChange,
}: SettingsPanelProps) {
  // Component logic unchanged
  // ...
});
```

### Step 3.4: Optimize PlatformIcon

**File**: `src/components/PlatformIcon.tsx`

```typescript
import { memo } from 'react';

export const PlatformIcon = memo(function PlatformIcon({
  platform,
  size = 20,
  className,
}: PlatformIconProps) {
  // Component logic unchanged
  // ...
});
```

### Step 3.5: Validation

**Test re-render behavior**:

1. Open React DevTools
2. Enable "Highlight updates when components render"
3. Test interactions:
   - Toggle theme → Only SettingsPanel + DOM should update
   - Toggle command palette → Only CommandPalette should update
   - Change platform → Only AppHeader + current route should update

**Expected Result**: ~10-15% fewer re-renders on state changes

---

## Improvement 4: Add Context DevTools (15 minutes)

### Step 4.1: Create DevTools Helper

**File**: `src/contexts/devtools.ts`

```typescript
/**
 * Development-only context state logging
 * Helps debug state updates without external DevTools
 */

export function logContextUpdate(
  contextName: string,
  action: string,
  payload: any,
  previousState?: any
) {
  if (import.meta.env.DEV) {
    console.group(`%c[${contextName}] ${action}`, 'color: #10b981; font-weight: bold');

    if (previousState) {
      console.log('%cPrevious:', 'color: #ef4444', previousState);
    }

    console.log('%cUpdate:', 'color: #3b82f6', payload);
    console.log('%cTimestamp:', 'color: #6b7280', new Date().toISOString());

    console.groupEnd();
  }
}

/**
 * Performance monitoring for context updates
 */
export function measureContextUpdate(
  contextName: string,
  updateFn: () => void
) {
  if (import.meta.env.DEV) {
    const start = performance.now();
    updateFn();
    const end = performance.now();

    const duration = end - start;
    if (duration > 16) { // Slower than 60fps
      console.warn(
        `[${contextName}] Slow update: ${duration.toFixed(2)}ms`,
        '(>16ms threshold)'
      );
    }
  } else {
    updateFn();
  }
}
```

### Step 4.2: Integrate into UIContext

**File**: `src/contexts/UIContext.tsx`

```typescript
import { logContextUpdate, measureContextUpdate } from './devtools';

// In UIProvider:
const setSelectedPlatform = (platform: Platform) => {
  logContextUpdate('UIContext', 'setSelectedPlatform', { platform }, { selectedPlatform: selectedPlatformState });
  measureContextUpdate('UIContext.setSelectedPlatform', () => {
    setSelectedPlatformState(platform);
  });
};

const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
  logContextUpdate('UIContext', 'setTheme', { theme: newTheme }, { theme });
  measureContextUpdate('UIContext.setTheme', () => {
    setThemeState(newTheme);
  });
};

const setCommandPaletteOpen = (open: boolean) => {
  logContextUpdate('UIContext', 'setCommandPaletteOpen', { open });
  setCommandPaletteOpenState(open);
};

// Repeat for other setters
```

### Step 4.3: Test DevTools

1. Run dev server: `npm run dev`
2. Open browser console
3. Perform state changes:
   - Change platform
   - Toggle theme
   - Open command palette

**Expected Console Output**:
```
[UIContext] setSelectedPlatform
  Previous: { selectedPlatform: "all" }
  Update: { platform: "twitter" }
  Timestamp: 2025-01-09T...

[UIContext] setTheme
  Previous: { theme: "dark" }
  Update: { theme: "light" }
  Timestamp: 2025-01-09T...
```

---

## Validation Checklist

### Functional Testing
- [ ] Platform switching works (all 9 platforms + "all")
- [ ] Theme toggle works (light/dark/system)
- [ ] Command palette opens (Cmd+Shift+K)
- [ ] AI chat opens (Cmd+K)
- [ ] Settings panel opens (Cmd+,)
- [ ] Keyboard shortcuts work for all views
- [ ] Inbox collapsible expands/collapses
- [ ] Project settings tabs switch correctly
- [ ] Account settings dialog opens with correct tab

### Persistence Testing
- [ ] Platform selection persists to URL
- [ ] Theme persists to localStorage
- [ ] Refresh page → state restored correctly

### Performance Testing
- [ ] Build time < 5 seconds
- [ ] Bundle size < 150 kB gzipped
- [ ] No console errors
- [ ] React DevTools shows minimal re-renders

### Code Quality
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] All imports updated to new paths
- [ ] No unused variables

---

## Rollback Plan

If issues arise, revert in reverse order:

### Rollback Improvement 4 (DevTools)
```bash
# Remove devtools.ts
rm src/contexts/devtools.ts

# Remove imports and logContextUpdate calls from UIContext.tsx
# (Keep the context, just remove logging)
```

### Rollback Improvement 3 (React.memo)
```bash
# Find and replace in each file:
# FROM: export const Component = memo(function Component
# TO:   export function Component
```

### Rollback Improvement 2 (UIContext)
```bash
# Delete UIContext
rm src/contexts/UIContext.tsx

# Revert App.tsx to remove UIProvider
# Revert ProtectedLayout.tsx to restore useState declarations

# Restore from git if needed:
git checkout src/App.tsx src/components/ProtectedLayout.tsx
```

### Rollback Improvement 1 (Directory Structure)
```bash
# Move contexts back
mv src/contexts/AuthContext.tsx src/components/AuthContext.tsx
mv src/contexts/ProjectContext.tsx src/components/ProjectContext.tsx

# Update imports
# Revert all import path changes
```

---

## Before/After Comparison

### Before (Current)
```
src/components/
├── AuthContext.tsx (317 lines)
├── ProjectContext.tsx (258 lines)
├── ProtectedLayout.tsx (499 lines, mixed concerns)
└── ... other components

Props drilling depth: 3 levels
ProtectedLayout complexity: High (UI state + layout + routing)
DevTools: React DevTools only
Performance optimizations: None
```

### After (Recommended)
```
src/contexts/
├── AuthContext.tsx (317 lines, unchanged)
├── ProjectContext.tsx (258 lines, unchanged)
├── UIContext.tsx (NEW, ~150 lines)
└── devtools.ts (NEW, ~50 lines)

src/components/
├── ProtectedLayout.tsx (~300 lines, layout only)
├── AppHeader.tsx (memo optimized)
├── CommandPalette.tsx (memo optimized)
└── ... other components

Props drilling depth: 0 levels (use hooks)
ProtectedLayout complexity: Medium (layout + routing only)
DevTools: React DevTools + custom logging
Performance optimizations: React.memo on 4 components
```

### Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| ProtectedLayout LOC | 499 | ~300 | -40% |
| Props drilling depth | 3 | 0 | -100% |
| Context re-renders | Baseline | -10-15% | ✅ |
| Bundle size | 138 kB | 138 kB | No change |
| Dev experience | Good | Better | ✅ |

---

## Next Steps

After implementing these improvements:

1. **Monitor Performance**:
   - Use React DevTools Profiler
   - Check console for slow update warnings (>16ms)
   - Measure build times

2. **Gather Metrics**:
   - Track re-render counts with DevTools logging
   - Monitor bundle size on each build
   - Profile critical user flows (compose, calendar)

3. **Iterate**:
   - If performance issues arise, add more React.memo()
   - If bundle size grows, audit dependencies
   - If state becomes complex, reconsider Zustand

4. **Move to Task 3.3**:
   - Focus on request caching (separate concern)
   - Consider React Query/SWR for server state
   - Keep Context API for client state

---

## Support & Resources

- [React Context API Docs](https://react.dev/learn/passing-data-deeply-with-context)
- [React.memo() Best Practices](https://react.dev/reference/react/memo)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Performance Optimization Guide](https://react.dev/learn/render-and-commit)

---

**Implementation Status**: Ready for execution
**Estimated Time**: 4 hours total
**Risk Level**: Low
**Approval Required**: Yes
