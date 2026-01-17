'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';
import { useConnectionStatus, useConnectionRecovery } from '@/hooks/use-real-time-sync';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConnectionStatusIndicator({ 
  className,
  showText = true,
  size = 'md'
}: ConnectionStatusIndicatorProps) {
  const connectionStatus = useConnectionStatus();
  const { forceReconnect, refreshAllData, isOnline, isConnecting, hasError } = useConnectionRecovery();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          text: 'Connection Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      default:
        return {
          icon: WifiOff,
          text: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  if (!showText) {
    return (
      <div className={cn('flex items-center', className)}>
        <Icon 
          className={cn(
            iconSize,
            config.animate && 'animate-spin',
            isOnline && 'text-green-600',
            isConnecting && 'text-yellow-600',
            hasError && 'text-red-600',
            connectionStatus === 'disconnected' && 'text-gray-600'
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant={config.variant}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1',
          config.className,
          textSize
        )}
      >
        <Icon 
          className={cn(
            iconSize,
            config.animate && 'animate-spin'
          )}
        />
        {config.text}
      </Badge>

      {(hasError || connectionStatus === 'disconnected') && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={forceReconnect}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAllData}
            className="h-6 px-2 text-xs"
          >
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact version for headers/toolbars
export function CompactConnectionStatus({ className }: { className?: string }) {
  return (
    <ConnectionStatusIndicator 
      className={className}
      showText={false}
      size="sm"
    />
  );
}

// Detailed version with additional info
export function DetailedConnectionStatus({ className }: { className?: string }) {
  const connectionStatus = useConnectionStatus();
  const { forceReconnect, refreshAllData } = useConnectionRecovery();

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time updates are active. Changes from other caregivers will appear automatically.';
      case 'connecting':
        return 'Establishing connection for real-time updates...';
      case 'disconnected':
        return 'Real-time updates are disabled. You may not see changes from other caregivers immediately.';
      case 'error':
        return 'Connection error. Real-time updates are not working. Try refreshing or check your internet connection.';
      default:
        return 'Connection status unknown.';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <ConnectionStatusIndicator />
      <p className="text-sm text-muted-foreground">
        {getStatusMessage()}
      </p>
      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={forceReconnect}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
          >
            Refresh Data
          </Button>
        </div>
      )}
    </div>
  );
}