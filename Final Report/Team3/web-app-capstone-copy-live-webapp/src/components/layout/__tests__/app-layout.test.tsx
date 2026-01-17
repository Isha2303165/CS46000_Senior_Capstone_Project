import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AppLayout } from '../app-layout';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock child components to avoid complex rendering
vi.mock('../mobile-navigation', () => ({
  MobileNavigation: () => <div data-testid="mobile-navigation">Mobile Navigation</div>,
}));

vi.mock('../desktop-sidebar', () => ({
  DesktopSidebar: () => <div data-testid="desktop-sidebar">Desktop Sidebar</div>,
}));

vi.mock('../header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

describe('AppLayout', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
    
    mockPush.mockClear();
  });

  it('shows loading state when auth is loading', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders public routes without navigation', () => {
    vi.mocked(usePathname).mockReturnValue('/login');
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <AppLayout>
        <div>Login Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Login Content')).toBeInTheDocument();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument();
  });

  it('renders authenticated layout with navigation components', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'PRIMARY_CAREGIVER' },
    });

    render(
      <AppLayout>
        <div>Dashboard Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <AppLayout>
        <div>Dashboard Content</div>
      </AppLayout>
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('redirects authenticated users from root to dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'PRIMARY_CAREGIVER' },
    });

    render(
      <AppLayout>
        <div>Root Content</div>
      </AppLayout>
    );

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});