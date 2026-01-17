'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MessageSquare,
  Pill,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/components/language/translation-context';
import type { DashboardActivity } from '@/hooks/use-dashboard';

interface ActivityFeedProps {
  activities: DashboardActivity[];
  onActivityClick?: (activityId: string) => void;
}

export function ActivityFeed({ activities, onActivityClick }: ActivityFeedProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const getActivityIcon = (type: DashboardActivity['type']) => {
    switch (type) {
      case 'medication_taken':
        return <Pill className="h-4 w-4 text-green-600" />;
      case 'appointment_scheduled':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'client_updated':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: DashboardActivity['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-orange-600" />;
      case 'normal':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'low':
        return <Info className="h-3 w-3 text-gray-600" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('activity.justNow');
    if (diffInMinutes < 60) return t('activity.minutesAgo', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('activity.hoursAgo', { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t('activity.daysAgo', { count: diffInDays });

    return activityTime.toLocaleDateString();
  };

  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: DashboardActivity[] } = {};
    const now = new Date();

    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      const diffInDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

      let groupKey: string;
      if (diffInDays === 0) groupKey = t('activity.group.today');
      else if (diffInDays === 1) groupKey = t('activity.group.yesterday');
      else if (diffInDays < 7) groupKey = t('activity.group.thisWeek');
      else groupKey = t('activity.group.earlier');

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(activity);
    });

    return groups;
  }, [activities, t]);

  const handleActivityClick = (activity: DashboardActivity) => {
    onActivityClick?.(activity.id);

    if (activity.actionUrl) {
      router.push(activity.actionUrl);
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('activity.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t('activity.none')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('activity.noneDescription')}
            </p>
          </div>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push('/activity')}
            >
              {t('activity.viewAll')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('activity.title')}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {activities.length} {t('activity.items')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {Object.entries(groupedActivities).map(([groupName, groupActivities]) => (
              <div key={groupName}>
                <h4 className="text-sm font-medium text-gray-700 mb-3 px-2">
                  {groupName}
                </h4>

                <div className="space-y-3">
                  {groupActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        activity.actionUrl
                          ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300'
                          : ''
                      } ${
                        activity.priority === 'urgent'
                          ? 'border-red-200 bg-red-50'
                          : activity.priority === 'high'
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onClick={() => activity.actionUrl && handleActivityClick(activity)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </h4>
                          {getPriorityIcon(activity.priority)}
                        </div>

                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {activity.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{activity.clientName}</span>
                          <span>{formatTimeAgo(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push('/activity')}
          >
            {t('activity.viewAll')}
          </Button>
        </div>
        </CardContent>
    </Card>
  );
}

