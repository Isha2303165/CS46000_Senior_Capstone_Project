'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  MessageSquare, 
  Pill, 
  User, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Toggle } from '@/components/ui/toggle';
import type { 
  Client, 
  Medication, 
  MedicationLog, 
  Appointment, 
  Message,
  MedicationLogStatus,
  AppointmentStatus,
  Priority 
} from '@/types';

// Activity types for the client-specific activity feed
export type ClientActivityType = 
  | 'medication_taken' 
  | 'medication_missed' 
  | 'medication_skipped'
  | 'appointment_scheduled' 
  | 'appointment_completed'
  | 'appointment_cancelled'
  | 'appointment_no_show'
  | 'message_sent' 
  | 'client_updated'
  | 'medical_history_updated'
  | 'emergency_contact_updated';

export interface ClientActivityItem {
  id: string;
  type: ClientActivityType;
  title: string;
  description: string;
  timestamp: string;
  performedBy: string;
  performedByName: string;
  priority: Priority;
  metadata?: {
    medicationId?: string;
    medicationName?: string;
    appointmentId?: string;
    appointmentTitle?: string;
    messageId?: string;
    dosage?: string;
    status?: MedicationLogStatus | AppointmentStatus;
    providerName?: string;
    [key: string]: any;
  };
}

export interface MedicationAdherenceStats {
  totalMedications: number;
  adherenceRate: number; // percentage
  missedDosesLast7Days: number;
  onTimeRate: number; // percentage
  trendDirection: 'improving' | 'stable' | 'declining';
  weeklyStats: Array<{
    week: string;
    adherenceRate: number;
    totalDoses: number;
    takenDoses: number;
  }>;
  monthlyStats: Array<{
    month: string;
    adherenceRate: number;
    totalDoses: number;
    takenDoses: number;
  }>;
}

export interface AppointmentAttendanceStats {
  totalAppointments: number;
  completedRate: number; // percentage
  noShowRate: number; // percentage
  cancelledRate: number; // percentage
  averageReschedules: number;
  upcomingCount: number;
  weeklyStats: Array<{
    week: string;
    scheduled: number;
    completed: number;
    noShows: number;
    cancelled: number;
  }>;
  monthlyStats: Array<{
    month: string;
    scheduled: number;
    completed: number;
    noShows: number;
    cancelled: number;
  }>;
}

export interface ActivityFilter {
  type: ClientActivityType;
  label: string;
  enabled: boolean;
}

interface ClientActivityFeedSectionProps {
  client: Client;
  medications: Medication[];
  medicationLogs: MedicationLog[];
  appointments: Appointment[];
  messages: Message[];
  className?: string;
}

export function ClientActivityFeedSection({
  client,
  medications,
  medicationLogs,
  appointments,
  messages,
  className = ''
}: ClientActivityFeedSectionProps) {
  // Activity filter state
  const [activityFilters, setActivityFilters] = useState<ActivityFilter[]>([
    { type: 'medication_taken', label: 'Medications Taken', enabled: true },
    { type: 'medication_missed', label: 'Missed Medications', enabled: true },
    { type: 'medication_skipped', label: 'Skipped Medications', enabled: true },
    { type: 'appointment_scheduled', label: 'Appointments Scheduled', enabled: true },
    { type: 'appointment_completed', label: 'Appointments Completed', enabled: true },
    { type: 'appointment_cancelled', label: 'Appointments Cancelled', enabled: false },
    { type: 'appointment_no_show', label: 'Appointment No-Shows', enabled: true },
    { type: 'message_sent', label: 'Messages', enabled: true },
    { type: 'client_updated', label: 'Profile Updates', enabled: false },
    { type: 'medical_history_updated', label: 'Medical History Updates', enabled: true },
    { type: 'emergency_contact_updated', label: 'Contact Updates', enabled: false },
  ]);

  // Generate activity items from various data sources
  const activityItems = useMemo((): ClientActivityItem[] => {
    const activities: ClientActivityItem[] = [];

    // Medication logs
    medicationLogs.forEach(log => {
      const medication = medications.find(m => m.id === log.medicationId);
      if (!medication) return;

      let type: ClientActivityType;
      let title: string;
      let priority: Priority = 'normal';

      switch (log.status) {
        case 'taken':
          type = 'medication_taken';
          title = 'Medication Taken';
          break;
        case 'missed':
          type = 'medication_missed';
          title = 'Medication Missed';
          priority = 'high';
          break;
        case 'skipped':
          type = 'medication_skipped';
          title = 'Medication Skipped';
          priority = 'normal';
          break;
        case 'partial':
          type = 'medication_taken';
          title = 'Partial Medication Taken';
          priority = 'normal';
          break;
        default:
          return;
      }

      activities.push({
        id: `med-log-${log.id}`,
        type,
        title,
        description: `${medication.name} (${log.dosageTaken || medication.dosage})${log.notes ? ` - ${log.notes}` : ''}`,
        timestamp: log.takenAt,
        performedBy: log.takenBy,
        performedByName: 'Caregiver', // Would be resolved from user data in real implementation
        priority,
        metadata: {
          medicationId: medication.id,
          medicationName: medication.name,
          dosage: log.dosageTaken || medication.dosage,
          status: log.status,
        },
      });
    });

    // Appointments
    appointments.forEach(appointment => {
      let type: ClientActivityType;
      let title: string;
      let priority: Priority = 'normal';

      switch (appointment.status) {
        case 'scheduled':
          type = 'appointment_scheduled';
          title = 'Appointment Scheduled';
          break;
        case 'completed':
          type = 'appointment_completed';
          title = 'Appointment Completed';
          break;
        case 'cancelled':
          type = 'appointment_cancelled';
          title = 'Appointment Cancelled';
          priority = 'normal';
          break;
        case 'no_show':
          type = 'appointment_no_show';
          title = 'Appointment No-Show';
          priority = 'high';
          break;
        default:
          return;
      }

      activities.push({
        id: `apt-${appointment.id}`,
        type,
        title,
        description: `${appointment.title} with ${appointment.providerName}${appointment.notes ? ` - ${appointment.notes}` : ''}`,
        timestamp: appointment.status === 'scheduled' ? appointment.createdAt : appointment.updatedAt,
        performedBy: appointment.createdBy,
        performedByName: 'Caregiver',
        priority,
        metadata: {
          appointmentId: appointment.id,
          appointmentTitle: appointment.title,
          providerName: appointment.providerName,
          status: appointment.status,
        },
      });
    });

    // Messages
    messages.forEach(message => {
      activities.push({
        id: `msg-${message.id}`,
        type: 'message_sent',
        title: 'Message Sent',
        description: message.content.length > 100 
          ? `${message.content.substring(0, 100)}...` 
          : message.content,
        timestamp: message.createdAt,
        performedBy: message.senderId,
        performedByName: 'Caregiver',
        priority: message.priority,
        metadata: {
          messageId: message.id,
        },
      });
    });

    // Client updates (simulated - would come from audit logs in real implementation)
    activities.push({
      id: `client-update-${client.id}`,
      type: 'client_updated',
      title: 'Client Profile Updated',
      description: `Profile information updated for ${client.firstName} ${client.lastName}`,
      timestamp: client.updatedAt,
      performedBy: 'system',
      performedByName: 'System',
      priority: 'low',
      metadata: {},
    });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [medications, medicationLogs, appointments, messages, client]);

  // Filter activities based on enabled filters
  const filteredActivities = useMemo(() => {
    const enabledTypes = activityFilters
      .filter(filter => filter.enabled)
      .map(filter => filter.type);
    
    return activityItems.filter(activity => 
      enabledTypes.includes(activity.type)
    );
  }, [activityItems, activityFilters]);

  // Calculate medication adherence statistics
  const medicationAdherenceStats = useMemo((): MedicationAdherenceStats => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get recent medication logs
    const recentLogs = medicationLogs.filter(log => 
      new Date(log.takenAt) >= thirtyDaysAgo
    );

    const last7DaysLogs = medicationLogs.filter(log => 
      new Date(log.takenAt) >= sevenDaysAgo
    );

    // Calculate basic stats
    const totalDoses = recentLogs.length;
    const takenDoses = recentLogs.filter(log => 
      log.status === 'taken' || log.status === 'partial'
    ).length;
    const missedDosesLast7Days = last7DaysLogs.filter(log => 
      log.status === 'missed'
    ).length;

    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
    const onTimeRate = adherenceRate; // Simplified - would calculate based on scheduled vs actual times

    // Calculate trend (simplified)
    const firstHalfLogs = recentLogs.slice(Math.floor(recentLogs.length / 2));
    const secondHalfLogs = recentLogs.slice(0, Math.floor(recentLogs.length / 2));
    
    const firstHalfRate = firstHalfLogs.length > 0 
      ? (firstHalfLogs.filter(log => log.status === 'taken').length / firstHalfLogs.length) * 100 
      : 0;
    const secondHalfRate = secondHalfLogs.length > 0 
      ? (secondHalfLogs.filter(log => log.status === 'taken').length / secondHalfLogs.length) * 100 
      : 0;

    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondHalfRate > firstHalfRate + 5) trendDirection = 'improving';
    else if (secondHalfRate < firstHalfRate - 5) trendDirection = 'declining';

    // Generate weekly stats (last 4 weeks)
    const weeklyStats = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const weekLogs = medicationLogs.filter(log => {
        const logDate = new Date(log.takenAt);
        return logDate >= weekStart && logDate < weekEnd;
      });

      const weekTaken = weekLogs.filter(log => log.status === 'taken').length;
      const weekTotal = weekLogs.length;

      weeklyStats.unshift({
        week: `Week ${4 - i}`,
        adherenceRate: weekTotal > 0 ? (weekTaken / weekTotal) * 100 : 0,
        totalDoses: weekTotal,
        takenDoses: weekTaken,
      });
    }

    // Generate monthly stats (last 3 months)
    const monthlyStats = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      const monthLogs = medicationLogs.filter(log => {
        const logDate = new Date(log.takenAt);
        return logDate >= monthStart && logDate < monthEnd;
      });

      const monthTaken = monthLogs.filter(log => log.status === 'taken').length;
      const monthTotal = monthLogs.length;

      monthlyStats.unshift({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        adherenceRate: monthTotal > 0 ? (monthTaken / monthTotal) * 100 : 0,
        totalDoses: monthTotal,
        takenDoses: monthTaken,
      });
    }

    return {
      totalMedications: medications.filter(m => m.isActive).length,
      adherenceRate: Math.round(adherenceRate),
      missedDosesLast7Days,
      onTimeRate: Math.round(onTimeRate),
      trendDirection,
      weeklyStats,
      monthlyStats,
    };
  }, [medications, medicationLogs]);

  // Calculate appointment attendance statistics
  const appointmentAttendanceStats = useMemo((): AppointmentAttendanceStats => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get recent appointments
    const recentAppointments = appointments.filter(apt => 
      new Date(apt.appointmentDate) >= thirtyDaysAgo
    );

    const totalAppointments = recentAppointments.length;
    const completedAppointments = recentAppointments.filter(apt => 
      apt.status === 'completed'
    ).length;
    const noShowAppointments = recentAppointments.filter(apt => 
      apt.status === 'no_show'
    ).length;
    const cancelledAppointments = recentAppointments.filter(apt => 
      apt.status === 'cancelled'
    ).length;
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.appointmentDate) >= now && apt.status === 'scheduled'
    ).length;

    const completedRate = totalAppointments > 0 
      ? (completedAppointments / totalAppointments) * 100 
      : 0;
    const noShowRate = totalAppointments > 0 
      ? (noShowAppointments / totalAppointments) * 100 
      : 0;
    const cancelledRate = totalAppointments > 0 
      ? (cancelledAppointments / totalAppointments) * 100 
      : 0;

    // Generate weekly stats (last 4 weeks)
    const weeklyStats = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const weekAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= weekStart && aptDate < weekEnd;
      });

      weeklyStats.unshift({
        week: `Week ${4 - i}`,
        scheduled: weekAppointments.length,
        completed: weekAppointments.filter(apt => apt.status === 'completed').length,
        noShows: weekAppointments.filter(apt => apt.status === 'no_show').length,
        cancelled: weekAppointments.filter(apt => apt.status === 'cancelled').length,
      });
    }

    // Generate monthly stats (last 3 months)
    const monthlyStats = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= monthStart && aptDate < monthEnd;
      });

      monthlyStats.unshift({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        scheduled: monthAppointments.length,
        completed: monthAppointments.filter(apt => apt.status === 'completed').length,
        noShows: monthAppointments.filter(apt => apt.status === 'no_show').length,
        cancelled: monthAppointments.filter(apt => apt.status === 'cancelled').length,
      });
    }

    return {
      totalAppointments,
      completedRate: Math.round(completedRate),
      noShowRate: Math.round(noShowRate),
      cancelledRate: Math.round(cancelledRate),
      averageReschedules: 0, // Would be calculated from appointment history
      upcomingCount: upcomingAppointments,
      weeklyStats,
      monthlyStats,
    };
  }, [appointments]);

  // Helper functions
  const getActivityIcon = (type: ClientActivityType) => {
    switch (type) {
      case 'medication_taken':
        return <Pill className="h-4 w-4 text-green-600" />;
      case 'medication_missed':
        return <Pill className="h-4 w-4 text-red-600" />;
      case 'medication_skipped':
        return <Pill className="h-4 w-4 text-yellow-600" />;
      case 'appointment_scheduled':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'appointment_completed':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'appointment_cancelled':
        return <Calendar className="h-4 w-4 text-gray-600" />;
      case 'appointment_no_show':
        return <Calendar className="h-4 w-4 text-red-600" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'client_updated':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'medical_history_updated':
        return <Activity className="h-4 w-4 text-purple-600" />;
      case 'emergency_contact_updated':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: Priority) => {
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

  const getTrendIcon = (direction: 'improving' | 'stable' | 'declining') => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  };

  const groupActivitiesByDate = (activities: ClientActivityItem[]) => {
    const groups: { [key: string]: ClientActivityItem[] } = {};
    const now = new Date();
    
    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      const diffInDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let groupKey: string;
      if (diffInDays === 0) {
        groupKey = 'Today';
      } else if (diffInDays === 1) {
        groupKey = 'Yesterday';
      } else if (diffInDays < 7) {
        groupKey = 'This Week';
      } else if (diffInDays < 30) {
        groupKey = 'This Month';
      } else {
        groupKey = 'Earlier';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });
    
    return groups;
  };

  const toggleFilter = (type: ClientActivityType) => {
    setActivityFilters(prev => 
      prev.map(filter => 
        filter.type === type 
          ? { ...filter, enabled: !filter.enabled }
          : filter
      )
    );
  };

  const groupedActivities = groupActivitiesByDate(filteredActivities);

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="medication-trends">Medication Trends</TabsTrigger>
          <TabsTrigger value="appointment-trends">Appointment Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {filteredActivities.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Activity Filters */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activityFilters.map(filter => (
                    <Toggle
                      key={filter.type}
                      pressed={filter.enabled}
                      onPressedChange={() => toggleFilter(filter.type)}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      {filter.label}
                    </Toggle>
                  ))}
                </div>
              </div>

              {/* Activity Timeline */}
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No Activity Found</h3>
                  <p className="text-sm text-gray-600">
                    No activities match your current filters. Try adjusting the filters above.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
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
                                activity.priority === 'urgent' 
                                  ? 'border-red-200 bg-red-50' 
                                  : activity.priority === 'high'
                                  ? 'border-orange-200 bg-orange-50'
                                  : 'border-gray-200 bg-white'
                              }`}
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
                                  <span>by {activity.performedByName}</span>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medication-trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Medication Adherence Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medication Adherence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Adherence</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">
                        {medicationAdherenceStats.adherenceRate}%
                      </span>
                      {getTrendIcon(medicationAdherenceStats.trendDirection)}
                    </div>
                  </div>
                  <Progress 
                    value={medicationAdherenceStats.adherenceRate} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {medicationAdherenceStats.totalMedications}
                    </div>
                    <div className="text-xs text-gray-600">Active Medications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {medicationAdherenceStats.missedDosesLast7Days}
                    </div>
                    <div className="text-xs text-gray-600">Missed (7 days)</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Trend</span>
                    <span className={`font-medium capitalize ${
                      medicationAdherenceStats.trendDirection === 'improving' 
                        ? 'text-green-600' 
                        : medicationAdherenceStats.trendDirection === 'declining'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {medicationAdherenceStats.trendDirection}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Medication Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {medicationAdherenceStats.weeklyStats.map((week, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{week.week}</span>
                        <span className="text-gray-600">
                          {week.takenDoses}/{week.totalDoses} doses
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={week.adherenceRate} 
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs font-medium w-10 text-right">
                          {Math.round(week.adherenceRate)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Medication Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {medicationAdherenceStats.monthlyStats.map((month, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="text-center space-y-2">
                      <h4 className="font-medium text-gray-900">{month.month}</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(month.adherenceRate)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        {month.takenDoses} of {month.totalDoses} doses taken
                      </div>
                      <Progress 
                        value={month.adherenceRate} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointment-trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Appointment Attendance Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      {appointmentAttendanceStats.completedRate}%
                    </span>
                  </div>
                  <Progress 
                    value={appointmentAttendanceStats.completedRate} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {appointmentAttendanceStats.completedRate}%
                    </div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {appointmentAttendanceStats.noShowRate}%
                    </div>
                    <div className="text-xs text-gray-600">No-Show</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600">
                      {appointmentAttendanceStats.cancelledRate}%
                    </div>
                    <div className="text-xs text-gray-600">Cancelled</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Upcoming</span>
                    <span className="font-medium">
                      {appointmentAttendanceStats.upcomingCount} appointments
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Appointment Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appointmentAttendanceStats.weeklyStats.map((week, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{week.week}</span>
                        <span className="text-gray-600">
                          {week.scheduled} scheduled
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-sm font-medium text-green-700">
                            {week.completed}
                          </div>
                          <div className="text-xs text-green-600">Completed</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="text-sm font-medium text-red-700">
                            {week.noShows}
                          </div>
                          <div className="text-xs text-red-600">No-Show</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-medium text-gray-700">
                            {week.cancelled}
                          </div>
                          <div className="text-xs text-gray-600">Cancelled</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Appointment Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {appointmentAttendanceStats.monthlyStats.map((month, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="text-center space-y-2">
                      <h4 className="font-medium text-gray-900">{month.month}</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {month.scheduled}
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        Total Appointments
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{month.completed}</div>
                          <div className="text-gray-500">Done</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{month.noShows}</div>
                          <div className="text-gray-500">No-Show</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-600">{month.cancelled}</div>
                          <div className="text-gray-500">Cancelled</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}