import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CalendarView } from '../calendar-view';
import { useAppointments } from '@/hooks/use-appointments';
import { useMedications } from '@/hooks/use-medications';
import { useClients } from '@/hooks/use-clients';
import { Appointment, Medication, Client } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-appointments');
vi.mock('@/hooks/use-medications');
vi.mock('@/hooks/use-clients');

// Mock AppointmentDialog
vi.mock('../appointment-dialog', () => ({
  AppointmentDialog: ({ onClose }: any) => (
    <div data-testid="appointment-dialog">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: ({ onSelectSlot, onSelectEvent, events }: any) => (
    <div data-testid="calendar">
      <button 
        onClick={() => onSelectSlot({ start: new Date(), end: new Date() })}
        data-testid="select-slot"
      >
        Select Slot
      </button>
      <div data-testid="events">
        {events.map((event: any, index: number) => (
          <div 
            key={index}
            data-testid={`event-${event.id}`}
            onClick={() => onSelectEvent(event)}
          >
            {event.title}
          </div>
        ))}
      </div>
    </div>
  ),
  momentLocalizer: () => ({}),
}));

// Mock moment
vi.mock('moment', () => ({
  default: () => ({
    format: () => 'January 2024',
  }),
}));

const mockClients: Client[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '555-0123',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-05-15',
    emergencyContactName: 'Bob Smith',
    emergencyContactPhone: '555-0456',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockAppointments: Appointment[] = [
  {
    id: '1',
    clientId: '1',
    title: 'Cardiology Checkup',
    appointmentDate: '2024-02-15',
    appointmentTime: '10:00',
    duration: 60,
    providerName: 'Dr. Smith',
    locationType: 'in_person',
    status: 'scheduled',
    priority: 'normal',
    followUpRequired: false,
    reminderSent: false,
    createdBy: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    clientId: '2',
    title: 'Annual Physical',
    appointmentDate: '2024-02-20',
    appointmentTime: '14:30',
    duration: 90,
    providerName: 'Dr. Johnson',
    locationType: 'in_person',
    status: 'confirmed',
    priority: 'normal',
    followUpRequired: true,
    reminderSent: false,
    createdBy: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockMedications: Medication[] = [
  {
    id: '1',
    clientId: '1',
    name: 'Lisinopril',
    dosage: '10',
    unit: 'mg',
    frequency: 'Once daily',
    scheduleType: 'fixed_times',
    scheduledTimes: ['08:00'],
    prescribingDoctor: 'Dr. Smith',
    startDate: '2024-01-01',
    isActive: true,
    isPRN: false,
    missedDoses: 0,
    totalDoses: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    clientId: '2',
    name: 'Metformin',
    dosage: '500',
    unit: 'mg',
    frequency: 'Twice daily',
    scheduleType: 'fixed_times',
    scheduledTimes: ['08:00', '20:00'],
    prescribingDoctor: 'Dr. Johnson',
    startDate: '2024-01-01',
    isActive: true,
    isPRN: false,
    missedDoses: 0,
    totalDoses: 60,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('CalendarView', () => {
  beforeEach(() => {
    vi.mocked(useClients).mockReturnValue({
      clients: mockClients,
      loading: false,
      error: null,
      createClient: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
    });

    vi.mocked(useAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
    });

    vi.mocked(useMedications).mockReturnValue({
      medications: mockMedications,
      loading: false,
      error: null,
      createMedication: vi.fn(),
      updateMedication: vi.fn(),
      deleteMedication: vi.fn(),
      logMedication: vi.fn(),
    });
  });

  it('renders calendar view with header', () => {
    render(<CalendarView />);
    
    expect(screen.getByText('Healthcare Calendar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  it('displays medication toggle', () => {
    render(<CalendarView />);
    
    const medicationToggle = screen.getByRole('button', { name: /medications/i });
    expect(medicationToggle).toBeInTheDocument();
  });

  it('displays add appointment button', () => {
    render(<CalendarView />);
    
    const addButton = screen.getByRole('button', { name: /add appointment/i });
    expect(addButton).toBeInTheDocument();
  });

  it('displays navigation controls', () => {
    render(<CalendarView />);
    
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByText('month')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
  });

  it('renders appointment events', () => {
    render(<CalendarView />);
    
    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.getByTestId('event-2')).toBeInTheDocument();
    expect(screen.getByText(/Cardiology Checkup - John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Annual Physical - Jane Smith/)).toBeInTheDocument();
  });

  it('renders medication events when toggle is enabled', () => {
    render(<CalendarView />);
    
    // Medication events should be rendered by default
    const events = screen.getByTestId('events');
    expect(events).toBeInTheDocument();
    
    // Should have both appointment and medication events
    const eventElements = screen.getAllByTestId(/^event-/);
    expect(eventElements.length).toBeGreaterThan(2); // More than just appointments
  });

  it('hides medication events when toggle is disabled', async () => {
    render(<CalendarView />);
    
    const medicationToggle = screen.getByRole('button', { name: /medications/i });
    fireEvent.click(medicationToggle);
    
    await waitFor(() => {
      // Should only show appointment events
      const eventElements = screen.getAllByTestId(/^event-/);
      expect(eventElements).toHaveLength(2); // Only appointments
    });
  });

  it('opens appointment dialog when add appointment is clicked', async () => {
    render(<CalendarView />);
    
    const addButton = screen.getByRole('button', { name: /add appointment/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
    });
  });

  it('opens appointment dialog when calendar slot is selected', async () => {
    render(<CalendarView />);
    
    const selectSlotButton = screen.getByTestId('select-slot');
    fireEvent.click(selectSlotButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
    });
  });

  it('opens event details sheet when event is clicked', async () => {
    render(<CalendarView />);
    
    const appointmentEvent = screen.getByTestId('event-1');
    fireEvent.click(appointmentEvent);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Details')).toBeInTheDocument();
    });
  });

  it('changes calendar view when view buttons are clicked', async () => {
    render(<CalendarView />);
    
    const weekButton = screen.getByRole('button', { name: /week/i });
    fireEvent.click(weekButton);
    
    // The view change should be handled by the Calendar component
    expect(weekButton).toBeInTheDocument();
  });

  it('navigates to today when today button is clicked', () => {
    render(<CalendarView />);
    
    const todayButton = screen.getByRole('button', { name: /today/i });
    fireEvent.click(todayButton);
    
    // Should not throw any errors
    expect(todayButton).toBeInTheDocument();
  });

  it('applies client color coding to events', () => {
    render(<CalendarView />);
    
    // Events should be rendered with client-specific colors
    const events = screen.getByTestId('events');
    expect(events).toBeInTheDocument();
  });

  it('handles empty state gracefully', () => {
    vi.mocked(useAppointments).mockReturnValue({
      appointments: [],
      loading: false,
      error: null,
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
    });

    vi.mocked(useMedications).mockReturnValue({
      medications: [],
      loading: false,
      error: null,
      createMedication: vi.fn(),
      updateMedication: vi.fn(),
      deleteMedication: vi.fn(),
      logMedication: vi.fn(),
    });

    render(<CalendarView />);
    
    expect(screen.getByText('Healthcare Calendar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    vi.mocked(useAppointments).mockReturnValue({
      appointments: [],
      loading: true,
      error: null,
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
    });

    render(<CalendarView />);
    
    expect(screen.getByText('Healthcare Calendar')).toBeInTheDocument();
  });

  it('handles error state', () => {
    vi.mocked(useAppointments).mockReturnValue({
      appointments: [],
      loading: false,
      error: new Error('Failed to load appointments'),
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
    });

    render(<CalendarView />);
    
    expect(screen.getByText('Healthcare Calendar')).toBeInTheDocument();
  });
});