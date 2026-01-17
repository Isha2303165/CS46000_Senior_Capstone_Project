import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicationReminder } from '../medication-reminder';
import { useLogMedication } from '@/hooks/use-medications';
import type { Medication } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-medications', () => ({
  useLogMedication: vi.fn(),
}));

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'h:mm a') return '9:00 AM';
    return 'Jan 15, 2024';
  }),
  isAfter: vi.fn(() => false),
  isBefore: vi.fn(() => true),
  addHours: vi.fn(() => new Date())
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
  instructions: 'Take with food',
  sideEffects: ['Nausea', 'Diarrhea'],
  startDate: '2024-01-01',
  isActive: true,
  isPRN: false,
  nextDueAt: '2024-01-15T20:00:00Z',
  lastTakenAt: '2024-01-15T08:00:00Z',
  missedDoses: 1,
  totalDoses: 15,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const mockOverdueMedication: Medication = {
  ...mockMedication,
  id: '2',
  name: 'Overdue Medication',
  nextDueAt: '2024-01-15T08:00:00Z', // Past time
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

describe('MedicationReminder', () => {
  const mockLogMedication = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLogMedication).mockReturnValue(mockLogMedication as any);
  });

  it('renders medication information correctly', () => {
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('500 mg • Twice daily')).toBeInTheDocument();
    expect(screen.getByText('Due at 9:00 AM')).toBeInTheDocument();
  });

  it('displays instructions when present', () => {
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Instructions:')).toBeInTheDocument();
    expect(screen.getByText('Take with food')).toBeInTheDocument();
  });

  it('shows overdue status for overdue medications', () => {
    // Mock isBefore to return true for overdue check
    const { isBefore } = require('date-fns');
    vi.mocked(isBefore).mockReturnValue(true);

    render(
      <MedicationReminder medication={mockOverdueMedication} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Overdue since 9:00 AM')).toBeInTheDocument();
  });

  it('calls onTakeMedication when taken button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    const takenButton = screen.getByRole('button', { name: /taken/i });
    await user.click(takenButton);

    await waitFor(() => {
      expect(mockLogMedication.mutateAsync).toHaveBeenCalledWith({
        medicationId: '1',
        takenAt: expect.any(String),
        scheduledFor: mockMedication.nextDueAt,
        dosageTaken: '500 mg',
        takenBy: 'current-user',
        status: 'taken',
        notes: 'Taken as scheduled',
      });
    });
  });

  it('calls onTakeMedication when missed button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    const missedButton = screen.getByRole('button', { name: /missed/i });
    await user.click(missedButton);

    await waitFor(() => {
      expect(mockLogMedication.mutateAsync).toHaveBeenCalledWith({
        medicationId: '1',
        takenAt: expect.any(String),
        scheduledFor: mockMedication.nextDueAt,
        dosageTaken: undefined,
        takenBy: 'current-user',
        status: 'missed',
        notes: 'Missed dose',
      });
    });
  });

  it('opens detailed log dialog when details button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    const detailsButton = screen.getByRole('button', { name: /details/i });
    await user.click(detailsButton);

    expect(screen.getByText('Log Medication')).toBeInTheDocument();
    expect(screen.getByText('Record details about taking Metformin')).toBeInTheDocument();
  });

  it('allows selecting different status options in detailed dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    // Open details dialog
    const detailsButton = screen.getByRole('button', { name: /details/i });
    await user.click(detailsButton);

    // Check that all status options are available
    expect(screen.getByRole('button', { name: /taken/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /partial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /missed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skipped/i })).toBeInTheDocument();

    // Select partial status
    const partialButton = screen.getByRole('button', { name: /partial/i });
    await user.click(partialButton);

    // Dosage input should appear
    expect(screen.getByLabelText('Dosage Taken')).toBeInTheDocument();
  });

  it('shows side effects selection in detailed dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    // Open details dialog
    const detailsButton = screen.getByRole('button', { name: /details/i });
    await user.click(detailsButton);

    expect(screen.getByText('Any side effects experienced?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nausea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diarrhea' })).toBeInTheDocument();

    // Select a side effect
    const nauseaButton = screen.getByRole('button', { name: 'Nausea' });
    await user.click(nauseaButton);

    // Button should be selected (different variant)
    expect(nauseaButton).toHaveClass('bg-primary');
  });

  it('submits detailed log with correct data', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    // Open details dialog
    const detailsButton = screen.getByRole('button', { name: /details/i });
    await user.click(detailsButton);

    // Fill in details
    await user.type(screen.getByLabelText('Notes (optional)'), 'Took with breakfast');

    // Submit
    const logButton = screen.getByRole('button', { name: /log medication/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(mockLogMedication.mutateAsync).toHaveBeenCalledWith({
        medicationId: '1',
        takenAt: expect.any(String),
        scheduledFor: mockMedication.nextDueAt,
        dosageTaken: '500',
        takenBy: 'current-user',
        status: 'taken',
        notes: 'Took with breakfast',
        sideEffectsNoted: undefined,
      });
    });
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    
    render(
      <MedicationReminder medication={mockMedication} onDismiss={onDismiss} />,
      { wrapper: createWrapper() }
    );

    const dismissButton = screen.getByRole('button', { name: /dismiss reminder/i });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('button', { name: /dismiss reminder/i })).not.toBeInTheDocument();
  });

  it('disables buttons when logging medication', () => {
    const mockLogMedicationPending = {
      mutateAsync: vi.fn(),
      isPending: true,
    };
    vi.mocked(useLogMedication).mockReturnValue(mockLogMedicationPending as any);

    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    const takenButton = screen.getByRole('button', { name: /taken/i });
    const missedButton = screen.getByRole('button', { name: /missed/i });
    const detailsButton = screen.getByRole('button', { name: /details/i });

    expect(takenButton).toBeDisabled();
    expect(missedButton).toBeDisabled();
    expect(detailsButton).toBeDisabled();
  });

  it('handles medication without instructions', () => {
    const medicationWithoutInstructions = {
      ...mockMedication,
      instructions: undefined
    };

    render(
      <MedicationReminder medication={medicationWithoutInstructions} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Instructions:')).not.toBeInTheDocument();
  });

  it('handles PRN medication correctly', () => {
    const prnMedication = {
      ...mockMedication,
      isPRN: true,
      nextDueAt: undefined
    };

    render(
      <MedicationReminder medication={prnMedication} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('As needed')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MedicationReminder medication={mockMedication} className="custom-class" />,
      { wrapper: createWrapper() }
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('closes detailed dialog on cancel', async () => {
    const user = userEvent.setup();
    
    render(
      <MedicationReminder medication={mockMedication} />,
      { wrapper: createWrapper() }
    );

    // Open details dialog
    const detailsButton = screen.getByRole('button', { name: /details/i });
    await user.click(detailsButton);

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.queryByText('Log Medication')).not.toBeInTheDocument();
  });
});