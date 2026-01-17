'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CalendarIcon,
  MessageCircleIcon,
  SettingsIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/components/language/translation-context';

const navigationItems = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    key: 'clients',
    href: '/clients',
    icon: UsersIcon,
  },
  {
    key: 'calendar',
    href: '/calendar',
    icon: CalendarIcon,
  },
  {
    key: 'chat',
    href: '/chat',
    icon: MessageCircleIcon,
  },
  {
    key: 'settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

export function DesktopSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { profilePicture, initializeSettings } = useSettingsStore();
  const { t } = useTranslation();

  // Initialize settings to load profile picture on mount
  useEffect(() => {
    if (user) {
      initializeSettings();
    }
  }, [user, initializeSettings]);

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Image
              src="/logo-square.png"
              alt="Levelup Meds logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            {!isCollapsed && (
              <span className="font-semibold text-gray-900">Levelup Meds</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const label = t(`sidebar.${item.key}`);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'min-h-[44px]',
                  isActive
                    ? 'bg-accent text-primary border border-border'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                )}
                title={isCollapsed ? label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary' : 'text-gray-400',
                  )}
                />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        {user && (
          <div
            className={cn(
              'border-t border-gray-200',
              isCollapsed ? 'p-2' : 'p-4',
            )}
          >
            <div
              className={cn(
                'flex items-center',
                isCollapsed ? 'justify-center' : 'space-x-3',
              )}
            >
              <Avatar className={cn(isCollapsed ? 'w-8 h-8' : 'w-10 h-10')}>
                <AvatarImage
                  src={profilePicture || undefined}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {t(`roles.${user.role}`)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
