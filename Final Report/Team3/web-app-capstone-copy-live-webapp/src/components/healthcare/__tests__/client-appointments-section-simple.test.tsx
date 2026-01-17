import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientAppointmentsSection } from '../client-appointments-section';
import { useAppointments } from '@/hooks/use-appointments';
import { Client, UserProfile } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-appointments');

// Mock the child components
vi.mock('../appointment-card', () => ({
  AppointmentCard: ({ appointment }: any) => (
    <div data-testid={`appointment-card-${appointment.id}`}>
      {appointment.title}
    </div>
  ),
}));

vi.mock('../appointment-dialog', () => ({
  AppointmentDialog: ({ isOpen }: any) => (
    <div data-testid="appointment-dialog" style={{ display: isOpen ? 'block' : 'none' }}>
      Dialog
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
    render(
      <ClientAppointmentsSection
        clientId="client-1"
        client={mockClient}
        currentUser={mockCurrentUser}
      />
    );

    expect(screen.getAllByText('Upcoming')).toHaveLength(2); // Stats and tab
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getAllByText('Overdue')).toHaveLength(2); // Stats and tab
    expect(screen.getAllByText('Cancelled')).toHaveLength(2); // Stats and tab
  });

  it('displays tabs for different appointment categories', () => {
    render(
      <ClientAppointmentsSection
        clientId="client-1"
        client={mockClient}
        currentUser={mockCurrentUser}
      />
    );

    expect(screen.getByRole('tab', { name: /upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /past/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /overdue/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cancelled/i })).toBeInTheDocument();
  });

  it('shows empty state message when no appointments exist', () => {
    render(
      <ClientAppointmentsSection
        clientId="client-1"
        client={mockClient}
        currentUser={mockCurrentUser}
      />
    );

    expect(screen.getByText('No upcoming appointments scheduled.')).toBeInTheDocument();
  });

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
  });
});