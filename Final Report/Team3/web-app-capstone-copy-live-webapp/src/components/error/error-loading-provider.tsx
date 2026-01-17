'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { SectionErrorBoundary } from './section-error-boundary';
import { ErrorMessage, InlineErrorMessage } from './error-messages';
import { useRetry, RetryOptions } from '@/lib/retry-mechanism';
import { useOfflineHandler, OfflineIndicator } from '@/lib/offline-handler';
import { 
  SectionSkeleton,
  ClientHeaderSkeleton,
  MedicationsSkeleton,
  AppointmentsSkeleton,
  OverviewSkeleton,
  ActivityFeedSkeleton,
  CommunicationSkeleton,
  MedicalHistorySkeleton,
  ContactsSkeleton,
} from '@/components/ui/section-skeletons';

interface ErrorLoadingContextValue {
  // Error handling
  showError: (error: any, context?: string) => void;
  clearError: () => void;
  currentError: any;
  
  // Loading states
  setLoading: (section: string, loading: boolean) => void;
  isLoading: (section: string) => boolean;
  loadingStates: Record<string, boolean>;
  
  // Retry functionality
  retry: <T>(fn: () => Promise<T>) => Promise<T>;
  retryState: ReturnType<typeof useRetry>;
  
  // Offline handling
  offlineHandler: ReturnType<typeof useOfflineHandler>;
}

const ErrorLoadingContext = createContext<ErrorLoadingContextValue | null>(null);

export const useErrorLoading = () => {
  const context = useContext(ErrorLoadingContext);
  if (!context) {
    throw new Error('useErrorLoading must be used within ErrorLoadingProvider');
  }
  return context;
};

interface ErrorLoadingProviderProps {
  children: ReactNode;
  retryOptions?: RetryOptions;
}

export const ErrorLoadingProvider: React.FC<ErrorLoadingProviderProps> = ({
  children,
  retryOptions,
}) => {
  const [currentError, setCurrentError] = React.useState<any>(null);
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  
  const retryState = useRetry(retryOptions);
  const offlineHandler = useOfflineHandler();

  const showError = React.useCallback((error: any, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    setCurrentError({ error, context });
  }, []);

  const clearError = React.useCallback(() => {
    setCurrentError(null);
  }, []);

  const setLoading = React.useCallback((section: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [section]: loading,
    }));
  }, []);

  const isLoading = React.useCallback((section: string) => {
    return loadingStates[section] || false;
  }, [loadingStates]);

  const value: ErrorLoadingContextValue = {
    showError,
    clearError,
    currentError,
    setLoading,
    isLoading,
    loadingStates,
    retry: retryState.retry,
    retryState,
    offlineHandler,
  };

  return (
    <ErrorLoadingContext.Provider value={value}>
      {children}
    </ErrorLoadingContext.Provider>
  );
};

// Higher-order component for wrapping sections with error boundaries and loading states
interface WithErrorLoadingProps {
  sectionName: string;
  showSkeleton?: boolean;
  skeletonType?: 'generic' | 'header' | 'medications' | 'appointments' | 'overview' | 'activity' | 'communication' | 'medical-history' | 'contacts';
  children: ReactNode;
  onRetry?: () => void;
}

export const WithErrorLoading: React.FC<WithErrorLoadingProps> = ({
  sectionName,
  showSkeleton = true,
  skeletonType = 'generic',
  children,
  onRetry,
}) => {
  const { isLoading } = useErrorLoading();
  const loading = isLoading(sectionName);

  const renderSkeleton = () => {
    if (!showSkeleton || !loading) return null;

    switch (skeletonType) {
      case 'header':
        return <ClientHeaderSkeleton />;
      case 'medications':
        return <MedicationsSkeleton />;
      case 'appointments':
        return <AppointmentsSkeleton />;
      case 'overview':
        return <OverviewSkeleton />;
      case 'activity':
        return <ActivityFeedSkeleton />;
      case 'communication':
        return <CommunicationSkeleton />;
      case 'medical-history':
        return <MedicalHistorySkeleton />;
      case 'contacts':
        return <ContactsSkeleton />;
      default:
        return <SectionSkeleton />;
    }
  };

  if (loading) {
    return renderSkeleton();
  }

  return (
    <SectionErrorBoundary sectionName={sectionName} onRetry={onRetry}>
      {children}
    </SectionErrorBoundary>
  );
};

// Hook for handling section-specific loading and error states
export const useSectionState = (sectionName: string) => {
  const { setLoading, isLoading, showError, clearError, retry, offlineHandler } = useErrorLoading();

  const handleAsyncOperation = React.useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      showLoading?: boolean;
      retryOnError?: boolean;
      cacheKey?: string;
    }
  ): Promise<T> => {
    const { showLoading = true, retryOnError = true, cacheKey } = options || {};

    try {
      if (showLoading) {
        setLoading(sectionName, true);
      }

      const result = retryOnError 
        ? await retry(operation)
        : await operation();

      clearError();
      return result;
    } catch (error) {
      showError(error, sectionName);
      
      // If offline, add to pending actions
      if (!offlineHandler.isOnline && cacheKey) {
        offlineHandler.addPendingAction('generic', {
          operation: operation.toString(),
          cacheKey,
        });
      }
      
      throw error;
    } finally {
      if (showLoading) {
        setLoading(sectionName, false);
      }
    }
  }, [sectionName, setLoading, showError, clearError, retry, offlineHandler]);

  return {
    loading: isLoading(sectionName),
    setLoading: (loading: boolean) => setLoading(sectionName, loading),
    showError: (error: any) => showError(error, sectionName),
    clearError,
    handleAsyncOperation,
    offlineHandler,
  };
};

// Component for displaying offline status
export const OfflineStatus: React.FC<{ className?: string }> = ({ className }) => {
  const { offlineHandler } = useErrorLoading();
  
  return (
    <OfflineIndicator
      offlineState={offlineHandler}
      onRetrySync={() => {
        // Implement sync retry logic here
        // TODO: Implement sync retry logic
      }}
      className={className}
    />
  );
};

// Global error display component
export const GlobalErrorDisplay: React.FC = () => {
  const { currentError, clearError, retry } = useErrorLoading();

  if (!currentError) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <ErrorMessage
        error={currentError.error}
        context={currentError.context}
        onRetry={() => {
          clearError();
          // Optionally trigger a retry
        }}
        onRefresh={() => window.location.reload()}
        className="shadow-lg"
      />
    </div>
  );
};