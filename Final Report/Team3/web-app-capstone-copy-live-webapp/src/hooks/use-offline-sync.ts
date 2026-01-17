/**
 * React hook for monitoring offline status and pending mutations
 */

'use client';

import { useState, useEffect } from 'react';
import { graphqlCache, type OfflineMutation } from '@/lib/graphql-cache';

interface OfflineSyncStatus {
  isOnline: boolean;
  pendingMutations: OfflineMutation[];
  pendingCount: number;
  oldestPending: Date | null;
  failedCount: number;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<OfflineSyncStatus>(() => {
    const stats = graphqlCache.getMutationQueueStats();
    return {
      isOnline: navigator.onLine,
      pendingMutations: graphqlCache.getPendingMutations(),
      pendingCount: stats.pendingMutations,
      oldestPending: stats.oldestMutation ? new Date(stats.oldestMutation) : null,
      failedCount: stats.failedMutations,
    };
  });

  useEffect(() => {
    // Update status function
    const updateStatus = () => {
      const stats = graphqlCache.getMutationQueueStats();
      setStatus({
        isOnline: navigator.onLine,
        pendingMutations: graphqlCache.getPendingMutations(),
        pendingCount: stats.pendingMutations,
        oldestPending: stats.oldestMutation ? new Date(stats.oldestMutation) : null,
        failedCount: stats.failedMutations,
      });
    };

    // Listen for online/offline events
    const handleOnline = () => {
      updateStatus();
      // Trigger processing of queued mutations
      if (typeof window !== 'undefined' && (window as any).graphqlClient) {
        (window as any).graphqlClient.processPendingMutations();
      }
    };

    const handleOffline = () => {
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll for updates every 5 seconds when there are pending mutations
    const interval = setInterval(() => {
      if (status.pendingCount > 0) {
        updateStatus();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [status.pendingCount]);

  return status;
}

/**
 * Hook to display offline sync notifications
 */
export function useOfflineSyncNotification() {
  const { isOnline, pendingCount, failedCount } = useOfflineSync();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    if (!isOnline && pendingCount > 0) {
      setNotificationMessage(`Working offline. ${pendingCount} change${pendingCount > 1 ? 's' : ''} will sync when online.`);
      setShowNotification(true);
    } else if (isOnline && pendingCount > 0) {
      setNotificationMessage(`Syncing ${pendingCount} pending change${pendingCount > 1 ? 's' : ''}...`);
      setShowNotification(true);
    } else if (failedCount > 0) {
      setNotificationMessage(`${failedCount} change${failedCount > 1 ? 's' : ''} failed to sync. Will retry.`);
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [isOnline, pendingCount, failedCount]);

  return {
    showNotification,
    notificationMessage,
    isOnline,
    pendingCount,
    failedCount,
  };
}