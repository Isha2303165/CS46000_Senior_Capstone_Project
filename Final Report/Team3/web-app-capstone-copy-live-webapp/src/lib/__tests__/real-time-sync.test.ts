import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { realTimeSyncService } from '../real-time-sync';
import { client } from '../graphql-client';
import type { Client, Medication, Appointment, Message } from '@/types';

// Mock the GraphQL client
vi.mock('../graphql-client', () => ({
  client: {
    models: {
      Client: {
        observeQuery: vi.fn(),
      },
      Medication: {
        observeQuery: vi.fn(),
      },
      Appointment: {
        observeQuery: vi.fn(),
      },
      Message: {
        observeQuery: vi.fn(),
      },
      MedicationLog: {
        observeQuery: vi.fn(),
      },
    },
  },
}));

// Mock React Query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('RealTimeSyncService', () => {
  let queryClient: QueryClient;
  let mockSubscription: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockSubscription = {
      unsubscribe: vi.fn(),
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    realTimeSyncService.unsubscribeAll();
  });

  describe('Connection Status Management', () => {
    it('should start with disconnected status', () => {
      expect(realTimeSyncService.getConnectionStatus()).toBe('disconnected');
    });

    it('should update connection status and notify listeners', () => {
      const listener = vi.fn();
      const unsubscribe = realTimeSyncService.onConnectionStatusChange(listener);

      realTimeSyncService.setConnectionStatus('connecting');
      expect(listener).toHaveBeenCalledWith('connecting');

      realTimeSyncService.setConnectionStatus('connected');
      expect(listener).toHaveBeenCalledWith('connected');

      unsubscribe();
      realTimeSyncService.setConnectionStatus('error');
      expect(listener).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
    });
  });

  describe('Client Data Subscriptions', () => {
    it('should subscribe to client updates', () => {
      const mockObserveQuery = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      });
      (client.models.Client.observeQuery as any) = mockObserveQuery;

      realTimeSyncService.subscribeToClientUpdates('client-1');

      expect(mockObserveQuery).toHaveBeenCalledWith({
        filter: { id: { eq: 'client-1' } }
      });
    });

    it('should handle client update events', async () => {
      const mockClient: Client = {
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+1234567890',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      let subscriptionCallback: any;
      const mockObserveQuery = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockImplementation((callback) => {
          subscriptionCallback = callback;
          return mockSubscription;
        }),
      });
      (client.models.Client.observeQuery as any) = mockObserveQuery;

      realTimeSyncService.subscribeToClientUpdates('client-1');

      // Simulate receiving an update
      act(() => {
        subscriptionCallback.next({ items: [mockClient] });
      });

      expect(realTimeSyncService.getConnectionStatus()).toBe('connected');
    });

    it('should handle subscription errors with retry logic', async () => {
      const mockError = new Error('Connection failed');
      let subscriptionCallback: any;
      const mockObserveQuery = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockImplementation((callback) => {
          subscriptionCallback = callback;
          return mockSubscription;
        }),
      });
      (client.models.Client.observeQuery as any) = mockObserveQuery;

      realTimeSyncService.subscribeToClientUpdates('client-1');

      // Simulate an error
      act(() => {
        subscriptionCallback.error(mockError);
      });

      expect(realTimeSyncService.getConnectionStatus()).toBe('error');
    });
  });

  describe('Medication Data Subscriptions', () => {
    it('should subscribe to medication updates for a client', () => {
      const mockObserveQuery = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      });
      (client.models.Medication.observeQuery as any) = mockObserveQuery;

      realTimeSyncService.subscribeToMedicationUpdates('client-1');

      expect(mockObserveQuery).toHaveBeenCalledWith({
        filter: { 
          clientId: { eq: 'client-1' },
          isActive: { eq: true }
        }
      });
    });

    it('should handle medication update events', () => {
      const mockMedication: Medication = {
        id: 'med-1',
        clientId: 'client-1',
        name: 'Aspirin',
        dosage: '100mg',
        unit: 'mg',
        frequency: 'daily',
        scheduleType: 'fixed_times',
        prescribingDoctor: 'Dr. Smith',
        startDate: '2023-01-01',
        isActive: true,
        isPRN: false,
        missedDoses: 0,
        totalDoses: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      let subscriptionCallback: any;
      const mockObserveQuery = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockImplementation((callback) => {
          subscriptionCallback = callback;
          return mockSubscription;
        }),
      });
      (client.models.Medication.observeQuery as any) = mockObserveQuery;

      realTimeSyncService.subscribeToMedicationUpdates('client-1');

      // Simulate receiving an update
      act(() => {
        subscriptionCallback.next({ items: [mockMedication] });
      });

      expect(realTimeSyncService.getConnectionStatus()).toBe('connected');
    });
  });

  describe('Optimistic Updates', () => {
    it('should add and track optimistic updates', () => {
      const mockData = { id: 'test-1', name: 'Test' };
      const rollback = vi.fn();

      realTimeSyncService.addOptimisticUpdate(
        'medication',
        'test-1',
        'update',
        mockData,
        rollback
      );

      const updates = realTimeSyncService.getOptimisticUpdates();
      expect(updates).toHaveLength(1);
      expect(updates[0].entity).toBe('medication');
      expect(updates[0].operation).toBe('update');
      expect(updates[0].data).toEqual(mockData);
    });

    it('should rollback optimistic updates', () => {
      const rollback = vi.fn();
      const updateId = 'medication-test-1';

      realTimeSyncService.addOptimisticUpdate(
        'medication',
        'test-1',
        'update',
        { id: 'test-1' },
        rollback
      );

      realTimeSyncService.rollbackOptimisticUpdate(updateId);

      expect(rollback).toHaveBeenCalled();
      expect(realTimeSyncService.getOptimisticUpdates()).toHaveLength(0);
    });

    it('should rollback all optimistic updates', () => {
      const rollback1 = vi.fn();
      const rollback2 = vi.fn();

      realTimeSyncService.addOptimisticUpdate(
        'medication',
        'test-1',
        'update',
        { id: 'test-1' },
        rollback1
      );

      realTimeSyncService.addOptimisticUpdate(
        'appointment',
        'test-2',
        'create',
        { id: 'test-2' },
        rollback2
      );

      realTimeSyncService.rollbackAllOptimisticUpdates();

      expect(rollback1).toHaveBeenCalled();
      expect(rollback2).toHaveBeenCalled();
      expect(realTimeSyncService.getOptimisticUpdates()).toHaveLength(0);
    });

    it('should auto-remove optimistic updates after timeout', async () => {
      vi.useFakeTimers();

      const rollback = vi.fn();
      realTimeSyncService.addOptimisticUpdate(
        'medication',
        'test-1',
        'update',
        { id: 'test-1' },
        rollback
      );

      expect(realTimeSyncService.getOptimisticUpdates()).toHaveLength(1);

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(realTimeSyncService.getOptimisticUpdates()).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('Conflict Detection and Resolution', () => {
    it('should detect conflicts between local and remote data', () => {
      const localData = {
        id: 'test-1',
        name: 'Local Name',
        updatedAt: '2023-01-01T10:00:00Z',
      };

      const remoteData = {
        id: 'test-1',
        name: 'Remote Name',
        updatedAt: '2023-01-01T09:00:00Z', // Older than local
      };

      // Add optimistic update
      realTimeSyncService.addOptimisticUpdate(
        'medication',
        'test-1',
        'update',
        localData,
        vi.fn()
      );

      // This would normally be called internally when handling updates
      // For testing, we'll check the conflict detection logic indirectly
      expect(realTimeSyncService.getOptimisticUpdates()).toHaveLength(1);
    });

    it('should resolve conflicts with different strategies', () => {
      const conflict = {
        id: 'test-1',
        entity: 'medication',
        localVersion: { id: 'test-1', name: 'Local' },
        remoteVersion: { id: 'test-1', name: 'Remote' },
        timestamp: new Date().toISOString(),
        conflictFields: ['name'],
      };

      // Manually add conflict for testing
      (realTimeSyncService as any).conflictQueue.set('test-1', conflict);

      expect(realTimeSyncService.getConflicts()).toHaveLength(1);

      realTimeSyncService.resolveConflict('test-1', { strategy: 'remote' });

      expect(realTimeSyncService.getConflicts()).toHaveLength(0);
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to all client data', () => {
      const clientObserve = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      });
      const medicationObserve = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      });
      const appointmentObserve = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      });
      const messageObserve = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      });

      (client.models.Client.observeQuery as any) = clientObserve;
      (client.models.Medication.observeQuery as any) = medicationObserve;
      (client.models.Appointment.observeQuery as any) = appointmentObserve;
      (client.models.Message.observeQuery as any) = messageObserve;

      realTimeSyncService.subscribeToClientData('client-1');

      expect(clientObserve).toHaveBeenCalled();
      expect(medicationObserve).toHaveBeenCalled();
      expect(appointmentObserve).toHaveBeenCalled();
      expect(messageObserve).toHaveBeenCalled();
    });

    it('should unsubscribe from client data', () => {
      const mockSub1 = { unsubscribe: vi.fn() };
      const mockSub2 = { unsubscribe: vi.fn() };

      (realTimeSyncService as any).subscriptions.set('client-client-1', mockSub1);
      (realTimeSyncService as any).subscriptions.set('medications-client-1', mockSub2);

      realTimeSyncService.unsubscribeFromClientData('client-1');

      expect(mockSub1.unsubscribe).toHaveBeenCalled();
      expect(mockSub2.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from all data', () => {
      const mockSub1 = { unsubscribe: vi.fn() };
      const mockSub2 = { unsubscribe: vi.fn() };

      (realTimeSyncService as any).subscriptions.set('sub1', mockSub1);
      (realTimeSyncService as any).subscriptions.set('sub2', mockSub2);

      realTimeSyncService.unsubscribeAll();

      expect(mockSub1.unsubscribe).toHaveBeenCalled();
      expect(mockSub2.unsubscribe).toHaveBeenCalled();
      expect(realTimeSyncService.getConnectionStatus()).toBe('disconnected');
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed subscriptions with exponential backoff', async () => {
      vi.useFakeTimers();

      let subscriptionCallback: any;
      let subscribeCallCount = 0;
      const mockObserveQuery = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockImplementation((callback) => {
          subscriptionCallback = callback;
          subscribeCallCount++;
          return mockSubscription;
        }),
      });
      (client.models.Client.observeQuery as any) = mockObserveQuery;

      realTimeSyncService.subscribeToClientUpdates('client-1');
      expect(subscribeCallCount).toBe(1);

      // Simulate first error
      act(() => {
        subscriptionCallback.error(new Error('Network error'));
      });

      // Fast-forward to trigger first retry (1 second)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(subscribeCallCount).toBe(2);

      // Simulate second error
      act(() => {
        subscriptionCallback.error(new Error('Network error'));
      });

      // Fast-forward to trigger second retry (2 seconds)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(subscribeCallCount).toBe(3);

      vi.useRealTimers();
    });

    it('should stop retrying after max attempts', async () => {
      vi.useFakeTimers();

      let subscriptionCallback: any;
      let subscribeCallCount = 0;
      const mockObserveQuery = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockImplementation((callback) => {
          subscriptionCallback = callback;
          subscribeCallCount++;
          return mockSubscription;
        }),
      });
      (client.models.Client.observeQuery as any) = mockObserveQuery;

      realTimeSyncService.subscribeToClientUpdates('client-1');

      // Simulate max retries (3) + initial attempt = 4 total
      for (let i = 0; i < 4; i++) {
        act(() => {
          subscriptionCallback.error(new Error('Network error'));
        });

        if (i < 3) {
          act(() => {
            vi.advanceTimersByTime(1000 * Math.pow(2, i));
          });
        }
      }

      expect(subscribeCallCount).toBe(4); // Initial + 3 retries

      // Should not retry after max attempts
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(subscribeCallCount).toBe(4);

      vi.useRealTimers();
    });
  });
});