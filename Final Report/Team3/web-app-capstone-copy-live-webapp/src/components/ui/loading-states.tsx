'use client';

import React from 'react';
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Basic loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={cn('animate-spin text-blue-600', sizeClasses[size], className)} 
      aria-label="Loading"
    />
  );
}

// GraphQL query loading state
interface GraphQLLoadingProps {
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export function GraphQLLoading({ 
  message = 'Loading data...', 
  showSpinner = true,
  className 
}: GraphQLLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <div className="flex items-center space-x-2 text-gray-600">
        {showSpinner && <LoadingSpinner size="sm" />}
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

// Connection status indicator
interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ConnectionStatus({ 
  isConnected, 
  isLoading = false, 
  className 
}: ConnectionStatusProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center space-x-1 text-yellow-600', className)}>
        <LoadingSpinner size="sm" />
        <span className="text-xs">Connecting...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center space-x-1',
      isConnected ? 'text-green-600' : 'text-red-600',
      className
    )}>
      {isConnected ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span className="text-xs">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

// Amplify connection status
interface AmplifyConnectionStatusProps {
  className?: string;
}

export function AmplifyConnectionStatus({ className }: AmplifyConnectionStatusProps) {
  const [connectionState, setConnectionState] = React.useState<{
    isConnected: boolean;
    isLoading: boolean;
    lastError?: string;
  }>({
    isConnected: true,
    isLoading: false,
  });

  React.useEffect(() => {
    // In a real implementation, this would monitor Amplify connection status
    // For now, we'll simulate connection monitoring
    
    const checkConnection = async () => {
      try {
        setConnectionState(prev => ({ ...prev, isLoading: true }));
        
        // Simulate connection check
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In production, this would check actual Amplify connection
        const isConnected = navigator.onLine;
        
        setConnectionState({
          isConnected,
          isLoading: false,
          lastError: isConnected ? undefined : 'Network unavailable',
        });
      } catch (error) {
        setConnectionState({
          isConnected: false,
          isLoading: false,
          lastError: error instanceof Error ? error.message : 'Connection failed',
        });
      }
    };

    // Initial check
    checkConnection();

    // Set up periodic checks
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    // Listen for online/offline events
    const handleOnline = () => setConnectionState(prev => ({ ...prev, isConnected: true, lastError: undefined }));
    const handleOffline = () => setConnectionState(prev => ({ ...prev, isConnected: false, lastError: 'Network unavailable' }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <ConnectionStatus 
        isConnected={connectionState.isConnected}
        isLoading={connectionState.isLoading}
      />
      {connectionState.lastError && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs" title={connectionState.lastError}>
            Error
          </span>
        </div>
      )}
    </div>
  );
}

// Loading overlay for forms and components
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children, 
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-lg">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-700">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton loading states
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

// GraphQL mutation loading button
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  isLoading, 
  loadingText = 'Loading...', 
  children, 
  className,
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-md',
        'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
    >
      {isLoading && <LoadingSpinner size="sm" className="text-white" />}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  );
}

// Data loading states for different scenarios
export function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description: string; 
  action?: React.ReactNode; 
}) {
  return (
    <div className="text-center py-8">
      <div className="text-gray-400 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ 
  title = 'Something went wrong', 
  description = 'Please try again later', 
  onRetry 
}: { 
  title?: string; 
  description?: string; 
  onRetry?: () => void; 
}) {
  return (
    <div className="text-center py-8">
      <div className="text-red-400 mb-4">
        <AlertCircle className="w-12 h-12 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}