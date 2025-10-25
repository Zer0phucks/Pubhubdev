# Platform Filters Fix

## Issue
The platform filters in the AppHeader weren't being displayed dynamically based on connected platforms because projects weren't initializing with a proper connections structure.

## Root Cause
When projects were created (both default and new projects), the `project:${projectId}:connections` key was not being initialized in the KV store. This caused the `useConnectedPlatforms` hook to return an empty array, which meant only the "ALL" tab would show in the header.

## Solution
Modified the backend server to properly initialize connections for all projects:

### 1. Default Project Initialization (`/auth/initialize` endpoint)
- Now creates `project:${defaultProjectId}:connections` with all 9 platforms set to `connected: false`
- Also initializes project-specific arrays for posts, templates, and automations

### 2. New Project Creation (`POST /projects` endpoint)
- Initializes connections array with all platforms when creating a new project
- Ensures each project starts with a clean slate of platform connections

### 3. GET Connections Endpoint Enhancement
- Added fallback logic to auto-initialize connections if they don't exist
- Returns default platform structure with all platforms set to `connected: false`
- Automatically saves these defaults for future requests

## Platform Structure
Each project's connections are stored as:
```javascript
[
  { platform: 'twitter', connected: false },
  { platform: 'instagram', connected: false },
  { platform: 'linkedin', connected: false },
  { platform: 'facebook', connected: false },
  { platform: 'youtube', connected: false },
  { platform: 'tiktok', connected: false },
  { platform: 'pinterest', connected: false },
  { platform: 'reddit', connected: false },
  { platform: 'blog', connected: false },
]
```

When users connect a platform via Settings > Connections, the `connected` flag is set to `true` and the platform tab appears in the header.

## How It Works

1. **AppHeader** uses the `useConnectedPlatforms` hook
2. **useConnectedPlatforms** calls `connectionsAPI.getAll(currentProject.id)`
3. Backend returns all platforms for that project with their connection status
4. Hook filters to only return platforms where `connected: true`
5. AppHeader dynamically builds the tab list with "ALL" + connected platforms
6. "Connect Platform" button shows if there are unconnected platforms

## Testing
- New users will see only "ALL" tab initially
- After connecting a platform in Settings, that platform's tab appears in the header
- Switching projects shows only the platforms connected to that project
- Each account can only be connected to one project (enforced by validation)
