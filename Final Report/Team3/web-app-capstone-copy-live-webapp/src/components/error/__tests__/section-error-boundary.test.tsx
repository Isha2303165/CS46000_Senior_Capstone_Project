import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SectionErrorBoundary, useSectionErrorBoundary } from '../section-error-boundary';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean; error?: Error }> = ({ 
  shouldThrow, 
  error = new Error('Test error') 
}) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

// Test component using the hook
const HookTestComponent: React.FC<{ sectionName: string }> = ({ sectionName }) => {
  const { error, resetError, captureError, hasError } = useSectionErrorBoundary(sectionName);

  return (
    <div>
      <div data-testid="error-status">{hasError ? 'Has Error' : 'No Error'}</div>
      <div data-testid="error-message">{error?.message || 'No message'}</div>
      <button onClick={() => captureError(new Error('Manual error'))}>
        Trigger Error
      </button>
      <button onClick={resetError}>Reset Error</button>
    </div>
  );
};

describe('SectionErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <SectionErrorBoundary sectionName="Test Section">
        <div>Test content</div>
      </SectionErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <SectionErrorBoundary sectionName="Test Section">
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(screen.getByText('Test Section Section Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong while loading the test section section/)).toBeInTheDocument();
  });

  it('displays retry button when showRetry is not false', () => {
    render(
      <SectionErrorBoundary sectionName="Test Section" showRetry={true}>
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('hides retry button when showRetry is false', () => {
    render(
      <SectionErrorBoundary sectionName="Test Section" showRetry={false}>
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    
    render(
      <SectionErrorBoundary sectionName="Test Section" onRetry={onRetry}>
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('resets error state when retry is clicked', () => {
    const TestComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <SectionErrorBoundary 
          sectionName="Test Section" 
          onRetry={() => setShouldThrow(false)}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </SectionErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Initially shows error
    expect(screen.getByText('Test Section Section Error')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText('Try Again'));

    // Should show content now
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>;

    render(
      <SectionErrorBoundary sectionName="Test Section" fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    expect(screen.queryByText('Test Section Section Error')).not.toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <SectionErrorBoundary sectionName="Test Section">
        <ThrowError shouldThrow={true} error={new Error('Detailed test error')} />
      </SectionErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('logs error to console with section context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    render(
      <SectionErrorBoundary sectionName="Test Section">
        <ThrowError shouldThrow={true} error={new Error('Test error')} />
      </SectionErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in Test Section section:',
      expect.any(Error),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });
});

describe('useSectionErrorBoundary', () => {
  it('initializes with no error', () => {
    render(<HookTestComponent sectionName="Test" />);

    expect(screen.getByTestId('error-status')).toHaveTextContent('No Error');
    expect(screen.getByTestId('error-message')).toHaveTextContent('No message');
  });

  it('captures and displays error', () => {
    render(<HookTestComponent sectionName="Test" />);

    fireEvent.click(screen.getByText('Trigger Error'));

    expect(screen.getByTestId('error-status')).toHaveTextContent('Has Error');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Manual error');
  });

  it('resets error state', () => {
    render(<HookTestComponent sectionName="Test" />);

    // Trigger error
    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByTestId('error-status')).toHaveTextContent('Has Error');

    // Reset error
    fireEvent.click(screen.getByText('Reset Error'));
    expect(screen.getByTestId('error-status')).toHaveTextContent('No Error');
    expect(screen.getByTestId('error-message')).toHaveTextContent('No message');
  });

  it('logs error with section name', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    render(<HookTestComponent sectionName="Test Section" />);
    fireEvent.click(screen.getByText('Trigger Error'));

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in Test Section section:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});