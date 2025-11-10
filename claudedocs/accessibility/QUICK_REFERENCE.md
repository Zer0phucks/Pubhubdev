# Accessibility Quick Reference Card

Quick reference for developers implementing accessibility in PubHub.

---

## Testing Commands

```bash
# Static analysis (ESLint)
npm run lint

# Automated accessibility tests
npm run test:accessibility

# All E2E tests (including accessibility)
npm run test:e2e

# Keyboard navigation tests only
npx playwright test tests/accessibility/keyboard-navigation.spec.ts
```

---

## PR Checklist

Before submitting a PR, verify:

- [ ] All images have alt text (or `alt=""` if decorative)
- [ ] All icon-only buttons have `aria-label`
- [ ] All form inputs have labels (`<label htmlFor="">` or `aria-label`)
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Keyboard accessible (Tab, Enter, Escape work)
- [ ] Focus visible on all interactive elements
- [ ] No ESLint jsx-a11y errors
- [ ] Semantic HTML used (`<button>`, `<main>`, `<nav>`)

---

## Common Patterns

### Icon-Only Button
```tsx
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

### Form Input
```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-describedby="email-help"
/>
<p id="email-help">We'll never share your email</p>
```

### Error Message
```tsx
{error && (
  <p id="field-error" role="alert">
    {error.message}
  </p>
)}
<input
  aria-invalid={!!error}
  aria-describedby={error ? "field-error" : undefined}
/>
```

### Loading State
```tsx
{isLoading && (
  <div role="status" aria-live="polite">
    <Spinner aria-hidden="true" />
    <span className="sr-only">Loading...</span>
  </div>
)}
```

### Status Message
```tsx
<div role="status" aria-live="polite">
  Post published successfully
</div>
```

### Skip Link
```tsx
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main">
  {/* content */}
</main>
```

---

## ARIA Quick Reference

| Attribute | Usage | Example |
|-----------|-------|---------|
| `aria-label` | Label when no visible text | `<button aria-label="Close">` |
| `aria-labelledby` | Reference to label element | `<div aria-labelledby="title">` |
| `aria-describedby` | Reference to description | `<input aria-describedby="help">` |
| `aria-required` | Required form field | `<input aria-required="true">` |
| `aria-invalid` | Invalid form field | `<input aria-invalid="true">` |
| `aria-live` | Announce dynamic content | `<div aria-live="polite">` |
| `aria-hidden` | Hide from screen readers | `<svg aria-hidden="true">` |
| `aria-current` | Current item in set | `<a aria-current="page">` |
| `aria-pressed` | Toggle button state | `<button aria-pressed="true">` |

---

## Keyboard Shortcuts

**Global**:
- `Tab` - Next element
- `Shift+Tab` - Previous element
- `Enter` or `Space` - Activate
- `Esc` - Close/Cancel

**Dropdowns**:
- `↓` or `Space` - Open
- `↑`/`↓` - Navigate
- `Enter` - Select
- `Esc` - Close

**Modals**:
- `Esc` - Close
- `Tab` - Trapped within modal

---

## Color Contrast Standards

- **Normal Text**: 4.5:1 minimum
- **Large Text** (18pt+ or 14pt+ bold): 3:1 minimum
- **UI Components**: 3:1 minimum

**Check with**: WebAIM Contrast Checker or Chrome DevTools

---

## Resources

- **Full Developer Guide**: `claudedocs/accessibility/developer-guide.md`
- **WCAG Checklist**: `claudedocs/accessibility/wcag-compliance-checklist.md`
- **Audit Report**: `claudedocs/accessibility/accessibility-audit-report.md`

---

## Contact

**Accessibility Questions**: accessibility@pubhub.dev
**Code Review**: Tag `accessibility` label on PR

---

**Version**: 1.0 | **Last Updated**: January 9, 2025
