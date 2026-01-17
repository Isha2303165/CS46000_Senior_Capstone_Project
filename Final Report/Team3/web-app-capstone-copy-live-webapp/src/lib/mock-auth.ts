// Mock authentication for development/testing purposes
// This allows testing the responsive layout without AWS Amplify setup

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'PRIMARY_CAREGIVER' | 'FAMILY_CAREGIVER' | 'PROFESSIONAL_CAREGIVER';
  createdAt: string;
}

const MOCK_USER: MockUser = {
  id: 'mock-user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'PRIMARY_CAREGIVER',
  createdAt: new Date().toISOString(),
};

// Mock authentication state
let isAuthenticated = false;
let currentUser: MockUser | null = null;

export const mockAuth = {
  // Sign in with mock credentials
  signIn: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Accept any email/password for demo purposes
    if (email && password) {
      isAuthenticated = true;
      currentUser = { ...MOCK_USER, email };
      return { user: currentUser };
    } else {
      throw new Error('Invalid credentials');
    }
  },

  // Sign up with mock data
  signUp: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: MockUser = {
      id: `mock-user-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role as MockUser['role'],
      createdAt: new Date().toISOString(),
    };
    
    isAuthenticated = true;
    currentUser = newUser;
    return { user: newUser };
  },

  // Sign out
  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    isAuthenticated = false;
    currentUser = null;
  },

  // Get current user
  getCurrentUser: async () => {
    if (isAuthenticated && currentUser) {
      return currentUser;
    }
    throw new Error('User not authenticated');
  },

  // Check if user is authenticated
  isAuthenticated: () => isAuthenticated,

  // Update user profile
  updateProfile: async (updates: Partial<Pick<MockUser, 'firstName' | 'lastName' | 'role'>>) => {
    if (!isAuthenticated || !currentUser) {
      throw new Error('User not authenticated');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    currentUser = { ...currentUser, ...updates };
    return currentUser;
  },
};

// Initialize with a logged-in state for demo purposes
// Remove this in production
if (typeof window !== 'undefined') {
  // Only run in browser
  const shouldAutoLogin = localStorage.getItem('mock-auto-login') !== 'false';
  if (shouldAutoLogin) {
    isAuthenticated = true;
    currentUser = MOCK_USER;
  }
}