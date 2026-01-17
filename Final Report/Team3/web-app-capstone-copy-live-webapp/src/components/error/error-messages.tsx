import React from 'react';
import { AlertTriangle, Wifi, RefreshCw, Clock, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ErrorMessageProps {
  error: Error | any;
  onRetry?: () => void;
  onRefresh?: () => void;
  onGoBack?: () => void;
  context?: string;
  className?: string;
}

/**
 * Determine error type and appropriate message
 */
export const getErrorInfo = (error: any) => {
  // Network/Connection errors
  if (error?.networkError || error?.message?.includes('Network request failed')) {
    return {
      type: 'network',
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection.',
      icon: Wifi,
      color: 'orange',
      canRetry: true,
      canRefresh: true,
    };
  }

  // Timeout errors
  if (error?.message?.includes('timeout')) {
    return {
      type: 'timeout',
      title: 'Request Timeout',
      message: 'The request took too long to complete. This might be due to a slow connection.',
      icon: Clock,
      color: 'yellow',
      canRetry: true,
      canRefresh: true,
    };
  }

  // Authentication errors
  if (error?.graphQLErrors?.some((e: any) => 
    e.extensions?.code === 'UNAUTHENTICATED' || 
    e.extensions?.code === 'FORBIDDEN'
  )) {
    return {
      type: 'auth',
      title: 'Authentication Required',
      message: 'Your session has expired. Please log in again to continue.',
      icon: Shield,
      color: 'red',
      canRetry: false,
      canRefresh: false,
      actionText: 'Log In',
      actionUrl: '/login',
    };
  }

  // Validation errors
  if (error?.graphQLErrors?.some((e: any) => 
    e.extensions?.code === 'BAD_USER_INPUT'
  )) {
    const validationError = error.graphQLErrors.find((e: any) => 
      e.extensions?.code === 'BAD_USER_INPUT'
    );
    return {
      type: 'validation',
      title: 'Invalid Input',
      message: validationError?.message || 'Please check your input and try again.',
      icon: AlertTriangle,
      color: 'red',
      canRetry: false,
      canRefresh: false,
    };
  }

  // Server errors
  if (error?.graphQLErrors?.some((e: any) => 
    e.extensions?.code === 'INTERNAL_ERROR'
  )) {
    return {
      type: 'server',
      title: 'Server Error',
      message: 'Something went wrong on our end. Our team has been notified.',
      icon: Database,
      color: 'red',
      canRetry: true,
      canRefresh: true,
    };
  }

  // Generic error
  return {
    type: 'generic',
    title: 'Something Went Wrong',
    message: error?.message || 'An unexpected error occurred. Please try again.',
    icon: AlertTriangle,
    color: 'red',
    canRetry: true,
    canRefresh: true,
  };
};

/**
 * Main error message component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onRefresh,
  onGoBack,
  context,
  className = '',
}) => {
  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: 'text-red-500',
          button: 'border-red-300 text-red-700 hover:bg-red-100',
        };
      case 'orange':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          icon: 'text-orange-500',
          button: 'border-orange-300 text-orange-700 hover:bg-orange-100',
        };
      case 'yellow':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          icon: 'text-yellow-500',
          button: 'border-yellow-300 text-yellow-700 hover:bg-yellow-100',
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          icon: 'text-gray-500',
          button: 'border-gray-300 text-gray-700 hover:bg-gray-100',
        };
    }
  };

  const colors = getColorClasses(errorInfo.color);

  return (
    <Card className={`${colors.border} ${colors.bg} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${colors.text}`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
          {errorInfo.title}
          {context && <span className="text-sm font-normal">in {context}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${colors.text} mb-4`}>
          {errorInfo.message}
        </p>

        {/* Development error details */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-4">
            <summary className={`text-xs ${colors.text} cursor-pointer opacity-75`}>
              Error Details (Development)
            </summary>
            <pre className={`text-xs ${colors.text} mt-2 p-2 ${colors.bg} rounded overflow-auto opacity-75`}>
              {error.message}
              {error.stack && `\n${error.stack}`}
              {error.graphQLErrors && `\nGraphQL Errors: ${JSON.stringify(error.graphQLErrors, null, 2)}`}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {errorInfo.canRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className={colors.button}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}

          {errorInfo.canRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className={colors.button}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}

          {errorInfo.actionText && errorInfo.actionUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = errorInfo.actionUrl!}
              className={colors.button}
            >
              {errorInfo.actionText}
            </Button>
          )}

          {onGoBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoBack}
              className={`${colors.text} hover:${colors.bg}`}
            >
              Go Back
            </Button>
          )}

          {!errorInfo.canRetry && !errorInfo.canRefresh && !errorInfo.actionUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className={`${colors.text} hover:${colors.bg}`}
            >
              Refresh Page
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Inline error message for smaller spaces
 */
export const InlineErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  context,
  className = '',
}) => {
  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;

  return (
    <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <Icon className="h-4 w-4 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-700">
          {context && <span className="font-medium">{context}: </span>}
          {errorInfo.message}
        </p>
      </div>
      {errorInfo.canRetry && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-red-700 hover:bg-red-100 flex-shrink-0"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

/**
 * Toast error message
 */
export const ToastErrorMessage: React.FC<{
  error: any;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  const errorInfo = getErrorInfo(error);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <p className="font-medium text-sm">{errorInfo.title}</p>
        <p className="text-xs opacity-90">{errorInfo.message}</p>
      </div>
      {errorInfo.canRetry && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-white hover:bg-white/20"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

/**
 * Error boundary fallback with context
 */
export const ErrorBoundaryFallback: React.FC<{
  error: Error;
  resetError: () => void;
  context?: string;
}> = ({ error, resetError, context }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <ErrorMessage
        error={error}
        onRetry={resetError}
        onRefresh={() => window.location.reload()}
        context={context}
        className="max-w-md"
      />
    </div>
  );
};