import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  useClients, 
  useClient, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient,
  useClientSubscription 
} from '../use-clients';
import { client } from '@/lib/graphql-client';
import type { Client, CreateClientInput } from '@/types';

// Mock the GraphQL client
vi.mock('@/lib/graphql-client', () => ({
  client: {
    models: {
      Client: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        observeQuery: vi.fn(),
      },
      ClientCaregiver: {
        list: vi.fn(),
        create: vi.fn(),
      },
      UserProfile: {
        list: vi.fn(),
      },
    },
  },
}));

// Mock the auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

const mockClient: Client = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-05-15',
  gender: 'male',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0123',
  isActive: true,
  caregivers: [],
  medications: [],
  appointments: [],
  messages: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches clients list successfully', async () => {
    // Mock UserProfile lookup
    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-1', userId: 'user-1' }]
    });
    
    // Mock ClientCaregiver relationship
    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [{ clientId: '1', caregiverId: 'user-1', isActive: true }]
    });
    
    // Mock Client list
    vi.mocked(client.models.Client.list).mockResolvedValue({
      data: [mockClient]
    });

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockClient]);
  });

  it('handles error when fetching clients', async () => {
    // Mock UserProfile lookup
    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-1', userId: 'user-1' }]
    });
    
    // Mock ClientCaregiver with error
    const mockError = new Error('Failed to fetch relationships');
    vi.mocked(client.models.ClientCaregiver.list).mockRejectedValue(mockError);

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single client successfully', async () => {
    // Mock UserProfile lookup
    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-1', userId: 'user-1' }]
    });
    
    // Mock access check
    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [{ clientId: '1', caregiverId: 'user-1', isActive: true }]
    });
    
    // Mock Client get
    vi.mocked(client.models.Client.get).mockResolvedValue({
      data: mockClient
    });

    const { result } = renderHook(() => useClient('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClient);
    expect(client.models.Client.get).toHaveBeenCalledWith({ id: '1' });
  });

  it('does not fetch when id is not provided', () => {
    renderHook(() => useClient(''), {
      wrapper: createWrapper(),
    });

    expect(client.models.Client.get).not.toHaveBeenCalled();
  });
});

describe('useCreateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates client successfully', async () => {
    // Mock UserProfile lookup
    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-1', userId: 'user-1' }]
    });
    
    // Mock Client creation
    vi.mocked(client.models.Client.create).mockResolvedValue({
      data: mockClient
    });
    
    // Mock ClientCaregiver creation
    vi.mocked(client.models.ClientCaregiver.create).mockResolvedValue({
      data: { clientId: '1', caregiverId: 'profile-1', role: 'primary' }
    });

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    const createInput: CreateClientInput = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-05-15',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '555-0123',
    };

    await result.current.mutateAsync(createInput);

    expect(client.models.Client.create).toHaveBeenCalledWith(createInput);
    expect(client.models.ClientCaregiver.create).toHaveBeenCalled();
  });

  it('handles error when creating client', async () => {
    const mockError = new Error('Failed to create client');
    vi.mocked(client.models.Client.create).mockRejectedValue(mockError);

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    const createInput: CreateClientInput = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-05-15',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '555-0123',
    };

    await expect(result.current.mutateAsync(createInput)).rejects.toThrow('Failed to create client');
  });
});

describe('useUpdateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates client successfully', async () => {
    const updatedClient = { ...mockClient, firstName: 'Jane' };
    const mockResponse = { data: updatedClient };
    vi.mocked(client.models.Client.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(),
    });

    const updateInput = { id: '1', firstName: 'Jane' };
    await result.current.mutateAsync(updateInput);

    expect(client.models.Client.update).toHaveBeenCalledWith(updateInput);
  });
});

describe('useDeleteClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('soft deletes client successfully', async () => {
    const deletedClient = { ...mockClient, isActive: false };
    const mockResponse = { data: deletedClient };
    vi.mocked(client.models.Client.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('1');

    expect(client.models.Client.update).toHaveBeenCalledWith({
      id: '1',
      isActive: false
    });
  });
});

describe('useClientSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets up subscription correctly', async () => {
    const mockSubscription = {
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    };
    
    vi.mocked(client.models.Client.observeQuery).mockReturnValue(mockSubscription);
    
    // Mock the ClientCaregiver list call that happens inside setupSubscription
    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [{ clientId: '1', caregiverId: 'user-1', isActive: true }]
    });

    const { result } = renderHook(() => useClientSubscription(), {
      wrapper: createWrapper(),
    });

    const subscription = result.current.subscribe();
    
    // Wait for the async setup to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(client.models.Client.observeQuery).toHaveBeenCalled();
    expect(subscription.unsubscribe).toBeDefined();
  });
});