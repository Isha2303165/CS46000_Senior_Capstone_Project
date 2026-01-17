'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvitations } from '@/hooks/use-invitations';
import Image from 'next/image'
import { 
  MenuIcon, 
  BellIcon, 
  UserIcon,
  LogOutIcon,
  SettingsIcon
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MobileSidebarContent } from './mobile-sidebar-content';

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { data: invitations } = useInvitations();
  
  const unreadNotifications = invitations?.filter(inv => inv.status === 'pending').length || 0;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button and logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile sidebar trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <MobileSidebarContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo for mobile/tablet */}
          <div className="flex items-center space-x-2 lg:hidden">
            <Image src="/logo-square.png" alt="Levelup Meds logo" width={32} height={32} className="h-8 w-8 animate-scaleIn" />
            <span className="font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text">Levelup Meds</span>
          </div>

          {/* Page title for desktop */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text animate-slideIn">
              Levelup Meds
            </h1>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                <BellIcon className="h-5 w-5" />
                <span className="sr-only">View notifications</span>
                {/* Notification badge */}
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center animate-bounceIn shadow-md">
                    <span className="text-xs text-white font-medium">{unreadNotifications}</span>
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {unreadNotifications === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">You have {unreadNotifications} pending invitation{unreadNotifications !== 1 ? 's' : ''}</p>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        router.push('/settings');
                        setIsNotificationOpen(false);
                      }}
                    >
                      View Invitations
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* User menu */}
          <Sheet open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <UserIcon className="h-5 w-5" />
                <span className="sr-only">Open user menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Account Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {/* User info */}
                {user && (
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-semibold">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Menu items */}
                <div className="space-y-2">
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/settings');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}