'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Pill,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardStats } from '@/hooks/use-dashboard';
import { useTranslation } from '@/components/language/translation-context';

interface DashboardStatsProps {
  stats?: DashboardStats;
  onStatClick?: (stat: string) => void;
}

interface StatCard {
  id: string;
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    label: string;
  };
  actionPath: string;
}

export function DashboardStats({ stats, onStatClick }: DashboardStatsProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const statCards = useMemo((): StatCard[] => {
    if (!stats) return [];

    return [
      {
        id: 'clients',
        title: t('dashboard.stats.totalClients'),
        value: stats.totalClients,
        icon: <Users className="h-5 w-5" />,
        color: 'text-primary',
        bgColor: 'bg-accent',
        description: t('dashboard.stats.clientsDescription'),
        actionPath: '/clients'
      },
      {
        id: 'medications',
        title: t('dashboard.stats.activeMedications'),
        value: stats.activeMedications,
        icon: <Pill className="h-5 w-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: t('dashboard.stats.medicationsDescription'),
        actionPath: '/clients'
      },
      {
        id: 'appointments',
        title: t('dashboard.stats.upcomingAppointments'),
        value: stats.upcomingAppointments,
        icon: <Calendar className="h-5 w-5" />,
        color: 'text-secondary',
        bgColor: 'bg-accent',
        description: t('dashboard.stats.appointmentsDescription'),
        actionPath: '/calendar'
      },
      {
        id: 'messages',
        title: t('dashboard.stats.unreadMessages'),
        value: stats.unreadMessages,
        icon: <MessageSquare className="h-5 w-5" />,
        color: stats.unreadMessages > 0 ? 'text-secondary' : 'text-gray-400',
        bgColor: stats.unreadMessages > 0 ? 'bg-accent' : 'bg-gray-50',
        description: t('dashboard.stats.messagesDescription'),
        actionPath: '/chat'
      },
      {
        id: 'overdue',
        title: t('dashboard.stats.overdueItems'),
        value: stats.overdueReminders,
        icon: <AlertTriangle className="h-5 w-5" />,
        color: stats.overdueReminders > 0 ? 'text-red-600' : 'text-green-600',
        bgColor: stats.overdueReminders > 0 ? 'bg-red-50' : 'bg-green-50',
        description:
          stats.overdueReminders > 0
            ? t('dashboard.stats.overdueDescription')
            : t('dashboard.stats.overdueClear'),
        actionPath: '/clients'
      },
      {
        id: 'today',
        title: t('dashboard.stats.todaysTasks'),
        value: stats.todaysTasks,
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: t('dashboard.stats.tasksDescription'),
        actionPath: '/dashboard?view=today'
      }
    ];
  }, [stats, t]);

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = (
    direction: 'up' | 'down' | 'neutral',
    isPositive: boolean
  ) => {
    if (direction === 'neutral') return 'text-gray-500';

    const isGoodTrend =
      (direction === 'up' && isPositive) ||
      (direction === 'down' && !isPositive);
    return isGoodTrend ? 'text-green-600' : 'text-red-600';
  };

  const handleStatClick = (stat: StatCard) => {
    onStatClick?.(stat.id);
    router.push(stat.actionPath);
  };

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('dashboard.stats.overview')}
        </h2>
        <Badge variant="secondary" className="text-xs">
          {t('dashboard.stats.liveData')}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card
            key={stat.id}
            className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
            onClick={() => handleStatClick(stat)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>

                    {stat.trend && (
                      <div
                        className={`flex items-center gap-1 text-xs ${getTrendColor(
                          stat.trend.direction,
                          stat.id !== 'overdue'
                        )}`}
                      >
                        {getTrendIcon(stat.trend.direction)}
                        <span>{stat.trend.value}%</span>
                        <span className="text-gray-500">{stat.trend.label}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>

                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>

              {/* Progress bar */}
              {(stat.id === 'today' || stat.id === 'overdue') && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('dashboard.stats.progress')}</span>
                    <span>
                      {stat.id === 'overdue'
                        ? stat.value === 0
                          ? '100%'
                          : '0%'
                        : '75%'}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stat.id === 'overdue'
                          ? stat.value === 0
                            ? 'bg-green-500'
                            : 'bg-red-500'
                          : 'bg-orange-500'
                      }`}
                      style={{
                        width:
                          stat.id === 'overdue'
                            ? stat.value === 0
                              ? '100%'
                              : '0%'
                            : '75%'
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary insights */}
      <Card className="bg-accent border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {t('dashboard.stats.careSummary')}
              </h3>

              <p className="text-sm text-gray-600">
                {stats.overdueReminders === 0
                  ? t('dashboard.stats.careSummaryAllGood')
                  : t('dashboard.stats.careSummaryOverdue', {
                      count: stats.overdueReminders
                    })}

                {stats.todaysTasks > 0 && (
                  <span>
                    {' '}
                    {t('dashboard.stats.careSummaryTasks', {
                      count: stats.todaysTasks
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
