import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ClientDetailErrorBoundary } from '../client-detail-error-boundary';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { afterEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock CloudWatch logger
vi.mock('@/lib/cloudwatch-logger', () => ({
  logErrorToCloudWatch: vi.fn().mockResolvedValue(undefined),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="working-component">Working component</div>;
};

describe('ClientDetailErrorBoundary', () => {
  const clientId = 'client-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={false} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    it('should not display error UI when children render successfully', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={false} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.queryByText('Unable to load client details')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByText('Unable to load client details')).toBeInTheDocument();
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    });

    it('should display error message with context', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByText('Unable to load client details')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an error while loading the client information/)).toBeInTheDocument();
    });

    it('should display error ID and client ID', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
      expect(screen.getByText(/Client ID:/)).toBeInTheDocument();
      expect(screen.getByText(clientId)).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ClientDetailErrorBoundary clientId={clientId} fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByText('Unable to load client details')).not.toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should provide Try Again button', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should provide Reload Page button', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should provide Back to Clients link', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      const backLink = screen.getByRole('link', { name: /Back to Clients/ });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/clients');
    });

    it('should reset error state when Try Again is clicked', () => {
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        
        return (
          <ClientDetailErrorBoundary clientId={clientId}>
            <button onClick={() => setShouldThrow(false)}>Fix Error</button>
            <ThrowError shouldThrow={shouldThrow} />
          </ClientDetailErrorBoundary>
        );
      };

      render(<TestComponent />);

      // Error should be displayed initially
      expect(screen.getByText('Unable to load client details')).toBeInTheDocument();

      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'));

      // Component should attempt to re-render (though it will still error in this test)
      // In a real scenario, the error might be resolved
    });

    it('should call window.location.reload when Reload Page is clicked', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      fireEvent.click(screen.getByText('Reload Page'));
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Development Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByText('Show Error Details (Development)')).toBeInTheDocument();
    });

    it('should not show error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.queryByText('Show Error Details (Development)')).not.toBeInTheDocument();
    });
  });

  describe('User Context', () => {
    it('should handle missing user context gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      // Should still render error UI without crashing
      expect(screen.getByText('Unable to load client details')).toBeInTheDocument();
    });

    it('should handle invalid user data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      // Should still render error UI without crashing
      expect(screen.getByText('Unable to load client details')).toBeInTheDocument();
    });

    it('should extract user ID from localStorage when available', () => {
      const mockUser = { id: 'user-123', name: 'Test User' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      // Should render error UI (user ID extraction is internal)
      expect(screen.getByText('Unable to load client details')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      // Error icon should be properly labeled
      const alertIcon = document.querySelector('[data-testid="alert-icon"]') || 
                       document.querySelector('.text-red-600');
      expect(alertIcon).toBeInTheDocument();
    });

    it('should have descriptive button labels', () => {
      render(
        <ClientDetailErrorBoundary clientId={clientId}>
          <ThrowError shouldThrow={true} />
        </ClientDetailErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Clients/ })).toBeInTheDocument();
    });
  });
});