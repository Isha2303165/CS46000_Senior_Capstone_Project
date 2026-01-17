import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientActivityFeedSection } from '../client-activity-feed-section';
import type { 
  Client, 
  Medication, 
  MedicationLog, 
  Appointment, 
  Message 
} from '@/types';

// Mock all UI components with simple implementations
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: any) => <button data-testid="button">{children}</button>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

vi.mock('@/components/ui/toggle', () => ({
  Toggle: ({ children, pressed }: any) => (
    <button data-testid={`toggle-${children.toLowerCase().replace(/\s+/g, '-')}`} className={pressed ? 'pressed' : ''}>
      {children}
    </button>
  ),
}));

// Mock all Lucide React icons
vi.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Pill: () => <div data-testid="pill-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
}));

describe('ClientActivityFeedSection', () => {
  const mockClient: Client = {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '555-0123',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  const mockMedications: Medication[] = [
    {
      id: 'med-1',
      clientId: 'client-1',
      name: 'Lisinopril',
      dosage: '10mg',
      unit: 'mg',
      frequency: 'Once daily',
      scheduleType: 'fixed_times',
      prescribingDoctor: 'Dr. Smith',
      startDate: '2024-01-01',
      isActive: true,
      isPRN: false,
      missedDoses: 2,
      totalDoses: 30,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockMedicationLogs: MedicationLog[] = [
    {
      id: 'log-1',
      medicationId: 'med-1',
      takenAt: '2024-01-14T08:00:00Z',
      takenBy: 'caregiver-1',
      status: 'taken',
      createdAt: '2024-01-14T08:00:00Z',
      updatedAt: '2024-01-14T08:00:00Z',
    },
  ];

  const mockAppointments: Appointment[] = [
    {
      id: 'apt-1',
      clientId: 'client-1',
      title: 'Annual Checkup',
      appointmentDate: '2024-01-20',
      appointmentTime: '10:00',
      duration: 60,
      providerName: 'Dr. Smith',
      locationType: 'in_person',
      status: 'scheduled',
      priority: 'normal',
      followUpRequired: false,
      reminderSent: false,
      createdBy: 'caregiver-1',
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
    },
  ];

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      clientId: 'client-1',
      senderId: 'caregiver-1',
      content: 'Client is doing well today.',
      messageType: 'text',
      priority: 'normal',
      isRead: false,
      createdAt: '2024-01-14T12:00:00Z',
      updatedAt: '2024-01-14T12:00:00Z',
    },
  ];

  const defaultProps = {
    client: mockClient,
    medications: mockMedications,
    medicationLogs: mockMedicationLogs,
    appointments: mockAppointments,
    messages: mockMessages,
  };

  it('renders the component without crashing', () => {
    render(<ClientActivityFeedSection {...defaultProps} />);
    
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('displays activity feed with basic content', () => {
    render(<ClientActivityFeedSection {...defaultProps} />);
    
    expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    expect(screen.getByText('Filter by type:')).toBeInTheDocument();
  });

  it('shows medication trends tab', () => {
    render(<ClientActivityFeedSection {...defaultProps} />);
    
    expect(screen.getByTestId('tab-content-medication-trends')).toBeInTheDocument();
    expect(screen.getByText('Medication Adherence')).toBeInTheDocument();
  });

  it('shows appointment trends tab', () => {
    render(<ClientActivityFeedSection {...defaultProps} />);
    
    expect(screen.getByTestId('tab-content-appointment-trends')).toBeInTheDocument();
    expect(screen.getByText('Appointment Attendance')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const emptyProps = {
      client: mockClient,
      medications: [],
      medicationLogs: [],
      appointments: [],
      messages: [],
    };
    
    render(<ClientActivityFeedSection {...emptyProps} />);
    
    expect(screen.getByText('No Activity Found')).toBeInTheDocument();
  });
});