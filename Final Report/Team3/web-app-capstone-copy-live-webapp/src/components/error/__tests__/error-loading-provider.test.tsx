import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { 
  ErrorLoadingProvider, 
  useErrorLoading, 
  WithErrorLoading,
  useSectionState,
  OfflineStatus,
  GlobalErrorDisplay
} from '../error-loading-provider';

import { vi } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/retry-mechanism', () => ({
  useRetry: () => ({
    retry: vi.fn().mockImplementation((fn) => fn()),
    retryState: {
      attempt: 0,
      isRetrying: false,
      lastError: null,
      canRetry: true,
    },
  }),
}));

vi.mock('@/lib/offline-handler', () => ({
  useOfflineHandler: () => ({
    isOnline: true,
    wasOffline: false,
    lastOnlineTime: new Date(),
    pendingActions: [],
    syncStatus: 'synced',
    addPendingAction: vi.fn(),
  }),
  OfflineIndicator: ({ offlineState }: any) => (
    <div data-testid="offline-indicator">
      {offlineState.isOnline ? 'Online' : 'Offline'}
    </div>
  ),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorLoadingProvider>{children}</ErrorLoadingProvider>
);

// Test component that uses the hook
const TestComponent: React.FC = () => {
  const { 
    showError, 
    clearError, 
    currentError, 
    setLoading, 
    isLoading, 
    loadingStates 
  } = useErrorLoading();

  return (
    <div>
      <div data-testid="current-error">
        {currentError ? currentError.error.message : 'No error'}
      </div>
      <div data-testid="loading-states">
        {JSON.stringify(loadingStates)}
      </div>
      <button onClick={() => showError(new Error('Test error'), 'Test context')}>
        Show Error
      </button>
      <button onClick={clearError}>Clear Error</button>
      <button onClick={() => setLoading('test-section', true)}>
        Set Loading
      </button>
      <button onClick={() => setLoading('test-section', false)}>
        Clear Loading
      </button>
      <div data-testid="is-loading">
        {isLoading('test-section') ? 'Loading' : 'Not Loading'}
      </div>
    </div>
  );
};

describe('ErrorLoadingProvider', () => {
  it('provides error and loading context', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('current-error')).toHaveTextContent('No error');
    expect(screen.getByTestId('loading-states')).toHaveTextContent('{}');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading');
  });

  it('handles error state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByTestId('current-error')).toHaveTextContent('Test error');

    fireEvent.click(screen.getByText('Clear Error'));
    expect(screen.getByTestId('current-error')).toHaveTextContent('No error');
  });

  it('handles loading state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Set Loading'));
    expect(screen.getByTestId('is-loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('loading-states')).toHaveTextContent('{"test-section":true}');

    fireEvent.click(screen.getByText('Clear Loading'));
    expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useErrorLoading());
    }).toThrow('useErrorLoading must be used within ErrorLoadingProvider');

    console.error = originalError;
  });
});

describe('WithErrorLoading', () => {
  const TestChild: React.FC = () => <div>Test content</div>;

  it('renders children when not loading', () => {
    render(
      <TestWrapper>
        <WithErrorLoading sectionName="test-section">
          <TestChild />
        </WithErrorLoading>
      </TestWrapper>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const LoadingTestComponent: React.FC = () => {
      const { setLoading } = useErrorLoading();
      
      React.useEffect(() => {
        setLoading('test-section', true);
      }, [setLoading]);

      return (
        <WithErrorLoading sectionName="test-section" skeletonType="generic">
          <TestChild />
        </WithErrorLoading>
      );
    };

    render(
      <TestWrapper>
        <LoadingTestComponent />
      </TestWrapper>
    );

    // Should not show the test content when loading
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('wraps children with error boundary', () => {
    const ErrorChild: React.FC = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <TestWrapper>
        <WithErrorLoading sectionName="test-section">
          <ErrorChild />
        </WithErrorLoading>
      </TestWrapper>
    );

    expect(screen.getByText('test-section Section Error')).toBeInTheDocument();

    console.error = originalError;
  });
});

describe('useSectionState', () => {
  const TestSectionComponent: React.FC<{ sectionName: string }> = ({ sectionName }) => {
    const { loading, setLoading, showError, handleAsyncOperation } = useSectionState(sectionName);

    const handleAsyncTest = async () => {
      try {
        await handleAsyncOperation(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'success';
        });
      } catch (error) {
        // Error handled by handleAsyncOperation
      }
    };

    return (
      <div>
        <div data-testid="section-loading">{loading ? 'Loading' : 'Not Loading'}</div>
        <button onClick={() => setLoading(true)}>Set Loading</button>
        <button onClick={() => showError(new Error('Section error'))}>Show Error</button>
        <button onClick={handleAsyncTest}>Async Operation</button>
      </div>
    );
  };

  it('manages section-specific loading state', () => {
    render(
      <TestWrapper>
        <TestSectionComponent sectionName="test-section" />
      </TestWrapper>
    );

    expect(screen.getByTestId('section-loading')).toHaveTextContent('Not Loading');

    fireEvent.click(screen.getByText('Set Loading'));
    expect(screen.getByTestId('section-loading')).toHaveTextContent('Loading');
  });

  it('handles async operations with loading state', async () => {
    render(
      <TestWrapper>
        <TestSectionComponent sectionName="test-section" />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Async Operation'));

    // Should briefly show loading state
    await waitFor(() => {
      expect(screen.getByTestId('section-loading')).toHaveTextContent('Not Loading');
    });
  });
});

describe('OfflineStatus', () => {
  it('renders offline indicator', () => {
    render(
      <TestWrapper>
        <OfflineStatus />
      </TestWrapper>
    );

    expect(screen.getByTestId('offline-indicator')).toHaveTextContent('Online');
  });
});

describe('GlobalErrorDisplay', () => {
  it('renders nothing when no error', () => {
    const { container } = render(
      <TestWrapper>
        <GlobalErrorDisplay />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays error when present', () => {
    const ErrorTriggerComponent: React.FC = () => {
      const { showError } = useErrorLoading();
      
      React.useEffect(() => {
        showError(new Error('Global error'), 'Global context');
      }, [showError]);

      return <GlobalErrorDisplay />;
    };

    render(
      <TestWrapper>
        <ErrorTriggerComponent />
      </TestWrapper>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText('Global error')).toBeInTheDocument();
  });

  it('clears error when retry is clicked', () => {
    const ErrorTriggerComponent: React.FC = () => {
      const { showError, currentError } = useErrorLoading();
      
      React.useEffect(() => {
        if (!currentError) {
          showError(new Error('Global error'), 'Global context');
        }
      }, [showError, currentError]);

      return (
        <div>
          <GlobalErrorDisplay />
          <div data-testid="error-state">
            {currentError ? 'Has Error' : 'No Error'}
          </div>
        </div>
      );
    };

    render(
      <TestWrapper>
        <ErrorTriggerComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('error-state')).toHaveTextContent('Has Error');

    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByTestId('error-state')).toHaveTextContent('No Error');
  });
});