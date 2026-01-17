'use client';

import React, { Component, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { logErrorToCloudWatch } from '@/lib/cloudwatch-logger';
import type { ClientDetailErrorBoundaryProps } from '@/types';

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ClientDetailErrorBoundary extends Component<ClientDetailErrorBoundaryProps, State> {
  constructor(props: ClientDetailErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `client_detail_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to CloudWatch with client context
    try {
      await logErrorToCloudWatch({
        error,
        errorInfo,
        errorId: this.state.errorId!,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userId: this.getCurrentUserId(),
        context: {
          component: 'ClientDetailPage',
          clientId: this.props.clientId,
          action: 'page_load',
        },
      });
    } catch (loggingError) {
      console.error('Failed to log client detail error to CloudWatch:', loggingError);
    }

    // Log to console for development
    console.error('Client Detail Page Error:', error, errorInfo, {
      clientId: this.props.clientId,
    });
  }

  private getCurrentUserId(): string | null {
    try {
      // Get current user from auth store or localStorage
      const currentUser = localStorage.getItem('healthcare_app_current_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.id || null;
      }
    } catch {
      // Ignore errors when getting user ID
    }
    return null;
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default client detail error UI
      return (
        <div className="max-w-4xl mx-auto p-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                 Unable to load client details
              </CardTitle>
              <CardDescription className="text-gray-600">
                 We encountered an error while loading the client information. 
                This issue has been reported to our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.errorId && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    Error ID: <code className="font-mono text-xs">{this.state.errorId}</code>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Client ID: <code className="font-mono text-xs">{this.props.clientId}</code>
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  Reload Page
                </Button>
                <Button
                  asChild
                  className="flex-1"
                >
                  <Link href="/clients">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Clients
                  </Link>
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withClientDetailErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  clientId: string,
  errorBoundaryProps?: Omit<ClientDetailErrorBoundaryProps, 'children' | 'clientId'>
) {
  const WrappedComponent = (props: P) => (
    <ClientDetailErrorBoundary clientId={clientId} {...errorBoundaryProps}>
      <Component {...props} />
    </ClientDetailErrorBoundary>
  );

  WrappedComponent.displayName = `withClientDetailErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}