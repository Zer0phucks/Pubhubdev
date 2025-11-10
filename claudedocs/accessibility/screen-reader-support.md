# Screen Reader Support Guide

Comprehensive guide to using PubHub with screen readers.

## Supported Screen Readers

PubHub is tested and optimized for the following screen readers:

### Windows
- **NVDA** (NonVisual Desktop Access)
  - Version: 2024.1 and later
  - Status: ✅ Fully Supported
  - Free download: [nvaccess.org](https://www.nvaccess.org/)

- **JAWS** (Job Access With Speech)
  - Version: 2024 and later
  - Status: ✅ Fully Supported
  - Commercial software: [FreedomScientific.com](https://www.freedomscientific.com/products/software/jaws/)

### macOS / iOS
- **VoiceOver**
  - Version: Built into macOS 13+ and iOS 16+
  - Status: ✅ Fully Supported
  - Built-in to Apple devices

### Android
- **TalkBack**
  - Version: Latest version from Google Play
  - Status: ✅ Supported
  - Free from Google Play Store

### Linux
- **Orca**
  - Version: Latest version
  - Status: ⚠️ Limited testing, should work
  - Built into GNOME desktop

---

## Getting Started

### First-Time Users

1. **Enable Your Screen Reader**
   - Windows (NVDA): Press `Ctrl+Alt+N`
   - Windows (JAWS): Press `Ctrl+Alt+J`
   - macOS: Press `⌘+F5`
   - iOS: Triple-click home button or side button
   - Android: Settings → Accessibility → TalkBack

2. **Navigate to PubHub**
   - Open browser (Chrome, Firefox, Safari, or Edge recommended)
   - Go to https://pubhub.dev
   - Screen reader will announce: "PubHub, web page, main landmark"

3. **Explore the Interface**
   - Use heading navigation to understand page structure
   - Use landmark navigation to jump between sections
   - Tab through interactive elements to learn the layout

---

## Navigation Strategies

### Landmark Navigation

PubHub uses ARIA landmarks for easy navigation:

| Landmark | Shortcut (NVDA/JAWS) | Purpose |
|----------|----------------------|---------|
| Main | `D` | Main content area |
| Navigation | `N` | Primary navigation menu |
| Search | `S` | Search functionality |
| Form | `F` | Form elements |
| Banner | `B` | Header/banner area |
| Contentinfo | `I` | Footer information |

**Example**: Press `D` to jump directly to main content, skipping navigation.

### Heading Navigation

PubHub uses a logical heading structure:

| Level | Purpose | Example |
|-------|---------|---------|
| H1 | Page title | "Project Overview", "Compose", "Analytics" |
| H2 | Major sections | "Recent Posts", "Platform Stats", "Inbox" |
| H3 | Subsections | "Twitter Analytics", "Engagement Metrics" |
| H4+ | Minor sections | Specific widget titles, card headers |

**Navigation**:
- Next heading: `H` (NVDA/JAWS)
- Previous heading: `Shift+H`
- Heading level 1: `1`
- Heading level 2: `2`
- Etc.

### Interactive Elements

Tab through buttons, links, and form controls:

| Element Type | How to Find | Shortcut (NVDA/JAWS) |
|--------------|-------------|----------------------|
| Links | Press `K` | Next link |
| Buttons | Press `B` | Next button |
| Form Fields | Press `F` | Next form field |
| Checkboxes | Press `X` | Next checkbox |
| Radio Buttons | Press `R` | Next radio button |
| Edit Fields | Press `E` | Next edit field |

---

## Using Key Features

### Navigation Menu (Sidebar)

**Location**: Left side of screen, navigation landmark

**Structure**:
- Heading: "Navigation"
- List of 6-8 navigation links
- Current page has `aria-current="page"` attribute

**Screen Reader Output**:
```
"Navigation, region"
"List with 6 items"
"Dashboard, link, current page"
"Compose, link"
"Inbox, link"
...
```

**How to Use**:
1. Press `N` to jump to navigation landmark
2. Press `Down Arrow` to navigate through links
3. Press `Enter` to activate a link

### Command Palette

**Keyboard Shortcut**: `⌘K` or `Ctrl+K`

**Purpose**: Quick navigation to any section

**Screen Reader Output**:
```
"Command palette, dialog"
"Quick navigation, edit, combo box"
"Navigation, group heading"
"List with 10 items"
"Dashboard, menu item, 1 of 10"
```

**How to Use**:
1. Press `⌘K` to open
2. Type to filter options (e.g., "inbox")
3. Use `↑`/`↓` arrows to navigate
4. Press `Enter` to select
5. Press `Esc` to close

### Content Composer

**Location**: Compose page, main landmark

**Form Elements**:
- Platform selector (combo box)
- Post content (multi-line text field)
- Media upload (button)
- Schedule date/time (date picker)
- Publish button

**Screen Reader Output**:
```
"Compose post, heading level 1"
"Select platform, combo box, Twitter"
"Post content, edit, multi-line"
"Upload media, button"
"Schedule for later, checkbox, not checked"
"Publish, button"
```

**How to Use**:
1. Tab through form fields
2. Select platform with `↑`/`↓` arrows
3. Type post content
4. Tab to "Publish" button
5. Press `Space` or `Enter` to publish

### Calendar View

**Location**: Calendar page, main landmark

**Structure**:
- View switcher (button group: Day, Week, Month)
- Date navigation (Previous/Today/Next)
- Calendar grid (table with posts)

**Screen Reader Output**:
```
"Calendar view, heading level 1"
"Month view, button, pressed"
"January 2025, heading level 2"
"Calendar grid, table with 35 cells"
"January 15, cell, contains 2 posts"
"Twitter post scheduled for 10:00 AM"
```

**How to Use**:
1. Use heading navigation to find calendar
2. Tab to view switcher buttons
3. Use arrow keys to navigate calendar grid
4. Press `Enter` on a date to view details

### Analytics Dashboard

**Location**: Analytics page, main landmark

**Structure**:
- Platform filter (select)
- Date range picker
- Metrics cards (stats with live data)
- Charts (labeled with data tables)

**Screen Reader Output**:
```
"Analytics, heading level 1"
"Platform, All platforms, combo box"
"Engagement rate, 45.2%, heading level 3"
"Engagement over time, chart"
"Data table: Date, Likes, Comments, Shares"
```

**How to Use**:
1. Navigate by headings to find metrics
2. Tab through interactive filters
3. Use table navigation for chart data tables
4. Use landmark navigation to jump between sections

### Unified Inbox

**Location**: Inbox page, main landmark

**Structure**:
- Filter tabs (All, Unread, Mentions)
- Message list (each message is a list item)
- Message detail panel

**Screen Reader Output**:
```
"Inbox, heading level 1"
"All messages, tab, selected"
"Messages, list with 15 items"
"Twitter mention from @user, list item 1 of 15, unread"
"Message preview: Great post! Thanks for sharing..."
```

**How to Use**:
1. Tab to filter tabs, use `←`/`→` arrows
2. Press `Down Arrow` to navigate message list
3. Press `Enter` to open message details
4. Tab through actions (Reply, Archive, etc.)

---

## ARIA Announcements

PubHub uses ARIA live regions to announce dynamic content:

### Status Updates

**Announced Automatically**:
- "Post published successfully"
- "Draft saved"
- "Connection established"
- "Loading analytics data"
- "3 new messages"

**ARIA Live Region Types**:
- `aria-live="polite"`: Announced at next pause
- `role="status"`: Status messages
- `role="alert"`: Important errors

### Loading States

**Announced**:
- "Loading..." (when content is fetching)
- "Content loaded" (when complete)
- Progress indicators for long operations

**Example**:
```
"Analytics page, heading level 1"
"Loading analytics data..."
[...wait 2 seconds...]
"Analytics loaded, showing data for All platforms"
```

### Error Messages

**Announced Immediately**:
- Form validation errors
- Connection errors
- Permission errors

**Example**:
```
"Post content, edit, required, invalid"
"Error: Post content cannot be empty"
```

---

## Forms & Input

### Form Labels

All form fields have associated labels:

**Good Example**:
```
"Email address, edit, required"
[Type: user@example.com]
"Email address, edit, user@example.com"
```

### Required Fields

Required fields are marked with `aria-required`:

**Announced**:
```
"Post content, edit, multi-line, required"
```

### Error Messages

Errors are associated with fields using `aria-describedby`:

**Announced**:
```
"Email address, edit, required, invalid"
"Error: Please enter a valid email address"
```

### Help Text

Help text is associated with `aria-describedby`:

**Announced**:
```
"Bio, edit, multi-line"
"Tell us about yourself. Max 160 characters."
```

---

## Known Issues & Workarounds

### Issue 1: Icon-Only Buttons May Not Have Labels

**Status**: Being fixed
**Impact**: Some icon buttons may not announce their purpose
**Workaround**: Use command palette (`⌘K`) for navigation

### Issue 2: Some Gradient Text May Be Hard to Read

**Status**: Being fixed
**Impact**: Low contrast in dark theme for some users
**Workaround**: Switch to light theme in Settings

### Issue 3: Loading States Not Always Announced

**Status**: Being fixed
**Impact**: May not hear when content is loading
**Workaround**: Wait for content to appear, or tab to next element and back

---

## Tips for Screen Reader Users

### 1. Use Landmark Navigation

Fastest way to navigate:
- `D` for main content
- `N` for navigation menu
- `S` for search

### 2. Learn Heading Structure

Use heading navigation (`H`) to understand page layout:
- H1: Page title
- H2: Major sections
- H3: Subsections

### 3. Use Command Palette

`⌘K` opens quick navigation:
- Faster than tabbing through menus
- Searchable list of all pages
- Keyboard accessible

### 4. Tab Through Forms

Most efficient form navigation:
1. Tab to first field
2. Fill in information
3. Tab to next field
4. Repeat until "Submit" button

### 5. Check for Live Regions

Listen for automatic announcements:
- Status updates
- Error messages
- Loading states

### 6. Explore with Browse Mode

NVDA/JAWS browse mode (default):
- Use arrow keys to read content
- Press `Enter` on links/buttons to activate
- Press `Tab` to jump between interactive elements

---

## Browser Recommendations

### Best Experience

1. **Chrome** - Excellent with NVDA and JAWS
2. **Firefox** - Great with NVDA and Orca
3. **Safari** - Best with VoiceOver on macOS/iOS
4. **Edge** - Good with NVDA and JAWS

### Settings to Enable

**Chrome**:
- Settings → Accessibility → Enable accessibility features
- Consider installing [Screen Reader extension](https://chrome.google.com/webstore/detail/screen-reader/)

**Firefox**:
- Accessibility features auto-enabled when screen reader detected

**Safari**:
- VoiceOver automatically optimizes Safari

---

## Reporting Issues

### How to Report Screen Reader Problems

**Include in Your Report**:
1. Screen reader name and version
2. Browser name and version
3. Operating system
4. Page/feature with the issue
5. Steps to reproduce
6. Expected vs actual announcement

**Example Report**:
```
Screen Reader: NVDA 2024.1
Browser: Chrome 120
OS: Windows 11
Issue: On Compose page, "Upload media" button not announced
Steps: 1. Navigate to Compose, 2. Tab to media button
Expected: "Upload media, button"
Actual: No announcement
```

**Contact**: accessibility@pubhub.dev

---

## Testing Checklist

Want to help test PubHub with your screen reader?

### Basic Navigation
- [ ] Page title announced
- [ ] Headings navigable
- [ ] Landmarks navigable
- [ ] Links announced with purpose
- [ ] Buttons announced with labels

### Forms
- [ ] All fields have labels
- [ ] Required fields indicated
- [ ] Errors announced and associated
- [ ] Help text available

### Dynamic Content
- [ ] Status messages announced
- [ ] Loading states announced
- [ ] Error messages announced
- [ ] Success confirmations announced

### Interactive Components
- [ ] Modals announce correctly
- [ ] Dropdowns navigable
- [ ] Tabs work with arrow keys
- [ ] Tables have headers
- [ ] Charts have data tables

---

## Additional Resources

### Screen Reader Training
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [JAWS Training](https://www.freedomscientific.com/training/jaws/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/)
- [TalkBack Tutorial](https://support.google.com/accessibility/android/answer/6283677)

### Web Accessibility
- [WebAIM Screen Reader Users Survey](https://webaim.org/projects/screenreadersurvey/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Deque University](https://dequeuniversity.com/)

---

**Screen Reader Support Version**: 1.0
**Last Updated**: January 9, 2025
**Status**: Living Document (updated as features improve)

For questions or assistance, contact accessibility@pubhub.dev
