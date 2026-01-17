'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Amplify } from 'aws-amplify';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AccessibilityProvider } from '@/components/accessibility/accessibility-provider';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { ToastProvider } from '@/components/ui/toast';
import { TranslationProvider } from '@/components/language/translation-context';
import amplifyconfig from '../../amplify_outputs.json';

Amplify.configure(amplifyconfig);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <TranslationProvider>
                {children}
              </TranslationProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </ToastProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
