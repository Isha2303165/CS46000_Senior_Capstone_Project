import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  useMedications,
  useClientMedications,
  useDueMedications,
  useMedication,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
  useLogMedication,
  useMedicationLogs,
  useMedicationSubscription
} from '../use-medications';
import { client } from '@/lib/graphql-client';
import type { Medication, CreateMedicationInput, CreateMedicationLogInput } from '@/types';

// Mock the GraphQL client
vi.mock('@/lib/graphql-client', () => ({
  client: {
    models: {
      Medication: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        observeQuery: vi.fn(),
      },
      MedicationLog: {
        list: vi.fn(),
        create: vi.fn(),
      },
    },
  },
}));

const mockMedication: Medication = {
  id: '1',
  clientId: 'client-1',
  name: 'Metformin',
  genericName: 'Metformin HCl',
  dosage: '500',
  unit: 'mg',
  frequency: 'Twice daily',
  route: 'oral',
  scheduleType: 'fixed_times',
  scheduledTimes: ['08:00', '20:00'],
  prescribingDoctor: 'Dr. Smith',
  prescriptionDate: '2024-01-01',
  instructions: 'Take with food',
  sideEffects: ['Nausea', 'Diarrhea'],
  startDate: '2024-01-01',
  isActive: true,
  isPRN: false,
  lastTakenAt: '2024-01-15T08:00:00Z',
  nextDueAt: '2024-01-15T20:00:00Z',
  missedDoses: 1,
  totalDoses: 15,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const mockMedicationLog = {
  id: '1',
  medicationId: '1',
  takenAt: '2024-01-15T08:00:00Z',
  scheduledFor: '2024-01-15T08:00:00Z',
  dosageTaken: '500 mg',
  takenBy: 'user-1',
  status: 'taken' as const,
  notes: 'Taken as scheduled',
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-15T08:00:00Z'
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

describe('useMedications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches medications list successfully', async () => {
    const mockResponse = { data: [mockMedication] };
    vi.mocked(client.models.Medication.list).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMedications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockMedication]);
    expect(client.models.Medication.list).toHaveBeenCalledWith({
      filter: { isActive: { eq: true } }
    });
  });

  it('handles error when fetching medications', async () => {
    const mockError = new Error('Failed to fetch medications');
    vi.mocked(client.models.Medication.list).mockRejectedValue(mockError);

    const { result } = renderHook(() => useMedications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useClientMedications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches client medications successfully', async () => {
    const mockResponse = { data: [mockMedication] };
    vi.mocked(client.models.Medication.list).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useClientMedications('client-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockMedication]);
    expect(client.models.Medication.list).toHaveBeenCalledWith({
      filter: { 
        clientId: { eq: 'client-1' },
        isActive: { eq: true }
      }
    });
  });

  it('does not fetch when clientId is not provided', () => {
    renderHook(() => useClientMedications(''), {
      wrapper: createWrapper(),
    });

    expect(client.models.Medication.list).not.toHaveBeenCalled();
  });
});

describe('useDueMedications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches due medications successfully', async () => {
    const mockResponse = { data: [mockMedication] };
    vi.mocked(client.models.Medication.list).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDueMedications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockMedication]);
    expect(client.models.Medication.list).toHaveBeenCalledWith({
      filter: { 
        isActive: { eq: true },
        nextDueAt: { le: expect.any(String) }
      }
    });
  });
});

describe('useMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single medication successfully', async () => {
    const mockResponse = { data: mockMedication };
    vi.mocked(client.models.Medication.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMedication('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMedication);
    expect(client.models.Medication.get).toHaveBeenCalledWith({ id: '1' });
  });

  it('does not fetch when id is not provided', () => {
    renderHook(() => useMedication(''), {
      wrapper: createWrapper(),
    });

    expect(client.models.Medication.get).not.toHaveBeenCalled();
  });
});

describe('useCreateMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates medication successfully', async () => {
    const mockResponse = { data: mockMedication };
    vi.mocked(client.models.Medication.create).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateMedication(), {
      wrapper: createWrapper(),
    });

    const createInput: CreateMedicationInput = {
      clientId: 'client-1',
      name: 'Metformin',
      dosage: '500',
      unit: 'mg',
      frequency: 'Twice daily',
      scheduleType: 'fixed_times',
      prescribingDoctor: 'Dr. Smith',
      startDate: '2024-01-01',
    };

    await result.current.mutateAsync(createInput);

    expect(client.models.Medication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...createInput,
        totalDoses: 0,
        missedDoses: 0,
      })
    );
  });

  it('handles error when creating medication', async () => {
    const mockError = new Error('Failed to create medication');
    vi.mocked(client.models.Medication.create).mockRejectedValue(mockError);

    const { result } = renderHook(() => useCreateMedication(), {
      wrapper: createWrapper(),
    });

    const createInput: CreateMedicationInput = {
      clientId: 'client-1',
      name: 'Metformin',
      dosage: '500',
      unit: 'mg',
      frequency: 'Twice daily',
      scheduleType: 'fixed_times',
      prescribingDoctor: 'Dr. Smith',
      startDate: '2024-01-01',
    };

    await expect(result.current.mutateAsync(createInput)).rejects.toThrow('Failed to create medication');
  });
});

describe('useUpdateMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates medication successfully', async () => {
    const updatedMedication = { ...mockMedication, name: 'Updated Metformin' };
    const mockResponse = { data: updatedMedication };
    vi.mocked(client.models.Medication.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateMedication(), {
      wrapper: createWrapper(),
    });

    const updateInput = { id: '1', name: 'Updated Metformin' };
    await result.current.mutateAsync(updateInput);

    expect(client.models.Medication.update).toHaveBeenCalledWith(updateInput);
  });
});

describe('useDeleteMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('soft deletes medication successfully', async () => {
    const deletedMedication = { ...mockMedication, isActive: false };
    const mockResponse = { data: deletedMedication };
    vi.mocked(client.models.Medication.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDeleteMedication(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('1');

    expect(client.models.Medication.update).toHaveBeenCalledWith({
      id: '1',
      isActive: false
    });
  });
});

describe('useLogMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs medication successfully', async () => {
    const mockLogResponse = { data: mockMedicationLog };
    const mockMedicationResponse = { data: mockMedication };
    const mockUpdatedMedicationResponse = { data: { ...mockMedication, totalDoses: 16 } };
    
    vi.mocked(client.models.MedicationLog.create).mockResolvedValue(mockLogResponse);
    vi.mocked(client.models.Medication.get).mockResolvedValue(mockMedicationResponse);
    vi.mocked(client.models.Medication.update).mockResolvedValue(mockUpdatedMedicationResponse);

    const { result } = renderHook(() => useLogMedication(), {
      wrapper: createWrapper(),
    });

    const logInput: CreateMedicationLogInput = {
      medicationId: '1',
      takenAt: '2024-01-15T08:00:00Z',
      takenBy: 'user-1',
      status: 'taken',
    };

    await result.current.mutateAsync(logInput);

    expect(client.models.MedicationLog.create).toHaveBeenCalledWith(logInput);
    expect(client.models.Medication.get).toHaveBeenCalledWith({ id: '1' });
    expect(client.models.Medication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        lastTakenAt: logInput.takenAt,
        totalDoses: 16,
      })
    );
  });
});

describe('useMedicationLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches medication logs successfully', async () => {
    const mockResponse = { data: [mockMedicationLog] };
    vi.mocked(client.models.MedicationLog.list).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMedicationLogs('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockMedicationLog]);
    expect(client.models.MedicationLog.list).toHaveBeenCalledWith({
      filter: { medicationId: { eq: '1' } }
    });
  });

  it('does not fetch when medicationId is not provided', () => {
    renderHook(() => useMedicationLogs(''), {
      wrapper: createWrapper(),
    });

    expect(client.models.MedicationLog.list).not.toHaveBeenCalled();
  });
});

describe('useMedicationSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets up subscription correctly', () => {
    const mockSubscription = {
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    };
    
    vi.mocked(client.models.Medication.observeQuery).mockReturnValue(mockSubscription);

    const { result } = renderHook(() => useMedicationSubscription(), {
      wrapper: createWrapper(),
    });

    const subscription = result.current.subscribe();

    expect(client.models.Medication.observeQuery).toHaveBeenCalledWith({
      filter: { isActive: { eq: true } }
    });
    expect(mockSubscription.subscribe).toHaveBeenCalled();
    expect(subscription.unsubscribe).toBeDefined();
  });
});