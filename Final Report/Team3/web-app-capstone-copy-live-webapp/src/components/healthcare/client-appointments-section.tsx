'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentCard } from './appointment-card';
import { AppointmentDialog } from './appointment-dialog';
import { 
  Appointment, 
  CreateAppointmentInput, 
  UpdateAppointmentInput,
  Client,
  UserProfile
} from '@/types';
import { useAppointments } from '@/hooks/use-appointments';
import { useCaregiverPermissions } from '@/hooks/use-caregiver-permissions';
import { 
  Calendar, 
  Clock, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Lock
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isFuture, addDays } from 'date-fns';

interface ClientAppointmentsSectionProps {
  clientId: string;
  client: Client;
  currentUser: UserProfile;
  className?: string;
}

interface AppointmentConflictIndicatorProps {
  conflicts: Array<{
    appointment: Appointment;
    conflictType: 'overlap' | 'same_time' | 'back_to_back';
    message: string;
  }>;
  onResolve: (conflictId: string) => void;
}

function AppointmentConflictIndicator({ conflicts, onResolve }: AppointmentConflictIndicatorProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <h4 className="font-medium text-yellow-800">
          Scheduling Conflicts Detected ({conflicts.length})
        </h4>
      </div>
      <div className="space-y-2">
        {conflicts.map((conflict, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {conflict.appointment.title}
              </p>
              <p className="text-sm text-yellow-700">{conflict.message}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve(conflict.appointment.id)}
              className="ml-2"
            >
              Resolve
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientAppointmentsSection({ 
  clientId, 
  client, 
  currentUser,
  className 
}: ClientAppointmentsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showConflicts, setShowConflicts] = useState(true);
  
  // Check caregiver permissions
  const permissions = useCaregiverPermissions(clientId);

  const {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkAppointmentConflicts,
    getUpcomingAppointments,
    getOverdueAppointments,
    refetch
  } = useAppointments({ clientId });

  // Categorize appointments
  const categorizedAppointments = useMemo(() => {
    const now = new Date();
    
    const upcoming = appointments.filter(apt => {
      const aptDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return isFuture(aptDateTime) && apt.status !== 'cancelled' && apt.status !== 'completed';
    });

    const past = appointments.filter(apt => {
      const aptDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return isPast(aptDateTime) || apt.status === 'completed';
    });

    const overdue = appointments.filter(apt => {
      const aptDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return isPast(aptDateTime) && apt.status === 'scheduled';
    });

    const cancelled = appointments.filter(apt => apt.status === 'cancelled');

    return { upcoming, past, overdue, cancelled };
  }, [appointments]);

  // Check for conflicts in upcoming appointments
  const [appointmentConflicts, setAppointmentConflicts] = useState<Array<{
    appointment: Appointment;
    conflictType: 'overlap' | 'same_time' | 'back_to_back';
    message: string;
  }>>([]);

  // Create a stable key for upcoming appointments to avoid effect loops
  const upcomingIdsKey = useMemo(
    () => categorizedAppointments.upcoming.map((a) => a.id).join('|'),
    [categorizedAppointments.upcoming]
  );

  // Check for conflicts when upcoming appointments change
  useEffect(() => {
    const runConflictCheck = async () => {
      const newConflicts: Array<{
        appointment: Appointment;
        conflictType: 'overlap' | 'same_time' | 'back_to_back';
        message: string;
      }> = [];

      for (const appointment of categorizedAppointments.upcoming) {
        try {
          const conflicts = await checkAppointmentConflicts(appointment, appointment.id);
          if (Array.isArray(conflicts) && conflicts.length > 0) {
            newConflicts.push(...conflicts);
          }
        } catch (error) {
          console.error('Error checking conflicts for appointment:', appointment.id, error);
        }
      }

      setAppointmentConflicts(newConflicts);
    };

    if (categorizedAppointments.upcoming.length > 0) {
      void runConflictCheck();
    } else if (appointmentConflicts.length > 0) {
      setAppointmentConflicts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingIdsKey, checkAppointmentConflicts]);

  const handleCreateAppointment = async (appointmentData: CreateAppointmentInput) => {
    try {
      await createAppointment(appointmentData);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  const handleUpdateAppointment = async (appointmentData: UpdateAppointmentInput) => {
    try {
      await updateAppointment(appointmentData);
      setIsDialogOpen(false);
      setEditingAppointment(undefined);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    if (!permissions.canManageAppointments) {
      console.warn('User does not have permission to edit appointments');
      return;
    }
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      await updateAppointment({
        id: appointment.id,
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleCompleteAppointment = async (appointment: Appointment) => {
    try {
      await updateAppointment({
        id: appointment.id,
        status: 'completed',
        completedBy: currentUser.id
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  const handleConfirmAppointment = async (appointment: Appointment) => {
    try {
      await updateAppointment({
        id: appointment.id,
        status: 'confirmed',
        confirmedBy: currentUser.id
      });
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    // Open the edit dialog with the appointment
    handleEditAppointment(appointment);
  };

  const handleResolveConflict = (conflictId: string) => {
    // Find the conflicting appointment and open it for editing
    const conflictingAppointment = appointments.find(apt => apt.id === conflictId);
    if (conflictingAppointment) {
      handleEditAppointment(conflictingAppointment);
    }
  };

  const getTabBadgeCount = (tab: string) => {
    switch (tab) {
      case 'upcoming':
        return categorizedAppointments.upcoming.length;
      case 'past':
        return categorizedAppointments.past.length;
      case 'overdue':
        return categorizedAppointments.overdue.length;
      case 'cancelled':
        return categorizedAppointments.cancelled.length;
      default:
        return 0;
    }
  };

  const renderAppointmentsList = (appointmentsList: Appointment[], emptyMessage: string) => {
    if (appointmentsList.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {appointmentsList.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onEdit={permissions.canManageAppointments ? handleEditAppointment : undefined}
            onCancel={permissions.canManageAppointments ? handleCancelAppointment : undefined}
            onComplete={permissions.canManageAppointments ? handleCompleteAppointment : undefined}
            onView={(apt) => {
              // Could open a detailed view modal
              // TODO: Implement detailed appointment view modal
            }}
          />
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Error Loading Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointments
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                disabled={loading}
                aria-label="Refresh appointments"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {permissions.canManageAppointments ? (
                <Button
                  onClick={() => {
                    setEditingAppointment(undefined);
                    setIsDialogOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Appointment
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>View Only</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Conflict Indicator */}
          {showConflicts && appointmentConflicts.length > 0 && (
            <AppointmentConflictIndicator
              conflicts={appointmentConflicts}
              onResolve={handleResolveConflict}
            />
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {categorizedAppointments.upcoming.length}
              </div>
              <div className="text-sm text-blue-600">Upcoming</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {categorizedAppointments.past.filter(apt => apt.status === 'completed').length}
              </div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {categorizedAppointments.overdue.length}
              </div>
              <div className="text-sm text-yellow-600">Overdue</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {categorizedAppointments.cancelled.length}
              </div>
              <div className="text-sm text-red-600">Cancelled</div>
            </div>
          </div>

          {/* Appointments Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                Upcoming
                {getTabBadgeCount('upcoming') > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getTabBadgeCount('upcoming')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                Past
                {getTabBadgeCount('past') > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getTabBadgeCount('past')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex items-center gap-2">
                Overdue
                {getTabBadgeCount('overdue') > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {getTabBadgeCount('overdue')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                Cancelled
                {getTabBadgeCount('cancelled') > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {getTabBadgeCount('cancelled')}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              {renderAppointmentsList(
                categorizedAppointments.upcoming,
                "No upcoming appointments scheduled."
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {renderAppointmentsList(
                categorizedAppointments.past,
                "No past appointments found."
              )}
            </TabsContent>

            <TabsContent value="overdue" className="mt-6">
              {categorizedAppointments.overdue.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      These appointments are past their scheduled time and need status updates.
                    </p>
                  </div>
                </div>
              )}
              {renderAppointmentsList(
                categorizedAppointments.overdue,
                "No overdue appointments."
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              {renderAppointmentsList(
                categorizedAppointments.cancelled,
                "No cancelled appointments."
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Actions for Upcoming Appointments */}
          {categorizedAppointments.upcoming.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                {categorizedAppointments.upcoming
                  .filter(apt => apt.status === 'scheduled')
                  .slice(0, 3)
                  .map((appointment) => (
                    <Button
                      key={`confirm-${appointment.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirmAppointment(appointment)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm {appointment.title}
                    </Button>
                  ))}
                {categorizedAppointments.upcoming
                  .slice(0, 2)
                  .map((appointment) => (
                    <Button
                      key={`reschedule-${appointment.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRescheduleAppointment(appointment)}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Reschedule {appointment.title}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Dialog */}
      <AppointmentDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingAppointment(undefined);
        }}
        onSave={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
        appointment={editingAppointment}
        clients={[client]}
        currentUserId={currentUser.id}
        existingAppointments={appointments}
        isLoading={loading}
      />
    </>
  );
}