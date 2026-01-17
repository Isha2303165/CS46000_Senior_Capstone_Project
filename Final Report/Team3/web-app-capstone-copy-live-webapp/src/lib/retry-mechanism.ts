/**
 * Retry mechanism with exponential backoff for GraphQL queries and mutations
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryState {
  attempt: number;
  isRetrying: boolean;
  lastError: Error | null;
  canRetry: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error?.networkError) return true;
    if (error?.message?.includes('timeout')) return true;
    if (error?.message?.includes('Network request failed')) return true;
    if (error?.graphQLErrors?.some((e: any) => e.extensions?.code === 'INTERNAL_ERROR')) return true;
    return false;
  },
  onRetry: () => {},
};

/**
 * Calculate delay for exponential backoff
 */
export const calculateDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number
): number => {
  const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (!opts.retryCondition(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === opts.maxAttempts) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay, opts.backoffFactor);
      
      opts.onRetry(attempt, error);
      console.warn(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms:`, error.message);
      
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * React hook for retry functionality
 */
export function useRetry(options: RetryOptions = {}) {
  const [retryState, setRetryState] = React.useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    lastError: null,
    canRetry: true,
  });

  const opts = { ...DEFAULT_OPTIONS, ...options };

  const retry = React.useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T> => {
    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      attempt: 0,
    }));

    try {
      const result = await retryWithBackoff(fn, {
        ...opts,
        onRetry: (attempt, error) => {
          setRetryState(prev => ({
            ...prev,
            attempt,
            lastError: error,
          }));
          opts.onRetry(attempt, error);
        },
      });

      setRetryState({
        attempt: 0,
        isRetrying: false,
        lastError: null,
        canRetry: true,
      });

      return result;
    } catch (error) {
      const canRetry = opts.retryCondition(error);
      setRetryState({
        attempt: opts.maxAttempts,
        isRetrying: false,
        lastError: error as Error,
        canRetry,
      });
      throw error;
    }
  }, [opts]);

  const reset = React.useCallback(() => {
    setRetryState({
      attempt: 0,
      isRetrying: false,
      lastError: null,
      canRetry: true,
    });
  }, []);

  return {
    retry,
    reset,
    ...retryState,
  };
}

/**
 * Enhanced React Query retry configuration
 */
export const createRetryConfig = (options: RetryOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return {
    retry: (failureCount: number, error: any) => {
      if (failureCount >= opts.maxAttempts) return false;
      return opts.retryCondition(error);
    },
    retryDelay: (attemptIndex: number) => 
      calculateDelay(attemptIndex + 1, opts.baseDelay, opts.maxDelay, opts.backoffFactor),
  };
};

/**
 * GraphQL-specific retry options
 */
export const graphqlRetryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // Don't retry authentication errors
    if (error?.graphQLErrors?.some((e: any) => 
      e.extensions?.code === 'UNAUTHENTICATED' || 
      e.extensions?.code === 'FORBIDDEN'
    )) {
      return false;
    }

    // Don't retry validation errors
    if (error?.graphQLErrors?.some((e: any) => 
      e.extensions?.code === 'BAD_USER_INPUT'
    )) {
      return false;
    }

    // Retry network errors and server errors
    return (
      error?.networkError ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('Network request failed') ||
      error?.graphQLErrors?.some((e: any) => 
        e.extensions?.code === 'INTERNAL_ERROR'
      )
    );
  },
};

// Import React for the hook
import React from 'react';