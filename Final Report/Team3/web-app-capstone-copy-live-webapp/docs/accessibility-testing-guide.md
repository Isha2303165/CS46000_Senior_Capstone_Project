# Accessibility Testing Guide

This guide provides comprehensive instructions for manually testing the accessibility features of the Healthcare Tracking App to ensure WCAG 2.1 AA compliance.

## Table of Contents

1. [Automated Testing](#automated-testing)
2. [Keyboard Navigation Testing](#keyboard-navigation-testing)
3. [Screen Reader Testing](#screen-reader-testing)
4. [Color Contrast Testing](#color-contrast-testing)
5. [Focus Management Testing](#focus-management-testing)
6. [Mobile Accessibility Testing](#mobile-accessibility-testing)
7. [High Contrast Mode Testing](#high-contrast-mode-testing)
8. [Font Size Testing](#font-size-testing)
9. [Reduced Motion Testing](#reduced-motion-testing)
10. [Common Issues Checklist](#common-issues-checklist)

## Automated Testing

### Running Accessibility Tests

```bash
# Run all accessibility tests
npm test -- accessibility.test.tsx

# Run with coverage
npm test -- --coverage accessibility.test.tsx

# Run axe-core tests specifically
npm test -- --testNamePattern="WCAG 2.1 AA Compliance"
```

### Browser Extensions

Install these browser extensions for automated testing:

1. **axe DevTools** (Chrome/Firefox)
   - Install from browser extension store
   - Open DevTools → axe tab
   - Click "Scan ALL of my page"
   - Review violations and best practices

2. **WAVE Web Accessibility Evaluator**
   - Install from browser extension store
   - Click WAVE icon on any page
   - Review errors, alerts, and features

3. **Lighthouse Accessibility Audit**
   - Open Chrome DevTools → Lighthouse tab
   - Select "Accessibility" category
   - Run audit and review score

## Keyboard Navigation Testing

### Basic Keyboard Navigation

Test all interactive elements using only the keyboard:

1. **Tab Navigation**
   - Press `Tab` to move forward through interactive elements
   - Press `Shift + Tab` to move backward
   - Verify tab order is logical and follows visual layout
   - Ensure all interactive elements are reachable

2. **Enter/Space Activation**
   - Press `Enter` or `Space` to activate buttons
   - Press `Enter` to follow links
   - Verify all actions work as expected

3. **Arrow Key Navigation**
   - Test arrow keys in dropdown menus
   - Test arrow keys in calendar components
   - Test arrow keys in radio button groups

4. **Escape Key**
   - Press `Escape` to close modals/dialogs
   - Press `Escape` to cancel form editing
   - Verify focus returns to trigger element

### Testing Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps (can always navigate away)
- [ ] Skip links work properly
- [ ] Modal dialogs trap focus correctly
- [ ] Dropdown menus are navigable with arrow keys

### Key Pages to Test

1. **Login/Registration Pages**
   - Tab through form fields
   - Submit forms using Enter key
   - Navigate between login/register forms

2. **Dashboard**
   - Navigate through patient cards
   - Access quick actions
   - Navigate medication reminders

3. **Patient Management**
   - Navigate patient list
   - Open patient details
   - Edit patient information

4. **Calendar View**
   - Navigate calendar grid
   - Create new appointments
   - Edit existing appointments

5. **Settings Page**
   - Navigate through settings sections
   - Toggle accessibility options
   - Save settings

## Screen Reader Testing

### Recommended Screen Readers

- **NVDA** (Windows) - Free
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS) - Built-in
- **Orca** (Linux) - Free

### VoiceOver Testing (macOS)

1. **Enable VoiceOver**
   - Press `Cmd + F5` or go to System Preferences → Accessibility → VoiceOver
   - Use VoiceOver Utility to configure settings

2. **Basic Navigation**
   - `Control + Option + Right Arrow` - Next element
   - `Control + Option + Left Arrow` - Previous element
   - `Control + Option + Space` - Activate element
   - `Control + Option + U` - Open rotor menu

3. **Testing Checklist**
   - [ ] All content is announced properly
   - [ ] Headings are identified and navigable
   - [ ] Form labels are associated correctly
   - [ ] Error messages are announced
   - [ ] Status updates are announced
   - [ ] Images have appropriate alt text
   - [ ] Links have descriptive text

### NVDA Testing (Windows)

1. **Enable NVDA**
   - Download and install NVDA
   - Press `Ctrl + Alt + N` to start

2. **Basic Navigation**
   - `Tab` - Next focusable element
   - `Arrow Keys` - Navigate by element
   - `H` - Next heading
   - `F` - Next form field
   - `B` - Next button
   - `L` - Next link

3. **Testing Checklist**
   - [ ] Page title is announced on load
   - [ ] Landmark regions are identified
   - [ ] Form validation errors are announced
   - [ ] Dynamic content updates are announced
   - [ ] Tables have proper headers

### Content to Verify

1. **Patient Cards**
   - Patient name and basic info announced
   - Medical conditions listed properly
   - Allergies announced as alerts
   - Emergency contact information clear

2. **Medication Reminders**
   - Medication name and dosage announced
   - Due time and status clear
   - Action buttons have descriptive labels

3. **Forms**
   - Field labels are announced
   - Required fields are identified
   - Error messages are clear and helpful
   - Instructions are provided

4. **Navigation**
   - Current page/section is identified
   - Navigation structure is clear
   - Breadcrumbs are announced properly

## Color Contrast Testing

### Automated Tools

1. **WebAIM Contrast Checker**
   - Visit https://webaim.org/resources/contrastchecker/
   - Test foreground/background color combinations
   - Ensure 4.5:1 ratio for normal text, 3:1 for large text

2. **Colour Contrast Analyser**
   - Download desktop application
   - Use eyedropper tool to test colors on screen

### Manual Testing

1. **High Contrast Mode**
   - Enable system high contrast mode
   - Verify all content remains visible and usable
   - Check that custom colors don't override system colors

2. **Color Blindness Simulation**
   - Use browser extensions like "Colorblinding"
   - Test with different types of color blindness
   - Ensure information isn't conveyed by color alone

### Testing Checklist

- [ ] Text has sufficient contrast against background
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators are visible in high contrast
- [ ] Error states don't rely solely on color
- [ ] Success states don't rely solely on color
- [ ] Charts and graphs have alternative text descriptions

## Focus Management Testing

### Visual Focus Indicators

1. **Focus Ring Visibility**
   - Tab through all interactive elements
   - Verify focus ring is clearly visible
   - Check focus ring color contrast
   - Ensure focus ring isn't hidden by other elements

2. **Focus Order**
   - Verify tab order matches visual layout
   - Check that focus moves logically through content
   - Ensure hidden elements don't receive focus

### Modal Dialog Focus

1. **Focus Trapping**
   - Open modal dialog
   - Verify focus moves to first focusable element
   - Tab through modal elements
   - Verify focus stays within modal
   - Press Escape and verify focus returns to trigger

2. **Testing Checklist**
   - [ ] Focus moves to modal on open
   - [ ] Focus is trapped within modal
   - [ ] Focus returns to trigger on close
   - [ ] Escape key closes modal

## Mobile Accessibility Testing

### Touch Target Size

1. **Minimum Size Requirements**
   - All touch targets should be at least 44px × 44px
   - Verify spacing between adjacent targets
   - Test with finger navigation

2. **Testing on Devices**
   - Test on actual mobile devices
   - Use various screen sizes
   - Test in both portrait and landscape orientations

### Screen Reader Testing (Mobile)

1. **iOS VoiceOver**
   - Settings → Accessibility → VoiceOver
   - Swipe right/left to navigate
   - Double-tap to activate
   - Two-finger swipe to read all content

2. **Android TalkBack**
   - Settings → Accessibility → TalkBack
   - Swipe right/left to navigate
   - Double-tap to activate
   - Use explore by touch

### Mobile Testing Checklist

- [ ] All content is accessible via swipe navigation
- [ ] Touch targets are appropriately sized
- [ ] Zoom up to 200% without horizontal scrolling
- [ ] Orientation changes don't break functionality
- [ ] Voice control works properly

## High Contrast Mode Testing

### System High Contrast

1. **Windows High Contrast**
   - Press `Left Alt + Left Shift + Print Screen`
   - Or Settings → Ease of Access → High Contrast

2. **macOS Increase Contrast**
   - System Preferences → Accessibility → Display → Increase Contrast

3. **Testing Checklist**
   - [ ] All text remains readable
   - [ ] Interactive elements are distinguishable
   - [ ] Focus indicators are visible
   - [ ] Images have appropriate alternative text
   - [ ] Custom colors don't interfere with system colors

### Application High Contrast Mode

1. **Enable in Settings**
   - Navigate to Settings page
   - Toggle "High Contrast Mode"
   - Verify immediate application of styles

2. **Testing Checklist**
   - [ ] High contrast styles are applied
   - [ ] All content remains functional
   - [ ] Setting persists across sessions
   - [ ] Can be disabled easily

## Font Size Testing

### Browser Zoom

1. **Zoom Testing**
   - Test zoom levels: 100%, 125%, 150%, 200%
   - Verify no horizontal scrolling at 200% zoom
   - Check that all content remains accessible

2. **Font Size Settings**
   - Test application font size settings
   - Verify changes apply immediately
   - Check that layout adapts properly

### Testing Checklist

- [ ] Content is readable at 200% zoom
- [ ] No horizontal scrolling required
- [ ] Interactive elements remain usable
- [ ] Font size settings work properly
- [ ] Settings persist across sessions

## Reduced Motion Testing

### System Preferences

1. **Enable Reduced Motion**
   - **macOS**: System Preferences → Accessibility → Display → Reduce Motion
   - **Windows**: Settings → Ease of Access → Display → Show animations
   - **iOS**: Settings → Accessibility → Motion → Reduce Motion

2. **Testing Checklist**
   - [ ] Animations are disabled or reduced
   - [ ] Loading indicators still function
   - [ ] Transitions are minimal
   - [ ] No vestibular triggers remain

### Application Settings

1. **Reduced Motion Setting**
   - Navigate to accessibility settings
   - Toggle reduced motion preference
   - Verify animations are disabled

## Common Issues Checklist

### Critical Issues (Must Fix)

- [ ] **Missing alt text** on informative images
- [ ] **Insufficient color contrast** (below 4.5:1 for normal text)
- [ ] **Keyboard inaccessible** interactive elements
- [ ] **Missing form labels** or improper associations
- [ ] **Focus traps** that prevent navigation
- [ ] **Missing skip links** on main pages
- [ ] **Unlabeled buttons** or links

### Important Issues (Should Fix)

- [ ] **Inconsistent heading structure** (skipping levels)
- [ ] **Missing landmark regions** (main, nav, aside)
- [ ] **Unclear error messages** or missing error announcements
- [ ] **Poor focus indicators** (too subtle or missing)
- [ ] **Missing status announcements** for dynamic content
- [ ] **Inadequate touch target sizes** on mobile

### Enhancement Opportunities

- [ ] **Improved screen reader instructions** for complex interactions
- [ ] **Better high contrast mode** support
- [ ] **Enhanced keyboard shortcuts** for power users
- [ ] **More descriptive link text** and button labels
- [ ] **Better error prevention** and inline validation
- [ ] **Improved loading states** and progress indicators

## Testing Schedule

### Daily Testing (Development)

- Run automated accessibility tests
- Test keyboard navigation for new features
- Verify focus management in new components

### Weekly Testing (Development)

- Full keyboard navigation testing
- Screen reader testing of new features
- Color contrast verification

### Pre-Release Testing

- Complete manual accessibility audit
- Cross-browser accessibility testing
- Mobile accessibility testing
- User testing with assistive technology users

### Post-Release Monitoring

- Monitor accessibility feedback from users
- Regular automated testing in CI/CD pipeline
- Quarterly comprehensive accessibility audits

## Resources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Tools

- [axe-core](https://github.com/dequelabs/axe-core)
- [Pa11y](https://pa11y.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)

### Testing Services

- [AccessiBe](https://accessibe.com/)
- [UserWay](https://userway.org/)
- [Deque](https://www.deque.com/)

Remember: Automated testing catches about 30-40% of accessibility issues. Manual testing and user testing with people who use assistive technologies are essential for comprehensive accessibility validation.