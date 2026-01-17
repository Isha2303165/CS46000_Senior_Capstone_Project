'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Heart } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isOnline ? (
              <RefreshCw className="w-8 h-8 text-blue-600" />
            ) : (
              <WifiOff className="w-8 h-8 text-gray-600" />
            )}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {isOnline ? 'Connection Restored' : 'You\'re Offline'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isOnline
              ? 'Your internet connection has been restored. You can now access all features.'
              : 'Don\'t worry - you can still view cached client information and medication schedules.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOnline ? (
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload App
            </Button>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  Available Offline Features
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• View cached client information</li>
                  <li>• Check medication schedules</li>
                  <li>• Review appointment details</li>
                  <li>• Access emergency contacts</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-medium text-amber-900 mb-2">
                  Limited Functionality
                </h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Cannot sync new data</li>
                  <li>• Real-time messaging unavailable</li>
                  <li>• Cannot create new records</li>
                </ul>
              </div>
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                className="w-full"
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}