'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  initializeAccessibility, 
  getFontSizePreference, 
  setFontSizePreference,
  announceToScreenReader 
} from '@/lib/accessibility';

interface AccessibilityContextType {
  fontSize: 'normal' | 'large' | 'extra-large';
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reducedMotion: boolean;
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [highContrast, setHighContrastState] = useState(false);
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    // Initialize accessibility features
    initializeAccessibility();
    
    // Set initial states
    setFontSizeState(getFontSizePreference());
    setHighContrastState(window.matchMedia('(prefers-contrast: high)').matches);
    setReducedMotionState(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    // Listen for system preference changes
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrastState(e.matches);
      document.documentElement.setAttribute('data-high-contrast', e.matches.toString());
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotionState(e.matches);
      document.documentElement.setAttribute('data-reduced-motion', e.matches.toString());
    };

    contrastMediaQuery.addEventListener('change', handleContrastChange);
    motionMediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastMediaQuery.removeEventListener('change', handleContrastChange);
      motionMediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const setFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    setFontSizeState(size);
    setFontSizePreference(size);
    announceMessage(`Font size changed to ${size}`);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    document.documentElement.setAttribute('data-high-contrast', enabled.toString());
    announceMessage(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
  };

  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  };

  const value: AccessibilityContextType = {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    announceMessage,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};