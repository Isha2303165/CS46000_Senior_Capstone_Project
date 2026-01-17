'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { MobileNavigation } from './mobile-navigation';
import { DesktopSidebar } from './desktop-sidebar';
import { Header } from './header';
import { ClearStorageButton } from '@/components/debug/clear-storage-button';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/', '/accept-invitation'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/accept-invitation/');

  useEffect(() => {

    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        if (!isAuthenticated && !isPublicRoute) {
          router.push('/login');
        } else if (isAuthenticated && pathname === '/') {
          router.push('/dashboard');
        }
      }
    }, 100); // Small delay to allow auth state to stabilize

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, pathname, isPublicRoute, router]);

  // Show loading while determining auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto loading-spinner"
            role="status"
            aria-label="Loading application"
          ></div>
          <p className="mt-2 text-gray-600" aria-live="polite">Loading...</p>
        </div>
      </div>
    );
  }

  // For public routes, render without navigation
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For authenticated routes, render with navigation
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <DesktopSidebar />
        <div className="flex-1 lg:pl-64 max-w-[-webkit-fill-available] max-w-[-moz-available]">
          <Header />
          <main
            id="main-content"
            className="py-6 px-4 sm:px-6 lg:px-8"
            role="main"
            aria-label="Main content"
            tabIndex={-1}
          >
            {children}
          </main>
          {/* Footer moved to RootLayout to show on public pages as well */}
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden">
        <Header />
        <main
          id="main-content"
          className="pb-20 pt-4 px-4 sm:px-6"
          role="main"
          aria-label="Main content"
          tabIndex={-1}
        >
          {children}
        </main>
        <MobileNavigation />
        {/* Footer moved to RootLayout to show on public pages as well */}
      </div>

      {/* Debug components */}
      {/* Auth debug removed */}
      <ClearStorageButton />

      {/* Offline sync indicator */}
      <OfflineIndicator />
    </div>
  );
}