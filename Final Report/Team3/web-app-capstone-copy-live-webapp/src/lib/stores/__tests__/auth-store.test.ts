import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '../auth-store';
import * as amplifyAuth from 'aws-amplify/auth';

// Mock AWS Amplify auth functions
vi.mock('aws-amplify/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  fetchUserAttributes: vi.fn(),
  updateUserAttributes: vi.fn(),
}));

const mockSignIn = vi.mocked(amplifyAuth.signIn);
const mockSignUp = vi.mocked(amplifyAuth.signUp);
const mockSignOut = vi.mocked(amplifyAuth.signOut);
const mockGetCurrentUser = vi.mocked(amplifyAuth.getCurrentUser);
const mockFetchUserAttributes = vi.mocked(amplifyAuth.fetchUserAttributes);
const mockUpdateUserAttributes = vi.mocked(amplifyAuth.updateUserAttributes);

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockUser = {
        userId: 'test-user-id',
      };
      const mockAttributes = {
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        'custom:role': 'PRIMARY_CAREGIVER',
      };

      mockSignIn.mockResolvedValue({ isSignedIn: true } as any);
      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockFetchUserAttributes.mockResolvedValue(mockAttributes);

      const { signIn } = useAuthStore.getState();
      await signIn('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PRIMARY_CAREGIVER',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(state.error).toBe(null);
    });

    it('should handle sign in error', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignIn.mockRejectedValue(new Error(errorMessage));

      const { signIn } = useAuthStore.getState();
      await signIn('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      mockSignUp.mockResolvedValue({} as any);

      const { signUp } = useAuthStore.getState();
      await signUp('test@example.com', 'password123', 'John', 'Doe');

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      
      expect(mockSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
        options: {
          userAttributes: {
            email: 'test@example.com',
            given_name: 'John',
            family_name: 'Doe',
            'custom:role': 'PRIMARY_CAREGIVER',
          },
        },
      });
    });

    it('should handle sign up error', async () => {
      const errorMessage = 'User already exists';
      mockSignUp.mockRejectedValue(new Error(errorMessage));

      const { signUp } = useAuthStore.getState();
      await signUp('test@example.com', 'password123', 'John', 'Doe');

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PRIMARY_CAREGIVER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isAuthenticated: true,
      });

      mockSignOut.mockResolvedValue();

      const { signOut } = useAuthStore.getState();
      await signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
      expect(state.isLoading).toBe(false);
    });

    it('should handle sign out error', async () => {
      const errorMessage = 'Sign out failed';
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      const { signOut } = useAuthStore.getState();
      await signOut();

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        userId: 'test-user-id',
      };
      const mockAttributes = {
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        'custom:role': 'PRIMARY_CAREGIVER',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockFetchUserAttributes.mockResolvedValue(mockAttributes);

      const { getCurrentUser } = useAuthStore.getState();
      await getCurrentUser();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PRIMARY_CAREGIVER',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(state.error).toBe(null);
    });

    it('should handle unauthenticated user', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('User not authenticated'));

      const { getCurrentUser } = useAuthStore.getState();
      await getCurrentUser();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null); // Should not show error for unauthenticated state
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        userId: 'test-user-id',
      };
      const mockAttributes = {
        email: 'test@example.com',
        given_name: 'Jane',
        family_name: 'Smith',
        'custom:role': 'FAMILY_CAREGIVER',
      };

      mockUpdateUserAttributes.mockResolvedValue();
      mockGetCurrentUser.mockResolvedValue(mockUser as any);
      mockFetchUserAttributes.mockResolvedValue(mockAttributes);

      const { updateProfile } = useAuthStore.getState();
      await updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'FAMILY_CAREGIVER',
      });

      expect(mockUpdateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          given_name: 'Jane',
          family_name: 'Smith',
          'custom:role': 'FAMILY_CAREGIVER',
        },
      });

      const state = useAuthStore.getState();
      expect(state.user?.firstName).toBe('Jane');
      expect(state.user?.lastName).toBe('Smith');
      expect(state.user?.role).toBe('FAMILY_CAREGIVER');
    });

    it('should handle update profile error', async () => {
      const errorMessage = 'Update failed';
      mockUpdateUserAttributes.mockRejectedValue(new Error(errorMessage));

      const { updateProfile } = useAuthStore.getState();
      await updateProfile({ firstName: 'Jane' });

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('state management', () => {
    it('should set loading state correctly', () => {
      const { setLoading } = useAuthStore.getState();
      setLoading(true);

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set error state correctly', () => {
      const { setError } = useAuthStore.getState();
      setError('Test error');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Test error');
    });

    it('should set user state correctly', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PRIMARY_CAREGIVER' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { setUser } = useAuthStore.getState();
      setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);
    });
  });
});