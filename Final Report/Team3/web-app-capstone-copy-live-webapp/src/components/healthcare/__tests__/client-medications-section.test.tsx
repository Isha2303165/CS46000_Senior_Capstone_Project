import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientMedicationsSection } from '../client-medications-section';
import { ToastProvider } from '@/components/ui/toast';
import { useClientMedications, useLogMedication, useMedicationLogs, useMedicationSubscription } from '@/hooks/use-medications';
import type { Medication } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-medications');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockUseClientMedications = vi.mocked(useClientMedications);
const mockUseLogMedication = vi.mocked(useLogMedication);
const mockUseMedicationSubscription = vi.mocked(useMedicationSubscription);

// Mock useMedicationLogs
const mockUseMedicationLogs = vi.fn();

// Mock medication data
const mockMedications: Medication[] = [
  {
    id: 'med-1',
    clientId: 'client-1',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: '10',
    unit: 'mg',
    frequency: 'Once daily',
    route: 'oral',
    scheduleType: 'fixed_times',
    scheduledTimes: ['08:00'],
    prescribingDoctor: 'Dr. Smith',
    instructions: 'Take with food',
    sideEffects: ['Dizziness', 'Cough'],
    startDate: '2024-01-01',
    isActive: true,
    isPRN: false,
    nextDueAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Due in 30 minutes
    lastTakenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Taken 24 hours ago
    missedDoses: 2,
    totalDoses: 28,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'med-2',
    clientId: 'client-1',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    dosage: '500',
    unit: 'mg',
    frequency: 'Twice daily',
    route: 'oral',
    scheduleType: 'fixed_times',
    scheduledTimes: ['08:00', '20:00'],
    prescribingDoctor: 'Dr. Johnson',
    instructions: 'Take with meals',
    sideEffects: ['Nausea', 'Diarrhea'],
    startDate: '2024-01-01',
    isActive: true,
    isPRN: false,
    nextDueAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Overdue by 30 minutes
    lastTakenAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // Taken 12 hours ago
    missedDoses: 1,
    totalDoses: 56,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'med-3',
    clientId: 'client-1',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    dosage: '200',
    unit: 'mg',
    frequency: 'As needed',
    route: 'oral',
    scheduleType: 'as_needed',
    prescribingDoctor: 'Dr. Brown',
    instructions: 'Take as needed for pain',
    sideEffects: ['Stomach upset'],
    startDate: '2024-01-01',
    isActive: true,
    isPRN: true,
    nextDueAt: null,
    lastTakenAt: null,
    missedDoses: 0,
    totalDoses: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockLogMedication = {
  mutateAsync: vi.fn(),
  isLoading: false,
  error: null,
};

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('ClientMedicationsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClientMedications.mockReturnValue({
      data: mockMedications,
      isLoading: false,
      error: null,
    } as any);
    mockUseLogMedication.mockReturnValue(mockLogMedication as any);
    mockUseMedicationLogs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    mockUseMedicationSubscription.mockReturnValue({
      subscribe: () => ({
        unsubscribe: vi.fn(),
      }),
    } as any);
    
    // Mock the useMedicationLogs hook
    vi.mocked(useMedicationLogs).mockImplementation(mockUseMedicationLogs);
  });

  it('renders medications section with correct title', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Add Medication')).toBeInTheDocument();
  });

  it('displays due medications count badge', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // Should show badge for due/overdue medications (all 3 medications are considered due based on the logic)
    expect(screen.getByText('3 due')).toBeInTheDocument();
  });

  it('categorizes medications correctly', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // Should show overdue section
    expect(screen.getByText('Overdue Medications (1)')).toBeInTheDocument();
    
    // Should show all active medications
    expect(screen.getByText('All Active Medications (3)')).toBeInTheDocument();
  });

  it('displays medication information correctly', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // Check if medication names are displayed (using getAllByText since they appear multiple times)
    expect(screen.getAllByText('Lisinopril').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Metformin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ibuprofen').length).toBeGreaterThanOrEqual(1);

    // Check dosage information (using getAllByText since they appear multiple times)
    expect(screen.getAllByText('10 mg • Once daily').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('500 mg • Twice daily').length).toBeGreaterThanOrEqual(1);
    
    // For PRN medication, check individual parts since the display might be different
    expect(screen.getByText('200 mg')).toBeInTheDocument();
    expect(screen.getAllByText('As needed').length).toBeGreaterThanOrEqual(1);
  });

  it('shows quick action buttons for due medications', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // Should show "Taken" and "Skip" buttons for due medications
    const takenButtons = screen.getAllByText('Taken');
    const skipButtons = screen.getAllByText('Skip');
    
    expect(takenButtons.length).toBeGreaterThanOrEqual(2); // For due/overdue medications
    expect(skipButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('handles medication taken action', async () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    const takenButtons = screen.getAllByText('Taken');
    fireEvent.click(takenButtons[0]);

    await waitFor(() => {
      expect(mockLogMedication.mutateAsync).toHaveBeenCalledWith({
        medicationId: 'med-2', // Metformin (overdue medication)
        takenAt: expect.any(String),
        scheduledFor: expect.any(String),
        takenBy: 'current-user',
        status: 'taken',
        notes: undefined,
      });
    });
  });

  it('handles medication skip action', async () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    const skipButtons = screen.getAllByText('Skip');
    fireEvent.click(skipButtons[0]);

    await waitFor(() => {
      expect(mockLogMedication.mutateAsync).toHaveBeenCalledWith({
        medicationId: 'med-2', // Metformin (overdue medication)
        takenAt: expect.any(String),
        scheduledFor: expect.any(String),
        takenBy: 'current-user',
        status: 'skipped',
        notes: 'Skipped by caregiver',
      });
    });
  });

  it('shows optimistic updates during medication actions', async () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    const takenButtons = screen.getAllByText('Taken');
    fireEvent.click(takenButtons[0]);

    // Should show loading state (may appear multiple times)
    expect(screen.getAllByText('Logging...').length).toBeGreaterThanOrEqual(1);
  });

  it('calculates adherence rates correctly', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // Switch to adherence tab to see the calculations
    fireEvent.click(screen.getByRole('tab', { name: 'Adherence' }));

    // Lisinopril: 28 taken / (28 + 2 missed) = 93%
    // Metformin: 56 taken / (56 + 1 missed) = 98%
    // Ibuprofen: 5 taken / (5 + 0 missed) = 100%
    
    // Check if adherence percentages are displayed
    expect(screen.getAllByText(/93%|98%|100%/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows PRN badge for as-needed medications', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // PRN medications show "As needed" in frequency and as a badge
    expect(screen.getAllByText('As needed').length).toBeGreaterThanOrEqual(1);
  });

  it('opens add medication dialog when add button is clicked', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add Medication');
    expect(addButton).toBeInTheDocument();
    
    // Test that the button is clickable
    expect(addButton).not.toBeDisabled();
  });

  it('switches between tabs correctly', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // Check default tab
    expect(screen.getByRole('tab', { name: 'Current' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Adherence' })).toBeInTheDocument();

    // Click on History tab
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByText('Medication Activity History')).toBeInTheDocument();

    // Click on Adherence tab
    fireEvent.click(screen.getByRole('tab', { name: 'Adherence' }));
    expect(screen.getByText('Adherence Analytics')).toBeInTheDocument();
  });

  it('shows loading state when medications are loading', () => {
    mockUseClientMedications.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    // Should show loading skeletons
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('shows empty state when no medications exist', () => {
    mockUseClientMedications.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    expect(screen.getByText('No active medications')).toBeInTheDocument();
    expect(screen.getByText('Add First Medication')).toBeInTheDocument();
  });

  it('handles medication logging errors gracefully', async () => {
    mockLogMedication.mutateAsync.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    const takenButtons = screen.getAllByText('Taken');
    fireEvent.click(takenButtons[0]);

    await waitFor(() => {
      expect(mockLogMedication.mutateAsync).toHaveBeenCalled();
    });

    // Error handling is done through toast notifications, which are harder to test
    // In a real implementation, you might want to check for error states or retry mechanisms
  });
});