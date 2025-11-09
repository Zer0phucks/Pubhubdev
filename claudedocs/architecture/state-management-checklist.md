# State Management Implementation Checklist

**Task**: 3.1 - State Management Evaluation & Implementation
**Decision**: Keep React Context API + Implement 4 Improvements
**Time Estimate**: 4 hours total
**Status**: ⏳ Awaiting Approval

---

## Pre-Implementation Checklist

### 1. Review Analysis
- [ ] Read `ADR-State-Management-Analysis.md`
- [ ] Review `state-management-summary.md`
- [ ] Understand decision rationale
- [ ] Approve keeping Context API (no migration)

### 2. Backup Current State
```bash
# Create feature branch
git checkout -b feature/state-management-improvements

# Ensure clean working directory
git status

# Run tests to establish baseline
npm run test:run
npm run build
```

### 3. Verify Environment
- [ ] Node version: 20.x
- [ ] npm dependencies installed
- [ ] Build passes: `npm run build`
- [ ] Type check passes: `npm run type-check`
- [ ] Tests pass: `npm run test:run`

---

## Implementation Checklist

### Improvement 1: Organize Contexts Directory (1 hour)

#### Step 1.1: Create Directory
```bash
mkdir src/contexts
```
- [ ] Directory created

#### Step 1.2: Move Contexts
```bash
mv src/components/AuthContext.tsx src/contexts/AuthContext.tsx
mv src/components/ProjectContext.tsx src/contexts/ProjectContext.tsx
```
- [ ] AuthContext moved
- [ ] ProjectContext moved

#### Step 1.3: Update Import Paths
**Files to update**:
- [ ] `src/App.tsx`
- [ ] `src/components/ProtectedLayout.tsx`
- [ ] `src/components/AppHeader.tsx`
- [ ] `src/components/ProjectSwitcher.tsx`
- [ ] Any other files importing these contexts

**Find/Replace**:
```typescript
OLD: import { ... } from './components/AuthContext'
NEW: import { ... } from './contexts/AuthContext'

OLD: import { ... } from './components/ProjectContext'
NEW: import { ... } from './contexts/ProjectContext'
```

#### Step 1.4: Validate
```bash
npm run type-check
npm run dev
```
- [ ] No TypeScript errors
- [ ] Dev server starts
- [ ] Auth still works
- [ ] Project switching works

---

### Improvement 2: Extract UI State to UIContext (2 hours)

#### Step 2.1: Create UIContext
- [ ] Create `src/contexts/UIContext.tsx`
- [ ] Copy code from implementation guide
- [ ] Verify all state variables included
- [ ] Verify all useEffect hooks included

#### Step 2.2: Update App.tsx
- [ ] Import UIProvider
- [ ] Add `<UIProvider>` wrapper
- [ ] Verify provider order:
  ```typescript
  <AuthProvider>
    <ProjectProvider>
      <UIProvider>
        <RouterProvider />
      </UIProvider>
    </ProjectProvider>
  </AuthProvider>
  ```

#### Step 2.3: Update ProtectedLayout.tsx
- [ ] Import `useUI` hook
- [ ] Remove all useState declarations for UI state
- [ ] Remove theme useEffect (lines 92-119)
- [ ] Remove platform persistence useEffect (lines 121-130)
- [ ] Replace with `useUI()` destructuring
- [ ] Verify all state variables replaced

**State to replace**:
- [ ] selectedPlatform
- [ ] theme
- [ ] commandPaletteOpen
- [ ] aiChatOpen
- [ ] settingsPanelOpen
- [ ] accountSettingsOpen
- [ ] aiInitialQuery
- [ ] aiAutoSubmit
- [ ] inboxView
- [ ] inboxOpen
- [ ] settingsOpen
- [ ] projectSettingsTab
- [ ] accountSettingsTab

#### Step 2.4: Validate
```bash
npm run type-check
npm run dev
```

**Manual Testing**:
- [ ] Platform switching works (all 9 + "all")
- [ ] Platform persists to URL (?platform=twitter)
- [ ] Theme toggle works (light/dark/system)
- [ ] Theme persists to localStorage
- [ ] Command palette opens (Cmd+Shift+K)
- [ ] AI chat opens (Cmd+K)
- [ ] Settings panel opens (Cmd+,)
- [ ] Account settings dialog works
- [ ] Inbox collapsible works
- [ ] Project settings tabs work
- [ ] Page refresh restores state

---

### Improvement 3: Add React.memo() Optimization (30 min)

#### Step 3.1: Optimize AppHeader
- [ ] Import `memo` from React
- [ ] Wrap component with `memo()`
- [ ] Add function name for DevTools

```typescript
import { memo } from 'react';

export const AppHeader = memo(function AppHeader({ ... }) {
  // ...
});
```

#### Step 3.2: Optimize CommandPalette
- [ ] Import `memo` from React
- [ ] Wrap component with `memo()`
- [ ] Add function name for DevTools

#### Step 3.3: Optimize SettingsPanel
- [ ] Import `memo` from React
- [ ] Wrap component with `memo()`
- [ ] Add function name for DevTools

#### Step 3.4: Optimize PlatformIcon
- [ ] Import `memo` from React
- [ ] Wrap component with `memo()`
- [ ] Add function name for DevTools

#### Step 3.5: Validate
```bash
npm run type-check
npm run dev
```

**Performance Testing**:
- [ ] Open React DevTools
- [ ] Enable "Highlight updates when components render"
- [ ] Toggle theme → Only affected components update
- [ ] Toggle command palette → Only CommandPalette updates
- [ ] Change platform → Only AppHeader + route update

---

### Improvement 4: Add Context DevTools (15 min)

#### Step 4.1: Create DevTools Helper
- [ ] Create `src/contexts/devtools.ts`
- [ ] Copy code from implementation guide
- [ ] Verify `logContextUpdate()` function
- [ ] Verify `measureContextUpdate()` function

#### Step 4.2: Integrate into UIContext
- [ ] Import devtools functions
- [ ] Add logging to `setSelectedPlatform()`
- [ ] Add logging to `setTheme()`
- [ ] Add logging to `setCommandPaletteOpen()`
- [ ] Add logging to other setters (optional)

#### Step 4.3: Test DevTools
```bash
npm run dev
```

**Browser Console Testing**:
- [ ] Change platform → See console log
- [ ] Toggle theme → See console log
- [ ] Open command palette → See console log
- [ ] Verify timestamp included
- [ ] Verify previous state shown
- [ ] No logs in production build

---

## Post-Implementation Validation

### Functional Testing
- [ ] All platform filters work
- [ ] Theme persistence works
- [ ] All keyboard shortcuts work
- [ ] All modals/dialogs work
- [ ] Sub-view tabs work
- [ ] URL persistence works
- [ ] localStorage persistence works

### Performance Testing
```bash
npm run build
```

- [ ] Build time < 5 seconds
- [ ] Bundle size < 150 kB gzipped
- [ ] Check build output for sizes
- [ ] No unexpected bundle increases

### Code Quality
```bash
npm run type-check
npm run lint
npm run test:run
```

- [ ] TypeScript: No errors
- [ ] ESLint: No errors
- [ ] Unit tests: All pass
- [ ] No console errors in dev
- [ ] No console warnings

### React DevTools Profiler
- [ ] Profile platform change
- [ ] Profile theme change
- [ ] Profile command palette open
- [ ] Verify 10-15% fewer re-renders

---

## Verification Metrics

### Before Improvements
```
ProtectedLayout: 499 lines
Props drilling depth: 3 levels
UI state location: ProtectedLayout
DevTools: React DevTools only
Performance: Baseline
```

### After Improvements
- [ ] ProtectedLayout: ~300 lines (-40%)
- [ ] Props drilling depth: 0 levels
- [ ] UI state location: UIContext
- [ ] DevTools: React DevTools + custom logging
- [ ] Performance: 10-15% fewer re-renders

### Bundle Analysis
```bash
npm run build
```

**Expected output**:
```
vendor-react: ~377 kB (116.98 kB gzipped)
index: ~81 kB (21.18 kB gzipped)
Total: ~138 kB gzipped
```

- [ ] React vendor: ≈ 116.98 kB gzipped
- [ ] Index bundle: ≈ 21.18 kB gzipped
- [ ] Total: < 150 kB gzipped
- [ ] No unexpected increases

---

## Git Workflow

### Commit Strategy
```bash
# Commit 1: Move contexts
git add src/contexts/
git commit -m "refactor: organize contexts into dedicated directory"

# Commit 2: UIContext
git add src/contexts/UIContext.tsx src/App.tsx src/components/ProtectedLayout.tsx
git commit -m "refactor: extract UI state to UIContext"

# Commit 3: React.memo
git add src/components/AppHeader.tsx src/components/CommandPalette.tsx src/components/SettingsPanel.tsx src/components/PlatformIcon.tsx
git commit -m "perf: optimize components with React.memo"

# Commit 4: DevTools
git add src/contexts/devtools.ts src/contexts/UIContext.tsx
git commit -m "dev: add context DevTools for better debugging"
```

### Final Validation
```bash
# Run all checks
npm run type-check && npm run lint && npm run test:run && npm run build

# Verify git status
git status

# Push feature branch
git push origin feature/state-management-improvements
```

- [ ] All commits made
- [ ] All checks passing
- [ ] Branch pushed
- [ ] Ready for review/merge

---

## Rollback Plan (If Needed)

### If Issues with Improvement 4 (DevTools)
```bash
rm src/contexts/devtools.ts
# Remove imports from UIContext.tsx
git checkout src/contexts/UIContext.tsx
```

### If Issues with Improvement 3 (React.memo)
```bash
git checkout src/components/AppHeader.tsx
git checkout src/components/CommandPalette.tsx
git checkout src/components/SettingsPanel.tsx
git checkout src/components/PlatformIcon.tsx
```

### If Issues with Improvement 2 (UIContext)
```bash
git checkout src/contexts/UIContext.tsx
git checkout src/App.tsx
git checkout src/components/ProtectedLayout.tsx
```

### If Issues with Improvement 1 (Directory)
```bash
mv src/contexts/AuthContext.tsx src/components/AuthContext.tsx
mv src/contexts/ProjectContext.tsx src/components/ProjectContext.tsx
# Revert all import changes
```

### Complete Rollback
```bash
git checkout main
git branch -D feature/state-management-improvements
```

---

## Success Criteria

### Functional
- ✅ All existing functionality works identically
- ✅ No breaking changes
- ✅ No new bugs introduced
- ✅ State persistence works (URL, localStorage)

### Performance
- ✅ Build time ≤ 5 seconds
- ✅ Bundle size < 150 kB gzipped
- ✅ 10-15% fewer re-renders (measured)
- ✅ No performance regressions

### Code Quality
- ✅ ProtectedLayout reduced by ~40%
- ✅ No props drilling for UI state
- ✅ TypeScript errors: 0
- ✅ ESLint errors: 0
- ✅ All tests passing

### Developer Experience
- ✅ Clearer separation of concerns
- ✅ Contexts co-located in src/contexts/
- ✅ Better debugging with DevTools
- ✅ Easier to locate and maintain state

---

## Next Steps

### After Implementation
1. **Review Changes**
   - Code review with team
   - Performance comparison
   - User testing

2. **Document Learnings**
   - Update CLAUDE.md if needed
   - Note any challenges encountered
   - Record performance improvements

3. **Move to Task 3.3**
   - Request Caching Strategy
   - Consider SWR for server state
   - Keep Context API for client state

---

## Support Resources

- **ADR**: `claudedocs/architecture/ADR-State-Management-Analysis.md`
- **Implementation Guide**: `claudedocs/architecture/state-management-implementation-guide.md`
- **Visual Map**: `claudedocs/architecture/state-management-visual-map.md`
- **Summary**: `claudedocs/architecture/state-management-summary.md`

---

**Time Tracking**:
- Improvement 1: ___ minutes (est: 60)
- Improvement 2: ___ minutes (est: 120)
- Improvement 3: ___ minutes (est: 30)
- Improvement 4: ___ minutes (est: 15)
- Validation: ___ minutes (est: 30)
- **Total**: ___ minutes (est: 255 = 4.25 hours)

**Status**: ⏳ Ready to begin
**Approval**: ⏳ Awaiting user approval
