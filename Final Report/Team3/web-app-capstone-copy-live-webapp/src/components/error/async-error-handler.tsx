'use client';

import { useEffect } from 'react';
import { logErrorToCloudWatch } from '@/lib/cloudwatch-logger';

/**
 * Global async error handler for unhandled promise rejections
 * This component should be included once in the root layout
 */
export function AsyncErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Log to CloudWatch
      try {
        await logErrorToCloudWatch({
          error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          errorInfo: {
            componentStack: 'Unhandled Promise Rejection',
          },
          errorId: `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          userAgent: window.navigator.userAgent,
          url: window.location.href,
          userId: getCurrentUserId(),
        });
      } catch (loggingError) {
        console.error('Failed to log async error to CloudWatch:', loggingError);
      }
    };

    const handleGlobalError = async (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      // Log to CloudWatch
      try {
        await logErrorToCloudWatch({
          error: event.error instanceof Error ? event.error : new Error(event.message),
          errorInfo: {
            componentStack: `Global Error at ${event.filename}:${event.lineno}:${event.colno}`,
          },
          errorId: `global_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          userAgent: window.navigator.userAgent,
          url: window.location.href,
          userId: getCurrentUserId(),
        });
      } catch (loggingError) {
        console.error('Failed to log global error to CloudWatch:', loggingError);
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return null;
}

function getCurrentUserId(): string | null {
  try {
    const currentUser = localStorage.getItem('healthcare_app_current_user');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      return user.id || null;
    }
  } catch {
    // Ignore errors when getting user ID
  }
  return null;
}