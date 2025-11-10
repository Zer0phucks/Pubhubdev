# Accessibility Implementation Guide for Developers

Practical guide for implementing accessibility in PubHub components.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Component Accessibility Patterns](#component-accessibility-patterns)
3. [ARIA Labels & Roles](#aria-labels--roles)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Focus Management](#focus-management)
6. [Color & Contrast](#color--contrast)
7. [Forms & Validation](#forms--validation)
8. [Dynamic Content](#dynamic-content)
9. [Testing](#testing)
10. [Common Mistakes](#common-mistakes)

---

## Core Principles

### The Four Principles (POUR)

1. **Perceivable**: Users must be able to perceive the information
2. **Operable**: Users must be able to operate the interface
3. **Understandable**: Users must be able to understand the information
4. **Robust**: Content must work with current and future technologies

### Accessibility First

- **Design with accessibility** from the start, not as an afterthought
- **Test with keyboard** before considering PR complete
- **Use semantic HTML** before reaching for ARIA
- **Leverage Radix UI** for complex components

---

## Component Accessibility Patterns

### Buttons

#### Icon-Only Buttons

**❌ Bad**:
```tsx
<button>
  <XIcon />
</button>
```

**✅ Good**:
```tsx
<button aria-label="Close">
  <XIcon aria-hidden="true" />
</button>
```

#### Buttons with Icons and Text

**✅ Good** (icon is decorative):
```tsx
<button>
  <PlusIcon aria-hidden="true" />
  Add Post
</button>
```

#### Toggle Buttons

**✅ Good**:
```tsx
<button
  aria-pressed={isActive}
  aria-label="Toggle dark mode"
>
  {isActive ? <MoonIcon /> : <SunIcon />}
</button>
```

### Links

#### Descriptive Link Text

**❌ Bad**:
```tsx
<a href="/docs">Click here</a>
```

**✅ Good**:
```tsx
<a href="/docs">Read documentation</a>
```

#### Links Opening in New Tab

**✅ Good**:
```tsx
<a
  href="https://external.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Visit external site (opens in new tab)"
>
  Visit Site
  <ExternalLinkIcon aria-hidden="true" />
</a>
```

### Images

#### Informative Images

**✅ Good**:
```tsx
<img
  src="/charts/analytics.png"
  alt="Bar chart showing engagement increase from January to March 2025"
/>
```

#### Decorative Images

**✅ Good**:
```tsx
<img
  src="/decorations/pattern.svg"
  alt=""
  role="presentation"
/>
```

#### Icons as Images

**✅ Good** (use Lucide React instead):
```tsx
import { AlertCircle } from "lucide-react";

<AlertCircle aria-label="Warning" />
```

### Forms

#### Text Inputs

**✅ Good**:
```tsx
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-describedby="email-help"
  />
  <p id="email-help">We'll never share your email</p>
</div>
```

#### Form Validation

**✅ Good**:
```tsx
<div>
  <label htmlFor="username">Username</label>
  <input
    id="username"
    type="text"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "username-error" : undefined}
  />
  {hasError && (
    <p id="username-error" role="alert">
      Username must be at least 3 characters
    </p>
  )}
</div>
```

#### Checkboxes & Radio Buttons

**✅ Good**:
```tsx
<fieldset>
  <legend>Select platforms to publish to</legend>
  <label>
    <input type="checkbox" name="platforms" value="twitter" />
    Twitter
  </label>
  <label>
    <input type="checkbox" name="platforms" value="instagram" />
    Instagram
  </label>
</fieldset>
```

### Modals/Dialogs

**✅ Good** (using Radix UI):
```tsx
import { Dialog } from "@radix-ui/react-dialog";

<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Trigger asChild>
    <button>Open Settings</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="overlay" />
    <Dialog.Content
      aria-describedby="dialog-description"
    >
      <Dialog.Title>Settings</Dialog.Title>
      <Dialog.Description id="dialog-description">
        Adjust your account settings
      </Dialog.Description>
      {/* Content */}
      <Dialog.Close asChild>
        <button aria-label="Close">
          <XIcon aria-hidden="true" />
        </button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Dropdowns/Select

**✅ Good** (using Radix UI):
```tsx
import { Select } from "@radix-ui/react-select";

<Select.Root value={platform} onValueChange={setPlatform}>
  <Select.Trigger aria-label="Select platform">
    <Select.Value placeholder="Choose platform" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.Item value="twitter">
        <Select.ItemText>Twitter</Select.ItemText>
      </Select.Item>
      <Select.Item value="instagram">
        <Select.ItemText>Instagram</Select.ItemText>
      </Select.Item>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

### Tables

**✅ Good**:
```tsx
<table>
  <caption>Analytics for January 2025</caption>
  <thead>
    <tr>
      <th scope="col">Platform</th>
      <th scope="col">Followers</th>
      <th scope="col">Engagement</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Twitter</th>
      <td>10,523</td>
      <td>4.2%</td>
    </tr>
  </tbody>
</table>
```

---

## ARIA Labels & Roles

### When to Use ARIA

**Semantic HTML First**:
- Use `<button>`, `<a>`, `<input>` instead of `<div>` with ARIA
- ARIA doesn't add functionality, only semantics
- "No ARIA is better than bad ARIA"

### Common ARIA Attributes

#### aria-label

Use when there's no visible label:

```tsx
<button aria-label="Delete post">
  <TrashIcon />
</button>
```

#### aria-labelledby

Use to reference existing text:

```tsx
<section aria-labelledby="analytics-heading">
  <h2 id="analytics-heading">Analytics</h2>
  {/* content */}
</section>
```

#### aria-describedby

Use for additional context:

```tsx
<button
  aria-label="Delete"
  aria-describedby="delete-warning"
>
  Delete
</button>
<p id="delete-warning">This action cannot be undone</p>
```

#### aria-live

Announce dynamic content:

```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>
```

**Politeness Levels**:
- `polite`: Announce at next pause (default)
- `assertive`: Interrupt current announcement (use sparingly)
- `off`: Don't announce

#### aria-current

Indicate current item in navigation:

```tsx
<nav>
  <a href="/dashboard" aria-current="page">Dashboard</a>
  <a href="/compose">Compose</a>
  <a href="/inbox">Inbox</a>
</nav>
```

### Landmark Roles

**✅ Good**:
```tsx
<header role="banner">
  {/* Site header */}
</header>

<nav role="navigation" aria-label="Main navigation">
  {/* Primary navigation */}
</nav>

<main role="main">
  {/* Primary content */}
</main>

<aside role="complementary" aria-label="Related posts">
  {/* Sidebar */}
</aside>

<footer role="contentinfo">
  {/* Site footer */}
</footer>
```

---

## Keyboard Navigation

### Tab Order

**Ensure logical tab order**:
- Top to bottom, left to right
- Skip decorative elements
- Include all interactive elements

**Control tab order with `tabIndex`**:
- `tabIndex={0}`: In natural tab order
- `tabIndex={-1}`: Focusable via JavaScript, not in tab order
- `tabIndex={1+}`: **Avoid** (creates confusing tab order)

### Keyboard Event Handlers

**✅ Good**:
```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Custom Button
</div>
```

**Better**: Use `<button>` instead:
```tsx
<button onClick={handleClick}>
  Custom Button
</button>
```

### Arrow Key Navigation

For lists, menus, tabs:

```tsx
function Menu({ items }) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(items.length - 1);
    }
  };

  return (
    <div role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <button
          key={item.id}
          role="menuitem"
          tabIndex={index === focusedIndex ? 0 : -1}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

---

## Focus Management

### Focus Indicators

**✅ Good** (Tailwind CSS):
```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</button>
```

### Focus Trapping in Modals

**✅ Good** (Radix UI handles this):
```tsx
<Dialog.Content>
  {/* Focus automatically trapped */}
</Dialog.Content>
```

**Manual Implementation**:
```tsx
useEffect(() => {
  if (isOpen) {
    const firstFocusable = dialogRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (firstFocusable as HTMLElement)?.focus();
  }
}, [isOpen]);
```

### Returning Focus

**✅ Good**:
```tsx
function Modal({ isOpen, onClose }) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // ... modal content
}
```

---

## Color & Contrast

### Contrast Ratios (WCAG AA)

- **Normal text** (< 18pt): 4.5:1 minimum
- **Large text** (≥ 18pt or 14pt bold): 3:1 minimum
- **UI components**: 3:1 minimum

### Testing Contrast

Use WebAIM Contrast Checker or browser DevTools:

```tsx
// ✅ Good contrast
<p className="text-gray-900 dark:text-gray-100">
  Regular text with sufficient contrast
</p>

// ❌ Bad contrast
<p className="text-gray-400">
  Low contrast text (may fail in light theme)
</p>
```

### Don't Rely on Color Alone

**❌ Bad**:
```tsx
<span className="text-red-500">Error</span>
<span className="text-green-500">Success</span>
```

**✅ Good**:
```tsx
<span className="text-red-500">
  <AlertCircle aria-hidden="true" /> Error
</span>
<span className="text-green-500">
  <CheckCircle aria-hidden="true" /> Success
</span>
```

---

## Forms & Validation

### Required Fields

**✅ Good**:
```tsx
<label htmlFor="email">
  Email Address <span aria-label="required">*</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
/>
```

### Error Messages

**✅ Good**:
```tsx
{errors.email && (
  <p id="email-error" role="alert">
    {errors.email.message}
  </p>
)}
<input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
```

### Autocomplete

**✅ Good**:
```tsx
<input
  type="email"
  autoComplete="email"
/>
<input
  type="password"
  autoComplete="current-password"
/>
```

---

## Dynamic Content

### Status Messages

**✅ Good**:
```tsx
function StatusMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
```

### Loading States

**✅ Good**:
```tsx
{isLoading && (
  <div role="status" aria-live="polite">
    <Loader aria-hidden="true" />
    <span className="sr-only">Loading analytics data</span>
  </div>
)}
```

### Accessible Loading Component

```tsx
function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div role="status">
      <svg aria-hidden="true" className="animate-spin">
        {/* spinner SVG */}
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
```

---

## Testing

### Manual Keyboard Testing

**Checklist**:
- [ ] Tab through all interactive elements
- [ ] Shift+Tab works in reverse
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in custom widgets
- [ ] Escape closes modals
- [ ] No keyboard traps
- [ ] Focus visible on all elements

### Screen Reader Testing

**Quick Test with NVDA**:
1. Install NVDA (free)
2. Press `Ctrl+Alt+N` to start
3. Navigate with `H` (headings), `D` (landmarks), `Tab` (interactive)
4. Listen to announcements for all elements

### Automated Testing

**With axe-core**:
```bash
npm run test:e2e:accessibility
```

**In Component Tests**:
```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### ESLint jsx-a11y

Already configured in `.eslintrc.json`:

```bash
npx eslint src/
```

---

## Common Mistakes

### 1. Missing Alt Text

**❌ Bad**:
```tsx
<img src="/avatar.jpg" />
```

**✅ Good**:
```tsx
<img src="/avatar.jpg" alt="John Doe profile picture" />
```

### 2. Divs as Buttons

**❌ Bad**:
```tsx
<div onClick={handleClick}>Click me</div>
```

**✅ Good**:
```tsx
<button onClick={handleClick}>Click me</button>
```

### 3. Icon-Only Buttons Without Labels

**❌ Bad**:
```tsx
<button><XIcon /></button>
```

**✅ Good**:
```tsx
<button aria-label="Close">
  <XIcon aria-hidden="true" />
</button>
```

### 4. Form Inputs Without Labels

**❌ Bad**:
```tsx
<input type="email" placeholder="Email" />
```

**✅ Good**:
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### 5. Low Color Contrast

**❌ Bad**:
```tsx
<p className="text-gray-400">Important information</p>
```

**✅ Good**:
```tsx
<p className="text-gray-900 dark:text-gray-100">Important information</p>
```

### 6. Removing Focus Outlines

**❌ Bad**:
```css
* {
  outline: none;
}
```

**✅ Good**:
```css
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

### 7. Not Announcing Dynamic Content

**❌ Bad**:
```tsx
<div>{statusMessage}</div>
```

**✅ Good**:
```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

### 8. Tooltips on Hover Only

**❌ Bad**:
```tsx
<div className="group">
  <button>Action</button>
  <div className="group-hover:block">Tooltip</div>
</div>
```

**✅ Good** (use Radix UI Tooltip):
```tsx
<Tooltip.Root>
  <Tooltip.Trigger>Action</Tooltip.Trigger>
  <Tooltip.Content>Tooltip</Tooltip.Content>
</Tooltip.Root>
```

---

## Quick Reference

### Accessibility Checklist for PRs

Before submitting a PR, verify:

- [ ] All images have alt text (or alt="" if decorative)
- [ ] All icon-only buttons have aria-label
- [ ] All form inputs have labels (visible or aria-label)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Keyboard accessible (Tab, Enter, Escape work)
- [ ] Focus visible on all interactive elements
- [ ] Screen reader tested (at least with NVDA)
- [ ] No ESLint jsx-a11y errors
- [ ] Semantic HTML used (`<button>`, `<main>`, `<nav>`)
- [ ] ARIA used correctly (or not at all if semantic HTML works)

### Resources

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Radix UI Accessibility**: https://www.radix-ui.com/primitives/docs/overview/accessibility
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

---

**Developer Guide Version**: 1.0
**Last Updated**: January 9, 2025
**For Questions**: Contact team lead or accessibility@pubhub.dev
