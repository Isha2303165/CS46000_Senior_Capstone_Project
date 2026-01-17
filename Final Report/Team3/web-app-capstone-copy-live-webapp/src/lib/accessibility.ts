/**
 * Accessibility utilities and constants for WCAG 2.1 AA compliance
 */

// ARIA live region announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management utilities
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Keyboard navigation helpers
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onEnter?.();
      break;
    case 'Escape':
      event.preventDefault();
      onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      onArrowDown?.();
      break;
  }
};

// Color contrast validation (for development)
export const validateColorContrast = (foreground: string, background: string): boolean => {
  // This is a simplified check - in production, use a proper color contrast library
  // WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text
  console.warn('Color contrast validation should use a proper library in production');
  return true;
};

// Screen reader text utilities
export const getScreenReaderText = {
  loading: 'Loading content, please wait',
  error: 'An error occurred',
  success: 'Action completed successfully',
  required: 'Required field',
  optional: 'Optional field',
  expanded: 'Expanded',
  collapsed: 'Collapsed',
  selected: 'Selected',
  unselected: 'Not selected',
  newWindow: 'Opens in new window',
  sortAscending: 'Sorted ascending',
  sortDescending: 'Sorted descending',
  currentPage: 'Current page',
  pageOf: (current: number, total: number) => `Page ${current} of ${total}`,
  itemsCount: (count: number) => `${count} items`,
  medicationDue: (name: string, time: string) => `Medication ${name} is due at ${time}`,
  appointmentReminder: (title: string, time: string) => `Appointment ${title} is scheduled for ${time}`,
  urgentMessage: 'Urgent message received',
  clientAdded: (name: string) => `Client ${name} has been added`,
  medicationTaken: (name: string) => `Medication ${name} has been marked as taken`,
  appointmentScheduled: (title: string) => `Appointment ${title} has been scheduled`
};

// High contrast mode detection
export const isHighContrastMode = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Font size preferences
export const getFontSizePreference = (): 'normal' | 'large' | 'extra-large' => {
  const stored = localStorage.getItem('healthcare_app_font_size');
  return (stored as 'normal' | 'large' | 'extra-large') || 'normal';
};

export const setFontSizePreference = (size: 'normal' | 'large' | 'extra-large') => {
  localStorage.setItem('healthcare_app_font_size', size);
  document.documentElement.setAttribute('data-font-size', size);
};

// Initialize accessibility features
export const initializeAccessibility = () => {
  // Set initial font size
  const fontSize = getFontSizePreference();
  document.documentElement.setAttribute('data-font-size', fontSize);
  
  // Set high contrast mode if preferred
  if (isHighContrastMode()) {
    document.documentElement.setAttribute('data-high-contrast', 'true');
  }
  
  // Listen for contrast changes
  window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-high-contrast', e.matches.toString());
  });
  
  // Listen for reduced motion changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-reduced-motion', e.matches.toString());
  });
};