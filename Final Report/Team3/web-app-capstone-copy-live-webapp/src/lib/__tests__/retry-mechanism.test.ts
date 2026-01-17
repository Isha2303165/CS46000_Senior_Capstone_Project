import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { 
  retryWithBackoff, 
  calculateDelay, 
  useRetry, 
  createRetryConfig,
  graphqlRetryOptions 
} from '../retry-mechanism';

// Mock timers
vi.useFakeTimers();

describe('calculateDelay', () => {
  it('calculates exponential backoff correctly', () => {
    expect(calculateDelay(1, 1000, 10000, 2)).toBe(1000); // 1000 * 2^0
    expect(calculateDelay(2, 1000, 10000, 2)).toBe(2000); // 1000 * 2^1
    expect(calculateDelay(3, 1000, 10000, 2)).toBe(4000); // 1000 * 2^2
    expect(calculateDelay(4, 1000, 10000, 2)).toBe(8000); // 1000 * 2^3
  });

  it('respects maximum delay', () => {
    expect(calculateDelay(10, 1000, 5000, 2)).toBe(5000);
  });

  it('handles different backoff factors', () => {
    expect(calculateDelay(3, 1000, 10000, 3)).toBe(9000); // 1000 * 3^2
  });
});

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('succeeds on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await retryWithBackoff(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('success');

    const promise = retryWithBackoff(mockFn, {
      maxAttempts: 3,
      baseDelay: 100,
    });

    // Fast-forward through delays
    act(() => {
      vi.advanceTimersByTime(100); // First retry delay
    });
    
    act(() => {
      vi.advanceTimersByTime(200); // Second retry delay
    });

    const result = await promise;
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('does not retry on non-retryable errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Validation error'));
    
    await expect(retryWithBackoff(mockFn, {
      retryCondition: (error) => !error.message.includes('Validation'),
    })).rejects.toThrow('Validation error');
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('gives up after max attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network request failed'));
    
    const promise = retryWithBackoff(mockFn, {
      maxAttempts: 2,
      baseDelay: 100,
    });

    // Fast-forward through delay
    act(() => {
      vi.advanceTimersByTime(100);
    });

    await expect(promise).rejects.toThrow('Network request failed');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('calls onRetry callback', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    
    const promise = retryWithBackoff(mockFn, {
      baseDelay: 100,
      onRetry,
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    await promise;
    
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });
});

describe('useRetry', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useRetry());
    
    expect(result.current.attempt).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBe(null);
    expect(result.current.canRetry).toBe(true);
  });

  it('updates state during retry attempts', async () => {
    const { result } = renderHook(() => useRetry({
      baseDelay: 100,
      maxAttempts: 2,
    }));

    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValue('success');

    act(() => {
      result.current.retry(mockFn);
    });

    // Should be retrying initially
    expect(result.current.isRetrying).toBe(true);
    expect(result.current.attempt).toBe(0);

    // Fast-forward through delay
    await act(async () => {
      vi.advanceTimersByTime(100);
      await Promise.resolve(); // Allow promises to resolve
    });

    // Should have completed successfully
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBe(null);
    expect(result.current.canRetry).toBe(true);
  });

  it('updates state on final failure', async () => {
    const { result } = renderHook(() => useRetry({
      baseDelay: 100,
      maxAttempts: 2,
    }));

    const mockFn = vi.fn().mockRejectedValue(new Error('Network request failed'));

    let thrownError;
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      thrownError = error;
    }

    // Fast-forward through delay
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBeInstanceOf(Error);
    expect(result.current.attempt).toBe(2);
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useRetry());

    // Manually set some state
    act(() => {
      result.current.retry(() => Promise.reject(new Error('test')));
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.attempt).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBe(null);
    expect(result.current.canRetry).toBe(true);
  });
});

describe('createRetryConfig', () => {
  it('creates React Query compatible config', () => {
    const config = createRetryConfig({
      maxAttempts: 3,
      baseDelay: 1000,
    });

    expect(typeof config.retry).toBe('function');
    expect(typeof config.retryDelay).toBe('function');
  });

  it('retry function respects max attempts', () => {
    const config = createRetryConfig({ maxAttempts: 2 });
    
    expect(config.retry(0, new Error('Network request failed'))).toBe(true);
    expect(config.retry(1, new Error('Network request failed'))).toBe(true);
    expect(config.retry(2, new Error('Network request failed'))).toBe(false);
  });

  it('retry function uses retry condition', () => {
    const config = createRetryConfig({
      retryCondition: (error) => error.message.includes('retryable'),
    });
    
    expect(config.retry(0, new Error('retryable error'))).toBe(true);
    expect(config.retry(0, new Error('non-retryable error'))).toBe(false);
  });

  it('retryDelay function calculates correct delays', () => {
    const config = createRetryConfig({
      baseDelay: 1000,
      backoffFactor: 2,
    });
    
    expect(config.retryDelay(0)).toBe(1000);
    expect(config.retryDelay(1)).toBe(2000);
    expect(config.retryDelay(2)).toBe(4000);
  });
});

describe('graphqlRetryOptions', () => {
  it('does not retry authentication errors', () => {
    const authError = {
      graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }],
    };
    
    expect(graphqlRetryOptions.retryCondition!(authError)).toBe(false);
  });

  it('does not retry validation errors', () => {
    const validationError = {
      graphQLErrors: [{ extensions: { code: 'BAD_USER_INPUT' } }],
    };
    
    expect(graphqlRetryOptions.retryCondition!(validationError)).toBe(false);
  });

  it('retries network errors', () => {
    const networkError = { networkError: true };
    expect(graphqlRetryOptions.retryCondition!(networkError)).toBe(true);
  });

  it('retries server errors', () => {
    const serverError = {
      graphQLErrors: [{ extensions: { code: 'INTERNAL_ERROR' } }],
    };
    
    expect(graphqlRetryOptions.retryCondition!(serverError)).toBe(true);
  });

  it('retries timeout errors', () => {
    const timeoutError = { message: 'Request timeout' };
    expect(graphqlRetryOptions.retryCondition!(timeoutError)).toBe(true);
  });
});