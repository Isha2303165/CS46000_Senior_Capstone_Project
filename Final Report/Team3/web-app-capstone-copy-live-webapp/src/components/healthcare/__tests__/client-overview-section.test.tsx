import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientOverviewSection } from '../client-overview-section';
import { Client, Medication, Appointment, ClientCaregiver } from '@/types';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd, h:mm a') {
      return 'Jan 15, 2:30 PM';
    }
    return '2024-01-15';
  }),
  isToday: vi.fn(() => false),
  isTomorrow: vi.fn(() => false),
  isPast: vi.fn(() => false),
}));

describe('ClientOverviewSection', () => {
  const mockClient: Client = {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '555-0123',
    allergies: ['Penicillin', 'Shellfish'],
    medicalConditions: ['Diabetes', 'Hypertension'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockMedications: Medication[] = [
    {
      id: 'med-1',
      clientId: 'client-1',
      name: 'Metformin',
      dosage: '500mg',
      unit: 'mg',
      frequency: 'twice daily',
      scheduleType: 'fixed_times',
      prescribingDoctor: 'Dr. Smith',
      startDate: '2024-01-01',
      isActive: true,
      isPRN: false,
      nextDueAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (overdue)
      totalDoses: 20,
      missedDoses: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'med-2',
      clientId: 'client-1',
      name: 'Lisinopril',
      dosage: '10mg',
      unit: 'mg',
      frequency: 'once daily',
      scheduleType: 'fixed_times',
      prescribingDoctor: 'Dr. Smith',
      startDate: '2024-01-01',
      isActive: true,
      isPRN: false,
      nextDueAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      totalDoses: 15,
      missedDoses: 1,
      lastTakenAt: '2024-01-15T14:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockAppointments: Appointment[] = [
    {
      id: 'apt-1',
      clientId: 'client-1',
      title: 'Cardiology Follow-up',
      appointmentDate: '2024-02-01',
      appointmentTime: '10:00',
      duration: 60,
      providerName: 'Dr. Johnson',
      locationType: 'in_person',
      status: 'scheduled',
      priority: 'normal',
      followUpRequired: false,
      reminderSent: false,
      createdBy: 'caregiver-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'apt-2',
      clientId: 'client-1',
      title: 'Lab Work',
      appointmentDate: '2024-01-10',
      appointmentTime: '09:00',
      duration: 30,
      providerName: 'Lab Corp',
      locationType: 'in_person',
      status: 'completed',
      priority: 'normal',
      followUpRequired: false,
      reminderSent: true,
      createdBy: 'caregiver-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
  ];

  const mockCaregivers: ClientCaregiver[] = [
    {
      id: 'pc-1',
      clientId: 'client-1',
      caregiverId: 'caregiver-1',
      role: 'primary',
      isActive: true,
      caregiver: {
        id: 'caregiver-1',
        userId: 'user-1',
        email: 'primary@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pc-2',
      clientId: 'client-1',
      caregiverId: 'caregiver-2',
      role: 'secondary',
      isActive: true,
      caregiver: {
        id: 'caregiver-2',
        userId: 'user-2',
        email: 'secondary@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockProps = {
    client: mockClient,
    medications: mockMedications,
    appointments: mockAppointments,
    caregivers: mockCaregivers,
    onAddMedication: vi.fn(),
    onScheduleAppointment: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the overview section with correct title', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      expect(screen.getByRole('region', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /overview/i })).toBeInTheDocument();
    });

    it('renders quick action buttons', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /add new medication/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /schedule new appointment/i })).toBeInTheDocument();
    });

    it('renders all metric cards', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      expect(screen.getByText('Medications')).toBeInTheDocument();
      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('caregiver')).toBeInTheDocument();
    });

    it('renders health status section when client has allergies or conditions', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      expect(screen.getByRole('region', { name: /health status/i })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: /client allergies/i })).toBeInTheDocument();
    });

    it('does not render health status section when client has no allergies or conditions', () => {
      const clientWithoutConditions = {
        ...mockClient,
        allergies: [],
        medicalConditions: [],
      };
      
      render(<ClientOverviewSection {...mockProps} client={clientWithoutConditions} />);
      
      expect(screen.queryByRole('region', { name: /health status/i })).not.toBeInTheDocument();
    });
  });

  describe('Medications Summary', () => {
    it('displays correct medication counts', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const medicationsCard = screen.getByText('Medications').closest('[role="article"]');
      expect(medicationsCard).toHaveTextContent('2'); // total active
      expect(medicationsCard).toHaveTextContent('active');
    });

    it('shows overdue badge when medications are overdue', () => {
      // Create medications with overdue nextDueAt
      const overdueTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const overdueMedications = mockMedications.map(med => ({
        ...med,
        nextDueAt: overdueTime,
        isPRN: false
      }));

      render(<ClientOverviewSection {...mockProps} medications={overdueMedications} />);
      
      expect(screen.getByRole('alert', { name: /2 overdue medications/i })).toBeInTheDocument();
    });

    it('calculates and displays adherence rate correctly', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const medicationsCard = screen.getByText('Medications').closest('[role="article"]');
      // Total doses: 20 + 15 = 35, Missed: 2 + 1 = 3, Adherence: (35-3)/35 = 91%
      expect(medicationsCard).toHaveTextContent('91% adherence');
    });

    it('shows due now count when medications are due', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const medicationsCard = screen.getByText('Medications').closest('[role="article"]');
      expect(medicationsCard).toHaveTextContent('1 due now');
    });
  });

  describe('Appointments Summary', () => {
    it('displays correct appointment counts', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const appointmentsCard = screen.getByText('Appointments').closest('[role="article"]');
      expect(appointmentsCard).toHaveTextContent('1'); // upcoming (future appointments)
      expect(appointmentsCard).toHaveTextContent('upcoming');
    });

    it('shows today count when appointments are today', () => {
      // Create appointments for today
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = [
        {
          ...mockAppointments[0],
          appointmentDate: today,
          status: 'scheduled' as const,
        }
      ];

      render(<ClientOverviewSection {...mockProps} appointments={todayAppointments} />);
      
      const appointmentsCard = screen.getByText('Appointments').closest('[role="article"]');
      expect(appointmentsCard).toHaveTextContent('1 today');
    });

    it('shows overdue badge when appointments are overdue', () => {
      // Create overdue appointment (past date and time)
      const pastDate = '2024-01-01';
      const pastTime = '10:00';
      const appointmentsWithOverdue = [
        {
          ...mockAppointments[0],
          id: 'apt-overdue',
          appointmentDate: pastDate,
          appointmentTime: pastTime,
          status: 'scheduled' as const,
        },
      ];

      render(<ClientOverviewSection {...mockProps} appointments={appointmentsWithOverdue} />);
      
      expect(screen.getByRole('alert', { name: /1 overdue appointments/i })).toBeInTheDocument();
    });
  });

  describe('Activity Summary', () => {
    it('displays medication and appointment activity counts', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const activityCard = screen.getByText('Recent Activity').closest('[role="article"]');
      expect(activityCard).toHaveTextContent('35 medications taken'); // 20 + 15
      expect(activityCard).toHaveTextContent('1 appointments completed');
    });

    it('shows last activity when available', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const activityCard = screen.getByText('Recent Activity').closest('[role="article"]');
      expect(activityCard).toHaveTextContent('Last activity: Jan 15, 2:30 PM');
    });
  });

  describe('caregiver Summary', () => {
    it('displays correct caregiver count', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const careTeamCard = screen.getByText('caregiver').closest('[role="article"]');
      expect(careTeamCard).toHaveTextContent('2');
      expect(careTeamCard).toHaveTextContent('caregivers');
    });

    it('shows caregiver names and roles', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const careTeamCard = screen.getByText('caregiver').closest('[role="article"]');
      expect(careTeamCard).toHaveTextContent('Alice Smith');
      expect(careTeamCard).toHaveTextContent('Bob Johnson');
      expect(careTeamCard).toHaveTextContent('primary');
      expect(careTeamCard).toHaveTextContent('secondary');
    });

    it('shows "more" indicator when there are more than 3 caregivers', () => {
      const manyCaregivers = [
        ...mockCaregivers,
        {
          ...mockCaregivers[0],
          id: 'pc-3',
          caregiverId: 'caregiver-3',
          caregiver: {
            ...mockCaregivers[0].caregiver!,
            id: 'caregiver-3',
            firstName: 'Charlie',
            lastName: 'Brown',
          },
        },
        {
          ...mockCaregivers[0],
          id: 'pc-4',
          caregiverId: 'caregiver-4',
          caregiver: {
            ...mockCaregivers[0].caregiver!,
            id: 'caregiver-4',
            firstName: 'Diana',
            lastName: 'Wilson',
          },
        },
      ];

      render(<ClientOverviewSection {...mockProps} caregivers={manyCaregivers} />);
      
      const careTeamCard = screen.getByText('caregiver').closest('[role="article"]');
      expect(careTeamCard).toHaveTextContent('+1 more');
    });
  });

  describe('Health Status', () => {
    it('displays allergies with proper alert role', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const allergiesSection = screen.getByRole('alert', { name: /client allergies/i });
      expect(allergiesSection).toBeInTheDocument();
      
      expect(screen.getByText('Penicillin')).toBeInTheDocument();
      expect(screen.getByText('Shellfish')).toBeInTheDocument();
    });

    it('displays medical conditions', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const conditionsSection = screen.getByRole('list', { name: /medical conditions/i });
      expect(conditionsSection).toBeInTheDocument();
      
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onAddMedication when Add Medication button is clicked', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const addMedicationButton = screen.getByRole('button', { name: /add new medication/i });
      fireEvent.click(addMedicationButton);
      
      expect(mockProps.onAddMedication).toHaveBeenCalledTimes(1);
    });

    it('calls onScheduleAppointment when Schedule Appointment button is clicked', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const scheduleAppointmentButton = screen.getByRole('button', { name: /schedule new appointment/i });
      fireEvent.click(scheduleAppointmentButton);
      
      expect(mockProps.onScheduleAppointment).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      expect(screen.getByRole('region', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /quick actions/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /client care metrics/i })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      const mainHeading = screen.getByRole('heading', { name: /overview/i });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading.tagName).toBe('H2');
    });

    it('has proper alert roles for urgent information', () => {
      // Create overdue medications
      const overdueTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const overdueMedications = mockMedications.map(med => ({
        ...med,
        nextDueAt: overdueTime,
        isPRN: false
      }));

      render(<ClientOverviewSection {...mockProps} medications={overdueMedications} />);
      
      expect(screen.getByRole('alert', { name: /2 overdue medications/i })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: /client allergies/i })).toBeInTheDocument();
    });

    it('has descriptive button labels', () => {
      render(<ClientOverviewSection {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /add new medication/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /schedule new appointment/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty medications array', () => {
      render(<ClientOverviewSection {...mockProps} medications={[]} />);
      
      const medicationsCard = screen.getByText('Medications').closest('[role="article"]');
      expect(medicationsCard).toHaveTextContent('0');
      expect(medicationsCard).toHaveTextContent('100% adherence');
    });

    it('handles empty appointments array', () => {
      render(<ClientOverviewSection {...mockProps} appointments={[]} />);
      
      const appointmentsCard = screen.getByText('Appointments').closest('[role="article"]');
      expect(appointmentsCard).toHaveTextContent('0');
      expect(appointmentsCard).toHaveTextContent('upcoming');
    });

    it('handles empty caregivers array', () => {
      render(<ClientOverviewSection {...mockProps} caregivers={[]} />);
      
      const careTeamCard = screen.getByText('caregiver').closest('[role="article"]');
      expect(careTeamCard).toHaveTextContent('0');
      expect(careTeamCard).toHaveTextContent('caregivers');
    });

    it('handles medications without nextDueAt', () => {
      const medicationsWithoutDue = mockMedications.map(med => ({
        ...med,
        nextDueAt: undefined,
      }));

      render(<ClientOverviewSection {...mockProps} medications={medicationsWithoutDue} />);
      
      const medicationsCard = screen.getByText('Medications').closest('[role="article"]');
      expect(medicationsCard).not.toHaveTextContent('due now');
    });

    it('handles caregivers without caregiver details', () => {
      const caregiversWithoutDetails = mockCaregivers.map(cg => ({
        ...cg,
        caregiver: undefined,
      }));

      render(<ClientOverviewSection {...mockProps} caregivers={caregiversWithoutDetails} />);
      
      const careTeamCard = screen.getByText('caregiver').closest('[role="article"]');
      expect(careTeamCard).toHaveTextContent('2');
      expect(careTeamCard).toHaveTextContent('caregivers');
    });
  });
});