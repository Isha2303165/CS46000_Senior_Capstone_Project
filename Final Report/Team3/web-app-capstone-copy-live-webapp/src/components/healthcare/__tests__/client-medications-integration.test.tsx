import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientDetailContent } from '../client-detail-content';
import { ToastProvider } from '@/components/ui/toast';
import type { Client } from '@/types';

// Mock all the hooks
vi.mock('@/hooks/use-medications', () => ({
  useClientMedications: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useLogMedication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  })),
  useMedicationLogs: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateMedication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  })),
  useUpdateMedication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/use-clients', () => ({
  useClients: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  gender: 'male',
  medicalRecordNumber: 'MRN123456',
  medicalConditions: ['Hypertension', 'Diabetes'],
  allergies: ['Penicillin'],
  currentMedications: ['Lisinopril', 'Metformin'],
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0123',
  emergencyContactRelationship: 'Spouse',
  insuranceProvider: 'Blue Cross',
  insurancePolicyNumber: 'BC123456',
  insuranceGroupNumber: 'GRP789',
  primaryPhysician: 'Dr. Smith',
  preferredPharmacy: 'CVS Pharmacy',
  careNotes: 'Client is compliant with medications',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
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

describe('Client Medications Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders medications section within client detail content', () => {
    render(
      <TestWrapper>
        <ClientDetailContent client={mockClient} />
      </TestWrapper>
    );

    // Check that the medications section is rendered
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Add Medication')).toBeInTheDocument();
    
    // Check that other sections are also rendered
    expect(screen.getByText('Client Overview')).toBeInTheDocument();
    expect(screen.getByText('Medical Information')).toBeInTheDocument();
    expect(screen.getByText('Emergency Contacts')).toBeInTheDocument();
    expect(screen.getByText('Insurance Information')).toBeInTheDocument();
  });

  it('displays client information correctly alongside medications section', () => {
    render(
      <TestWrapper>
        <ClientDetailContent client={mockClient} />
      </TestWrapper>
    );

    // Check Client Overview metrics
    expect(screen.getByText('Current Medications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // currentMedications length

    // Check medical conditions
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Diabetes')).toBeInTheDocument();

    // Check allergies
    expect(screen.getByText('Penicillin')).toBeInTheDocument();

    // Check emergency contact
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('555-0123')).toBeInTheDocument();
  });

  it('shows medications section in the correct layout position', () => {
    render(
      <TestWrapper>
        <ClientDetailContent client={mockClient} />
      </TestWrapper>
    );

    // The medications section should be in a full-width container (lg:col-span-3)
    const medicationsSection = screen.getByText('Medications').closest('.lg\\:col-span-3');
    expect(medicationsSection).toBeInTheDocument();
  });
});