import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicationDialog } from '../medication-dialog';
import { useCreateMedication, useUpdateMedication } from '@/hooks/use-medications';
import type { Medication } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-medications', () => ({
  useCreateMedication: vi.fn(),
  useUpdateMedication: vi.fn(),
}));

const mockMedication: Medication = {
  id: '1',
  clientId: 'client-1',
  name: 'Metformin',
  genericName: 'Metformin HCl',
  dosage: '500',
  unit: 'mg',
  frequency: 'Twice daily',
  route: 'oral',
  scheduleType: 'fixed_times',
  scheduledTimes: ['08:00', '20:00'],
  prescribingDoctor: 'Dr. Smith',
  prescriptionDate: '2024-01-01',
  instructions: 'Take with food',
  sideEffects: ['Nausea', 'Diarrhea'],
  startDate: '2024-01-01',
  isActive: true,
  isPRN: false,
  lastTakenAt: '2024-01-15T08:00:00Z',
  nextDueAt: '2024-01-15T20:00:00Z',
  missedDoses: 1,
  totalDoses: 15,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('MedicationDialog', () => {
  const mockCreateMedication = {
    mutateAsync: vi.fn(),
    isPending: false,
  };
  
  const mockUpdateMedication = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateMedication).mockReturnValue(mockCreateMedication as any);
    vi.mocked(useUpdateMedication).mockReturnValue(mockUpdateMedication as any);
  });

  it('renders create dialog correctly', () => {
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Add New Medication')).toBeInTheDocument();
    expect(screen.getByText('Enter medication details and schedule information.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create medication/i })).toBeInTheDocument();
  });

  it('renders edit dialog correctly', () => {
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        medication={mockMedication}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Edit Medication')).toBeInTheDocument();
    expect(screen.getByText('Update medication information and schedule.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update medication/i })).toBeInTheDocument();
  });

  it('populates form fields in edit mode', () => {
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        medication={mockMedication}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByDisplayValue('Metformin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Metformin HCl')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mg')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Twice daily')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dr. Smith')).toBeInTheDocument();
  });

  it('displays side effects as badges in edit mode', () => {
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        medication={mockMedication}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Nausea')).toBeInTheDocument();
    expect(screen.getByText('Diarrhea')).toBeInTheDocument();
  });

  it('displays scheduled times as badges in edit mode', () => {
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        medication={mockMedication}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /create medication/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Medication name is required')).toBeInTheDocument();
      expect(screen.getByText('Dosage is required')).toBeInTheDocument();
      expect(screen.getByText('Unit is required')).toBeInTheDocument();
      expect(screen.getByText('Frequency is required')).toBeInTheDocument();
      expect(screen.getByText('Prescribing doctor is required')).toBeInTheDocument();
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
    });
  });

  it('allows adding and removing side effects', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Add a side effect
    const sideEffectInput = screen.getByPlaceholderText('Add side effect');
    await user.type(sideEffectInput, 'Headache');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Headache')).toBeInTheDocument();

    // Remove the side effect
    const headacheBadge = screen.getByText('Headache').closest('[class*="badge"]');
    const removeButton = headacheBadge?.querySelector('button');
    if (removeButton) {
      await user.click(removeButton);
    }

    expect(screen.queryByText('Headache')).not.toBeInTheDocument();
  });

  it('allows adding and removing scheduled times', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Add a scheduled time
    const timeInput = screen.getByDisplayValue('');
    await user.type(timeInput, '09:00');
    
    const addTimeButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') && btn.closest('div')?.querySelector('input[type="time"]')
    );
    if (addTimeButton) {
      await user.click(addTimeButton);
    }

    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('toggles PRN medication correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Find and toggle the PRN switch
    const prnSwitch = screen.getByRole('switch');
    await user.click(prnSwitch);

    // Schedule fields should be hidden when PRN is enabled
    expect(screen.queryByText('Schedule Type')).not.toBeInTheDocument();
  });

  it('shows interval input when interval schedule type is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Select interval schedule type
    const scheduleTypeSelect = screen.getByDisplayValue('Fixed Times');
    await user.selectOptions(scheduleTypeSelect, 'interval');

    expect(screen.getByText('Interval (hours)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 8')).toBeInTheDocument();
  });

  it('submits create form with correct data', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={onOpenChange}
        mode="create"
        clientId="client-1"
      />,
      { wrapper: createWrapper() }
    );

    // Fill required fields
    await user.type(screen.getByPlaceholderText('Enter medication name'), 'Aspirin');
    await user.type(screen.getByPlaceholderText('e.g., 500'), '100');
    await user.type(screen.getByPlaceholderText('e.g., mg, ml'), 'mg');
    await user.type(screen.getByPlaceholderText('e.g., Twice daily, Every 8 hours'), 'Once daily');
    await user.type(screen.getByPlaceholderText('Enter doctor\'s name'), 'Dr. Johnson');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-01');

    const submitButton = screen.getByRole('button', { name: /create medication/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateMedication.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client-1',
          name: 'Aspirin',
          dosage: '100',
          unit: 'mg',
          frequency: 'Once daily',
          prescribingDoctor: 'Dr. Johnson',
          startDate: '2024-01-01',
        })
      );
    });
  });

  it('submits update form with correct data', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={onOpenChange}
        medication={mockMedication}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    // Update medication name
    const nameInput = screen.getByDisplayValue('Metformin');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Metformin');

    const submitButton = screen.getByRole('button', { name: /update medication/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateMedication.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Updated Metformin',
        })
      );
    });
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={onOpenChange}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles form submission errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockCreateMedication.mutateAsync.mockRejectedValue(new Error('Network error'));
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
        clientId="client-1"
      />,
      { wrapper: createWrapper() }
    );

    // Fill required fields
    await user.type(screen.getByPlaceholderText('Enter medication name'), 'Aspirin');
    await user.type(screen.getByPlaceholderText('e.g., 500'), '100');
    await user.type(screen.getByPlaceholderText('e.g., mg, ml'), 'mg');
    await user.type(screen.getByPlaceholderText('e.g., Twice daily, Every 8 hours'), 'Once daily');
    await user.type(screen.getByPlaceholderText('Enter doctor\'s name'), 'Dr. Johnson');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-01');

    const submitButton = screen.getByRole('button', { name: /create medication/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error saving medication:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('adds side effect on Enter key press', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    const sideEffectInput = screen.getByPlaceholderText('Add side effect');
    await user.type(sideEffectInput, 'Dizziness');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Dizziness')).toBeInTheDocument();
  });

  it('shows route selection options', () => {
    render(
      <MedicationDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    const routeSelect = screen.getByDisplayValue('Oral');
    expect(routeSelect).toBeInTheDocument();
    
    // Check that all route options are available
    const options = screen.getAllByRole('option');
    const routeOptions = options.filter(option => 
      ['Oral', 'Injection', 'Topical', 'Inhalation', 'Other'].includes(option.textContent || '')
    );
    expect(routeOptions).toHaveLength(5);
  });
});