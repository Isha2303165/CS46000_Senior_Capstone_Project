'use client';

import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/graphql-client';
import { 
  Appointment, 
  CreateAppointmentInput, 
  UpdateAppointmentInput,
  Client,
  UserProfile
} from '@/types';
import { useAppointmentEmails } from '@/lib/ses-email-service';
import { format, addHours, isBefore, isAfter, parseISO } from 'date-fns';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface UseAppointmentsOptions {
  clientId?: string;
  caregiverId?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AppointmentConflict {
  appointment: Appointment;
  conflictType: 'overlap' | 'same_time' | 'back_to_back';
  message: string;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const { user } = useAuthStore();

  const { sendUpdate, sendReminder, sendUrgentAlert } = useAppointmentEmails();

  // Fetch appointments with optional filtering
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      // Apply filters if provided
      if (options.clientId) {
        result = await client.models.Appointment.list({
          filter: { clientId: { eq: options.clientId } }
        });
      } else {
        // Scope to the current caregiver's clients
        if (!user?.id) {
          setAppointments([]);
          setLoading(false);
          return;
        }
        const profileLookup = await client.models.UserProfile.list({
          filter: { userId: { eq: user.id } },
          limit: 1,
        });
        const caregiverKeyId = profileLookup.data?.[0]?.id || user.id;
        const relationships = await client.models.ClientCaregiver.list({
          filter: {
            and: [
              { isActive: { eq: true } },
              { or: [ { caregiverId: { eq: user.id } }, { caregiverId: { eq: caregiverKeyId } } ] }
            ]
          },
        });
        const rels = relationships.data || [];
        if (rels.length === 0) {
          setAppointments([]);
          setLoading(false);
          return;
        }
        const clientIdOr = rels.map((r) => ({ clientId: { eq: r.clientId } }));
        result = await client.models.Appointment.list({
          filter: { or: clientIdOr }
        });
      }
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to fetch appointments');
      }

      let fetchedAppointments = result.data || [];

      // Apply additional client-side filters
      if (options.status) {
        fetchedAppointments = fetchedAppointments.filter(apt => apt.status === options.status);
      }

      if (options.dateRange) {
        const startDate = new Date(options.dateRange.start);
        const endDate = new Date(options.dateRange.end);
        fetchedAppointments = fetchedAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= startDate && aptDate <= endDate;
        });
      }

      // Sort by date and time
      fetchedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(fetchedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [options.clientId, options.status, options.dateRange?.start, options.dateRange?.end, user?.id]);

  // Create new appointment
  const createAppointment = async (input: CreateAppointmentInput): Promise<Appointment> => {
    setLoading(true);
    setError(null);

    try {
      // Remove empty-string optional fields that backend may reject
      const sanitize = <T extends Record<string, any>>(obj: T): T => {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value === '') continue; // drop empty strings
          cleaned[key] = value;
        }
        return cleaned as T;
      };

      const sanitizedInput = sanitize(input);

      // Check for conflicts before creating
      const conflicts = await checkAppointmentConflicts(sanitizedInput);
      if (conflicts.length > 0) {
        throw new Error(`Appointment conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
      }

      const result = await client.models.Appointment.create(sanitizedInput);
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to create appointment');
      }

      const newAppointment = result.data!;

      // Update local state
      setAppointments(prev => [...prev, newAppointment].sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        return dateA.getTime() - dateB.getTime();
      }));

      // Send notification emails to caregivers
      await notifyCaregivers(newAppointment, 'created');

      // Schedule reminder emails
      await scheduleAppointmentReminders(newAppointment);

      return newAppointment;
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update existing appointment
  const updateAppointment = async (input: UpdateAppointmentInput): Promise<Appointment> => {
    setLoading(true);
    setError(null);

    try {
      // Remove empty-string optional fields to avoid invalid values
      const sanitize = <T extends Record<string, any>>(obj: T): T => {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value === '') continue; // drop empty strings
          cleaned[key] = value;
        }
        return cleaned as T;
      };

      const sanitizedInput = sanitize(input);

      // Get the current appointment for comparison
      const currentAppointment = appointments.find(apt => apt.id === sanitizedInput.id);
      if (!currentAppointment) {
        throw new Error('Appointment not found');
      }

      // Check for conflicts if date/time changed
      if (sanitizedInput.appointmentDate || sanitizedInput.appointmentTime || sanitizedInput.duration) {
        const conflicts = await checkAppointmentConflicts(sanitizedInput, sanitizedInput.id);
        if (conflicts.length > 0) {
          throw new Error(`Appointment conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
        }
      }

      const result = await client.models.Appointment.update(sanitizedInput);
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to update appointment');
      }

      const updatedAppointment = result.data!;

      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      ).sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        return dateA.getTime() - dateB.getTime();
      }));

      // Send notification emails to caregivers with changes
      const changes = getAppointmentChanges(currentAppointment, updatedAppointment);
      if (Object.keys(changes).length > 0) {
        await notifyCaregivers(updatedAppointment, 'updated', changes);
      }

      // Reschedule reminder emails if date/time changed
      if (input.appointmentDate || input.appointmentTime || input.reminderTimes) {
        await scheduleAppointmentReminders(updatedAppointment);
      }

      return updatedAppointment;
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment
  const deleteAppointment = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const appointmentToDelete = appointments.find(apt => apt.id === id);
      if (!appointmentToDelete) {
        throw new Error('Appointment not found');
      }

      const result = await client.models.Appointment.delete({ id });
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to delete appointment');
      }

      // Update local state
      setAppointments(prev => prev.filter(apt => apt.id !== id));

      // Send cancellation notification
      await notifyCaregivers(appointmentToDelete, 'cancelled');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check for appointment conflicts (memoized to ensure stable identity)
  const checkAppointmentConflicts = useCallback(
    async (
      appointmentData: CreateAppointmentInput | UpdateAppointmentInput,
      excludeId?: string
    ): Promise<AppointmentConflict[]> => {
      if (!appointmentData.clientId || !appointmentData.appointmentDate || 
          !appointmentData.appointmentTime || !appointmentData.duration) {
        return [];
      }

      try {
        // Fetch appointments for the same client on the same date
        const result = await client.models.Appointment.list({
          filter: {
            clientId: { eq: appointmentData.clientId },
            appointmentDate: { eq: appointmentData.appointmentDate },
            status: { ne: 'cancelled' }
          }
        });

        if (result.errors) {
          console.error('Error checking conflicts:', result.errors);
          return [];
        }

        const existingAppointments = (result.data || [])
          .filter(apt => apt.id !== excludeId)
          .filter(apt => apt.status !== 'cancelled'); // Filter out cancelled appointments
        const conflicts: AppointmentConflict[] = [];

        const newStart = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
        const newEnd = new Date(newStart.getTime() + (appointmentData.duration * 60000));

        for (const existing of existingAppointments) {
          const existingStart = new Date(`${existing.appointmentDate}T${existing.appointmentTime}`);
          const existingEnd = new Date(existingStart.getTime() + (existing.duration * 60000));

          // Check for exact same time
          if (newStart.getTime() === existingStart.getTime()) {
            conflicts.push({
              appointment: existing,
              conflictType: 'same_time',
              message: `Same time as "${existing.title}" at ${format(existingStart, 'h:mm a')}`
            });
          }
          // Check for overlap
          else if (newStart < existingEnd && newEnd > existingStart) {
            conflicts.push({
              appointment: existing,
              conflictType: 'overlap',
              message: `Overlaps with "${existing.title}" (${format(existingStart, 'h:mm a')} - ${format(existingEnd, 'h:mm a')})`
            });
          }
          // Check for back-to-back (within 15 minutes)
          else if (
            Math.abs(newStart.getTime() - existingEnd.getTime()) <= 15 * 60000 ||
            Math.abs(existingStart.getTime() - newEnd.getTime()) <= 15 * 60000
          ) {
            conflicts.push({
              appointment: existing,
              conflictType: 'back_to_back',
              message: `Very close to "${existing.title}" - consider travel time`
            });
          }
        }

        return conflicts;
      } catch (error) {
        console.error('Error checking appointment conflicts:', error);
        return [];
      }
    },
    []
  );

  // Get appointments for a specific date range
  const getAppointmentsByDateRange = (startDate: string, endDate: string): Appointment[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= start && aptDate <= end;
    });
  };

  // Get upcoming appointments
  const getUpcomingAppointments = (days: number = 7): Appointment[] => {
    const now = new Date();
    const futureDate = addHours(now, days * 24);
    
    return appointments.filter(apt => {
      const aptDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return aptDateTime >= now && aptDateTime <= futureDate && apt.status !== 'cancelled';
    });
  };

  // Get overdue appointments (past appointments that are still scheduled)
  const getOverdueAppointments = (): Appointment[] => {
    const now = new Date();
    
    return appointments.filter(apt => {
      const aptDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      return aptDateTime < now && apt.status === 'scheduled';
    });
  };

  // Send notifications to caregivers
  const notifyCaregivers = async (
    appointment: Appointment,
    changeType: 'created' | 'updated' | 'cancelled' | 'confirmed',
    changes?: Record<string, { old: any; new: any }>
  ) => {
    try {
      // Get client and caregivers
      const clientResult = await client.models.Client.get({ id: appointment.clientId });
      if (!clientResult.data) return;

      const clientData = clientResult.data;
      
      // Get caregivers for this client
      const caregiversResult = await client.models.ClientCaregiver.list({
        filter: { clientId: { eq: appointment.clientId }, isActive: { eq: true } }
      });

      if (!caregiversResult.data) return;

      // Get caregiver emails
      const caregiverEmails: string[] = [];
      for (const pc of caregiversResult.data) {
        if (pc.caregiver?.email) {
          caregiverEmails.push(pc.caregiver.email);
        }
      }

      if (caregiverEmails.length === 0) return;

      // Get the user who made the change
      const creatorResult = await client.models.UserProfile.get({ id: appointment.createdBy });
      const changedBy = creatorResult.data ? 
        `${creatorResult.data.firstName} ${creatorResult.data.lastName}` : 
        'System';

      await sendUpdate({
        appointmentId: appointment.id,
        clientName: `${clientData.firstName} ${clientData.lastName}`,
        appointmentTitle: appointment.title,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        providerName: appointment.providerName,
        changeType,
        changedBy,
        caregiverEmails,
        changes,
      });
    } catch (error) {
      console.error('Error notifying caregivers:', error);
    }
  };

  // Schedule appointment reminder emails
  const scheduleAppointmentReminders = async (appointment: Appointment) => {
    try {
      if (!appointment.reminderTimes || appointment.reminderTimes.length === 0) {
        return;
      }

      // Get client and caregivers
      const clientResult = await client.models.Client.get({ id: appointment.clientId });
      if (!clientResult.data) return;

      const clientData = clientResult.data;
      
      // Get caregivers for this client
      const caregiversResult = await client.models.ClientCaregiver.list({
        filter: { clientId: { eq: appointment.clientId }, isActive: { eq: true } }
      });

      if (!caregiversResult.data) return;

      // Get caregiver emails
      const caregiverEmails: string[] = [];
      for (const pc of caregiversResult.data) {
        if (pc.caregiver?.email) {
          caregiverEmails.push(pc.caregiver.email);
        }
      }

      if (caregiverEmails.length === 0) return;

      // Schedule reminders for each time
      for (const hoursBeforeAppointment of appointment.reminderTimes) {
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
        const reminderTime = new Date(appointmentDateTime.getTime() - (hoursBeforeAppointment * 60 * 60 * 1000));

        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
          // In a real implementation, this would use AWS EventBridge to schedule the email
          // For now, we'll use setTimeout as a demo
          const delay = reminderTime.getTime() - Date.now();
          
          setTimeout(async () => {
            await sendReminder({
              appointmentId: appointment.id,
              clientName: `${clientData.firstName} ${clientData.lastName}`,
              appointmentTitle: appointment.title,
              appointmentDate: appointment.appointmentDate,
              appointmentTime: appointment.appointmentTime,
              duration: appointment.duration,
              providerName: appointment.providerName,
              providerPhone: appointment.providerPhone,
              locationType: appointment.locationType,
              address: appointment.address,
              roomNumber: appointment.roomNumber,
              teleHealthLink: appointment.teleHealthLink,
              preparationInstructions: appointment.preparationInstructions,
              documentsNeeded: appointment.documentsNeeded,
              caregiverEmails,
              hoursBeforeAppointment,
            });
          }, Math.min(delay, 2147483647)); // Max setTimeout value
        }
      }
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
    }
  };

  // Get changes between appointments for notifications
  const getAppointmentChanges = (
    oldAppointment: Appointment,
    newAppointment: Appointment
  ): Record<string, { old: any; new: any }> => {
    const changes: Record<string, { old: any; new: any }> = {};

    const fieldsToCheck = [
      'title', 'appointmentDate', 'appointmentTime', 'duration',
      'providerName', 'locationType', 'address', 'status'
    ];

    for (const field of fieldsToCheck) {
      const oldValue = (oldAppointment as any)[field];
      const newValue = (newAppointment as any)[field];
      
      if (oldValue !== newValue) {
        changes[field] = { old: oldValue, new: newValue };
      }
    }

    return changes;
  };

  // Set up real-time subscription
  useEffect(() => {
    const sub = client.models.Appointment.observeQuery().subscribe({
      next: ({ items }) => {
        let filteredItems = items;

        // Apply filters
        if (options.clientId) {
          filteredItems = filteredItems.filter(apt => apt.clientId === options.clientId);
        }

        if (options.status) {
          filteredItems = filteredItems.filter(apt => apt.status === options.status);
        }

        if (options.dateRange) {
          const startDate = new Date(options.dateRange.start);
          const endDate = new Date(options.dateRange.end);
          filteredItems = filteredItems.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= startDate && aptDate <= endDate;
          });
        }

        // Sort by date and time
        filteredItems.sort((a, b) => {
          const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
          const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
          return dateA.getTime() - dateB.getTime();
        });

        setAppointments(filteredItems);
      },
      error: (err) => {
        console.error('Appointment subscription error:', err);
        setError('Real-time updates failed');
      }
    });

    setSubscription(sub);

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [options.clientId, options.status, options.dateRange?.start, options.dateRange?.end]);

  // Initial fetch
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkAppointmentConflicts,
    getAppointmentsByDateRange,
    getUpcomingAppointments,
    getOverdueAppointments,
    refetch: fetchAppointments,
  };
}