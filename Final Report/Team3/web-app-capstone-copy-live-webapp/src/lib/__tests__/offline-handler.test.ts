import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { 
  useOfflineHandler, 
  checkOnlineStatus, 
  cacheData, 
  getCachedData, 
  clearCache,
  OfflineIndicator 
} from '../offline-handler';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('checkOnlineStatus', () => {
  it('returns true when navigator.onLine is true', () => {
    (navigator as any).onLine = true;
    expect(checkOnlineStatus()).toBe(true);
  });

  it('returns false when navigator.onLine is false', () => {
    (navigator as any).onLine = false;
    expect(checkOnlineStatus()).toBe(false);
  });

  it('returns true when navigator is undefined (SSR)', () => {
    const originalNavigator = global.navigator;
    delete (global as any).navigator;
    
    expect(checkOnlineStatus()).toBe(true);
    
    global.navigator = originalNavigator;
  });
});

describe('cacheData and getCachedData', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('caches data with TTL', () => {
    const testData = { id: 1, name: 'test' };
    cacheData('test-key', testData, 60000);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cache_test-key',
      expect.stringContaining('"data":{"id":1,"name":"test"}')
    );
  });

  it('retrieves cached data when not expired', () => {
    const testData = { id: 1, name: 'test' };
    const cacheItem = {
      data: testData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheItem));
    
    const result = getCachedData('test-key', null);
    expect(result).toEqual(testData);
  });

  it('returns default value when cache is expired', () => {
    const cacheItem = {
      data: { id: 1, name: 'test' },
      timestamp: Date.now() - 70000, // 70 seconds ago
      ttl: 60000, // 60 second TTL
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheItem));
    
    const result = getCachedData('test-key', 'default');
    expect(result).toBe('default');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cache_test-key');
  });

  it('returns default value when no cache exists', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const result = getCachedData('test-key', 'default');
    expect(result).toBe('default');
  });
});

describe('clearCache', () => {
  it('removes all cache entries', () => {
    Object.defineProperty(window.localStorage, 'keys', {
      value: jest.fn(() => ['cache_key1', 'cache_key2', 'other_key']),
    });
    
    // Mock Object.keys to return our test keys
    const originalKeys = Object.keys;
    Object.keys = vi.fn(() => ['cache_key1', 'cache_key2', 'other_key']);
    
    clearCache();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cache_key1');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cache_key2');
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key');
    
    Object.keys = originalKeys;
  });
});

describe('useOfflineHandler', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue('[]');
    (navigator as any).onLine = true;
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useOfflineHandler());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
    expect(result.current.pendingActions).toEqual([]);
    expect(result.current.syncStatus).toBe('synced');
  });

  it('loads pending actions from localStorage', () => {
    const pendingActions = [
      {
        id: 'test-1',
        type: 'medication_log',
        data: { medicationId: '1' },
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3,
      },
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingActions));
    
    const { result } = renderHook(() => useOfflineHandler());
    
    expect(result.current.pendingActions).toHaveLength(1);
  });

  it('adds pending actions', () => {
    const { result } = renderHook(() => useOfflineHandler());
    
    act(() => {
      const actionId = result.current.addPendingAction('medication_log', { medicationId: '1' });
      expect(actionId).toBeTruthy();
    });
    
    expect(result.current.pendingActions).toHaveLength(1);
    expect(result.current.pendingActions[0].type).toBe('medication_log');
    expect(result.current.pendingActions[0].data).toEqual({ medicationId: '1' });
  });

  it('removes pending actions', () => {
    const { result } = renderHook(() => useOfflineHandler());
    
    let actionId: string;
    act(() => {
      actionId = result.current.addPendingAction('medication_log', { medicationId: '1' });
    });
    
    act(() => {
      result.current.removePendingAction(actionId);
    });
    
    expect(result.current.pendingActions).toHaveLength(0);
  });

  it('retries pending actions', () => {
    const { result } = renderHook(() => useOfflineHandler());
    
    let actionId: string;
    act(() => {
      actionId = result.current.addPendingAction('medication_log', { medicationId: '1' });
    });
    
    act(() => {
      result.current.retryPendingAction(actionId);
    });
    
    expect(result.current.pendingActions[0].retryCount).toBe(1);
  });

  it('limits number of pending actions', () => {
    const { result } = renderHook(() => useOfflineHandler({ maxPendingActions: 2 }));
    
    act(() => {
      result.current.addPendingAction('medication_log', { medicationId: '1' });
      result.current.addPendingAction('medication_log', { medicationId: '2' });
      result.current.addPendingAction('medication_log', { medicationId: '3' });
    });
    
    expect(result.current.pendingActions).toHaveLength(2);
    // Should keep the most recent actions
    expect(result.current.pendingActions[0].data.medicationId).toBe('2');
    expect(result.current.pendingActions[1].data.medicationId).toBe('3');
  });

  it('syncs pending actions successfully', async () => {
    const { result } = renderHook(() => useOfflineHandler());
    
    act(() => {
      result.current.addPendingAction('medication_log', { medicationId: '1' });
      result.current.addPendingAction('medication_log', { medicationId: '2' });
    });
    
    const mockSyncFunction = vi.fn().mockResolvedValue(['test-action-1']);
    
    await act(async () => {
      await result.current.syncPendingActions(mockSyncFunction);
    });
    
    expect(mockSyncFunction).toHaveBeenCalledWith(result.current.pendingActions);
    expect(result.current.syncStatus).toBe('synced');
  });

  it('handles sync failures', async () => {
    const { result } = renderHook(() => useOfflineHandler());
    
    act(() => {
      result.current.addPendingAction('medication_log', { medicationId: '1' });
    });
    
    const mockSyncFunction = vi.fn().mockRejectedValue(new Error('Sync failed'));
    
    await act(async () => {
      await result.current.syncPendingActions(mockSyncFunction);
    });
    
    expect(result.current.syncStatus).toBe('error');
  });

  it('responds to online/offline events', () => {
    const { result } = renderHook(() => useOfflineHandler());
    
    // Simulate going offline
    act(() => {
      (navigator as any).onLine = false;
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
    
    // Simulate going back online
    act(() => {
      (navigator as any).onLine = true;
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOnline).toBe(true);
  });
});

describe('OfflineIndicator', () => {
  const mockOfflineState = {
    isOnline: true,
    wasOffline: false,
    lastOnlineTime: new Date(),
    pendingActions: [],
    syncStatus: 'synced' as const,
  };

  it('renders nothing when online with no pending actions', () => {
    const { container } = render(
      <OfflineIndicator offlineState={mockOfflineState} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('shows offline status when offline', () => {
    const offlineState = {
      ...mockOfflineState,
      isOnline: false,
    };
    
    render(<OfflineIndicator offlineState={offlineState} />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows pending actions count', () => {
    const offlineState = {
      ...mockOfflineState,
      pendingActions: [
        { id: '1', type: 'medication_log' as const, data: {}, timestamp: new Date(), retryCount: 0, maxRetries: 3 },
        { id: '2', type: 'medication_log' as const, data: {}, timestamp: new Date(), retryCount: 0, maxRetries: 3 },
      ],
      syncStatus: 'pending' as const,
    };
    
    render(<OfflineIndicator offlineState={offlineState} />);
    
    expect(screen.getByText('2 pending')).toBeInTheDocument();
  });

  it('shows syncing status', () => {
    const offlineState = {
      ...mockOfflineState,
      syncStatus: 'syncing' as const,
    };
    
    render(<OfflineIndicator offlineState={offlineState} />);
    
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('shows retry button on sync error', () => {
    const onRetrySync = vi.fn();
    const offlineState = {
      ...mockOfflineState,
      syncStatus: 'error' as const,
    };
    
    render(
      <OfflineIndicator 
        offlineState={offlineState} 
        onRetrySync={onRetrySync}
      />
    );
    
    expect(screen.getByText('Sync failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});