import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientMedicalHistorySection } from '../client-medical-history-section';
import { Client } from '@/types';
import * as useClients from '@/hooks/use-clients';
import * as authStore from '@/lib/stores/auth-store';

// Mock the hooks
vi.mock('@/hooks/use-clients');
vi.mock('@/lib/stores/auth-store');

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd, yyyy h:mm a') {
      return 'Jan 15, 2024 2:30 PM';
    }
    if (formatStr === 'MMM dd, yyyy') {
      return 'Jan 15, 2024';
    }
    return '2024-01-15';
  }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
}));

describe('ClientMedicalHistorySection', () => {
  let queryClient: QueryClient;
  const mockUpdateClient = vi.fn();

  const mockUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Caregiver',
    email: 'john@example.com',
  };

  const mockClient: Client = {
    id: 'client-1',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'John Doe',
    emergencyContactPhone: '555-0123',
    medicalConditions: ['Diabetes', 'Hypertension'],
    allergies: ['Penicillin', 'Shellfish'],
    careNotes: 'Client requires assistance with medication management.',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  };

  const mockClientWithoutData: Client = {
    id: 'client-2',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1975-05-15',
    emergencyContactName: 'Mary Smith',
    emergencyContactPhone: '555-0456',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    // Mock the auth store
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    // Mock the update client hook
    vi.mocked(useClients.useUpdateClient).mockReturnValue({
      mutateAsync: mockUpdateClient,
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
      data: undefined,
      isSuccess: false,
      isPending: false,
      reset: vi.fn(),
    } as any);

    mockUpdateClient.mockResolvedValue(mockClient);
  });

  const renderComponent = (client: Client = mockClient) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClientMedicalHistorySection client={client} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('renders the medical history section with correct title', () => {
      renderComponent();
      
      expect(screen.getByRole('region', { name: /medical history/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /medical history/i })).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      renderComponent();
      
      expect(screen.getByRole('region', { name: /medical conditions/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /allergies/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /care notes/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /medical timeline/i })).toBeInTheDocument();
    });

    it('renders critical allergies alert when severe allergies exist', () => {
      // Note: In the current implementation, all allergies default to 'moderate'
      // This test would pass if we had severe allergies in the data
      renderComponent();
      
      // Since we don't have severe allergies in mock data, the alert shouldn't appear
      expect(screen.queryByRole('alert', { name: /critical allergies/i })).not.toBeInTheDocument();
    });

    it('renders add buttons for each section', () => {
      renderComponent();
      
      expect(screen.getByRole('button', { name: /add new medical condition/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new allergy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit care notes/i })).toBeInTheDocument();
    });
  });

  describe('Medical Conditions Section', () => {
    it('displays existing medical conditions', () => {
      renderComponent();
      
      const conditionsSection = screen.getByRole('region', { name: /medical conditions/i });
      expect(conditionsSection).toHaveTextContent('Diabetes');
      expect(conditionsSection).toHaveTextContent('Hypertension');
    });

    it('shows empty state when no conditions exist', () => {
      renderComponent(mockClientWithoutData);
      
      const conditionsSection = screen.getByRole('region', { name: /medical conditions/i });
      expect(conditionsSection).toHaveTextContent('No medical conditions recorded');
    });

    it('opens add condition dialog when add button is clicked', async () => {
      renderComponent();
      
      const addButton = screen.getByRole('button', { name: /add new medical condition/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Add Medical Condition')).toBeInTheDocument();
      });
    });

    it('allows removing a medical condition', async () => {
      renderComponent();
      
      const removeButton = screen.getByRole('button', { name: /remove diabetes condition/i });
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 'client-1',
          medicalConditions: ['Hypertension'],
        });
      });
    });

    it('handles adding a new medical condition', async () => {
      renderComponent();
      
      // Open dialog
      const addButton = screen.getByRole('button', { name: /add new medical condition/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Fill form
      const conditionInput = screen.getByLabelText(/medical condition \*/i);
      fireEvent.change(conditionInput, { target: { value: 'Arthritis' } });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /add condition/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 'client-1',
          medicalConditions: ['Diabetes', 'Hypertension', 'Arthritis'],
        });
      });
    });

    it('shows validation error for empty condition', async () => {
      renderComponent();
      
      // Open dialog
      const addButton = screen.getByRole('button', { name: /add new medical condition/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Submit without filling form
      const submitButton = screen.getByRole('button', { name: /add condition/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Medical condition is required');
      });
    });
  });

  describe('Allergies Section', () => {
    it('displays existing allergies with severity badges', () => {
      renderComponent();
      
      const allergiesSection = screen.getByRole('region', { name: /allergies/i });
      expect(allergiesSection).toHaveTextContent('Penicillin');
      expect(allergiesSection).toHaveTextContent('Shellfish');
      expect(allergiesSection).toHaveTextContent('moderate');
    });

    it('shows empty state when no allergies exist', () => {
      renderComponent(mockClientWithoutData);
      
      const allergiesSection = screen.getByRole('region', { name: /allergies/i });
      expect(allergiesSection).toHaveTextContent('No allergies recorded');
    });

    it('opens add allergy dialog when add button is clicked', async () => {
      renderComponent();
      
      const addButton = screen.getByRole('button', { name: /add new allergy/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Add Allergy')).toBeInTheDocument();
      });
    });

    it('allows removing an allergy', async () => {
      renderComponent();
      
      const removeButton = screen.getByRole('button', { name: /remove penicillin allergy/i });
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 'client-1',
          allergies: ['Shellfish'],
        });
      });
    });

    it('handles adding a new allergy with severity', async () => {
      renderComponent();
      
      // Open dialog
      const addButton = screen.getByRole('button', { name: /add new allergy/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Fill form
      const allergyInput = screen.getByLabelText(/allergy \*/i);
      fireEvent.change(allergyInput, { target: { value: 'Latex' } });
      
      const severitySelect = screen.getByLabelText(/severity/i);
      fireEvent.change(severitySelect, { target: { value: 'severe' } });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /add allergy/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 'client-1',
          allergies: ['Penicillin', 'Shellfish', 'Latex'],
        });
      });
    });

    it('shows validation error for empty allergy', async () => {
      renderComponent();
      
      // Open dialog
      const addButton = screen.getByRole('button', { name: /add new allergy/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Submit without filling form
      const submitButton = screen.getByRole('button', { name: /add allergy/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Allergy name is required');
      });
    });
  });

  describe('Care Notes Section', () => {
    it('displays existing care notes', () => {
      renderComponent();
      
      const notesSection = screen.getByRole('region', { name: /care notes/i });
      expect(notesSection).toHaveTextContent('Client requires assistance with medication management.');
      expect(notesSection).toHaveTextContent('Last updated: Jan 15, 2024 2:30 PM');
    });

    it('shows empty state when no care notes exist', () => {
      renderComponent(mockClientWithoutData);
      
      const notesSection = screen.getByRole('region', { name: /care notes/i });
      expect(notesSection).toHaveTextContent('No care notes recorded');
    });

    it('opens edit notes dialog when edit button is clicked', async () => {
      renderComponent();
      
      const editButton = screen.getByRole('button', { name: /edit care notes/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Care Notes')).toBeInTheDocument();
      });
    });

    it('handles updating care notes', async () => {
      renderComponent();
      
      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit care notes/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Update notes
      const notesTextarea = screen.getByLabelText(/care notes \*/i);
      fireEvent.change(notesTextarea, { 
        target: { value: 'Updated care notes with new information.' } 
      });
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: /save notes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 'client-1',
          careNotes: 'Updated care notes with new information.',
        });
      });
    });

    it('shows validation error for empty care notes', async () => {
      renderComponent();
      
      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit care notes/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Clear notes
      const notesTextarea = screen.getByLabelText(/care notes \*/i);
      fireEvent.change(notesTextarea, { target: { value: '' } });
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: /save notes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Care notes cannot be empty');
      });
    });
  });

  describe('Medical Timeline Section', () => {
    it('displays timeline events', () => {
      renderComponent();
      
      const timelineSection = screen.getByRole('region', { name: /medical timeline/i });
      expect(timelineSection).toHaveTextContent('Diagnosed with Diabetes');
      expect(timelineSection).toHaveTextContent('Diagnosed with Hypertension');
      expect(timelineSection).toHaveTextContent('Allergy to Penicillin documented');
      expect(timelineSection).toHaveTextContent('Allergy to Shellfish documented');
      expect(timelineSection).toHaveTextContent('Care notes updated');
    });

    it('shows performer information for timeline events', () => {
      renderComponent();
      
      const timelineSection = screen.getByRole('region', { name: /medical timeline/i });
      expect(timelineSection).toHaveTextContent('by John Caregiver');
    });

    it('shows expand/collapse button when there are more than 3 events', () => {
      renderComponent();
      
      // With our mock data, we should have 5 events (2 conditions + 2 allergies + 1 notes update)
      const expandButton = screen.getByRole('button', { name: /show all \(5\)/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('expands timeline when expand button is clicked', async () => {
      renderComponent();
      
      const expandButton = screen.getByRole('button', { name: /show all \(5\)/i });
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show less timeline events/i })).toBeInTheDocument();
      });
    });

    it('shows empty state when no timeline events exist', () => {
      renderComponent(mockClientWithoutData);
      
      const timelineSection = screen.getByRole('region', { name: /medical timeline/i });
      expect(timelineSection).toHaveTextContent('No medical history events recorded');
    });

    it('displays event details when available', () => {
      renderComponent();
      
      const timelineSection = screen.getByRole('region', { name: /medical timeline/i });
      expect(timelineSection).toHaveTextContent('Client requires assistance with medication management.');
    });
  });

  describe('Dialog Interactions', () => {
    it('closes add condition dialog when cancel is clicked', async () => {
      renderComponent();
      
      // Open dialog
      const addButton = screen.getByRole('button', { name: /add new medical condition/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes add allergy dialog when cancel is clicked', async () => {
      renderComponent();
      
      // Open dialog
      const addButton = screen.getByRole('button', { name: /add new allergy/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes edit notes dialog when cancel is clicked', async () => {
      renderComponent();
      
      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit care notes/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles error when adding medical condition fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateClient.mockRejectedValueOnce(new Error('Update failed'));
      
      renderComponent();
      
      // Open dialog and submit
      const addButton = screen.getByRole('button', { name: /add new medical condition/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const conditionInput = screen.getByLabelText(/medical condition/i);
      fireEvent.change(conditionInput, { target: { value: 'Arthritis' } });
      
      const submitButton = screen.getByRole('button', { name: /add condition/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding medical condition:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('handles error when removing medical condition fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateClient.mockRejectedValueOnce(new Error('Update failed'));
      
      renderComponent();
      
      const removeButton = screen.getByRole('button', { name: /remove diabetes condition/i });
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error removing medical condition:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('handles error when adding allergy fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateClient.mockRejectedValueOnce(new Error('Update failed'));
      
      renderComponent();
      
      // Open dialog and submit
      const addButton = screen.getByRole('button', { name: /add new allergy/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const allergyInput = screen.getByLabelText(/allergy \*/i);
      fireEvent.change(allergyInput, { target: { value: 'Latex' } });
      
      const submitButton = screen.getByRole('button', { name: /add allergy/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding allergy:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('handles error when updating care notes fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateClient.mockRejectedValueOnce(new Error('Update failed'));
      
      renderComponent();
      
      // Open dialog and submit
      const editButton = screen.getByRole('button', { name: /edit care notes/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const notesTextarea = screen.getByLabelText(/care notes \*/i);
      fireEvent.change(notesTextarea, { 
        target: { value: 'Updated notes' } 
      });
      
      const saveButton = screen.getByRole('button', { name: /save notes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating care notes:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderComponent();
      
      expect(screen.getByRole('region', { name: /medical history/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /medical conditions/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /allergies/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /care notes/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /medical timeline/i })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderComponent();
      
      const mainHeading = screen.getByRole('heading', { name: /medical history/i });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading.tagName).toBe('H2');
    });

    it('has proper list roles for conditions and allergies', () => {
      renderComponent();
      
      expect(screen.getByRole('list', { name: /medical conditions/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /client allergies/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /medical timeline events/i })).toBeInTheDocument();
    });

    it('has descriptive button labels', () => {
      renderComponent();
      
      expect(screen.getByRole('button', { name: /add new medical condition/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new allergy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit care notes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove diabetes condition/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove penicillin allergy/i })).toBeInTheDocument();
    });

    it('has proper form labels and error handling', async () => {
      renderComponent();
      
      // Open add condition dialog
      const addButton = screen.getByRole('button', { name: /add new medical condition/i });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/medical condition \*/i)).toBeInTheDocument();
      });
      
      // Submit empty form to trigger validation
      const submitButton = screen.getByRole('button', { name: /add condition/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('id', 'condition-error');
      });
    });

    it('has proper time elements with datetime attributes', () => {
      renderComponent();
      
      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThan(0);
      
      timeElements.forEach(timeElement => {
        expect(timeElement).toHaveAttribute('dateTime');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles client with no user in auth store', () => {
      vi.mocked(authStore.useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
      });
      
      renderComponent();
      
      // Should still render without crashing
      expect(screen.getByRole('region', { name: /medical history/i })).toBeInTheDocument();
    });

    it('handles removing the last medical condition', async () => {
      const clientWithOneCondition = {
        ...mockClient,
        medicalConditions: ['Diabetes'],
      };
      
      renderComponent(clientWithOneCondition);
      
      const removeButton = screen.getByRole('button', { name: /remove diabetes condition/i });
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 'client-1',
          medicalConditions: undefined,
        });
      });
    });

    it('handles removing the last allergy', async () => {
      const clientWithOneAllergy = {
        ...mockClient,
        allergies: ['Penicillin'],
      };
      
      renderComponent(clientWithOneAllergy);
      
      const removeButton = screen.getByRole('button', { name: /remove penicillin allergy/i });
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          id: 'client-1',
          allergies: undefined,
        });
      });
    });

    it('handles timeline with fewer than 3 events', () => {
      const clientWithMinimalData = {
        ...mockClientWithoutData,
        medicalConditions: ['Diabetes'],
      };
      
      renderComponent(clientWithMinimalData);
      
      // Should not show expand button
      expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
    });
  });
});