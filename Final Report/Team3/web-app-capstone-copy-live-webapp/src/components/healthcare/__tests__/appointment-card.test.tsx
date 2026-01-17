import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentCard } from '../appointment-card';
import { Appointment } from '@/types';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'h:mm a') return '2:30 PM';
    if (formatStr === 'MMM dd, yyyy') return 'Jan 15, 2024';
    if (formatStr === 'EEEE') return 'Monday';
    return 'Jan 15, 2024';
  }),
  isToday: vi.fn(() => false),
  isTomorrow: vi.fn(() => false),
  isAfter: vi.fn(() => true),
  isBefore: vi.fn(() => false),
  addHours: vi.fn(() => new Date())
}));

const mockAppointment: Appointment = {
  id: '1',
  clientId: 'client-1',
  title: 'Annual Checkup',
  description: 'Routine annual physical examination',
  appointmentDate: '2024-01-15',
  appointmentTime: '14:30',
  duration: 60,
  providerName: 'Dr. Johnson',
  providerType: 'primary_care',
  providerPhone: '555-0123',
  locationType: 'in_person',
  address: '123 Medical Center Dr, Suite 100',
  roomNumber: 'Room 205',
  status: 'scheduled',
  appointmentType: 'Physical Exam',
  priority: 'normal',
  preparationInstructions: 'Please bring your insurance card and medication list',
  documentsNeeded: ['Insurance Card', 'Photo ID', 'Medication List'],
  followUpRequired: true,
  reminderSent: false,
  createdBy: 'caregiver-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockTelehealthAppointment: Appointment = {
  ...mockAppointment,
  id: '2',
  title: 'Telehealth Consultation',
  locationType: 'telehealth',
  teleHealthLink: 'https://example.com/video-call',
  address: undefined,
  roomNumber: undefined
};

const mockCompletedAppointment: Appointment = {
  ...mockAppointment,
  id: '3',
  status: 'completed'
};

const mockCancelledAppointment: Appointment = {
  ...mockAppointment,
  id: '4',
  status: 'cancelled'
};

const mockUrgentAppointment: Appointment = {
  ...mockAppointment,
  id: '5',
  priority: 'urgent'
};

describe('AppointmentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders appointment basic information correctly', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Annual Checkup')).toBeInTheDocument();
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
  });

  it('displays client name when provided', () => {
    render(<AppointmentCard appointment={mockAppointment} clientName="John Doe" />);
    
    expect(screen.getByText('Client: John Doe')).toBeInTheDocument();
  });

  it('displays date and time information', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    expect(screen.getByText('60m')).toBeInTheDocument();
  });

  it('displays in-person location information', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('In person')).toBeInTheDocument();
    expect(screen.getByText('123 Medical Center Dr, Suite 100')).toBeInTheDocument();
    expect(screen.getByText('Room: Room 205')).toBeInTheDocument();
    expect(screen.getByText('📞 555-0123')).toBeInTheDocument();
  });

  it('displays telehealth location information', () => {
    render(<AppointmentCard appointment={mockTelehealthAppointment} />);
    
    expect(screen.getByText('Telehealth')).toBeInTheDocument();
    expect(screen.getByText('Video link available')).toBeInTheDocument();
  });

  it('displays provider type and appointment type badges', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Primary Care')).toBeInTheDocument();
    expect(screen.getByText('Physical Exam')).toBeInTheDocument();
  });

  it('displays description when present', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Description:')).toBeInTheDocument();
    expect(screen.getByText('Routine annual physical examination')).toBeInTheDocument();
  });

  it('displays preparation instructions when present', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Preparation needed:')).toBeInTheDocument();
    expect(screen.getByText('Please bring your insurance card and medication list')).toBeInTheDocument();
  });

  it('displays documents needed when present', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Documents to bring:')).toBeInTheDocument();
    expect(screen.getByText('Insurance Card')).toBeInTheDocument();
    expect(screen.getByText('Photo ID')).toBeInTheDocument();
    expect(screen.getByText('Medication List')).toBeInTheDocument();
  });

  it('displays follow-up required indicator', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Follow-up appointment required')).toBeInTheDocument();
  });

  it('displays scheduled status badge', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('displays completed status badge', () => {
    render(<AppointmentCard appointment={mockCompletedAppointment} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays cancelled status badge', () => {
    render(<AppointmentCard appointment={mockCancelledAppointment} />);
    
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('displays urgent priority badge', () => {
    render(<AppointmentCard appointment={mockUrgentAppointment} />);
    
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<AppointmentCard appointment={mockAppointment} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockAppointment);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<AppointmentCard appointment={mockAppointment} onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledWith(mockAppointment);
  });

  it('calls onComplete when mark complete button is clicked', () => {
    const onComplete = vi.fn();
    // Mock isPast to be true for this test
    vi.mocked(vi.importMock('date-fns')).isBefore.mockReturnValue(true);
    
    render(<AppointmentCard appointment={mockAppointment} onComplete={onComplete} />);
    
    const completeButton = screen.getByRole('button', { name: /mark complete/i });
    fireEvent.click(completeButton);
    
    expect(onComplete).toHaveBeenCalledWith(mockAppointment);
  });

  it('calls onView when view button is clicked', () => {
    const onView = vi.fn();
    render(<AppointmentCard appointment={mockAppointment} onView={onView} />);
    
    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);
    
    expect(onView).toHaveBeenCalledWith(mockAppointment);
  });

  it('does not show edit/cancel buttons for completed appointments', () => {
    render(
      <AppointmentCard 
        appointment={mockCompletedAppointment} 
        onEdit={vi.fn()} 
        onCancel={vi.fn()} 
      />
    );
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('does not show edit/cancel buttons for cancelled appointments', () => {
    render(
      <AppointmentCard 
        appointment={mockCancelledAppointment} 
        onEdit={vi.fn()} 
        onCancel={vi.fn()} 
      />
    );
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('does not render action buttons when callbacks are not provided', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AppointmentCard appointment={mockAppointment} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles appointment without optional fields', () => {
    const minimalAppointment = {
      id: '1',
      clientId: 'client-1',
      title: 'Basic Appointment',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      duration: 30,
      providerName: 'Dr. Smith',
      locationType: 'in_person' as const,
      status: 'scheduled' as const,
      priority: 'normal' as const,
      followUpRequired: false,
      reminderSent: false,
      createdBy: 'caregiver-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
    
    render(<AppointmentCard appointment={minimalAppointment} />);
    
    expect(screen.getByText('Basic Appointment')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.queryByText('Description:')).not.toBeInTheDocument();
    expect(screen.queryByText('Preparation needed:')).not.toBeInTheDocument();
    expect(screen.queryByText('Documents to bring:')).not.toBeInTheDocument();
    expect(screen.queryByText('Follow-up appointment required')).not.toBeInTheDocument();
  });

  it('formats duration correctly for hours and minutes', () => {
    const longAppointment = {
      ...mockAppointment,
      duration: 90 // 1 hour 30 minutes
    };
    
    render(<AppointmentCard appointment={longAppointment} />);
    
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('formats duration correctly for hours only', () => {
    const hourAppointment = {
      ...mockAppointment,
      duration: 120 // 2 hours
    };
    
    render(<AppointmentCard appointment={hourAppointment} />);
    
    expect(screen.getByText('2h')).toBeInTheDocument();
  });
});