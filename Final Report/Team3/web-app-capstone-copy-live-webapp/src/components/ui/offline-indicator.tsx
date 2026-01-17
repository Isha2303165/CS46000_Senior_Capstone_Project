'use client';

import React from 'react';
import { WifiOff, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { useOfflineSyncNotification, useOfflineSync } from '@/hooks/use-offline-sync';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { showNotification, notificationMessage, isOnline, pendingCount, failedCount } = useOfflineSyncNotification();

  if (!showNotification) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all',
        !isOnline && 'bg-yellow-100 text-yellow-900 border border-yellow-200',
        isOnline && pendingCount > 0 && 'bg-blue-100 text-blue-900 border border-blue-200',
        failedCount > 0 && 'bg-red-100 text-red-900 border border-red-200'
      )}
      role="status"
      aria-live="polite"
    >
      {!isOnline ? (
        <WifiOff className="h-4 w-4" aria-hidden="true" />
      ) : pendingCount > 0 ? (
        <Cloud className="h-4 w-4 animate-pulse" aria-hidden="true" />
      ) : failedCount > 0 ? (
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
      ) : (
        <CloudOff className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{notificationMessage}</span>
    </div>
  );
}

/**
 * Detailed offline sync status component for settings or debug views
 */
export function OfflineSyncStatus() {
  const { isOnline, pendingCount, oldestPending, failedCount, pendingMutations } = useOfflineSync();

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Offline Sync Status</h3>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-600">Online</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-sm text-yellow-600">Offline</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Pending Changes</p>
          <p className="text-xl font-semibold">{pendingCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Failed Syncs</p>
          <p className="text-xl font-semibold">{failedCount}</p>
        </div>
      </div>

      {oldestPending && (
        <div className="text-sm">
          <p className="text-muted-foreground">Oldest Pending</p>
          <p>{oldestPending.toLocaleString()}</p>
        </div>
      )}

      {pendingMutations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pending Operations:</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {pendingMutations.map((mutation) => (
              <div
                key={mutation.id}
                className="text-xs p-2 bg-muted rounded flex items-center justify-between"
              >
                <span className="truncate flex-1">
                  {mutation.mutation.substring(0, 50)}...
                </span>
                {mutation.retryCount > 0 && (
                  <span className="text-red-600 ml-2">
                    Retry {mutation.retryCount}/{mutation.maxRetries}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}