'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Client, Medication, Appointment, ClientCaregiver } from '@/types';
import { 
  Pill, 
  Calendar, 
  Activity, 
  Users, 
  Plus, 
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface ClientOverviewSectionProps {
  client: Client;
  medications: Medication[];
  appointments: Appointment[];
  caregivers: ClientCaregiver[];
  onAddMedication: () => void;
  onScheduleAppointment: () => void;
  className?: string;
}

interface MedicationsSummary {
  totalActive: number;
  dueNow: number;
  overdue: number;
  adherenceRate: number;
}

interface AppointmentsSummary {
  upcoming: number;
  today: number;
  thisWeek: number;
  overdue: number;
}

interface ActivitySummary {
  medicationsTaken: number;
  appointmentsCompleted: number;
  lastActivity: string | null;
}

export function ClientOverviewSection({
  client,
  medications,
  appointments,
  caregivers,
  onAddMedication,
  onScheduleAppointment,
  className
}: ClientOverviewSectionProps) {
  // Calculate medications summary
  const medicationsSummary: MedicationsSummary = React.useMemo(() => {
    const activeMedications = medications.filter(med => med.isActive);
    const now = new Date();
    
    const dueNow = activeMedications.filter(med => 
      med.nextDueAt && new Date(med.nextDueAt) <= now
    ).length;
    
    const overdue = activeMedications.filter(med => 
      med.nextDueAt && isPast(new Date(med.nextDueAt)) && !med.isPRN
    ).length;
    
    // Calculate adherence rate (simplified)
    const totalDoses = activeMedications.reduce((sum, med) => sum + (med.totalDoses || 0), 0);
    const missedDoses = activeMedications.reduce((sum, med) => sum + (med.missedDoses || 0), 0);
    const adherenceRate = totalDoses > 0 ? ((totalDoses - missedDoses) / totalDoses) * 100 : 100;
    
    return {
      totalActive: activeMedications.length,
      dueNow,
      overdue,
      adherenceRate: Math.round(adherenceRate)
    };
  }, [medications]);

  // Calculate appointments summary
  const appointmentsSummary: AppointmentsSummary = React.useMemo(() => {
    const now = new Date();
    const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled');
    
    const upcoming = activeAppointments.filter(apt => {
      const aptDate = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return aptDate > now;
    }).length;
    
    const today = activeAppointments.filter(apt => 
      isToday(new Date(apt.appointmentDate))
    ).length;
    
    const thisWeek = activeAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return aptDate >= now && aptDate <= weekFromNow;
    }).length;
    
    const overdue = activeAppointments.filter(apt => {
      const aptDate = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return aptDate < now && apt.status === 'scheduled';
    }).length;
    
    return {
      upcoming,
      today,
      thisWeek,
      overdue
    };
  }, [appointments]);

  // Calculate activity summary (simplified for now)
  const activitySummary: ActivitySummary = React.useMemo(() => {
    // In a real implementation, this would come from medication logs and appointment history
    const medicationsTaken = medications.reduce((sum, med) => sum + (med.totalDoses || 0), 0);
    const appointmentsCompleted = appointments.filter(apt => apt.status === 'completed').length;
    
    // Find most recent activity
    const recentMedications = medications
      .filter(med => med.lastTakenAt)
      .sort((a, b) => new Date(b.lastTakenAt!).getTime() - new Date(a.lastTakenAt!).getTime());
    
    const recentAppointments = appointments
      .filter(apt => apt.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    let lastActivity: string | null = null;
    if (recentMedications.length > 0 || recentAppointments.length > 0) {
      const lastMedTime = recentMedications[0]?.lastTakenAt ? new Date(recentMedications[0].lastTakenAt) : new Date(0);
      const lastAptTime = recentAppointments[0] ? new Date(recentAppointments[0].updatedAt) : new Date(0);
      
      if (lastMedTime > lastAptTime) {
        lastActivity = format(lastMedTime, 'MMM dd, h:mm a');
      } else if (recentAppointments[0]) {
        lastActivity = format(lastAptTime, 'MMM dd, h:mm a');
      }
    }
    
    return {
      medicationsTaken,
      appointmentsCompleted,
      lastActivity
    };
  }, [medications, appointments]);

  // Get active caregivers
  const activeCaregivers = caregivers.filter(cg => cg.isActive);

  return (
    <section 
      className={`space-y-6 ${className}`}
      role="region"
      aria-labelledby="client-overview-title"
    >
      <div className="flex items-center justify-between">
        <h2 
          id="client-overview-title"
          className="text-2xl font-semibold text-gray-900"
        >
          Overview
        </h2>
        <div className="flex gap-2" role="group" aria-label="Quick actions">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddMedication}
            className="flex items-center gap-2"
            aria-label="Add new medication"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Medication
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onScheduleAppointment}
            className="flex items-center gap-2"
            aria-label="Schedule new appointment"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Schedule Appointment
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        role="group"
        aria-label="Client care metrics"
      >
        {/* Medications Card */}
        <Card 
          className="relative"
          role="article"
          aria-labelledby="medications-summary-title"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle 
                id="medications-summary-title"
                className="text-sm font-medium text-gray-600 flex items-center gap-2"
              >
                <Pill className="w-4 h-4" aria-hidden="true" />
                Medications
              </CardTitle>
              {medicationsSummary.overdue > 0 && (
                <Badge 
                  variant="destructive" 
                  className="text-xs"
                  role="alert"
                  aria-label={`${medicationsSummary.overdue} overdue medications`}
                >
                  {medicationsSummary.overdue} overdue
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {medicationsSummary.totalActive}
                </span>
                <span className="text-sm text-gray-500">active</span>
              </div>
              {medicationsSummary.dueNow > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-3 h-3 text-orange-500" aria-hidden="true" />
                  <span className="text-orange-600">
                    {medicationsSummary.dueNow} due now
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-3 h-3 text-green-500" aria-hidden="true" />
                <span className="text-green-600">
                  {medicationsSummary.adherenceRate}% adherence
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Card */}
        <Card 
          role="article"
          aria-labelledby="appointments-summary-title"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle 
                id="appointments-summary-title"
                className="text-sm font-medium text-gray-600 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Appointments
              </CardTitle>
              {appointmentsSummary.overdue > 0 && (
                <Badge 
                  variant="destructive" 
                  className="text-xs"
                  role="alert"
                  aria-label={`${appointmentsSummary.overdue} overdue appointments`}
                >
                  {appointmentsSummary.overdue} overdue
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {appointmentsSummary.upcoming}
                </span>
                <span className="text-sm text-gray-500">upcoming</span>
              </div>
              {appointmentsSummary.today > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <AlertTriangle className="w-3 h-3 text-blue-500" aria-hidden="true" />
                  <span className="text-blue-600">
                    {appointmentsSummary.today} today
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-3 h-3 text-gray-500" aria-hidden="true" />
                <span className="text-gray-600">
                  {appointmentsSummary.thisWeek} this week
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card 
          role="article"
          aria-labelledby="activity-summary-title"
        >
          <CardHeader className="pb-3">
            <CardTitle 
              id="activity-summary-title"
              className="text-sm font-medium text-gray-600 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" aria-hidden="true" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3 h-3 text-green-500" aria-hidden="true" />
                <span className="text-gray-600">
                  {activitySummary.medicationsTaken} medications taken
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-3 h-3 text-blue-500" aria-hidden="true" />
                <span className="text-gray-600">
                  {activitySummary.appointmentsCompleted} appointments completed
                </span>
              </div>
              {activitySummary.lastActivity && (
                <div className="text-xs text-gray-500 pt-1">
                  Last activity: {activitySummary.lastActivity}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* caregiver Card */}
        <Card 
          role="article"
          aria-labelledby="care-team-title"
        >
          <CardHeader className="pb-3">
            <CardTitle 
              id="care-team-title"
              className="text-sm font-medium text-gray-600 flex items-center gap-2"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              caregiver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {activeCaregivers.length}
                </span>
                <span className="text-sm text-gray-500">caregivers</span>
              </div>
              <div className="space-y-1">
                {activeCaregivers.slice(0, 3).map((caregiver) => (
                  <div key={caregiver.id} className="flex items-center gap-2 text-sm">
                    <Badge 
                      variant={caregiver.role === 'primary' ? 'default' : 'secondary'}
                      className="text-xs px-2 py-0"
                    >
                      {caregiver.role}
                    </Badge>
                    <span className="text-gray-600 truncate">
                      {caregiver.caregiver?.firstName} {caregiver.caregiver?.lastName}
                    </span>
                  </div>
                ))}
                {activeCaregivers.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{activeCaregivers.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Status Indicators */}
      {(client.allergies?.length || client.medicalConditions?.length) && (
        <Card 
          role="region"
          aria-labelledby="health-status-title"
        >
          <CardHeader>
            <CardTitle 
              id="health-status-title"
              className="text-lg font-semibold flex items-center gap-2"
            >
              Health Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.allergies && client.allergies.length > 0 && (
              <div role="alert" aria-label="Client allergies">
                <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Allergies
                </h4>
                <div 
                  className="flex flex-wrap gap-2"
                  role="list"
                  aria-label="Client allergies list"
                >
                  {client.allergies.map((allergy, index) => (
                    <Badge 
                      key={index} 
                      variant="destructive" 
                      className="text-sm"
                      role="listitem"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {client.medicalConditions && client.medicalConditions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</h4>
                <div 
                  className="flex flex-wrap gap-2"
                  role="list"
                  aria-label="Medical conditions"
                >
                  {client.medicalConditions.map((condition, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-sm"
                      role="listitem"
                    >
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}