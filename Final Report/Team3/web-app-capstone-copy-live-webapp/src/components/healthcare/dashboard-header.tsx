'use client';

import { useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  MessageSquare,
  Pill,
  Users,
  AlertTriangle,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataExportDialog } from './data-export-dialog';
import type { UserProfile } from '@/types';
import type { DashboardStats } from '@/hooks/use-dashboard';
import { useTranslation } from '@/components/language/translation-context';

interface DashboardHeaderProps {
  user: UserProfile;
  stats?: DashboardStats;
  onActionClick?: (action: string) => void;
}

export function DashboardHeader({ user, stats, onActionClick }: DashboardHeaderProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { t } = useTranslation();

  const currentTime = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.header.greetingMorning');
    if (hour < 17) return t('dashboard.header.greetingAfternoon');
    return t('dashboard.header.greetingEvening');
  };

  const hasUrgentItems =
    stats && (stats.overdueReminders > 0 || stats.unreadMessages > 0);

  return (
    <div className="mb-8">
      {/* Main header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {getGreeting()}, {user.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">{currentTime}</p>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('dashboard.header.export')}
          </Button>

          {/* Notification bell */}
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => onActionClick?.('notifications')}
          >
            <Bell className="h-4 w-4" />
            {hasUrgentItems && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                !
              </Badge>
            )}
          </Button>

          {/* Quick add button */}
          <Button size="sm" onClick={() => onActionClick?.('quick_add')}>
            {t('dashboard.header.quickAdd')}
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalClients}</div>
            <div className="text-sm text-gray-600">{t('dashboard.header.clients')}</div>
          </div>

          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Pill className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeMedications}</div>
            <div className="text-sm text-gray-600">{t('dashboard.header.medications')}</div>
          </div>

          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.upcomingAppointments}
            </div>
            <div className="text-sm text-gray-600">
              {t('dashboard.header.appointments')}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.unreadMessages}
            </div>
            <div className="text-sm text-gray-600">{t('dashboard.header.messages')}</div>
          </div>

          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle
                className={`h-5 w-5 ${
                  stats.overdueReminders > 0 ? 'text-red-600' : 'text-gray-400'
                }`}
              />
            </div>
            <div
              className={`text-2xl font-bold ${
                stats.overdueReminders > 0 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {stats.overdueReminders}
            </div>
            <div className="text-sm text-gray-600">{t('dashboard.header.overdue')}</div>
          </div>

          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.todaysTasks}</div>
            <div className="text-sm text-gray-600">
              {t('dashboard.header.todaysTasks')}
            </div>
          </div>
        </div>
      )}

      {/* Urgent alerts */}
      {hasUrgentItems && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">
              {t('dashboard.header.urgentTitle')}
            </h3>
          </div>
          <div className="text-sm text-red-700">
            {stats?.overdueReminders > 0 && (
              <span>
                {stats.overdueReminders}{' '}
                {t('dashboard.header.overdueMedications', {
                  count: stats.overdueReminders
                })}
              </span>
            )}

            {stats?.overdueReminders > 0 && stats?.unreadMessages > 0 && (
              <span> • </span>
            )}

            {stats?.unreadMessages > 0 && (
              <span>
                {stats.unreadMessages}{' '}
                {t('dashboard.header.unreadMessages', {
                  count: stats.unreadMessages
                })}
              </span>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => onActionClick?.('view_urgent')}
          >
            {t('dashboard.header.viewDetails')}
          </Button>
        </div>
      )}

      {/* Export dialog */}
      <DataExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  );
}
