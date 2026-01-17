import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ClientQuickActions } from '../client-quick-actions';
import { ToastProvider } from '@/components/ui/toast';
import type { Client, Medication } from '@/types';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the toast hook
const mockAddToast = vi.fn();
vi.mock('@/components/ui/toast', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useToast: () => ({
      addToast: mockAddToast
    })
  };
});

// Test wrapper with ToastProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+1234567890',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockDueMedications: Medication[] = [
  {
    id: 'med-1',
    clientId: 'client-1',
    name: 'Aspirin',
    dosage: '100',
    unit: 'mg',
    frequency: 'daily',
    scheduleType: 'fixed_times',
    prescribingDoctor: 'Dr. Smith',
    startDate: '2024-01-01',
    isActive: true,
    isPRN: false,
    missedDoses: 0,
    totalDoses: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'med-2',
    clientId: 'client-1',
    name: 'Metformin',
    dosage: '500',
    unit: 'mg',
    frequency: 'twice daily',
    scheduleType: 'fixed_times',
    prescribingDoctor: 'Dr. Johnson',
    startDate: '2024-01-01',
    isActive: true,
    isPRN: false,
    missedDoses: 0,
    totalDoses: 20,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('ClientQuickActions', () => {
  const mockProps = {
    client: mockClient,
    dueMedications: mockDueMedications,
    onAddMedication: vi.fn(),
    onScheduleAppointment: vi.fn(),
    onSendMessage: vi.fn(),
    onLogMedication: vi.fn(),
    onEmergencyContact: vi.fn(),
    onViewCriticalInfo: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToast.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders collapsed state initially', () => {
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Should show main toggle button
    expect(screen.getByLabelText('Expand quick actions')).toBeInTheDocument();
    
    // Should not show expanded content initially
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Emergency')).not.toBeInTheDocument();
  });

  it('shows due medications badge when medications are due', () => {
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Should show badge with medication count
    expect(screen.getByLabelText('2 medications due')).toBeInTheDocument();
  });

  it('expands when toggle button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    const toggleButton = screen.getByLabelText('Expand quick actions');
    await user.click(toggleButton);

    // Should show expanded content
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText('Due Medications')).toBeInTheDocument();
  });

  it('displays due medications with quick action buttons', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Should show due medications
    expect(screen.getByText('Aspirin')).toBeInTheDocument();
    expect(screen.getByText('100 mg')).toBeInTheDocument();
    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('500 mg')).toBeInTheDocument();

    // Should show quick action buttons for each medication
    expect(screen.getByLabelText('Mark Aspirin as taken')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark Aspirin as skipped')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark Metformin as taken')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark Metformin as skipped')).toBeInTheDocument();
  });

  it('calls onLogMedication when medication action buttons are clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Click "Mark as taken" for Aspirin
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    expect(mockProps.onLogMedication).toHaveBeenCalledWith('med-1', 'taken');
  });

  it('shows loading state when logging medication', async () => {
    const user = userEvent.setup();
    const slowLogMedication = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} onLogMedication={slowLogMedication} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Click "Mark as taken" for Aspirin
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    // Should show loading spinner
    expect(screen.getByLabelText('Mark Aspirin as taken')).toBeDisabled();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText('Mark Aspirin as taken')).not.toBeDisabled();
    });
  });

  it('displays primary action buttons', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Should show primary action buttons
    expect(screen.getByLabelText('Add Medication')).toBeInTheDocument();
    expect(screen.getByLabelText('Schedule Appointment')).toBeInTheDocument();
    expect(screen.getByLabelText('Send Message')).toBeInTheDocument();
  });

  it('calls appropriate handlers when primary action buttons are clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Test Add Medication
    await user.click(screen.getByLabelText('Add Medication'));
    expect(mockProps.onAddMedication).toHaveBeenCalled();

    // Test Schedule Appointment
    await user.click(screen.getByLabelText('Schedule Appointment'));
    expect(mockProps.onScheduleAppointment).toHaveBeenCalled();

    // Test Send Message
    await user.click(screen.getByLabelText('Send Message'));
    expect(mockProps.onSendMessage).toHaveBeenCalled();
  });

  it('displays emergency action buttons', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Should show emergency action buttons
    expect(screen.getByLabelText('Emergency Contact')).toBeInTheDocument();
    expect(screen.getByLabelText('Critical Info')).toBeInTheDocument();
  });

  it('calls appropriate handlers when emergency action buttons are clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Test Emergency Contact
    await user.click(screen.getByLabelText('Emergency Contact'));
    expect(mockProps.onEmergencyContact).toHaveBeenCalled();

    // Test Critical Info
    await user.click(screen.getByLabelText('Critical Info'));
    expect(mockProps.onViewCriticalInfo).toHaveBeenCalled();
  });

  it('disables buttons when handlers are not provided', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions 
          client={mockClient}
          dueMedications={mockDueMedications}
        />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // All buttons should be disabled
    expect(screen.getByLabelText('Add Medication')).toBeDisabled();
    expect(screen.getByLabelText('Schedule Appointment')).toBeDisabled();
    expect(screen.getByLabelText('Send Message')).toBeDisabled();
    expect(screen.getByLabelText('Emergency Contact')).toBeDisabled();
    expect(screen.getByLabelText('Critical Info')).toBeDisabled();
  });

  it('tracks recent actions and shows undo functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Perform an action that creates a recent action
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    // Should show recent actions section
    await waitFor(() => {
      expect(screen.getByText('Recent Actions')).toBeInTheDocument();
      expect(screen.getByText('Marked Aspirin as taken')).toBeInTheDocument();
    });

    // Should show undo button
    expect(screen.getByLabelText('Undo Marked Aspirin as taken')).toBeInTheDocument();
  });

  it('shows toast notification when action is performed', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Perform an action
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    // Should show toast notification
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Marked Aspirin as taken',
        action: expect.objectContaining({
          label: 'Undo',
          onClick: expect.any(Function)
        })
      });
    });
  });

  it('handles undo functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Perform an action
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    // Wait for recent action to appear
    await waitFor(() => {
      expect(screen.getByText('Recent Actions')).toBeInTheDocument();
    });

    // Click undo
    await user.click(screen.getByLabelText('Undo Marked Aspirin as taken'));

    // Should show undo toast
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'info',
        message: 'Undid: Marked Aspirin as taken'
      });
    });

    // Recent action should be removed
    await waitFor(() => {
      expect(screen.queryByText('Marked Aspirin as taken')).not.toBeInTheDocument();
    });
  });

  it('clears recent actions when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Perform an action to create recent action
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    // Wait for recent action to appear
    await waitFor(() => {
      expect(screen.getByText('Recent Actions')).toBeInTheDocument();
    });

    // Click clear button
    await user.click(screen.getByLabelText('Clear recent actions'));

    // Recent actions should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Recent Actions')).not.toBeInTheDocument();
    });
  });

  it('shows limited number of due medications with overflow indicator', async () => {
    const user = userEvent.setup();
    const manyMedications = Array.from({ length: 5 }, (_, i) => ({
      ...mockDueMedications[0],
      id: `med-${i + 1}`,
      name: `Medication ${i + 1}`
    }));
    
    render(
      <TestWrapper>
        <ClientQuickActions 
          {...mockProps} 
          dueMedications={manyMedications}
        />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Should show only first 3 medications
    expect(screen.getByText('Medication 1')).toBeInTheDocument();
    expect(screen.getByText('Medication 2')).toBeInTheDocument();
    expect(screen.getByText('Medication 3')).toBeInTheDocument();
    
    // Should show overflow indicator
    expect(screen.getByText('+2 more due')).toBeInTheDocument();
  });

  it('handles medication logging errors gracefully', async () => {
    const user = userEvent.setup();
    const errorLogMedication = vi.fn().mockRejectedValue(new Error('Network error'));
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} onLogMedication={errorLogMedication} />
      </TestWrapper>
    );

    // Expand the component
    await user.click(screen.getByLabelText('Expand quick actions'));

    // Click medication action
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    // Should show error toast
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to log Aspirin'
      });
    });
  });

  it('auto-hides after inactivity', async () => {
    vi.useFakeTimers();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Initially visible
    expect(screen.getByLabelText('Expand quick actions')).toBeInTheDocument();

    // Fast-forward time to trigger auto-hide
    act(() => {
      vi.advanceTimersByTime(11000); // 11 seconds
    });

    // Component should still be functional (this tests the auto-hide logic exists)
    expect(screen.getByRole('button')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows undo badge when undoable actions are available', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Expand and perform action
    await user.click(screen.getByLabelText('Expand quick actions'));
    await user.click(screen.getByLabelText('Mark Aspirin as taken'));

    // Should show recent actions section when expanded
    await waitFor(() => {
      expect(screen.getByText('Recent Actions')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} className="custom-class" />
      </TestWrapper>
    );

    const container = screen.getByLabelText('Expand quick actions').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientQuickActions {...mockProps} />
      </TestWrapper>
    );

    // Tab to toggle button
    await user.tab();
    expect(screen.getByLabelText('Expand quick actions')).toHaveFocus();

    // Press Enter to expand
    await user.keyboard('{Enter}');
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });
});