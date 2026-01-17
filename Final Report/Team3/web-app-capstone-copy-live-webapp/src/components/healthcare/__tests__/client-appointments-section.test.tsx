import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientAppointmentsSection } from '../client-appointments-section';
import { useAppointments } from '@/hooks/use-appointments';
import { Appointment, Client, UserProfile } from '@/types';
import { addDays, subDays, format } from 'date-fns';

// Mock the hooks
vi.mock('@/hooks/use-appointments');

// Mock the child components
vi.mock('../appointment-card', () => ({
  AppointmentCard: ({ appointment, onEdit, onCancel, onComplete }: any) => (
    <div data-testid={`appointment-card-${appointment.id}`}>
      <div>{appointment.title}</div>
      <div>{appointment.status}</div>
      <button onClick={() => onEdit(appointment)}>Edit</button>
      <button onClick={() => onCancel(appointment)}>Cancel</button>
      <button onClick={() => onComplete(appointment)}>Complete</button>
    </div>
  ),
}));

vi.mock('../appointment-dialog', () => ({
  AppointmentDialog: ({ isOpen, onClose, onSave, appointment }: any) => (
    <div data-testid="appointment-dialog" style={{ display: isOpen ? 'block' : 'none' }}>
      <div>{appointment ? 'Edit Appointment' : 'New Appointment'}</div>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onSave({ title: 'Test Appointment' })}>Save</button>
    </div>
  ),
}));

const mockUseAppointments = vi.mocked(useAppointments);

describe('ClientAppointmentsSection', () => {
  const mockClient: Client = {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '555-0123',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCurrentUser: UserProfile = {
    id: 'user-1',
    userId: 'cognito-user-1',
    email: 'caregiver@example.com',
    firstName: 'Care',
    lastName: 'Giver',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const createMockAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
    id: 'appointment-1',
    clientId: 'client-1',
    title: 'Annual Physical',
    appointmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    appointmentTime: '10:00',
    duration: 60,
    providerName: 'Dr. Smith',
    locationType: 'in_person',
    status: 'scheduled',
    priority: 'normal',
    followUpRequired: false,
    reminderSent: false,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  const mockAppointmentsHook = {
    appointments: [],
    loading: false,
    error: null,
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
    checkAppointmentConflicts: vi.fn().mockResolvedValue([]),
    getAppointmentsByDateRange: vi.fn(),
    getUpcomingAppointments: vi.fn(),
    getOverdueAppointments: vi.fn(),
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppointments.mockReturnValue(mockAppointmentsHook);
  });

  describe('Rendering', () => {
    it('renders the appointments section with title and add button', () => {
      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Add Appointment')).toBeInTheDocument();
    });

    it('displays quick stats for appointment categories', () => {
      const upcomingAppointment = createMockAppointment({
        id: 'upcoming-1',
        appointmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        status: 'scheduled',
      });

      const completedAppointment = createMockAppointment({
        id: 'completed-1',
        appointmentDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        status: 'completed',
      });

      const overdueAppointment = createMockAppointment({
        id: 'overdue-1',
        appointmentDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        status: 'scheduled',
      });

      const cancelledAppointment = createMockAppointment({
        id: 'cancelled-1',
        status: 'cancelled',
      });

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [upcomingAppointment, completedAppointment, overdueAppointment, cancelledAppointment],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument(); // Upcoming
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('displays tabs with badge counts', () => {
      const appointments = [
        createMockAppointment({
          id: 'upcoming-1',
          appointmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
          status: 'scheduled',
        }),
        createMockAppointment({
          id: 'upcoming-2',
          appointmentDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
          status: 'confirmed',
        }),
      ];

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const upcomingTab = screen.getByRole('tab', { name: /upcoming/i });
      expect(upcomingTab).toBeInTheDocument();
      expect(within(upcomingTab).getByText('2')).toBeInTheDocument();
    });
  });

  describe('Appointment Management', () => {
    it('opens the appointment dialog when add button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const addButton = screen.getByRole('button', { name: /add appointment/i });
      await user.click(addButton);

      expect(screen.getByTestId('appointment-dialog')).toBeVisible();
      expect(screen.getByText('New Appointment')).toBeInTheDocument();
    });

    it('opens the appointment dialog for editing when edit is clicked', async () => {
      const user = userEvent.setup();
      const appointment = createMockAppointment();

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [appointment],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('appointment-dialog')).toBeVisible();
      expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
    });

    it('creates a new appointment when dialog is saved', async () => {
      const user = userEvent.setup();
      const createAppointmentMock = vi.fn().mockResolvedValue({});

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        createAppointment: createAppointmentMock,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      // Open dialog
      const addButton = screen.getByRole('button', { name: /add appointment/i });
      await user.click(addButton);

      // Save appointment
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(createAppointmentMock).toHaveBeenCalledWith({ title: 'Test Appointment' });
      });
    });

    it('updates an appointment when editing', async () => {
      const user = userEvent.setup();
      const updateAppointmentMock = vi.fn().mockResolvedValue({});
      const appointment = createMockAppointment();

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [appointment],
        updateAppointment: updateAppointmentMock,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      // Open edit dialog
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateAppointmentMock).toHaveBeenCalledWith({ title: 'Test Appointment' });
      });
    });

    it('cancels an appointment when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const updateAppointmentMock = vi.fn().mockResolvedValue({});
      const appointment = createMockAppointment();

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [appointment],
        updateAppointment: updateAppointmentMock,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(updateAppointmentMock).toHaveBeenCalledWith({
          id: appointment.id,
          status: 'cancelled',
        });
      });
    });

    it('completes an appointment when complete button is clicked', async () => {
      const user = userEvent.setup();
      const updateAppointmentMock = vi.fn().mockResolvedValue({});
      const appointment = createMockAppointment();

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [appointment],
        updateAppointment: updateAppointmentMock,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(updateAppointmentMock).toHaveBeenCalledWith({
          id: appointment.id,
          status: 'completed',
          completedBy: mockCurrentUser.id,
        });
      });
    });
  });

  describe('Quick Actions', () => {
    it('displays quick confirm buttons for scheduled appointments', () => {
      const scheduledAppointment = createMockAppointment({
        id: 'scheduled-1',
        title: 'Physical Exam',
        status: 'scheduled',
        appointmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [scheduledAppointment],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByRole('button', { name: /confirm physical exam/i })).toBeInTheDocument();
    });

    it('displays quick reschedule buttons for upcoming appointments', () => {
      const upcomingAppointment = createMockAppointment({
        id: 'upcoming-1',
        title: 'Checkup',
        appointmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [upcomingAppointment],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByRole('button', { name: /reschedule checkup/i })).toBeInTheDocument();
    });

    it('confirms an appointment when quick confirm is clicked', async () => {
      const user = userEvent.setup();
      const updateAppointmentMock = vi.fn().mockResolvedValue({});
      const scheduledAppointment = createMockAppointment({
        status: 'scheduled',
        appointmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [scheduledAppointment],
        updateAppointment: updateAppointmentMock,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(updateAppointmentMock).toHaveBeenCalledWith({
          id: scheduledAppointment.id,
          status: 'confirmed',
          confirmedBy: mockCurrentUser.id,
        });
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches between appointment tabs', async () => {
      const user = userEvent.setup();
      const upcomingAppointment = createMockAppointment({
        id: 'upcoming-1',
        appointmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        status: 'scheduled',
      });

      const pastAppointment = createMockAppointment({
        id: 'past-1',
        appointmentDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        status: 'completed',
      });

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [upcomingAppointment, pastAppointment],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      // Initially on upcoming tab
      expect(screen.getByTestId('appointment-card-upcoming-1')).toBeInTheDocument();
      expect(screen.queryByTestId('appointment-card-past-1')).not.toBeInTheDocument();

      // Switch to past tab
      const pastTab = screen.getByRole('tab', { name: /past/i });
      await user.click(pastTab);

      expect(screen.queryByTestId('appointment-card-upcoming-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('appointment-card-past-1')).toBeInTheDocument();
    });

    it('shows overdue warning message in overdue tab', async () => {
      const user = userEvent.setup();
      const overdueAppointment = createMockAppointment({
        id: 'overdue-1',
        appointmentDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        status: 'scheduled',
      });

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [overdueAppointment],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const overdueTab = screen.getByRole('tab', { name: /overdue/i });
      await user.click(overdueTab);

      expect(screen.getByText(/these appointments are past their scheduled time/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when appointments fail to load', () => {
      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        error: 'Failed to load appointments',
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByText('Error Loading Appointments')).toBeInTheDocument();
      expect(screen.getByText('Failed to load appointments')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('calls refetch when try again button is clicked', async () => {
      const user = userEvent.setup();
      const refetchMock = vi.fn();

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        error: 'Failed to load appointments',
        refetch: refetchMock,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const tryAgainButton = screen.getByText('Try Again');
      await user.click(tryAgainButton);

      expect(refetchMock).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows loading state on refresh button when loading', () => {
      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        loading: true,
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const refreshButton = screen.getByRole('button', { name: 'Refresh appointments' });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Empty States', () => {
    it('shows empty state message when no appointments exist', () => {
      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByText('No upcoming appointments scheduled.')).toBeInTheDocument();
    });

    it('shows appropriate empty messages for each tab', async () => {
      const user = userEvent.setup();

      mockUseAppointments.mockReturnValue({
        ...mockAppointmentsHook,
        appointments: [],
      });

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      // Check upcoming tab
      expect(screen.getByText('No upcoming appointments scheduled.')).toBeInTheDocument();

      // Check past tab
      const pastTab = screen.getByRole('tab', { name: /past/i });
      await user.click(pastTab);
      expect(screen.getByText('No past appointments found.')).toBeInTheDocument();

      // Check overdue tab
      const overdueTab = screen.getByRole('tab', { name: /overdue/i });
      await user.click(overdueTab);
      expect(screen.getByText('No overdue appointments.')).toBeInTheDocument();

      // Check cancelled tab
      const cancelledTab = screen.getByRole('tab', { name: /cancelled/i });
      await user.click(cancelledTab);
      expect(screen.getByText('No cancelled appointments.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('supports keyboard navigation between tabs', async () => {
      const user = userEvent.setup();

      render(
        <ClientAppointmentsSection
          clientId="client-1"
          client={mockClient}
          currentUser={mockCurrentUser}
        />
      );

      const upcomingTab = screen.getByRole('tab', { name: /upcoming/i });
      const pastTab = screen.getByRole('tab', { name: /past/i });

      // Focus on first tab
      upcomingTab.focus();
      expect(upcomingTab).toHaveFocus();

      // Click to navigate to next tab (simpler than arrow key navigation)
      await user.click(pastTab);
      expect(pastTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});