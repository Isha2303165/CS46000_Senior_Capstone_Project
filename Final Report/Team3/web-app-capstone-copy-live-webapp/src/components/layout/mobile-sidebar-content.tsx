'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CalendarIcon, 
  MessageCircleIcon, 
  SettingsIcon,
  UsersIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect } from 'react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: UsersIcon,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: CalendarIcon,
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageCircleIcon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

export function MobileSidebarContent() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { profilePicture, initializeSettings } = useSettingsStore();
  
  // Initialize settings to load profile picture on mount
  useEffect(() => {
    if (user) {
      initializeSettings();
    }
  }, [user, initializeSettings]);

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Image src="/logo-square.png" alt="Levelup Meds logo" width={40} height={40} className="w-10 h-10" />
          <div>
            <SheetTitle className="text-left">Levelup Meds</SheetTitle>
            <p className="text-sm text-gray-500">Care platform</p>
          </div>
        </div>
      </SheetHeader>

      <nav className="flex-1 p-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                'min-h-[44px]', // Minimum touch target size
                isActive
                  ? 'bg-accent text-primary border border-border'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon 
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-gray-400'
                )} 
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={profilePicture || undefined} 
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role?.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}