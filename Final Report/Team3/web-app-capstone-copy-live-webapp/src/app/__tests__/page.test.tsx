import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import Home from '../page';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

describe('Landing Page', () => {
  const mockPush = vi.fn();
  const mockUseRouter = useRouter as vi.MockedFunction<typeof useRouter>;
  const mockUseAuthStore = useAuthStore as vi.MockedFunction<typeof useAuthStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    expect(screen.getByRole('status', { name: /loading application/i })).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects authenticated users to dashboard', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders landing page for unauthenticated users', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    // Check hero section
    expect(screen.getByText('Coordinate Care with')).toBeInTheDocument();
    expect(screen.getByText('Confidence & Clarity')).toBeInTheDocument();
    expect(screen.getByText(/comprehensive healthcare tracking app/i)).toBeInTheDocument();

    // Check navigation
    expect(screen.getAllByText('Levelup Meds')).toHaveLength(2); // Header and footer
    expect(screen.getAllByText('Features')).toHaveLength(2); // Header and footer
    expect(screen.getAllByText('How It Works')).toHaveLength(2); // Header and footer
    expect(screen.getAllByText('Testimonials')).toHaveLength(2); // Header and footer
  });

  it('does not display removed trust indicators or trust badge', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    expect(screen.queryByText('HIPAA Compliant')).not.toBeInTheDocument();
    expect(screen.queryByText('Bank-Level Security')).not.toBeInTheDocument();
    expect(screen.queryByText('24/7 Support')).not.toBeInTheDocument();
    // Trust badge removed
    expect(screen.queryByText('Trusted by 10,000+ Caregivers')).not.toBeInTheDocument();
  });

  it('renders all feature cards', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    // Check feature cards
    expect(screen.getByText('Multi-Caregiver Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Medication Management')).toBeInTheDocument();
    expect(screen.getByText('Appointment Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Communication')).toBeInTheDocument();
    expect(screen.getByText('Mobile-First Design')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
  });

  it('renders how it works section with steps', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    expect(screen.getByText('Simple Steps to Better Care Coordination')).toBeInTheDocument();
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByText('Add Clients & Invite Caregivers')).toBeInTheDocument();
    expect(screen.getByText('Start Coordinating Care')).toBeInTheDocument();

    // Check step numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not render testimonials section after removal', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    expect(screen.queryByText('Trusted by Caregivers Everywhere')).not.toBeInTheDocument();
  });

  it('handles navigation to register page', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    const getStartedButtons = screen.getAllByText('Get Started');
    fireEvent.click(getStartedButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/register');
  });

  it('handles navigation to login page', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    const signInButtons = screen.getAllByText('Sign In');
    fireEvent.click(signInButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('handles CTA button clicks', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    // Test "Start Free Today" button
    const startFreeButton = screen.getByText('Start Free Today');
    fireEvent.click(startFreeButton);
    expect(mockPush).toHaveBeenCalledWith('/register');

    // Test primary CTA button now labeled "Get Started"
    const freeTrialButton = screen.getAllByText('Get Started')[0];
    fireEvent.click(freeTrialButton);
    expect(mockPush).toHaveBeenCalledWith('/register');
  });

  it('renders footer with proper links', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    expect(screen.getByText('© 2024 Levelup Meds. All rights reserved.')).toBeInTheDocument();
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    // Check main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check navigation
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check buttons have proper accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });

    // Check headings hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4); // Multiple h2s
  });

  it('displays proper semantic HTML structure', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(<Home />);

    // Check semantic sections
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
  });
});