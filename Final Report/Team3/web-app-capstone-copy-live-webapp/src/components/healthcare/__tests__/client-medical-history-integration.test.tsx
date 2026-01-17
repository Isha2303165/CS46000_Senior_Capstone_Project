import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientMedicalHistorySection } from '../client-medical-history-section';
import { Client } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-clients', () => ({
  useUpdateClient: () => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
    data: undefined,
    isSuccess: false,
    isPending: false,
    reset: vi.fn(),
  }),
}));

vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Caregiver',
      email: 'john@example.com',
    },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  }),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 15, 2024 2:30 PM'),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
}));

describe('ClientMedicalHistorySection Integration', () => {
  const mockClient: Client = {
    id: 'client-1',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'John Doe',
    emergencyContactPhone: '555-0123',
    medicalConditions: ['Diabetes', 'Hypertension'],
    allergies: ['Penicillin', 'Shellfish'],
    careNotes: 'Client requires assistance with medication management.',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  };

  const renderComponent = (client: Client = mockClient) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ClientMedicalHistorySection client={client} />
      </QueryClientProvider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByRole('region', { name: /medical history/i })).toBeInTheDocument();
  });

  it('displays all main sections', () => {
    renderComponent();
    
    expect(screen.getByText('Medical Conditions')).toBeInTheDocument();
    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Care Notes')).toBeInTheDocument();
    expect(screen.getByText('Medical Timeline')).toBeInTheDocument();
  });

  it('displays client data correctly', () => {
    renderComponent();
    
    expect(screen.getByText('Diabetes')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Penicillin')).toBeInTheDocument();
    expect(screen.getByText('Shellfish')).toBeInTheDocument();
    expect(screen.getByText('Client requires assistance with medication management.')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    renderComponent();
    
    expect(screen.getByRole('button', { name: /add new medical condition/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new allergy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit care notes/i })).toBeInTheDocument();
  });

  it('handles empty client data gracefully', () => {
    const emptyClient: Client = {
      id: 'client-2',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1975-05-15',
      emergencyContactName: 'Mary Smith',
      emergencyContactPhone: '555-0456',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    renderComponent(emptyClient);
    
    expect(screen.getByText('No medical conditions recorded')).toBeInTheDocument();
    expect(screen.getByText('No allergies recorded')).toBeInTheDocument();
    expect(screen.getByText('No care notes recorded')).toBeInTheDocument();
  });
});