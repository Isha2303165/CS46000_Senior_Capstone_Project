/**
 * Offline handling with cached data display and sync indicators
 */

import React from 'react';

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  pendingActions: PendingAction[];
  syncStatus: 'synced' | 'syncing' | 'pending' | 'error';
}

export interface PendingAction {
  id: string;
  type: 'medication_log' | 'appointment_update' | 'client_update' | 'message_send';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineHandlerOptions {
  enablePersistence?: boolean;
  maxPendingActions?: number;
  syncRetryInterval?: number;
  onlineCheckInterval?: number;
}

const DEFAULT_OPTIONS: Required<OfflineHandlerOptions> = {
  enablePersistence: true,
  maxPendingActions: 100,
  syncRetryInterval: 30000, // 30 seconds
  onlineCheckInterval: 5000, // 5 seconds
};

/**
 * Check if the browser is online
 */
export const checkOnlineStatus = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

/**
 * Persist data to localStorage
 */
const persistData = (key: string, data: any): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to persist offline data:', error);
  }
};

/**
 * Retrieve data from localStorage
 */
const retrieveData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn('Failed to retrieve offline data:', error);
    return defaultValue;
  }
};

/**
 * React hook for offline handling
 */
export function useOfflineHandler(options: OfflineHandlerOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [offlineState, setOfflineState] = React.useState<OfflineState>(() => ({
    isOnline: checkOnlineStatus(),
    wasOffline: false,
    lastOnlineTime: new Date(),
    pendingActions: retrieveData('offline_pending_actions', []),
    syncStatus: 'synced',
  }));

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: true,
        lastOnlineTime: new Date(),
        syncStatus: prev.pendingActions.length > 0 ? 'pending' : 'synced',
      }));
    };

    const handleOffline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: false,
        wasOffline: true,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic online check (for cases where events don't fire)
    const onlineCheckInterval = setInterval(() => {
      const isOnline = checkOnlineStatus();
      setOfflineState(prev => {
        if (prev.isOnline !== isOnline) {
          return {
            ...prev,
            isOnline,
            wasOffline: prev.wasOffline || !isOnline,
            lastOnlineTime: isOnline ? new Date() : prev.lastOnlineTime,
          };
        }
        return prev;
      });
    }, opts.onlineCheckInterval);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(onlineCheckInterval);
    };
  }, [opts.onlineCheckInterval]);

  // Persist pending actions
  React.useEffect(() => {
    if (opts.enablePersistence) {
      persistData('offline_pending_actions', offlineState.pendingActions);
    }
  }, [offlineState.pendingActions, opts.enablePersistence]);

  // Add pending action
  const addPendingAction = React.useCallback((
    type: PendingAction['type'],
    data: any,
    maxRetries: number = 3
  ): string => {
    const action: PendingAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries,
    };

    setOfflineState(prev => {
      const newActions = [...prev.pendingActions, action];
      
      // Limit the number of pending actions
      if (newActions.length > opts.maxPendingActions) {
        newActions.splice(0, newActions.length - opts.maxPendingActions);
      }

      return {
        ...prev,
        pendingActions: newActions,
        syncStatus: prev.isOnline ? 'pending' : prev.syncStatus,
      };
    });

    return action.id;
  }, [opts.maxPendingActions]);

  // Remove pending action
  const removePendingAction = React.useCallback((actionId: string) => {
    setOfflineState(prev => ({
      ...prev,
      pendingActions: prev.pendingActions.filter(action => action.id !== actionId),
    }));
  }, []);

  // Retry pending action
  const retryPendingAction = React.useCallback((actionId: string) => {
    setOfflineState(prev => ({
      ...prev,
      pendingActions: prev.pendingActions.map(action =>
        action.id === actionId
          ? { ...action, retryCount: action.retryCount + 1 }
          : action
      ),
    }));
  }, []);

  // Clear all pending actions
  const clearPendingActions = React.useCallback(() => {
    setOfflineState(prev => ({
      ...prev,
      pendingActions: [],
      syncStatus: 'synced',
    }));
  }, []);

  // Sync pending actions
  const syncPendingActions = React.useCallback(async (
    syncFunction: (actions: PendingAction[]) => Promise<string[]>
  ) => {
    if (!offlineState.isOnline || offlineState.pendingActions.length === 0) {
      return;
    }

    setOfflineState(prev => ({ ...prev, syncStatus: 'syncing' }));

    try {
      const succeededActionIds = await syncFunction(offlineState.pendingActions);
      
      setOfflineState(prev => ({
        ...prev,
        pendingActions: prev.pendingActions.filter(
          action => !succeededActionIds.includes(action.id)
        ),
        syncStatus: 'synced',
      }));
    } catch (error) {
      console.error('Failed to sync pending actions:', error);
      setOfflineState(prev => ({ ...prev, syncStatus: 'error' }));
    }
  }, [offlineState.isOnline, offlineState.pendingActions]);

  return {
    ...offlineState,
    addPendingAction,
    removePendingAction,
    retryPendingAction,
    clearPendingActions,
    syncPendingActions,
  };
}

/**
 * Offline indicator component
 */
export interface OfflineIndicatorProps {
  offlineState: OfflineState;
  onRetrySync?: () => void;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  offlineState,
  onRetrySync,
  className = '',
}) => {
  if (offlineState.isOnline && offlineState.pendingActions.length === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!offlineState.isOnline) return 'bg-red-500';
    if (offlineState.syncStatus === 'syncing') return 'bg-yellow-500';
    if (offlineState.syncStatus === 'pending') return 'bg-orange-500';
    if (offlineState.syncStatus === 'error') return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!offlineState.isOnline) return 'Offline';
    if (offlineState.syncStatus === 'syncing') return 'Syncing...';
    if (offlineState.syncStatus === 'pending') return `${offlineState.pendingActions.length} pending`;
    if (offlineState.syncStatus === 'error') return 'Sync failed';
    return 'Synced';
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-gray-600">{getStatusText()}</span>
      {offlineState.syncStatus === 'error' && onRetrySync && (
        <button
          onClick={onRetrySync}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * Cache data for offline access
 */
export const cacheData = (key: string, data: any, ttl?: number): void => {
  const cacheItem = {
    data,
    timestamp: Date.now(),
    ttl: ttl || 24 * 60 * 60 * 1000, // 24 hours default
  };
  persistData(`cache_${key}`, cacheItem);
};

/**
 * Retrieve cached data
 */
export const getCachedData = <T>(key: string, defaultValue: T): T => {
  const cacheItem = retrieveData(`cache_${key}`, null);
  
  if (!cacheItem) return defaultValue;
  
  const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;
  if (isExpired) {
    // Clean up expired cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`);
    }
    return defaultValue;
  }
  
  return cacheItem.data;
};

/**
 * Clear all cached data
 */
export const clearCache = (): void => {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      localStorage.removeItem(key);
    }
  });
};