import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientContactsSection } from '../client-contacts-section';
import { useUpdateClient } from '@/hooks/use-clients';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-clients');
vi.mock('@/hooks/use-toast');

const mockUseUpdateClient = vi.mocked(useUpdateClient);
const mockUseToast = vi.mocked(useToast);

// Mock client data
const mockClientComplete: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+1234567890',
  emergencyContactRelationship: 'Spouse',
  insuranceProvider: 'Blue Cross Blue Shield',
  insurancePolicyNumber: 'BC123456789',
  insuranceGroupNumber: 'GRP001',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockClientIncomplete: Client = {
  id: 'client-2',
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: '1985-05-15',
  emergencyContactName: '',
  emergencyContactPhone: '',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockMutateAsync = vi.fn();
const mockToast = vi.fn();

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ClientContactsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseUpdateClient.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
      data: undefined,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: true,
      isPaused: false,
      isSuccess: false,
      submittedAt: 0,
    });

    mockUseToast.mockReturnValue({
      toast: mockToast,
    });
  });

  describe('Display', () => {
    it('renders emergency contacts and insurance sections', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      expect(screen.getByText('Emergency Contacts')).toBeInTheDocument();
      expect(screen.getByText('Insurance Information')).toBeInTheDocument();
    });

    it('displays complete emergency contact information', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Spouse')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('displays complete insurance information', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      expect(screen.getByText('Blue Cross Blue Shield')).toBeInTheDocument();
      expect(screen.getByText('BC123456789')).toBeInTheDocument();
      expect(screen.getByText('GRP001')).toBeInTheDocument();
    });

    it('shows warning for missing emergency contact information', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientIncomplete} />);

      expect(screen.getByText('Incomplete')).toBeInTheDocument();
      expect(screen.getByText('Missing Emergency Contact Information')).toBeInTheDocument();
      expect(screen.getByText(/Please add emergency contact information/)).toBeInTheDocument();
    });

    it('shows placeholder when no emergency contact exists', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientIncomplete} />);

      expect(screen.getByText('No emergency contact information available')).toBeInTheDocument();
      expect(screen.getByText('Click Edit to add emergency contact details')).toBeInTheDocument();
    });
  });

  describe('Click-to-call functionality', () => {
    it('renders phone number as clickable tel: link', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      const phoneLink = screen.getByRole('link', { name: /Call Jane Doe at \+1234567890/ });
      expect(phoneLink).toBeInTheDocument();
      expect(phoneLink).toHaveAttribute('href', 'tel:+1234567890');
    });

    it('includes proper accessibility labels for phone links', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      const phoneLink = screen.getByRole('link', { name: /Call Jane Doe at \+1234567890/ });
      expect(phoneLink).toHaveAttribute('aria-label', 'Call Jane Doe at +1234567890');
    });

    it('does not render phone link when no phone number exists', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientIncomplete} />);

      const phoneLinks = screen.queryAllByRole('link');
      expect(phoneLinks).toHaveLength(0);
    });
  });

  describe('Edit functionality', () => {
    it('shows edit button when not in edit mode', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      expect(screen.getByRole('button', { name: /Edit contact information/ })).toBeInTheDocument();
    });

    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      expect(screen.getByLabelText('Contact Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact Phone *')).toBeInTheDocument();
      expect(screen.getByLabelText('Relationship')).toBeInTheDocument();
      expect(screen.getByLabelText('Insurance Provider')).toBeInTheDocument();
    });

    it('pre-fills form with existing client data', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Spouse')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Blue Cross Blue Shield')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BC123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('GRP001')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      expect(screen.getByRole('button', { name: /Save contact information changes/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel editing contact information/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Edit contact information/ })).not.toBeInTheDocument();
    });

    it('cancels edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      // Cancel edit mode
      const cancelButton = screen.getByRole('button', { name: /Cancel editing contact information/ });
      await user.click(cancelButton);

      expect(screen.getByRole('button', { name: /Edit contact information/ })).toBeInTheDocument();
      expect(screen.queryByLabelText('Contact Name *')).not.toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('shows validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ClientContactsSection client={mockClientIncomplete} />);

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      // Try to submit without filling required fields
      const saveButton = screen.getByRole('button', { name: /Save contact information changes/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Emergency contact name is required')).toBeInTheDocument();
        expect(screen.getByText('Emergency contact phone is required')).toBeInTheDocument();
      });
    });

    it('allows submission with valid data', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});
      
      renderWithQueryClient(<ClientContactsSection client={mockClientIncomplete} />);

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      // Fill in required fields
      const nameInput = screen.getByLabelText('Contact Name *');
      const phoneInput = screen.getByLabelText('Contact Phone *');
      
      await user.type(nameInput, 'John Smith');
      await user.type(phoneInput, '555-123-4567');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /Save contact information changes/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'client-2',
          emergencyContactName: 'John Smith',
          emergencyContactPhone: '+15551234567',
          emergencyContactRelationship: undefined,
          insuranceProvider: undefined,
          insurancePolicyNumber: undefined,
          insuranceGroupNumber: undefined,
        });
      });
    });
  });

  describe('Phone number formatting', () => {
    it('formats US phone numbers to E.164 format', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});
      
      renderWithQueryClient(<ClientContactsSection client={mockClientIncomplete} />);

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      // Fill in phone number without country code
      const nameInput = screen.getByLabelText('Contact Name *');
      const phoneInput = screen.getByLabelText('Contact Phone *');
      
      await user.type(nameInput, 'John Smith');
      await user.type(phoneInput, '(555) 123-4567');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /Save contact information changes/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            emergencyContactPhone: '+15551234567',
          })
        );
      });
    });
  });

  describe('Success and error handling', () => {
    it('shows success toast on successful update', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});
      
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      // Enter edit mode and make changes
      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      const nameInput = screen.getByLabelText('Contact Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /Save contact information changes/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Contact information updated',
          description: 'Emergency contact and insurance information has been saved successfully.',
        });
      });
    });

    it('shows error toast on failed update', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error('Update failed'));
      
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      // Enter edit mode and make changes
      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      const nameInput = screen.getByLabelText('Contact Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /Save contact information changes/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error updating contact information',
          description: 'Please try again or contact support if the problem persists.',
          variant: 'destructive',
        });
      });
    });

    it('exits edit mode on successful update', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});
      
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      // Submit form
      const saveButton = screen.getByRole('button', { name: /Save contact information changes/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit contact information/ })).toBeInTheDocument();
        expect(screen.queryByLabelText('Contact Name *')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for phone links', () => {
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      const phoneLink = screen.getByRole('link', { name: /Call Jane Doe at \+1234567890/ });
      expect(phoneLink).toHaveAttribute('aria-label', 'Call Jane Doe at +1234567890');
    });

    it('has proper form labels', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ClientContactsSection client={mockClientComplete} />);

      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      expect(screen.getByLabelText('Contact Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact Phone *')).toBeInTheDocument();
      expect(screen.getByLabelText('Relationship')).toBeInTheDocument();
      expect(screen.getByLabelText('Insurance Provider')).toBeInTheDocument();
      expect(screen.getByLabelText('Policy Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Group Number')).toBeInTheDocument();
    });

    it('shows validation errors with proper text', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ClientContactsSection client={mockClientIncomplete} />);

      const editButton = screen.getByRole('button', { name: /Edit contact information/ });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /Save contact information changes/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Emergency contact name is required')).toBeInTheDocument();
        expect(screen.getByText('Emergency contact phone is required')).toBeInTheDocument();
      });
    });
  });
});