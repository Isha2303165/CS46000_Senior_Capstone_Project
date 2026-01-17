import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';
import { useAuthStore } from '@/lib/stores/auth-store';

// Mock the auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockUseAuthStore = vi.mocked(useAuthStore);

describe('LoginForm', () => {
  const mockSignIn = vi.fn();
  const mockOnSwitchToSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn(),
      updateProfile: vi.fn(),
    });

    // Mock getState for checking authentication status
    mockUseAuthStore.getState = vi.fn().mockReturnValue({
      isAuthenticated: false,
    });
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your healthcare tracking account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows sign up link when onSwitchToSignUp is provided', () => {
    render(<LoginForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('validates email field', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password field', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123'); // Too short
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during sign in', () => {
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      isLoading: true,
      error: null,
      user: null,
      isAuthenticated: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(<LoginForm />);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('displays error message', () => {
    const errorMessage = 'Invalid credentials';
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
      error: errorMessage,
      user: null,
      isAuthenticated: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(<LoginForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByLabelText('Show password');

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('calls onSwitchToSignUp when sign up link is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

    const signUpLink = screen.getByRole('button', { name: 'Sign up' });
    await user.click(signUpLink);

    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
  });
});