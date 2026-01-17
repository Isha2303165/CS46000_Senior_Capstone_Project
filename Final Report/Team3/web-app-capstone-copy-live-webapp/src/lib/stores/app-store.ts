import { create } from 'zustand';

interface AppState {
  // UI State
  isMobileMenuOpen: boolean;
  isLoading: boolean;
  notifications: Notification[];
  
  // Settings
  theme: 'light' | 'dark' | 'system';
  notificationPreferences: {
    medications: boolean;
    appointments: boolean;
    messages: boolean;
    urgent: boolean;
  };
  
  // Actions
  setMobileMenuOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateNotificationPreferences: (preferences: Partial<AppState['notificationPreferences']>) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isMobileMenuOpen: false,
  isLoading: false,
  notifications: [],
  theme: 'system',
  notificationPreferences: {
    medications: true,
    appointments: true,
    messages: true,
    urgent: true,
  },

  // Actions
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50
    }));
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  setTheme: (theme) => set({ theme }),
  
  updateNotificationPreferences: (preferences) => set((state) => ({
    notificationPreferences: { ...state.notificationPreferences, ...preferences },
  })),
}));