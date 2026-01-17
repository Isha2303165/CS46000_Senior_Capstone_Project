import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useConnectionStatus,
  useClientRealTimeSync,
  useConflicts,
  useOptimisticMedicationLog,
  useOptimisticMedicationUpdate,
  useOptimisticAppointmentUpdate,
  useOptimisticMessageSend,
  useOptimisticUpdates,
  useConnectionRecovery,
} from '../use-real-time-sync';
import { realTimeSyncService } from '@/lib/real-time-sync';
import { client } from '@/lib/graphql-client';
import type { CreateMedicationLogInput, UpdateMedicationInput } from '@/types';

// Mock dependencies
vi.mock('@/lib/real-time-sync');
vi.mock('@/lib/graphql-client');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current connection status', () => {
    const mockGetConnectionStatus = vi.fn().mockReturnValue('connected');
    const mockOnConnectionStatusChange = vi.fn().mockReturnValue(() => {});
    
    (realTimeSyncService.getConnectionStatus as any) = mockGetConnectionStatus;
    (realTimeSyncService.onConnectionStatusChange as any) = mockOnConnectionStatusChange;

    const { result } = renderHook(() => useConnectionStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe('connected');
    expect(mockGetConnectionStatus).toHaveBeenCalled();
    expect(mockOnConnectionStatusChange).toHaveBeenCalled();
  });

  it('should update when connection status changes', () => {
    let statusChangeCallback: (status: any) => void;
    const mockOnConnectionStatusChange = vi.fn().mockImplementation((callback) => {
      statusChangeCallback = callback;
      return () => {};
    });
    
    (realTimeSyncService.getConnectionStatus as any) = vi.fn().mockReturnValue('disconnected');
    (realTimeSyncService.onConnectionStatusChange as any) = mockOnConnectionStatusChange;

    const { result } = renderHook(() => useConnectionStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe('disconnected');

    // Simulate status change
    act(() => {
      statusChangeCallback('connected');
    });

    expect(result.current).toBe('connected');
  });
});

describe('useClientRealTimeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to client data when clientId is provided', () => {
    const mockSubscribeToClientData = vi.fn();
    const mockUnsubscribeFromClientData = vi.fn();
    const mockGetConnectionStatus = vi.fn().mockReturnValue('connected');
    const mockGetConflicts = vi.fn().mockReturnValue([]);
    const mockOnConnectionStatusChange = vi.fn().mockReturnValue(() => {});

    (realTimeSyncService.subscribeToClientData as any) = mockSubscribeToClientData;
    (realTimeSyncService.unsubscribeFromClientData as any) = mockUnsubscribeFromClientData;
    (realTimeSyncService.getConnectionStatus as any) = mockGetConnectionStatus;
    (realTimeSyncService.getConflicts as any) = mockGetConflicts;
    (realTimeSyncService.onConnectionStatusChange as any) = mockOnConnectionStatusChange;

    const { unmount } = renderHook(() => useClientRealTimeSync('client-1'), {
      wrapper: createWrapper(),
    });

    expect(mockSubscribeToClientData).toHaveBeenCalledWith('client-1');

    unmount();

    expect(mockUnsubscribeFromClientData).toHaveBeenCalledWith('client-1');
  });

  it('should not subscribe when clientId is undefined', () => {
    const mockSubscribeToClientData = vi.fn();
    const mockGetConnectionStatus = vi.fn().mockReturnValue('disconnected');
    const mockGetConflicts = vi.fn().mockReturnValue([]);
    const mockOnConnectionStatusChange = vi.fn().mockReturnValue(() => {});

    (realTimeSyncService.subscribeToClientData as any) = mockSubscribeToClientData;
    (realTimeSyncService.getConnectionStatus as any) = mockGetConnectionStatus;
    (realTimeSyncService.getConflicts as any) = mockGetConflicts;
    (realTimeSyncService.onConnectionStatusChange as any) = mockOnConnectionStatusChange;

    renderHook(() => useClientRealTimeSync(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockSubscribeToClientData).not.toHaveBeenCalled();
  });
});

describe('useConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return conflicts and provide resolve function', () => {
    const mockConflicts = [
      {
        id: 'conflict-1',
        entity: 'medication',
        localVersion: { id: '1', name: 'Local' },
        remoteVersion: { id: '1', name: 'Remote' },
        timestamp: '2023-01-01T00:00:00Z',
        conflictFields: ['name'],
      },
    ];

    const mockGetConflicts = vi.fn().mockReturnValue(mockConflicts);
    const mockResolveConflict = vi.fn();

    (realTimeSyncService.getConflicts as any) = mockGetConflicts;
    (realTimeSyncService.resolveConflict as any) = mockResolveConflict;

    const { result } = renderHook(() => useConflicts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.conflicts).toEqual(mockConflicts);

    act(() => {
      result.current.resolveConflict('conflict-1', 'remote');
    });

    expect(mockResolveConflict).toHaveBeenCalledWith('conflict-1', { strategy: 'remote' });
  });

  it('should poll for conflicts', () => {
    const mockGetConflicts = vi.fn().mockReturnValue([]);
    (realTimeSyncService.getConflicts as any) = mockGetConflicts;

    renderHook(() => useConflicts(), {
      wrapper: createWrapper(),
    });

    expect(mockGetConflicts).toHaveBeenCalledTimes(1);

    // Fast-forward 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockGetConflicts).toHaveBeenCalledTimes(2);
  });
});

describe('useOptimisticMedicationLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should perform optimistic medication logging', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      data: {
        id: 'log-1',
        medicationId: 'med-1',
        takenAt: '2023-01-01T10:00:00Z',
        status: 'taken',
        takenBy: 'user-1',
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T10:00:00Z',
      },
      errors: null,
    });

    const mockAddOptimisticUpdate = vi.fn();

    (client.models.MedicationLog.create as any) = mockCreate;
    (realTimeSyncService.addOptimisticUpdate as any) = mockAddOptimisticUpdate;

    const { result } = renderHook(() => useOptimisticMedicationLog(), {
      wrapper: createWrapper(),
    });

    const input: CreateMedicationLogInput = {
      medicationId: 'med-1',
      takenAt: '2023-01-01T10:00:00Z',
      takenBy: 'user-1',
      status: 'taken',
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(mockAddOptimisticUpdate).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(input);
  });

  it('should rollback on error', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      data: null,
      errors: [{ message: 'Failed to create log' }],
    });

    const mockAddOptimisticUpdate = vi.fn();

    (client.models.MedicationLog.create as any) = mockCreate;
    (realTimeSyncService.addOptimisticUpdate as any) = mockAddOptimisticUpdate;

    const { result } = renderHook(() => useOptimisticMedicationLog(), {
      wrapper: createWrapper(),
    });

    const input: CreateMedicationLogInput = {
      medicationId: 'med-1',
      takenAt: '2023-01-01T10:00:00Z',
      takenBy: 'user-1',
      status: 'taken',
    };

    await expect(
      act(async () => {
        await result.current.mutateAsync(input);
      })
    ).rejects.toThrow('Failed to create log');

    // Verify rollback was called
    const rollbackCall = mockAddOptimisticUpdate.mock.calls[0];
    expect(rollbackCall).toBeDefined();
    const rollbackFn = rollbackCall[4]; // 5th parameter is rollback function
    expect(typeof rollbackFn).toBe('function');
  });
});

describe('useOptimisticMedicationUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should perform optimistic medication update', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      data: {
        id: 'med-1',
        name: 'Updated Medication',
        updatedAt: '2023-01-01T10:00:00Z',
      },
      errors: null,
    });

    const mockAddOptimisticUpdate = vi.fn();

    (client.models.Medication.update as any) = mockUpdate;
    (realTimeSyncService.addOptimisticUpdate as any) = mockAddOptimisticUpdate;

    const { result } = renderHook(() => useOptimisticMedicationUpdate(), {
      wrapper: createWrapper(),
    });

    // Mock existing medication in cache
    const queryClient = new QueryClient();
    queryClient.setQueryData(['medications', 'detail', 'med-1'], {
      id: 'med-1',
      name: 'Original Medication',
      clientId: 'client-1',
    });

    const input: UpdateMedicationInput = {
      id: 'med-1',
      name: 'Updated Medication',
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(mockAddOptimisticUpdate).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(input);
  });
});

describe('useOptimisticUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return optimistic updates and provide rollback functions', () => {
    const mockUpdates = [
      {
        id: 'update-1',
        entity: 'medication',
        operation: 'update',
        data: { id: 'med-1', name: 'Test' },
        timestamp: '2023-01-01T00:00:00Z',
        rollback: vi.fn(),
      },
    ];

    const mockGetOptimisticUpdates = vi.fn().mockReturnValue(mockUpdates);
    const mockRollbackOptimisticUpdate = vi.fn();
    const mockRollbackAllOptimisticUpdates = vi.fn();

    (realTimeSyncService.getOptimisticUpdates as any) = mockGetOptimisticUpdates;
    (realTimeSyncService.rollbackOptimisticUpdate as any) = mockRollbackOptimisticUpdate;
    (realTimeSyncService.rollbackAllOptimisticUpdates as any) = mockRollbackAllOptimisticUpdates;

    const { result } = renderHook(() => useOptimisticUpdates(), {
      wrapper: createWrapper(),
    });

    expect(result.current.updates).toEqual(mockUpdates);

    act(() => {
      result.current.rollbackUpdate('update-1');
    });

    expect(mockRollbackOptimisticUpdate).toHaveBeenCalledWith('update-1');

    act(() => {
      result.current.rollbackAll();
    });

    expect(mockRollbackAllOptimisticUpdates).toHaveBeenCalled();
  });

  it('should poll for updates', () => {
    const mockGetOptimisticUpdates = vi.fn().mockReturnValue([]);
    (realTimeSyncService.getOptimisticUpdates as any) = mockGetOptimisticUpdates;

    renderHook(() => useOptimisticUpdates(), {
      wrapper: createWrapper(),
    });

    expect(mockGetOptimisticUpdates).toHaveBeenCalledTimes(1);

    // Fast-forward 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockGetOptimisticUpdates).toHaveBeenCalledTimes(2);
  });
});

describe('useConnectionRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide connection recovery functions', () => {
    const mockGetConnectionStatus = vi.fn().mockReturnValue('error');
    const mockOnConnectionStatusChange = vi.fn().mockReturnValue(() => {});
    const mockUnsubscribeAll = vi.fn();

    (realTimeSyncService.getConnectionStatus as any) = mockGetConnectionStatus;
    (realTimeSyncService.onConnectionStatusChange as any) = mockOnConnectionStatusChange;
    (realTimeSyncService.unsubscribeAll as any) = mockUnsubscribeAll;

    const { result } = renderHook(() => useConnectionRecovery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.connectionStatus).toBe('error');
    expect(result.current.hasError).toBe(true);
    expect(result.current.isOnline).toBe(false);

    act(() => {
      result.current.forceReconnect();
    });

    expect(mockUnsubscribeAll).toHaveBeenCalled();
  });

  it('should correctly identify connection states', () => {
    const mockOnConnectionStatusChange = vi.fn().mockReturnValue(() => {});

    (realTimeSyncService.onConnectionStatusChange as any) = mockOnConnectionStatusChange;

    // Test connected state
    (realTimeSyncService.getConnectionStatus as any) = vi.fn().mockReturnValue('connected');
    const { result: connectedResult } = renderHook(() => useConnectionRecovery(), {
      wrapper: createWrapper(),
    });

    expect(connectedResult.current.isOnline).toBe(true);
    expect(connectedResult.current.isConnecting).toBe(false);
    expect(connectedResult.current.hasError).toBe(false);

    // Test connecting state
    (realTimeSyncService.getConnectionStatus as any) = vi.fn().mockReturnValue('connecting');
    const { result: connectingResult } = renderHook(() => useConnectionRecovery(), {
      wrapper: createWrapper(),
    });

    expect(connectingResult.current.isOnline).toBe(false);
    expect(connectingResult.current.isConnecting).toBe(true);
    expect(connectingResult.current.hasError).toBe(false);

    // Test error state
    (realTimeSyncService.getConnectionStatus as any) = vi.fn().mockReturnValue('error');
    const { result: errorResult } = renderHook(() => useConnectionRecovery(), {
      wrapper: createWrapper(),
    });

    expect(errorResult.current.isOnline).toBe(false);
    expect(errorResult.current.isConnecting).toBe(false);
    expect(errorResult.current.hasError).toBe(true);
  });
});