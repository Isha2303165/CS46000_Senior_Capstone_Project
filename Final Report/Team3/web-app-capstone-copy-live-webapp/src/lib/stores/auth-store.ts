import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signIn, signUp, signOut, getCurrentUser as amplifyGetCurrentUser, fetchUserAttributes, updateUserAttributes, confirmSignUp, resendSignUpCode, fetchAuthSession } from 'aws-amplify/auth';
import type { AuthUser } from 'aws-amplify/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PRIMARY_CAREGIVER' | 'FAMILY_CAREGIVER' | 'PROFESSIONAL_CAREGIVER';
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingConfirmation: string | null; // Email waiting for confirmation
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPendingConfirmation: (email: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ needsConfirmation?: boolean }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ needsConfirmation?: boolean }>;
  confirmSignUp: (email: string, confirmationCode: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'role'>>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pendingConfirmation: null,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setPendingConfirmation: (email) => set({ pendingConfirmation: email }),
      
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const result = await signIn({ username: email, password });
          
          if (result.isSignedIn) {
            await get().getCurrentUser();
            return {};
          } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
            set({ 
              isLoading: false,
              pendingConfirmation: email,
              error: 'Please check your email and confirm your account before signing in.'
            });
            return { needsConfirmation: true };
          } else {
            set({ isLoading: false });
            return {};
          }
        } catch (error) {
          console.error('Sign in error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sign in',
            isLoading: false 
          });
          return {};
        }
      },

      signUp: async (email: string, password: string, firstName: string, lastName: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const result = await signUp({
            username: email,
            password,
            options: {
              userAttributes: {
                email,
                given_name: firstName,
                family_name: lastName,
                'custom:role': 'PRIMARY_CAREGIVER'
              }
            }
          });
          
          
          if (!result.isSignUpComplete && result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
            set({ 
              isLoading: false,
              pendingConfirmation: email
            });
            return { needsConfirmation: true };
          } else {
            set({ isLoading: false });
            return {};
          }
        } catch (error) {
          console.error('Sign up error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sign up',
            isLoading: false 
          });
          return {};
        }
      },
      
      confirmSignUp: async (email: string, confirmationCode: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await confirmSignUp({
            username: email,
            confirmationCode
          });
          
          set({ 
            isLoading: false,
            pendingConfirmation: null,
            error: null
          });
        } catch (error) {
          console.error('Confirm sign up error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to confirm account',
            isLoading: false 
          });
        }
      },
      
      resendConfirmationCode: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await resendSignUpCode({ username: email });
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Resend confirmation code error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to resend confirmation code',
            isLoading: false 
          });
        }
      },
      
      signOut: async () => {
        try {
          set({ isLoading: true });
          await signOut();
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null,
            isLoading: false,
            pendingConfirmation: null
          });
        } catch (error) {
          console.error('Sign out error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sign out',
            isLoading: false 
          });
        }
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true });
          
          // Add a small delay to prevent race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // First check if user is authenticated without throwing errors
          const session = await fetchAuthSession();
          
          if (!session.tokens?.accessToken) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: null 
            });
            return;
          }
          
          const authUser: AuthUser = await amplifyGetCurrentUser();
          
          const attributes = await fetchUserAttributes();
          
          const user: User = {
            id: authUser.userId,
            email: attributes.email || '',
            firstName: attributes.given_name || '',
            lastName: attributes.family_name || '',
            role: (attributes['custom:role'] as User['role']) || 'PRIMARY_CAREGIVER',
            profilePicture: attributes.picture || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Ensure UserProfile exists in the database
          try {
            const { client } = await import('@/lib/graphql-client');
            
            // Check if UserProfile exists (we use Cognito userId as the model id)
            const existingProfile = await client.models.UserProfile.get({ id: authUser.userId });
            
            if (!existingProfile.data) {
              // Create UserProfile if it doesn't exist
              const profileData = {
                id: authUser.userId, // ensure model id matches Cognito user id
                userId: authUser.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role === 'PRIMARY_CAREGIVER' ? 'primary' : 'family',
                isActive: true,
              } as const;
              
              const createResult = await client.models.UserProfile.create(profileData);
              
              if (createResult.errors) {
                console.error('UserProfile creation errors:', createResult.errors);
              } else {
              }
            } else {
            }
          } catch (profileError) {
            console.error('Error handling UserProfile:', profileError);
            // Don't fail the auth process if UserProfile creation fails
          }
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Get current user error:', error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null // Don't show error for unauthenticated state
          });
        }
      },

      updateProfile: async (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'role'>>) => {
        try {
          set({ isLoading: true, error: null });
          
          const attributeUpdates: Record<string, string> = {};
          
          if (updates.firstName !== undefined) {
            attributeUpdates.given_name = updates.firstName;
          }
          if (updates.lastName !== undefined) {
            attributeUpdates.family_name = updates.lastName;
          }
          if (updates.role !== undefined) {
            attributeUpdates['custom:role'] = updates.role;
          }
          
          await updateUserAttributes({ userAttributes: attributeUpdates });
          
          // Refresh user data
          await get().getCurrentUser();
        } catch (error) {
          console.error('Update profile error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update profile',
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'healthcare-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        pendingConfirmation: state.pendingConfirmation
      }),
    }
  )
);