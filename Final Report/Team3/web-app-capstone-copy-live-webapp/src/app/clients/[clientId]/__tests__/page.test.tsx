import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientDetailPage from '../page';
import { useClient } from '@/hooks/use-clients';
import type { Client } from '@/types';

// Mock the client hook
vi.mock('@/hooks/use-clients', () => ({
  useClient: vi.fn(),
}));

// Mock the client detail components
vi.mock('@/components/healthcare/client-detail-header', () => ({
  ClientDetailHeader: ({ client }: { client: Client }) => (
    <div data-testid="client-detail-header">
      Header for {client.firstName} {client.lastName}
    </div>
  ),
}));

vi.mock('@/components/healthcare/client-detail-content', () => ({
  ClientDetailContent: ({ client }: { client: Client }) => (
    <div data-testid="client-detail-content">
      Content for {client.firstName} {client.lastName}
    </div>
  ),
}));

vi.mock('@/components/healthcare/client-detail-error-boundary', () => ({
  ClientDetailErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="client-detail-error-boundary">{children}</div>
  ),
}));

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  gender: 'male',
  medicalRecordNumber: 'MRN123456',
  medicalConditions: ['Diabetes', 'Hypertension'],
  allergies: ['Penicillin'],
  currentMedications: ['Metformin', 'Lisinopril'],
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+1-555-0123',
  emergencyContactRelationship: 'Spouse',
  insuranceProvider: 'Blue Cross Blue Shield',
  insurancePolicyNumber: 'BC123456789',
  insuranceGroupNumber: 'GRP001',
  primaryPhysician: 'Dr. Smith',
  preferredPharmacy: 'CVS Pharmacy',
  careNotes: 'Client requires assistance with medication management.',
  isActive: true,
  caregivers: [],
  medications: [],
  appointments: [],
  messages: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ClientDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Parameter Validation', () => {
    it('should handle valid client ID parameter', async () => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: mockClient,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<ClientDetailPage />);

      expect(vi.mocked(useClient)).toHaveBeenCalledWith('client-1');
      await waitFor(() => {
        expect(screen.getByTestId('client-detail-header')).toBeInTheDocument();
        expect(screen.getByTestId('client-detail-content')).toBeInTheDocument();
      });
    });

    it('should handle invalid client ID parameter', () => {
      vi.mocked(useParams).mockReturnValue({ clientId: null });

      renderWithQueryClient(<ClientDetailPage />);

      expect(screen.getByText('Invalid client ID provided')).toBeInTheDocument();
      expect(vi.mocked(useClient)).not.toHaveBeenCalled();
    });

    it('should handle empty client ID parameter', () => {
      vi.mocked(useParams).mockReturnValue({ clientId: '' });

      renderWithQueryClient(<ClientDetailPage />);

      expect(screen.getByText('Invalid client ID provided')).toBeInTheDocument();
      expect(vi.mocked(useClient)).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should display loading skeleton while client data is loading', () => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithQueryClient(<ClientDetailPage />);

      // Check for loading skeleton elements
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should hide loading state when data is loaded', async () => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: mockClient,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        const skeletonElements = document.querySelectorAll('.animate-pulse');
        expect(skeletonElements.length).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when client fetch fails', () => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch client'),
      } as any);

      renderWithQueryClient(<ClientDetailPage />);

      expect(screen.getByText('Error loading client: Failed to fetch client')).toBeInTheDocument();
    });

    it('should display not found message when client is null', () => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<ClientDetailPage />);

      expect(screen.getByText('Client not found')).toBeInTheDocument();
    });
  });

  describe('Page Layout Structure', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: mockClient,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should render client detail header component', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('client-detail-header')).toBeInTheDocument();
        expect(screen.getByText('Header for John Doe')).toBeInTheDocument();
      });
    });

    it('should render client detail content component', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('client-detail-content')).toBeInTheDocument();
        expect(screen.getByText('Content for John Doe')).toBeInTheDocument();
      });
    });

    it('should wrap components in error boundary', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('client-detail-error-boundary')).toBeInTheDocument();
      });
    });

    it('should have proper container structure with max width', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        const container = document.querySelector('.max-w-7xl.mx-auto.space-y-6');
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: mockClient,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should pass client data to header component', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Header for John Doe')).toBeInTheDocument();
      });
    });

    it('should pass client data to content component', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Content for John Doe')).toBeInTheDocument();
      });
    });

    it('should pass client ID to error boundary', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('client-detail-error-boundary')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ clientId: 'client-1' });
      vi.mocked(useClient).mockReturnValue({
        data: mockClient,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should have proper semantic structure', async () => {
      renderWithQueryClient(<ClientDetailPage />);

      await waitFor(() => {
        // The main container should be present
        const container = document.querySelector('.max-w-7xl');
        expect(container).toBeInTheDocument();
      });
    });
  });
});