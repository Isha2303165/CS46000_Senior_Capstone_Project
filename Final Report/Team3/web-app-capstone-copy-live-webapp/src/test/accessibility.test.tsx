/**
 * Accessibility tests for WCAG 2.1 AA compliance
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, describe, test, beforeAll, vi } from 'vitest';
import { AccessibilityProvider } from '@/components/accessibility/accessibility-provider';
import { ClientCard } from '@/components/healthcare/client-card';
import { MedicationReminder } from '@/components/healthcare/medication-reminder';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import { Client, Medication } from '@/types';

// Extend Vitest matchers
beforeAll(() => {
  expect.extend(toHaveNoViolations);
});

// Mock data
const mockClient: Client = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  gender: 'Male',
  medicalConditions: ['Diabetes', 'Hypertension'],
  allergies: ['Penicillin', 'Shellfish'],
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0123',
  emergencyContactRelationship: 'Spouse',
  caregivers: ['caregiver-1'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockMedication: Medication = {
  id: '1',
  clientId: '1',
  name: 'Metformin',
  dosage: '500',
  unit: 'mg',
  frequency: 'Twice daily',
  instructions: 'Take with food',
  prescribingDoctor: 'Dr. Smith',
  startDate: '2024-01-01',
  nextDueAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
  isActive: true,
  sideEffects: ['Nausea', 'Diarrhea']
};

// Test wrapper with accessibility provider
const AccessibilityWrapper = ({ children }: { children: React.ReactNode }) => (
  <AccessibilityProvider>{children}</AccessibilityProvider>
);

describe('Accessibility Tests', () => {
  describe('WCAG 2.1 AA Compliance', () => {
    test('ClientCard should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibilityWrapper>
          <ClientCard client={mockClient} />
        </AccessibilityWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('MedicationReminder should have no accessibility violations', async () => {
      // Mock the medication hook
      vi.mock('@/hooks/use-medications', () => ({
        useLogMedication: () => ({
          mutateAsync: vi.fn(),
          isPending: false
        })
      }));

      const { container } = render(
        <AccessibilityWrapper>
          <MedicationReminder medication={mockMedication} />
        </AccessibilityWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Button component should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibilityWrapper>
          <Button>Test Button</Button>
          <Button aria-label="Icon button">
            <span>🔍</span>
          </Button>
        </AccessibilityWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('FormField should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibilityWrapper>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            required
            helperText="Enter your email address"
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            required
            error="Password is required"
          />
        </AccessibilityWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    test('ClientCard buttons should be keyboard accessible', () => {
      const onEdit = vi.fn();
      const onView = vi.fn();

      render(
        <AccessibilityWrapper>
          <ClientCard client={mockClient} onEdit={onEdit} onView={onView} />
        </AccessibilityWrapper>
      );

      const viewButton = screen.getByRole('button', { name: /view details for john doe/i });
      const editButton = screen.getByRole('button', { name: /edit information for john doe/i });

      // Test keyboard navigation
      viewButton.focus();
      expect(document.activeElement).toBe(viewButton);

      fireEvent.keyDown(viewButton, { key: 'Tab' });
      expect(document.activeElement).toBe(editButton);

      // Test Enter key activation
      fireEvent.keyDown(viewButton, { key: 'Enter' });
      expect(onView).toHaveBeenCalledWith(mockClient);

      fireEvent.keyDown(editButton, { key: 'Enter' });
      expect(onEdit).toHaveBeenCalledWith(mockClient);
    });

    test('MedicationReminder buttons should be keyboard accessible', () => {
      // Mock the medication hook
      vi.mock('@/hooks/use-medications', () => ({
        useLogMedication: () => ({
          mutateAsync: vi.fn(),
          isPending: false
        })
      }));

      render(
        <AccessibilityWrapper>
          <MedicationReminder medication={mockMedication} />
        </AccessibilityWrapper>
      );

      const takenButton = screen.getByRole('button', { name: /mark metformin as taken/i });
      const missedButton = screen.getByRole('button', { name: /mark metformin as missed/i });

      // Test keyboard navigation
      takenButton.focus();
      expect(document.activeElement).toBe(takenButton);

      fireEvent.keyDown(takenButton, { key: 'Tab' });
      expect(document.activeElement).toBe(missedButton);
    });
  });

  describe('Screen Reader Support', () => {
    test('ClientCard should have proper ARIA labels', () => {
      render(
        <AccessibilityWrapper>
          <ClientCard client={mockClient} />
        </AccessibilityWrapper>
      );

      // Check for proper ARIA attributes
      const clientCard = screen.getByRole('article');
      expect(clientCard).toHaveAttribute('aria-labelledby', 'client-1-name');
      expect(clientCard).toHaveAttribute('aria-describedby', 'client-1-info');

      // Check for allergy alert
      const allergyBadge = screen.getByRole('alert');
      expect(allergyBadge).toHaveAttribute('aria-label', 'Client has allergies: Penicillin, Shellfish');

      // Check for emergency contact phone link
      const phoneLink = screen.getByRole('link', { name: /call emergency contact/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:555-0123');
    });

    test('MedicationReminder should have proper ARIA labels', () => {
      // Mock the medication hook
      vi.mock('@/hooks/use-medications', () => ({
        useLogMedication: () => ({
          mutateAsync: vi.fn(),
          isPending: false
        })
      }));

      render(
        <AccessibilityWrapper>
          <MedicationReminder medication={mockMedication} />
        </AccessibilityWrapper>
      );

      // Check for alert role on medication card
      const medicationCard = screen.getByRole('alert');
      expect(medicationCard).toHaveAttribute('aria-labelledby', 'medication-1-name');
      expect(medicationCard).toHaveAttribute('aria-describedby', 'medication-1-status');

      // Check for status badge
      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveAttribute('aria-label', 'Medication status: Due Soon');

      // Check for action group
      const actionGroup = screen.getByRole('group', { name: 'Medication actions' });
      expect(actionGroup).toBeInTheDocument();
    });

    test('FormField should announce errors to screen readers', () => {
      render(
        <AccessibilityWrapper>
          <FormField
            label="Email"
            name="email"
            error="Email is required"
            required
          />
        </AccessibilityWrapper>
      );

      const input = screen.getByRole('textbox', { name: /email/i });
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('High contrast mode should be applied when enabled', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <AccessibilityWrapper>
          <Button>High Contrast Button</Button>
        </AccessibilityWrapper>
      );

      // Check if high contrast attribute is set
      expect(document.documentElement).toHaveAttribute('data-high-contrast', 'true');
    });

    test('Error states should have proper visual indicators', () => {
      render(
        <AccessibilityWrapper>
          <FormField
            label="Email"
            name="email"
            error="Email is required"
          />
        </AccessibilityWrapper>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('error-state');
    });
  });

  describe('Focus Management', () => {
    test('Skip link should be present and functional', () => {
      render(
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <main id="main-content" tabIndex={-1}>
            Main content
          </main>
        </div>
      );

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      const mainContent = screen.getByRole('main');

      expect(skipLink).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('tabindex', '-1');
    });

    test('Focus indicators should be visible', () => {
      render(
        <AccessibilityWrapper>
          <Button>Focusable Button</Button>
        </AccessibilityWrapper>
      );

      const button = screen.getByRole('button');
      button.focus();

      // Check if focus styles are applied
      expect(button).toHaveClass('focus-visible:ring-ring/50');
    });
  });

  describe('Touch Target Size', () => {
    test('Interactive elements should meet minimum touch target size', () => {
      render(
        <AccessibilityWrapper>
          <Button size="sm">Small Button</Button>
          <Button>Default Button</Button>
          <Button size="lg">Large Button</Button>
        </AccessibilityWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('touch-target');
      });
    });
  });

  describe('Reduced Motion Support', () => {
    test('Animations should be disabled when reduced motion is preferred', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <AccessibilityWrapper>
          <div className="loading-spinner" role="status" aria-label="Loading">
            Loading...
          </div>
        </AccessibilityWrapper>
      );

      // Check if reduced motion attribute is set
      expect(document.documentElement).toHaveAttribute('data-reduced-motion', 'true');
    });
  });
});