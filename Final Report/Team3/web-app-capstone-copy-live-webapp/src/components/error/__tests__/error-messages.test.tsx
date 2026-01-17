import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { 
  ErrorMessage, 
  InlineErrorMessage, 
  ToastErrorMessage, 
  ErrorBoundaryFallback,
  getErrorInfo 
} from '../error-messages';

describe('getErrorInfo', () => {
  it('identifies network errors', () => {
    const networkError = { networkError: true };
    const info = getErrorInfo(networkError);
    
    expect(info.type).toBe('network');
    expect(info.title).toBe('Connection Problem');
    expect(info.canRetry).toBe(true);
  });

  it('identifies timeout errors', () => {
    const timeoutError = { message: 'Request timeout occurred' };
    const info = getErrorInfo(timeoutError);
    
    expect(info.type).toBe('timeout');
    expect(info.title).toBe('Request Timeout');
    expect(info.canRetry).toBe(true);
  });

  it('identifies authentication errors', () => {
    const authError = {
      graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }],
    };
    const info = getErrorInfo(authError);
    
    expect(info.type).toBe('auth');
    expect(info.title).toBe('Authentication Required');
    expect(info.canRetry).toBe(false);
    expect(info.actionText).toBe('Log In');
    expect(info.actionUrl).toBe('/login');
  });

  it('identifies validation errors', () => {
    const validationError = {
      graphQLErrors: [{ 
        extensions: { code: 'BAD_USER_INPUT' },
        message: 'Invalid email format'
      }],
    };
    const info = getErrorInfo(validationError);
    
    expect(info.type).toBe('validation');
    expect(info.title).toBe('Invalid Input');
    expect(info.message).toBe('Invalid email format');
    expect(info.canRetry).toBe(false);
  });

  it('identifies server errors', () => {
    const serverError = {
      graphQLErrors: [{ extensions: { code: 'INTERNAL_ERROR' } }],
    };
    const info = getErrorInfo(serverError);
    
    expect(info.type).toBe('server');
    expect(info.title).toBe('Server Error');
    expect(info.canRetry).toBe(true);
  });

  it('handles generic errors', () => {
    const genericError = new Error('Something went wrong');
    const info = getErrorInfo(genericError);
    
    expect(info.type).toBe('generic');
    expect(info.title).toBe('Something Went Wrong');
    expect(info.message).toBe('Something went wrong');
    expect(info.canRetry).toBe(true);
  });
});

describe('ErrorMessage', () => {
  it('renders error title and message', () => {
    const error = new Error('Test error message');
    
    render(<ErrorMessage error={error} />);
    
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays context when provided', () => {
    const error = new Error('Test error');
    
    render(<ErrorMessage error={error} context="Medications Section" />);
    
    expect(screen.getByText(/in Medications Section/)).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    const error = { networkError: true };
    const onRetry = vi.fn();
    
    render(<ErrorMessage error={error} onRetry={onRetry} />);
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const error = { networkError: true };
    const onRetry = vi.fn();
    
    render(<ErrorMessage error={error} onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows refresh button when onRefresh is provided', () => {
    const error = new Error('Test error');
    const onRefresh = vi.fn();
    
    render(<ErrorMessage error={error} onRefresh={onRefresh} />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('shows go back button when onGoBack is provided', () => {
    const error = new Error('Test error');
    const onGoBack = vi.fn();
    
    render(<ErrorMessage error={error} onGoBack={onGoBack} />);
    
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('shows action button for auth errors', () => {
    const authError = {
      graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }],
    };
    
    render(<ErrorMessage error={authError} />);
    
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('hides retry button for non-retryable errors', () => {
    const validationError = {
      graphQLErrors: [{ extensions: { code: 'BAD_USER_INPUT' } }],
    };
    
    render(<ErrorMessage error={validationError} onRetry={vi.fn()} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Test error with stack');
    error.stack = 'Error stack trace';
    
    render(<ErrorMessage error={error} />);
    
    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('applies custom className', () => {
    const error = new Error('Test error');
    
    const { container } = render(
      <ErrorMessage error={error} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('InlineErrorMessage', () => {
  it('renders compact error message', () => {
    const error = new Error('Inline error message');
    
    render(<InlineErrorMessage error={error} />);
    
    expect(screen.getByText('Inline error message')).toBeInTheDocument();
  });

  it('displays context prefix', () => {
    const error = new Error('Test error');
    
    render(<InlineErrorMessage error={error} context="Loading data" />);
    
    expect(screen.getByText(/Loading data:/)).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    const error = { networkError: true };
    const onRetry = vi.fn();
    
    render(<InlineErrorMessage error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button for non-retryable errors', () => {
    const validationError = {
      graphQLErrors: [{ extensions: { code: 'BAD_USER_INPUT' } }],
    };
    
    render(<InlineErrorMessage error={validationError} onRetry={vi.fn()} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ToastErrorMessage', () => {
  it('renders error title and message', () => {
    const error = new Error('Toast error message');
    
    render(<ToastErrorMessage error={error} />);
    
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText('Toast error message')).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    const error = { networkError: true };
    const onRetry = vi.fn();
    
    render(<ToastErrorMessage error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorBoundaryFallback', () => {
  it('renders error message with reset functionality', () => {
    const error = new Error('Boundary error');
    const resetError = vi.fn();
    
    render(
      <ErrorBoundaryFallback 
        error={error} 
        resetError={resetError}
        context="Test Component"
      />
    );
    
    expect(screen.getByText('Boundary error')).toBeInTheDocument();
    expect(screen.getByText(/Test Component/)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(resetError).toHaveBeenCalledTimes(1);
  });

  it('provides refresh page option', () => {
    const error = new Error('Boundary error');
    const resetError = vi.fn();
    
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });
    
    render(
      <ErrorBoundaryFallback 
        error={error} 
        resetError={resetError}
      />
    );
    
    fireEvent.click(screen.getByText('Refresh'));
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});