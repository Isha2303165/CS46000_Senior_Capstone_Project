'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';

export function ClearStorageButton() {
  const { signOut } = useAuthStore();

  const handleClearStorage = async () => {
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Sign out from Amplify
      await signOut();
      
      // Reload the page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={handleClearStorage}
        variant="destructive"
        size="sm"
      >
        Clear Storage & Re-login
      </Button>
    </div>
  );
}