'use client';

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

function PageErrorFallback({ pageName, onRetry }: { pageName?: string; onRetry: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {pageName ? `Error loading ${pageName}` : 'Page Error'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            We encountered an error loading this page. Please try again or return to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  const [retry, setRetry] = React.useState(0);

  return (
    <ErrorBoundary
      key={retry}
      fallback={
        <PageErrorFallback 
          pageName={pageName} 
          onRetry={() => setRetry(r => r + 1)}
        />
      }
      onError={(error, errorInfo) => {
        console.error(`Page error in ${pageName || 'unknown page'}:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping page components
export function withPageErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  pageName?: string
) {
  const WrappedComponent = (props: P) => (
    <PageErrorBoundary pageName={pageName}>
      <Component {...props} />
    </PageErrorBoundary>
  );

  WrappedComponent.displayName = `withPageErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}