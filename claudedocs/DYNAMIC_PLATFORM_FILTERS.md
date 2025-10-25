# Dynamic Platform Filters Implementation

## Overview
The platform filters in the header now dynamically display only the platforms that the user has connected for the current project, plus a "+ Connect Platform" button when not all platforms are connected.

## Changes Made

### 1. New Hook: `useConnectedPlatforms.tsx`
Created a custom hook that:
- Fetches connected platforms from the backend via `connectionsAPI`
- Returns only platforms where `connected: true`
- Updates when the current project changes
- Provides `hasUnconnectedPlatforms` flag to determine if the connect button should show
- Includes a `refresh()` method to reload connections

**API:**
```typescript
const {
  connectedPlatforms,    // Platform[] - array of connected platform IDs
  loading,               // boolean - loading state
  hasUnconnectedPlatforms, // boolean - true if not all 9 platforms are connected
  refresh                // () => Promise<void> - reload connections
} = useConnectedPlatforms();
```

### 2. Updated `AppHeader.tsx`

**Key Changes:**
- Imported `useConnectedPlatforms` hook
- Dynamically builds platform filter list based on connected platforms
- Always shows "ALL" tab as first option
- Only shows platform tabs for connected platforms
- Adds "+ Connect Platform" button at the end (when `hasUnconnectedPlatforms` is true)
- Shows "No platforms connected yet" hint when user has 0 connections
- Auto-resets to "all" if currently selected platform gets disconnected

**Platform Filter Logic:**
```typescript
// Always start with "ALL"
const platforms = [
  { id: "all" as Platform, label: "ALL" },
  // Only add connected platforms
  ...allPlatforms
    .filter(p => p.id !== "all" && connectedPlatforms.includes(p.id))
    .map(p => ({ id: p.id, label: p.label }))
];
```

**Auto-Reset Logic:**
```typescript
// If selected platform is disconnected, reset to "all"
useEffect(() => {
  if (selectedPlatform !== "all" && !connectedPlatforms.includes(selectedPlatform)) {
    onPlatformChange("all");
  }
}, [connectedPlatforms, selectedPlatform]);
```

### 3. "+ Connect Platform" Button

**When Shown:**
- Only appears when `hasUnconnectedPlatforms` is true
- Hidden when all 9 platforms are connected

**Behavior:**
- Clicking navigates to Settings → Connections tab
- Shows helpful tooltip:
  - "Connect your first platform to get started" (when 0 platforms)
  - "Connect more platforms" (when 1-8 platforms)

**Styling:**
- Matches the platform tab design
- Uses muted colors with hover effect
- Shows Plus icon + "Connect Platform" text (text hidden on mobile)

### 4. Empty State

When user has **zero** connected platforms:
- Shows "ALL" tab only
- Shows "+ Connect Platform" button
- Shows "No platforms connected yet" hint text
- Guides user to connect their first platform

---

## User Experience Flow

### New User (0 Platforms Connected)
1. User sees header with:
   - "ALL" tab (selected by default)
   - "+ Connect Platform" button
   - "No platforms connected yet" hint
2. User clicks "+ Connect Platform"
3. Navigates to Settings → Connections
4. User connects first platform (e.g., Twitter)
5. Header updates to show: "ALL" | Twitter | "+ Connect Platform"

### Adding More Platforms
1. User clicks "+ Connect Platform" in header
2. Goes to Settings → Connections
3. Connects another platform (e.g., Instagram)
4. Header updates: "ALL" | Twitter | Instagram | "+ Connect Platform"

### All Platforms Connected
1. User connects all 9 platforms
2. Header shows: "ALL" | Twitter | Instagram | LinkedIn | ... | Blog
3. "+ Connect Platform" button disappears (no more platforms to connect)

### Disconnecting a Platform
1. User disconnects a platform in Settings
2. Platform tab disappears from header
3. "+ Connect Platform" button reappears
4. If user was viewing that platform, auto-switches to "ALL"

---

## Technical Details

### Platform Connection Data Flow

```
User Action (Connect/Disconnect Platform)
    ↓
Settings → PlatformConnections component
    ↓
connectionsAPI.update() → Backend
    ↓
Backend stores in Supabase KV
    ↓
useConnectedPlatforms hook (via useEffect)
    ↓
connectionsAPI.getAll() → Backend
    ↓
Hook updates connectedPlatforms state
    ↓
AppHeader re-renders with new platform list
    ↓
Platform tabs update dynamically
```

### Multi-Project Support
- Each project has its own set of platform connections
- Platform filters update automatically when switching projects
- `useConnectedPlatforms` watches `currentProject.id` for changes
- Same platform can be connected to different projects (per multi-project feature)

### Performance Considerations
- Hook uses `useEffect` with `currentProject.id` dependency
- Only fetches connections when project changes
- Connections cached in component state
- No unnecessary re-fetches

---

## Benefits

### For Users
✅ **Cleaner Interface**: Only see platforms they actually use  
✅ **Clear Call-to-Action**: "+ Connect Platform" button guides next step  
✅ **Less Clutter**: No need to scroll through 9+ platform tabs if only using 2-3  
✅ **Responsive Design**: Platform labels hide on mobile, icons remain  
✅ **Smart Defaults**: Auto-resets to "ALL" if selected platform is disconnected  

### For Agencies
✅ **Project-Specific**: Different clients/projects can have different platform combinations  
✅ **Quick Setup**: Easy to see which platforms are connected at a glance  
✅ **Workflow Efficiency**: Connect button right in the header for quick access  

### For Developers
✅ **Reusable Hook**: `useConnectedPlatforms` can be used in other components  
✅ **Type-Safe**: Full TypeScript support  
✅ **Consistent API**: Uses existing `connectionsAPI` infrastructure  
✅ **Reactive**: Automatically updates when connections change  

---

## Edge Cases Handled

### 1. Zero Platforms Connected
- Shows only "ALL" tab
- Shows "+ Connect Platform" button prominently
- Shows hint text: "No platforms connected yet"

### 2. Selected Platform Gets Disconnected
```typescript
// User is viewing "Twitter" tab
// User disconnects Twitter in Settings
// → Auto-switches to "ALL" tab
// → Twitter tab disappears from header
```

### 3. All Platforms Connected
- Shows all 9 platform tabs + "ALL"
- "+ Connect Platform" button is hidden
- Header may require horizontal scroll on smaller screens

### 4. Project Switch
```typescript
// User switches from Project A (3 platforms) to Project B (5 platforms)
// → useConnectedPlatforms detects project change
// → Fetches connections for Project B
// → Header updates to show Project B's 5 platforms
```

### 5. Loading State
- While connections are loading, shows empty array
- User sees only "ALL" tab briefly
- Once loaded, platforms populate smoothly

### 6. API Error
- If connections API fails, falls back to empty array
- User sees only "ALL" tab
- "+ Connect Platform" button still shows
- Error logged to console

---

## Component Dependencies

```
AppHeader.tsx
  ├── useConnectedPlatforms.tsx (new)
  │   ├── useProject (ProjectContext)
  │   └── connectionsAPI (api.ts)
  ├── PlatformIcon.tsx
  ├── Tabs components (ui/tabs.tsx)
  └── useAuth (AuthContext)
```

---

## Future Enhancements

### 1. Connection Status Indicators
Add visual indicators to show connection health:
```typescript
<TabsTrigger>
  <PlatformIcon platform={platform.id} />
  {connectionStatus === 'warning' && <AlertCircle className="w-3 h-3 text-warning" />}
</TabsTrigger>
```

### 2. Quick Connect from Header
Allow connecting platforms directly from header without full settings page:
```typescript
<Popover>
  <PopoverTrigger>+ Connect Platform</PopoverTrigger>
  <PopoverContent>
    {/* Quick connect UI */}
  </PopoverContent>
</Popover>
```

### 3. Platform Groups
For users with many platforms, group them by category:
```typescript
const platformGroups = {
  social: ['twitter', 'instagram', 'facebook'],
  professional: ['linkedin', 'blog'],
  video: ['youtube', 'tiktok'],
  visual: ['pinterest']
};
```

### 4. Favorite Platforms
Allow users to pin/favorite specific platforms to always show first:
```typescript
const pinnedPlatforms = user.preferences.pinnedPlatforms;
const sortedPlatforms = [
  ...connectedPlatforms.filter(p => pinnedPlatforms.includes(p)),
  ...connectedPlatforms.filter(p => !pinnedPlatforms.includes(p))
];
```

### 5. Connection Health Monitoring
Show last sync time and alert if connection is stale:
```typescript
const needsReauth = platform.lastSync < Date.now() - (30 * 24 * 60 * 60 * 1000);
```

---

## Testing Checklist

### Manual Testing

- [ ] **Zero Platforms**
  - [ ] Shows only "ALL" tab
  - [ ] Shows "+ Connect Platform" button
  - [ ] Shows "No platforms connected yet" text
  - [ ] Clicking "+ Connect Platform" navigates to Settings → Connections

- [ ] **One Platform Connected**
  - [ ] Shows "ALL" + connected platform tab
  - [ ] Shows "+ Connect Platform" button
  - [ ] Can switch between "ALL" and platform tab
  - [ ] Selected platform persists when navigating between views

- [ ] **Multiple Platforms Connected**
  - [ ] All connected platforms appear in header
  - [ ] Platforms appear in consistent order
  - [ ] "+ Connect Platform" button shows at the end
  - [ ] Platform icons display correctly

- [ ] **All 9 Platforms Connected**
  - [ ] All platforms visible in header
  - [ ] "+ Connect Platform" button is hidden
  - [ ] May need horizontal scroll on small screens

- [ ] **Disconnecting Active Platform**
  - [ ] Currently viewing "Twitter" tab
  - [ ] Disconnect Twitter in Settings
  - [ ] Auto-switches to "ALL" tab
  - [ ] Twitter tab disappears

- [ ] **Project Switching**
  - [ ] Switch between projects with different platform connections
  - [ ] Platform tabs update immediately
  - [ ] Selected platform resets appropriately
  - [ ] No stale data from previous project

- [ ] **Responsive Design**
  - [ ] Desktop: Shows platform names
  - [ ] Mobile: Shows only icons (names hidden)
  - [ ] "+ Connect Platform" text hidden on mobile
  - [ ] All tabs remain accessible

- [ ] **Multi-View Compatibility**
  - [ ] Platform filters show on: Home, Calendar, Inbox, Analytics, Library
  - [ ] Platform filters hidden on: Compose, Settings, Notifications
  - [ ] Selected platform persists across compatible views

---

## Migration Notes

### Backward Compatibility
- ✅ No breaking changes to existing components
- ✅ Settings → Connections still works as before
- ✅ All existing platform connection logic preserved
- ✅ Only affects header display, not functionality

### Database
- ✅ No database migrations required
- ✅ Uses existing platform connections data structure
- ✅ No new API endpoints needed

### Deployment
- ✅ Safe to deploy without downtime
- ✅ New hook gracefully handles empty state
- ✅ Falls back to showing only "ALL" if API fails

---

## Conclusion

The dynamic platform filters provide a cleaner, more intuitive interface that adapts to each user's specific platform connections. By showing only relevant platforms and providing clear calls-to-action, users can focus on their actual workflow without unnecessary clutter.

The "+ Connect Platform" button serves as both a useful tool for expanding platform coverage and a gentle nudge for new users to get started with their first connection.
