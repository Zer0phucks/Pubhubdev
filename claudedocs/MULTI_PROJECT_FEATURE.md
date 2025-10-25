# Multi-Project Feature Implementation

## Overview
PubHub now supports multiple projects, enabling agencies and digital marketing professionals to manage multiple campaigns with separate social media accounts. Each social media account can only be linked to one project at a time, ensuring clean separation of campaigns.

## Key Features

### 1. **Project Management**
- Create unlimited projects for different clients or campaigns
- Each project has:
  - Name and description
  - Unique set of connected social accounts
  - Separate content calendar and posts
  - Own analytics and connections
- One project is marked as "default" (cannot be deleted)

### 2. **Project Switcher**
- Located at the top of the sidebar
- Quick dropdown to switch between projects
- Shows current project with visual indicator
- Create new projects directly from the switcher

### 3. **Data Isolation**
- **Posts**: Each post belongs to one project
- **Connections**: Social media accounts are exclusive to one project
- **Calendar**: Content calendar is scoped to current project
- **Analytics**: Dashboard shows data for current project only

### 4. **Account Protection**
- Backend validation prevents connecting the same social account to multiple projects
- Clear error messages when attempting duplicate connections
- Example: "This Twitter account is already connected to project 'Client A Campaign'"

## User Interface

### Sidebar Project Switcher
```
┌─────────────────────┐
│  🗂️ My First Project │ ← Click to open dropdown
└─────────────────────┘
```

### Project Management (Settings → Projects)
- View all projects in card layout
- Edit project name and description
- Delete projects (except default)
- Switch to different project
- Visual badges for "Current" and "Default" projects

### Visual Indicators
- Yellow alert shown when no project is selected
- Project name visible in switcher at all times
- "Current" badge on active project in settings

## Backend Architecture

### Data Structure
```
Database Keys:
- user:{userId}:projects → Array of project IDs
- user:{userId}:currentProject → Current project ID
- project:{projectId} → Project object
- project:{projectId}:posts → Array of post IDs
- project:{projectId}:connections → Array of connections
```

### API Endpoints

#### Projects
- `GET /projects` - List all user projects
- `GET /projects/current` - Get current project
- `PUT /projects/current` - Set current project
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

#### Scoped Data
- `GET /posts?projectId=xxx` - Get posts for project
- `GET /connections?projectId=xxx` - Get connections for project
- `POST /posts` with `projectId` - Create post in project
- `PUT /connections` with `projectId` - Update project connections

### Validation Rules
1. Cannot delete default project
2. Cannot connect same account to multiple projects
3. When deleting project, automatically switches to another project
4. All data operations require valid project context

## Usage Flow

### For Individual Creators
1. Start with default "My First Project"
2. Connect social accounts
3. Create and schedule content
4. (Optional) Create additional projects for different content themes

### For Agencies
1. Create project per client (e.g., "Client A - Q1 Campaign")
2. Connect client's social accounts to their project
3. Switch between projects using sidebar switcher
4. Manage multiple campaigns independently
5. Each client's data remains isolated

### For Digital Marketers
1. Create projects for different brands or products
2. Connect separate accounts for each brand
3. Schedule content for each brand independently
4. Track performance per project

## Key Benefits

### Organization
- Clear separation between campaigns/clients
- Easy to find content by project
- Reduced clutter and confusion

### Scalability
- Manage unlimited clients/campaigns
- Add team members to specific projects (future enhancement)
- Scale without mixing data

### Security
- Account protection prevents accidental cross-posting
- Data isolation ensures privacy
- Clear audit trail per project

### Flexibility
- Switch contexts instantly
- Work on multiple campaigns simultaneously
- Customize workflows per project

## Technical Implementation

### Components Created
1. `/components/ProjectContext.tsx` - React context for project state
2. `/components/ProjectSwitcher.tsx` - Dropdown switcher component
3. `/components/CreateProjectDialog.tsx` - Project creation modal
4. `/components/ProjectManagement.tsx` - Full management interface

### Components Updated
1. `/App.tsx` - Added ProjectProvider and ProjectSwitcher
2. `/components/Settings.tsx` - Added Projects tab
3. `/components/DashboardOverview.tsx` - Scoped to current project
4. `/components/ContentCalendar.tsx` - Scoped to current project
5. `/components/ContentComposer.tsx` - Includes projectId in posts
6. `/components/PlatformConnections.tsx` - Project-scoped connections

### API Updates
1. `/utils/api.ts` - Added projectId support to endpoints
2. `/supabase/functions/server/index.tsx` - Full backend implementation

## Migration Notes

### Existing Users
- On first login after update, default project is auto-created
- All existing posts and connections are preserved
- Backward compatibility maintained for legacy data

### New Users
- Default project created during signup
- Onboarding guides to project creation
- Sample content can be project-specific

## Future Enhancements

### Potential Features
1. **Team Collaboration**: Invite team members to specific projects
2. **Project Templates**: Pre-configured project setups
3. **Cross-Project Analytics**: Compare performance across projects
4. **Project Archiving**: Archive completed campaigns
5. **Project Sharing**: Share read-only access with clients
6. **Bulk Operations**: Move posts between projects
7. **Project Colors**: Visual color coding for quick identification
8. **Project Icons**: Custom icons for each project

## Best Practices

### Naming Projects
- Use clear, descriptive names: "Acme Corp - Q1 2025"
- Include client name, campaign, or time period
- Keep names concise for sidebar display

### Project Organization
- One project per client (for agencies)
- One project per brand (for multi-brand companies)
- One project per campaign (for seasonal campaigns)
- Consider timeframe in naming (Q1, Spring, 2025)

### Account Management
- Review connected accounts before switching projects
- Double-check active project before posting
- Use project descriptions to document account details

## Troubleshooting

### Common Issues

**Issue**: "Account already connected to another project"
- **Solution**: Disconnect account from other project first, or use different account

**Issue**: Cannot delete project
- **Solution**: Ensure it's not the default project. Switch to another project first.

**Issue**: Content not showing
- **Solution**: Check if correct project is selected in sidebar switcher

**Issue**: No project selected warning
- **Solution**: Click project switcher and select a project

## Summary

The multi-project feature transforms PubHub from a personal tool into a professional platform capable of managing multiple clients, campaigns, and brands simultaneously. With robust data isolation, intuitive UI, and backend validation, it's now ready to support agencies and marketing teams at scale.
