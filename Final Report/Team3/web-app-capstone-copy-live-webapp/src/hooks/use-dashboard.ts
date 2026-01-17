import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useMemo } from 'react';
import { client } from '@/lib/graphql-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useClients, clientKeys } from './use-clients';
import { useMedications, medicationKeys } from './use-medications';
import { useAppointments } from './use-appointments';
import { useMessages } from './use-messages';
import type { Client, Medication, Appointment, Message } from '@/types';

// Analytics tracking
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export interface DashboardStats {
  totalClients: number;
  activeMedications: number;
  upcomingAppointments: number;
  unreadMessages: number;
  overdueReminders: number;
  todaysTasks: number;
}

export interface DashboardActivity {
  id: string;
  type: 'medication_taken' | 'appointment_scheduled' | 'message_sent' | 'client_updated';
  title: string;
  description: string;
  timestamp: string;
  clientId?: string;
  clientName?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  clients: Client[];
  recentActivity: DashboardActivity[];
  urgentTasks: Array<{
    id: string;
    type: 'medication' | 'appointment' | 'message';
    title: string;
    description: string;
    dueAt: string;
    clientId: string;
    clientName: string;
  }>;
  activeMedicationDetails: {
    id: string;
    name: string;
    dosage: string;
    unit: string;
    frequency: string;
    clientId: string;
    clientName: string;
    isActive: boolean;
    nextDueAt?: string;
    missedDoses: number;
    totalDoses: number;
  }[];
}

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
};

export function useDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Fetch all related data
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: medications = [], isLoading: medicationsLoading } = useMedications();
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { data: messages = [], isLoading: messagesLoading } = useMessages();

  const isLoading = clientsLoading || medicationsLoading || appointmentsLoading || messagesLoading;

  // Calculate dashboard statistics
  const stats = useMemo((): DashboardStats => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Active medications (not ended and active)
    const activeMedications = medications.filter(med => 
      med.isActive && (!med.endDate || new Date(med.endDate) >= now)
    );


    // Upcoming appointments (next 7 days)
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return aptDate >= now && aptDate <= weekFromNow && apt.status === 'scheduled';
    });

    // Unread messages
    const unreadMessages = messages.filter(msg => !msg.isRead);

    // Overdue medications
    const overdueReminders = medications.filter(med => {
      if (!med.nextDueAt || !med.isActive) return false;
      return new Date(med.nextDueAt) < now;
    });

    // Today's tasks (medications due today + appointments today)
    const todaysMedications = medications.filter(med => {
      if (!med.nextDueAt || !med.isActive) return false;
      return med.nextDueAt.startsWith(today);
    });
    
    const todaysAppointments = appointments.filter(apt => 
      apt.appointmentDate === today && apt.status === 'scheduled'
    );

    return {
      totalClients: clients.length,
      activeMedications: activeMedications.length,
      upcomingAppointments: upcomingAppointments.length,
      unreadMessages: unreadMessages.length,
      overdueReminders: overdueReminders.length,
      todaysTasks: todaysMedications.length + todaysAppointments.length,
    };
  }, [clients, medications, appointments, messages]);

  // Generate recent activity feed
  const recentActivity = useMemo((): DashboardActivity[] => {
    const activities: DashboardActivity[] = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Recent medication logs
    medications.forEach(med => {
      if (med.lastTakenAt && new Date(med.lastTakenAt) >= oneDayAgo) {
        const client = clients.find(p => p.id === med.clientId);
        activities.push({
          id: `med-${med.id}`,
          type: 'medication_taken',
          title: 'Medication Taken',
          description: `${med.name} taken for ${client?.firstName} ${client?.lastName}`,
          timestamp: med.lastTakenAt,
          clientId: med.clientId,
          clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
          priority: 'normal',
        });
      }
    });

    // Recent appointments
    appointments
      .filter(apt => new Date(apt.createdAt) >= oneDayAgo)
      .forEach(apt => {
        const client = clients.find(p => p.id === apt.clientId);
        activities.push({
          id: `apt-${apt.id}`,
          type: 'appointment_scheduled',
          title: 'Appointment Scheduled',
          description: `${apt.title} with ${apt.providerName}`,
          timestamp: apt.createdAt,
          clientId: apt.clientId,
          clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
          priority: apt.priority,
          actionUrl: `/calendar?appointment=${apt.id}`,
        });
      });

    // Recent messages
    messages
      .filter(msg => new Date(msg.createdAt) >= oneDayAgo)
      .forEach(msg => {
        const client = clients.find(p => p.id === msg.clientId);
        activities.push({
          id: `msg-${msg.id}`,
          type: 'message_sent',
          title: 'New Message',
          description: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
          timestamp: msg.createdAt,
          clientId: msg.clientId,
          clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
          priority: msg.priority,
          actionUrl: `/chat?client=${msg.clientId}`,
        });
      });

    // Recent client updates
    clients
      .filter(client => new Date(client.updatedAt) >= oneDayAgo)
      .forEach(client => {
        activities.push({
          id: `client-${client.id}`,
          type: 'client_updated',
          title: 'Client Updated',
          description: `Profile updated for ${client.firstName} ${client.lastName}`,
          timestamp: client.updatedAt,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          priority: 'normal',
          actionUrl: `/clients/${client.id}`,
        });
      });

    // Sort by timestamp (most recent first) and limit to 20
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [clients, medications, appointments, messages]);

  // Generate urgent tasks
  const urgentTasks = useMemo(() => {
    const tasks: DashboardData['urgentTasks'] = [];
    const now = new Date();

    // Overdue medications
    medications.forEach(med => {
      if (med.nextDueAt && med.isActive && new Date(med.nextDueAt) < now) {
        const client = clients.find(p => p.id === med.clientId);
        if (client) {
          tasks.push({
            id: `med-${med.id}`,
            type: 'medication',
            title: 'Overdue Medication',
            description: `${med.name} - ${med.dosage}`,
            dueAt: med.nextDueAt,
            clientId: med.clientId,
            clientName: `${client.firstName} ${client.lastName}`,
          });
        }
      }
    });

    // Upcoming appointments (next 2 hours)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    appointments.forEach(apt => {
      const aptDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      if (aptDateTime >= now && aptDateTime <= twoHoursFromNow && apt.status === 'scheduled') {
        const client = clients.find(p => p.id === apt.clientId);
        if (client) {
          tasks.push({
            id: `apt-${apt.id}`,
            type: 'appointment',
            title: 'Upcoming Appointment',
            description: `${apt.title} with ${apt.providerName}`,
            dueAt: aptDateTime.toISOString(),
            clientId: apt.clientId,
            clientName: `${client.firstName} ${client.lastName}`,
          });
        }
      }
    });

    // Urgent unread messages
    messages.forEach(msg => {
      if (!msg.isRead && msg.priority === 'urgent') {
        const client = clients.find(p => p.id === msg.clientId);
        if (client) {
          tasks.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: 'Urgent Message',
            description: msg.content.substring(0, 100),
            dueAt: msg.createdAt,
            clientId: msg.clientId,
            clientName: `${client.firstName} ${client.lastName}`,
          });
        }
      }
    });

    return tasks.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [clients, medications, appointments, messages]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    // Subscribe to client updates
    const setupClientSub = async () => {
      let filter: any = { isActive: { eq: true } };
      try {
        const relationships = await client.models.ClientCaregiver.list({
          filter: { caregiverId: { eq: user.id }, isActive: { eq: true } },
        });
        const rels = relationships.data || [];
        if (rels.length > 0) {
          filter = { and: [ filter, { or: rels.map((r) => ({ id: { eq: r.clientId } })) } ] };
        } else {
          filter = { and: [ filter, { id: { eq: '__none__' } } ] };
        }
      } catch (err) {
        console.error('Error preparing client subscription filter:', err);
      }

      return client.models.Client.observeQuery({ filter }).subscribe({
        next: ({ items }) => {
          queryClient.setQueryData(
            clientKeys.list({ caregiverId: user.id }),
            items
          );
        },
        error: (error) => console.error('Client subscription error:', error)
      });
    };
    const clientSubPromise = setupClientSub();
    subscriptions.push({ unsubscribe: () => { clientSubPromise.then(sub => sub.unsubscribe()); } });

    // Subscribe to medication updates
    const setupMedicationSub = async () => {
      let filter: any = { isActive: { eq: true } };
      try {
        const relationships = await client.models.ClientCaregiver.list({
          filter: { caregiverId: { eq: user.id }, isActive: { eq: true } },
        });
        const rels = relationships.data || [];
        if (rels.length > 0) {
          filter = { and: [ filter, { or: rels.map((r) => ({ clientId: { eq: r.clientId } })) } ] };
        } else {
          filter = { and: [ filter, { clientId: { eq: '__none__' } } ] };
        }
      } catch (err) {
        console.error('Error preparing medication subscription filter:', err);
      }

      return client.models.Medication.observeQuery({ filter }).subscribe({
        next: ({ items }) => {
          queryClient.setQueryData(
            medicationKeys.list({ caregiverId: user.id }),
            items
          );
        },
        error: (error) => console.error('Medication subscription error:', error)
      });
    };
    const medicationSubPromise = setupMedicationSub();
    subscriptions.push({ unsubscribe: () => { medicationSubPromise.then(sub => sub.unsubscribe()); } });

    // Subscribe to appointment updates
    const appointmentSub = client.models.Appointment.observeQuery().subscribe({
      next: ({ items }) => {
        queryClient.setQueryData(['appointments', 'list'], items);
      },
      error: (error) => console.error('Appointment subscription error:', error)
    });
    subscriptions.push(appointmentSub);

    // Subscribe to message updates
    const messageSub = client.models.Message.observeQuery().subscribe({
      next: ({ items }) => {
        queryClient.setQueryData(['messages', 'list'], items);
      },
      error: (error) => console.error('Message subscription error:', error)
    });
    subscriptions.push(messageSub);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [user, queryClient]);

  // Analytics tracking functions
  const trackPageView = useCallback((page: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Dashboard',
        page_location: window.location.href,
        custom_map: { dimension1: user?.role }
      });
    }
  }, [user?.role]);

  const trackAction = useCallback((action: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: 'dashboard',
        event_label: parameters?.action || parameters?.stat,
        custom_map: { dimension1: user?.role },
        ...parameters
      });
    }
  }, [user?.role]);

  const activeMedicationDetails = useMemo(() => {
    const activeList: {
      medId: string;
      name: string;
      dosage: string;
      unit: string;
      frequency: string;
      clientId: string;
      clientName: string;
      startDate?: string;
      endDate?: string;
      missedDoses: number;
      totalDoses: number;
    }[] = [];

    medications.forEach(med => {
      if (med.isActive) {
        const client = clients.find(c => c.id === med.clientId);

        if (client) {
          activeList.push({
            medId: med.id,
            name: med.name,
            dosage: med.dosage,
            unit: med.unit,
            frequency: med.frequency,
            clientId: med.clientId,
            clientName: `${client.firstName} ${client.lastName}`,
            startDate: med.startDate,
            endDate: med.endDate,
            missedDoses: med.missedDoses,
            totalDoses: med.totalDoses,
          });
        }
      }
    });

    return activeList;
  }, [medications, clients]);


  // Combine all data
  const dashboardData: DashboardData = {
    stats,
    clients,
    recentActivity,
    urgentTasks,
    activeMedicationDetails,
  };


  return {
    data: dashboardData,
    isLoading,
    error: null,
    trackPageView,
    trackAction,
  };
}

// Hook for dashboard performance optimization
export function useDashboardOptimization() {
  const queryClient = useQueryClient();

  const prefetchClientDetails = useCallback((clientId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['clients', 'detail', clientId],
      queryFn: async () => {
        const response = await client.models.Client.get({ id: clientId });
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);

  const prefetchMedicationHistory = useCallback((medicationId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['medications', 'logs', medicationId],
      queryFn: async () => {
        const response = await client.models.MedicationLog.list({
          filter: { medicationId: { eq: medicationId } }
        });
        return response.data || [];
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient]);

  return {
    prefetchClientDetails,
    prefetchMedicationHistory,
  };
}