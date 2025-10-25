# PubHub Architecture Guide

## Component Structure

### Core Application
- **App.tsx** - Main application container
  - Manages global state (view, platform, theme, settings)
  - Handles keyboard shortcuts
  - Coordinates all major components

### Layout Components
- **Sidebar** (from shadcn/ui)
  - Clean 6-item navigation menu
  - No platform submenu (moved to header)
  
- **AppHeader** 
  - Dynamic page title and breadcrumbs
  - Context-aware platform selector
  - Global search bar (opens command palette)
  - Create post button (always accessible)
  - Notification center
  - User menu

### Feature Components
- **DashboardOverview** - Analytics and overview
- **ContentComposer** - Multi-platform post creation
- **UnifiedInbox** - Centralized message management
- **ContentCalendar** - Visual scheduling interface
- **AIAssistant** - Platform-specific insights
- **PlatformConnections** - Social media account management

### Utility Components
- **AIChatDialog** - AI-powered conversational assistant (⌘K)
- **CommandPalette** - Quick navigation (⌘⇧K)
- **SettingsPanel** - User preferences
- **EmptyState** - Reusable empty state UI
- **LoadingState** - Reusable loading UI
- **StatusBadge** - Color-coded status indicators

### Brand Components
- **PubHubLogo** - Brand identity
- **PlatformIcon** - Platform-specific icons with brand colors

## Information Flow

### Platform Selection
```
User selects platform in header
  ↓
App.tsx updates selectedPlatform state
  ↓
Platform persists across Compose, Calendar, and Insights views
  ↓
Platform selector only visible on relevant pages
```

### Navigation
```
Option 1: Sidebar Click
  ↓
App.tsx updates currentView state
  ↓
renderContent() switches component

Option 2: Keyboard Shortcut
  ↓
App.tsx keyboard listener
  ↓
Updates currentView state

Option 3: Command Palette (⌘K)
  ↓
CommandPalette.onNavigate()
  ↓
App.tsx updates currentView state
```

### Theme Management
```
User opens Settings (⌘,)
  ↓
SettingsPanel component
  ↓
User selects theme
  ↓
App.tsx updates theme state
  ↓
useEffect applies dark class to document
```

## State Management

### Global State (App.tsx)
- `currentView` - Active page/section
- `selectedPlatform` - Currently selected platform
- `theme` - Light or dark mode
- `aiChatOpen` - AI chat dialog visibility
- `settingsOpen` - Settings panel visibility
- `commandPaletteOpen` - Command palette visibility

### Derived State
- Page title (computed from currentView)
- Breadcrumbs (computed from currentView + selectedPlatform)
- Platform selector visibility (based on currentView)

## Keyboard Shortcuts

### Global Shortcuts (Always Active)
- `⌘K` - Open AI chat assistant
- `⌘⇧K` - Open command palette (quick navigation)
- `⌘,` - Open settings
- `⌘N` - New post (navigate to composer)

### Navigation Shortcuts (Context-Aware)
- `⌘D` - Dashboard
- `⌘I` - Inbox
- `⌘C` - Calendar (when not in text input)
- `⌘A` - Insights (when not in text input)
- `⌘P` - Connections (when not in text input)

## Design System

### Colors
- **Brand**: Emerald/Teal gradient
- **Status**: Success (green), Warning (amber), Error (red), Info (blue)
- **Platforms**: Brand-specific colors per platform

### Spacing
- Mobile: `p-4`
- Tablet: `p-6`
- Desktop: `p-8`

### Typography
- Handled by Tailwind v4 custom typography
- Consistent heading hierarchy
- No manual font sizing unless necessary

## Data Flow (Future)

### When Backend is Connected
```
User Action
  ↓
Component calls Supabase
  ↓
Server processes request
  ↓
Database updated
  ↓
UI reflects changes
```

## Best Practices

### Adding a New View
1. Create component in `/components`
2. Add to View type in App.tsx
3. Add menu item to menuItems array
4. Add case to renderContent() switch
5. Add keyboard shortcut (optional)
6. Add to CommandPalette pages array

### Adding a New Platform
1. Add to Platform type
2. Add platform icon to PlatformIcon component
3. Add to platforms array in App.tsx
4. Update platform-specific components

### State Updates
- Always use setState functions from App.tsx
- Pass callbacks down as props
- Keep state as high as necessary, as low as possible

## Performance Considerations

### Code Splitting
- Currently all components loaded upfront
- Future: Lazy load components with React.lazy()

### Memoization
- Use React.memo() for expensive components
- Use useMemo() for expensive computations
- Use useCallback() for stable function references

## Accessibility

### Keyboard Navigation
- All actions accessible via keyboard
- Focus management in modals
- ARIA labels on interactive elements

### Screen Readers
- Semantic HTML structure
- Proper heading hierarchy
- Alt text on images (when applicable)

## Future Enhancements

### Workspace Concept
- Multiple workspaces per user
- Per-workspace platform connections
- Workspace switcher in header

### Real-time Updates
- WebSocket connection for notifications
- Live collaboration features
- Real-time analytics updates

### Advanced Search
- Full-text search across all content
- Filter by platform, date, status
- Saved searches

### AI Integration
- Contextual AI assistance in composer
- Smart scheduling suggestions
- Automated content optimization
