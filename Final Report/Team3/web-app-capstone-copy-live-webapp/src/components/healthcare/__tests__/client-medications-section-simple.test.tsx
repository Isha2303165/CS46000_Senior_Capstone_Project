import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientMedicationsSection } from '../client-medications-section';
import { ToastProvider } from '@/components/ui/toast';

// Mock all the hooks to return empty/loading states
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

describe('ClientMedicationsSection - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the medications section with title', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    expect(screen.getByText('Medications')).toBeInTheDocument();
  });

  it('renders the add medication button', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    expect(screen.getByText('Add Medication')).toBeInTheDocument();
  });

  it('renders the tab navigation', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Adherence')).toBeInTheDocument();
  });

  it('shows empty state when no medications exist', () => {
    render(
      <TestWrapper>
        <ClientMedicationsSection clientId="client-1" />
      </TestWrapper>
    );

    expect(screen.getByText('No active medications')).toBeInTheDocument();
    expect(screen.getByText('Add First Medication')).toBeInTheDocument();
  });
});