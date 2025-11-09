# PubHub State Management Visual Map

## Current Architecture (React Context API)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                 │
│                          (14 lines, minimal)                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ AuthProvider │  │ProjectProvider│  │RouterProvider│
        │  (317 lines) │  │  (258 lines)  │  │  (React)     │
        └──────────────┘  └──────────────┘  └──────────────┘
                │                 │                 │
                │                 │                 │
        ┌───────┴─────────────────┴─────────────────┴──────┐
        │                                                    │
        ▼                                                    ▼
┌────────────────────┐                          ┌────────────────────┐
│   Auth State       │                          │   Project State    │
│                    │                          │                    │
│ • user             │                          │ • currentProject   │
│ • loading          │                          │ • projects[]       │
│ • isAuthenticated  │                          │ • loading          │
│ • profilePicture   │                          │ • CRUD operations  │
│ • signin/signup    │                          │                    │
│ • OAuth methods    │                          │                    │
│ • getToken         │                          │                    │
└────────────────────┘                          └────────────────────┘
        │                                                    │
        └───────────────────┬────────────────────────────────┘
                            │
                            ▼
                ┌────────────────────┐
                │  ProtectedLayout   │
                │   (499 lines)      │
                │                    │
                │  Global UI State:  │
                │  • selectedPlatform│
                │  • theme           │
                │  • modals/dialogs  │
                │  • sub-views       │
                │  • keyboard shortcuts │
                └────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐      ┌─────────────┐     ┌──────────┐
  │AppHeader │      │CommandPalette│     │ Outlet   │
  │(332 lines│      │  (118 lines) │     │(React    │
  │          │      │              │     │ Router)  │
  │Props:    │      │Props:        │     │          │
  │• platform│      │• open        │     │Context:  │
  │• theme   │      │• navigate    │     │• platform│
  │• navigate│      │• platform    │     │• views   │
  │• callbacks│     │              │     │          │
  └──────────┘      └─────────────┘     └──────────┘
                                               │
                    ┌──────────────────────────┼─────────────────┐
                    │                          │                 │
                    ▼                          ▼                 ▼
            ┌──────────────┐          ┌──────────────┐  ┌──────────────┐
            │DashboardRoute│          │ComposeRoute  │  │InboxRoute    │
            │  (47 lines)  │          │  (37 lines)  │  │  (45 lines)  │
            └──────────────┘          └──────────────┘  └──────────────┘
                    │                          │                 │
                    ▼                          ▼                 ▼
            ┌──────────────┐          ┌──────────────┐  ┌──────────────┐
            │    Home      │          │ContentComposer│ │UnifiedInbox  │
            │  (19 lines)  │          │ (500+ lines)  │ │ (400+ lines) │
            └──────────────┘          └──────────────┘  └──────────────┘
                    │
                    ▼
            ┌──────────────┐
            │DashboardOverview│
            │ (700+ lines)  │
            │               │
            │ Local State:  │
            │ • chartData   │
            │ • metrics     │
            │ • dateRange   │
            └──────────────┘
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     STATE CATEGORIES                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ GLOBAL STATE │       │ SHARED STATE │       │ LOCAL STATE  │
│              │       │              │       │              │
│ • Auth       │       │ • Platform   │       │ • Form data  │
│ • User       │       │ • Theme      │       │ • Chart data │
│ • Project    │       │ • Modals     │       │ • Filters    │
│              │       │ • Sub-views  │       │ • Sorting    │
│ Accessible:  │       │              │       │              │
│ Anywhere     │       │ Accessible:  │       │ Accessible:  │
│              │       │ Multiple     │       │ Single       │
│ Via:         │       │ components   │       │ component    │
│ useAuth()    │       │              │       │              │
│ useProject() │       │ Via:         │       │ Via:         │
│              │       │ Props/Outlet │       │ useState()   │
└──────────────┘       └──────────────┘       └──────────────┘
```

## Persistence Strategy

```
┌────────────────────────────────────────────────────────────┐
│              STATE PERSISTENCE LAYERS                       │
└────────────────────────────────────────────────────────────┘

Session Storage:
┌──────────────┐
│ Supabase     │ ──▶ user, token, isAuthenticated
│ Session      │
└──────────────┘

Local Storage:
┌──────────────┐
│ localStorage │ ──▶ theme, currentProjectId
└──────────────┘

URL Parameters:
┌──────────────┐
│ SearchParams │ ──▶ selectedPlatform (?platform=twitter)
└──────────────┘

Memory Only:
┌──────────────┐
│ Component    │ ──▶ modals, dialogs, form state
│ State        │
└──────────────┘
```

## Props Drilling Analysis

```
DEPTH LEVEL 0: App.tsx
│
├─ DEPTH LEVEL 1: Providers (AuthProvider, ProjectProvider)
│  │
│  └─ DEPTH LEVEL 2: ProtectedLayout
│     │
│     ├─ DEPTH LEVEL 3: AppHeader (receives 7 props)
│     │  └─ Uses directly (NO FURTHER DRILLING) ✅
│     │
│     ├─ DEPTH LEVEL 3: CommandPalette (receives 5 props)
│     │  └─ Uses directly (NO FURTHER DRILLING) ✅
│     │
│     └─ DEPTH LEVEL 3: Route Components via Outlet Context
│        │
│        └─ DEPTH LEVEL 4: Feature Components (Home, ContentComposer, etc.)
│           └─ Uses directly or manages local state ✅

MAX DEPTH: 4 levels
VERDICT: Acceptable (< 5 levels threshold)
```

## State Update Frequency

```
┌────────────────────────────────────────────────────┐
│          STATE UPDATE PATTERNS                     │
└────────────────────────────────────────────────────┘

HIGH FREQUENCY (Multiple times per minute):
┌──────────────┐
│ • Form inputs│ ──▶ Local state (useState)
│ • Search     │     No global state pollution ✅
│ • Filters    │
└──────────────┘

MEDIUM FREQUENCY (Once per few minutes):
┌──────────────┐
│ • Platform   │ ──▶ URL params + ProtectedLayout state
│   selection  │     Triggers re-render of affected routes
│ • Theme      │     (Acceptable, not expensive)
│ • Modal open │
└──────────────┘

LOW FREQUENCY (Once per session):
┌──────────────┐
│ • Auth login │ ──▶ AuthContext + Supabase session
│ • Project    │     Minimal re-renders, optimized ✅
│   switch     │
└──────────────┘
```

## Re-render Impact Map

```
When selectedPlatform changes:

ProtectedLayout (root)
├─ AppHeader (re-renders) ──▶ PlatformIcon updates
│  └─ Impact: Low (just icon swap)
│
├─ Outlet Context (re-renders)
│  └─ Current Route (re-renders)
│     └─ Feature Component (re-renders)
│        └─ Impact: Medium (data refetch)
│
└─ Other Components (NO re-render) ✅
   CommandPalette, SettingsPanel not affected

OPTIMIZATION OPPORTUNITY:
Add React.memo() to AppHeader to prevent
unnecessary re-renders when only modals change.
```

## Context vs Props Decision Tree

```
                    Need to share state?
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        Used in 5+ components?    Used in 2-4 components?
                │                       │
        ┌───────┴────────┐             │
        │                │             │
        ▼                ▼             ▼
    Context API      Consider      Props Drilling
    (useAuth,        Context         (Acceptable)
     useProject)     if deeply
                     nested
```

## Performance Profile

```
┌────────────────────────────────────────────────────┐
│           CURRENT PERFORMANCE METRICS               │
└────────────────────────────────────────────────────┘

Build Time:        3.64s                         ✅ Excellent
Bundle Size:
  - React vendor:  116.98 kB gzipped            ✅ Healthy
  - Index:         21.18 kB gzipped             ✅ Excellent
  - Total:         ~138 kB gzipped              ✅ Well under 150 kB target

Context Re-renders:
  - Theme change:  2-3 components               ✅ Minimal
  - Platform:      5-8 components               ✅ Acceptable
  - Modal toggle:  1-2 components               ✅ Optimal

Render Time:
  - Dashboard:     <100ms                       ✅ Fast
  - Compose:       <150ms                       ✅ Fast
  - Calendar:      <200ms                       ✅ Acceptable
```

## Recommended Architecture (After Improvements)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                 │
│                          (14 lines, minimal)                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┬──────────────┐
                    │              │              │              │
                    ▼              ▼              ▼              ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐
        │ AuthProvider │  │ProjectProvider│  │UIProvider│  │RouterProvider│
        │  (Context)   │  │   (Context)   │  │  (NEW)   │  │  (React)     │
        └──────────────┘  └──────────────┘  └──────────┘  └──────────────┘
                │                 │              │                │
                │                 │              │                │
                └─────────────────┴──────────────┴────────────────┘
                                   │
                                   ▼
                        ┌────────────────────┐
                        │  ProtectedLayout   │
                        │   (300 lines)      │  ◀── Reduced from 499!
                        │                    │
                        │  Uses:             │
                        │  • useAuth()       │
                        │  • useProject()    │
                        │  • useUI()         │
                        └────────────────────┘

BENEFITS:
✅ Cleaner separation of concerns
✅ No props drilling for UI state
✅ Contexts co-located in src/contexts/
✅ ProtectedLayout 40% smaller
✅ Still using native React Context API
```

## Comparison: Context API vs Zustand (IF Migrating)

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONTEXT API (Current)                          │
└─────────────────────────────────────────────────────────────────┘

AuthContext.tsx (317 lines)
├─ createContext()
├─ AuthProvider component
├─ useAuth() hook
└─ State + logic in provider

ProjectContext.tsx (258 lines)
├─ createContext()
├─ ProjectProvider component
├─ useProject() hook
└─ State + logic in provider

UIContext.tsx (NEW, ~150 lines)
├─ createContext()
├─ UIProvider component
├─ useUI() hook
└─ State + logic in provider

TOTAL: ~725 lines
BUNDLE: 0 kB (native React)

┌─────────────────────────────────────────────────────────────────┐
│              ZUSTAND (Alternative)                              │
└─────────────────────────────────────────────────────────────────┘

stores/auth-store.ts (~80 lines)
└─ export const useAuthStore = create(...)

stores/project-store.ts (~70 lines)
└─ export const useProjectStore = create(...)

stores/ui-store.ts (~60 lines)
└─ export const useUIStore = create(...)

TOTAL: ~210 lines (-71% code)
BUNDLE: +3.5 kB gzipped

TRADE-OFFS:
Context API:
✅ 0 kB bundle
✅ Native React
❌ More verbose
❌ Provider nesting

Zustand:
✅ Less code
✅ No providers
✅ DevTools
❌ +3.5 kB bundle
❌ External dependency
```

## Health Score Breakdown

```
┌────────────────────────────────────────────────────────┐
│         STATE MANAGEMENT HEALTH SCORE: 8.5/10         │
└────────────────────────────────────────────────────────┘

Organization:        8/10  ███████████████░░░░░
  ✅ Clear separation (Auth, Project, UI)
  ⚠️  Can improve: Move to src/contexts/

Performance:         9/10  ██████████████████░░
  ✅ No bottlenecks, fast renders
  ⚠️  Can optimize: Add React.memo()

Maintainability:     9/10  ██████████████████░░
  ✅ Consistent patterns, easy to understand
  ✅ Good separation of concerns

Scalability:         7/10  ██████████████░░░░░░
  ✅ Good for <50 routes
  ⚠️  May need library at 100+ routes

Developer Experience: 9/10  ██████████████████░░
  ✅ Familiar React patterns
  ✅ Easy to debug with React DevTools
  ⚠️  No dedicated state DevTools

┌────────────────────────────────────────────────────────┐
│    AFTER IMPROVEMENTS (Estimated): 9.2/10             │
└────────────────────────────────────────────────────────┘

Organization:        10/10  ████████████████████
Performance:         10/10  ████████████████████
Maintainability:     9/10   ██████████████████░░
Scalability:         8/10   ████████████████░░░░
Developer Experience: 9/10   ██████████████████░░
```

## Decision Flow: When to Reconsider External Library

```
START
  │
  ▼
Routes > 50?
  │
  ├─ YES ──▶ Consider Zustand
  │
  └─ NO
     │
     ▼
Props drilling depth > 5?
     │
     ├─ YES ──▶ Consider Zustand
     │
     └─ NO
        │
        ▼
Context re-renders slow?
(Profiler shows >200ms)
        │
        ├─ YES ──▶ Consider Zustand or React.memo()
        │
        └─ NO
           │
           ▼
Team requests DevTools?
           │
           ├─ YES ──▶ Consider Zustand (easy win)
           │
           └─ NO
              │
              ▼
        KEEP CONTEXT API ✅
        (Current recommendation)
```

## Legend

```
✅ = Good / Acceptable
⚠️  = Warning / Can Improve
❌ = Bad / Needs Attention
▶  = Leads to / Results in
│  = Flow / Connection
```
