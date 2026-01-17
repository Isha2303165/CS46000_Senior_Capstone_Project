'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSettingsStore } from '@/lib/stores/settings-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { getCurrentUser, isAuthenticated, user, isLoading } = useAuthStore();
  const { initializeSettings } = useSettingsStore();

  useEffect(() => {
    
    // Always try to get current user on mount to ensure fresh auth state
    getCurrentUser();
  }, [getCurrentUser]);
  
  // Initialize settings (including profile picture) when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      initializeSettings();
    }
  }, [isAuthenticated, user, isLoading, initializeSettings]);

  return <>{children}</>;
}