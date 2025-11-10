# PubHub Accessibility Statement

**Last Updated**: January 9, 2025

## Our Commitment

PubHub is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Conformance Status

The [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/) define requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.

**PubHub is currently working toward** WCAG 2.1 Level AA conformance.

### Current Accessibility Status

- **Partially Conformant**: We are actively working to achieve full WCAG 2.1 Level AA compliance
- **Target Date for Full Compliance**: March 2025
- **Last Audit Date**: January 2025

## Accessibility Features

### What Works Well

1. **Keyboard Navigation**
   - Full keyboard access to all interactive elements
   - Logical tab order through pages
   - Keyboard shortcuts for common actions (⌘K for quick navigation)
   - No keyboard traps

2. **Screen Reader Support**
   - Radix UI components provide ARIA labels and roles
   - Semantic HTML structure
   - Text alternatives for visual content
   - Proper form labels

3. **Visual Design**
   - Responsive design works across devices
   - Resizable text up to 200%
   - No information conveyed by color alone
   - Clear focus indicators

4. **Input Assistance**
   - Clear form labels
   - Helpful error messages
   - Confirmation for destructive actions
   - Consistent navigation across pages

### Known Issues & Roadmap

We are aware of the following accessibility issues and are working to resolve them:

#### High Priority (In Progress)
1. **Skip Navigation Link**: Adding a "skip to main content" link
2. **ARIA Labels**: Improving labels on icon-only buttons
3. **Color Contrast**: Enhancing contrast ratios in the dark theme
4. **Form Labels**: Ensuring all form inputs have programmatically associated labels

#### Medium Priority (Planned)
5. **Landmark Roles**: Adding proper ARIA landmark roles
6. **Heading Hierarchy**: Reviewing and fixing heading structure
7. **Error Announcements**: Improving screen reader announcements for errors
8. **Status Messages**: Adding ARIA live regions for dynamic content

## Technical Specifications

PubHub works with the following assistive technologies:

### Supported Screen Readers
- **NVDA** (Windows) - Latest version
- **JAWS** (Windows) - Version 2024 and later
- **VoiceOver** (macOS/iOS) - Latest version
- **TalkBack** (Android) - Latest version

### Supported Browsers
- **Chrome** (latest 2 versions)
- **Firefox** (latest 2 versions)
- **Safari** (latest 2 versions)
- **Edge** (latest 2 versions)

### Keyboard Shortcuts

PubHub includes keyboard shortcuts for efficient navigation. See our [Keyboard Shortcuts Guide](./keyboard-shortcuts.md) for a complete list.

## Testing & Evaluation

We regularly test PubHub's accessibility using:

1. **Automated Testing**
   - axe-core accessibility testing engine
   - ESLint jsx-a11y plugin
   - WAVE browser extension

2. **Manual Testing**
   - Keyboard navigation testing
   - Screen reader testing (NVDA, VoiceOver)
   - Color contrast validation
   - User testing with people with disabilities

3. **Third-Party Audits**
   - Periodic accessibility audits by external experts

## Feedback & Contact

We welcome your feedback on the accessibility of PubHub. Please let us know if you encounter accessibility barriers:

### How to Report Issues

**Email**: accessibility@pubhub.dev

**Include in Your Report**:
- Your name (optional)
- Contact information (email or phone)
- The page or feature with the accessibility issue
- Your assistive technology (if applicable)
- Description of the problem
- Any suggestions for improvement

**Response Time**: We aim to respond to accessibility feedback within 5 business days.

## Alternative Formats

If you require content from PubHub in an alternative format:
- Audio versions of documentation
- Large print documentation
- Simplified text versions
- Other accessible formats

Please contact us at accessibility@pubhub.dev with your request.

## Continuous Improvement

Accessibility is an ongoing effort. Our commitment includes:

1. **Regular Audits**: Quarterly accessibility testing and audits
2. **Team Training**: Ongoing accessibility training for developers and designers
3. **User Feedback**: Incorporating feedback from users with disabilities
4. **Standards Compliance**: Following WCAG guidelines and best practices
5. **Inclusive Design**: Considering accessibility from the start of every feature

## Legal Information

This accessibility statement applies to the PubHub web application available at [https://pubhub.dev](https://pubhub.dev).

### Applicable Standards
- Web Content Accessibility Guidelines (WCAG) 2.1
- Americans with Disabilities Act (ADA)
- Section 508 of the Rehabilitation Act
- EN 301 549 (European accessibility standard)

### Third-Party Content

Some content on PubHub may be provided by third parties (e.g., social media platforms, external integrations). We strive to ensure these third-party components are accessible, but we cannot always control their accessibility. Please contact us if you encounter accessibility issues with third-party content.

## Resources

### Learn More About Accessibility
- [W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/)
- [WebAIM: Web Accessibility In Mind](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Deque University](https://dequeuniversity.com/)

### Assistive Technology Resources
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/)
- [TalkBack User Guide](https://support.google.com/accessibility/android/answer/6283677)

---

**Accessibility Statement Version**: 1.0
**Organization**: PubHub
**Published**: January 9, 2025
**Next Review**: April 2025

This statement was created using the [W3C Accessibility Statement Generator](https://www.w3.org/WAI/planning/statements/).
