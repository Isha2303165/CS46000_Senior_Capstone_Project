import { useEffect, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { realTimeSyncService, type ConnectionStatus, type DataConflict } from '@/lib/real-time-sync';
import { client } from '@/lib/graphql-client';
import type { 
  Medication, 
  Appointment, 
  Message, 
  MedicationLog,
  CreateMedicationLogInput,
  UpdateMedicationInput,
  UpdateAppointmentInput,
  CreateMessageInput
} from '@/types';

// Hook for connection status
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(
    realTimeSyncService.getConnectionStatus()
  );

  useEffect(() => {
    const unsubscribe = realTimeSyncService.onConnectionStatusChange(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

// Hook for subscribing to client data
export function useClientRealTimeSync(clientId: string | undefined) {
  useEffect(() => {
    if (!clientId) return;

    realTimeSyncService.subscribeToClientData(clientId);

    return () => {
      realTimeSyncService.unsubscribeFromClientData(clientId);
    };
  }, [clientId]);

  return {
    connectionStatus: useConnectionStatus(),
    conflicts: useConflicts(),
  };
}

// Hook for managing conflicts
export function useConflicts() {
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);

  useEffect(() => {
    // Poll for conflicts (in a real app, you might use an event emitter)
    const interval = setInterval(() => {
      setConflicts(realTimeSyncService.getConflicts());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const resolveConflict = useCallback((conflictId: string, strategy: 'local' | 'remote' | 'merge') => {
    realTimeSyncService.resolveConflict(conflictId, { strategy });
  }, []);

  return {
    conflicts,
    resolveConflict,
  };
}

// Hook for optimistic medication logging
export function useOptimisticMedicationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMedicationLogInput) => {
      // Optimistic update: immediately update UI
      const optimisticLog: MedicationLog = {
        id: `temp-${Date.now()}`,
        medicationId: input.medicationId,
        takenAt: input.takenAt,
        scheduledFor: input.scheduledFor,
        dosageTaken: input.dosageTaken,
        takenBy: input.takenBy,
        status: input.status,
        notes: input.notes,
        sideEffectsNoted: input.sideEffectsNoted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update medication logs cache optimistically
      const logsKey = ['medication-logs', input.medicationId];
      const existingLogs = queryClient.getQueryData<MedicationLog[]>(logsKey) || [];
      const optimisticLogs = [optimisticLog, ...existingLogs];
      queryClient.setQueryData(logsKey, optimisticLogs);

      // Update medication cache optimistically (update lastTakenAt, etc.)
      const medicationKey = ['medications', 'detail', input.medicationId];
      const existingMedication = queryClient.getQueryData<Medication>(medicationKey);
      if (existingMedication) {
        const optimisticMedication: Medication = {
          ...existingMedication,
          lastTakenAt: input.takenAt,
          totalDoses: (existingMedication.totalDoses || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(medicationKey, optimisticMedication);
      }

      // Register optimistic update for conflict detection
      const rollback = () => {
        queryClient.setQueryData(logsKey, existingLogs);
        if (existingMedication) {
          queryClient.setQueryData(medicationKey, existingMedication);
        }
      };

      realTimeSyncService.addOptimisticUpdate(
        'medication-log',
        optimisticLog.id,
        'create',
        optimisticLog,
        rollback
      );

      // Perform actual mutation
      const response = await client.models.MedicationLog.create(input);
      
      if (response.errors) {
        // Rollback on error
        rollback();
        throw new Error(response.errors[0]?.message || 'Failed to log medication');
      }

      return response.data;
    },
    onSuccess: (newLog) => {
      if (newLog) {
        // Remove the temporary optimistic update
        const logsKey = ['medication-logs', newLog.medicationId];
        const currentLogs = queryClient.getQueryData<MedicationLog[]>(logsKey) || [];
        const updatedLogs = currentLogs.filter(log => !log.id.startsWith('temp-'));
        updatedLogs.unshift(newLog);
        queryClient.setQueryData(logsKey, updatedLogs);
      }
    },
    onError: (error) => {
      console.error('Failed to log medication:', error);
    },
  });
}

// Hook for optimistic medication updates
export function useOptimisticMedicationUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMedicationInput) => {
      const medicationKey = ['medications', 'detail', input.id];
      const existingMedication = queryClient.getQueryData<Medication>(medicationKey);
      
      if (!existingMedication) {
        throw new Error('Medication not found in cache');
      }

      // Optimistic update
      const optimisticMedication: Medication = {
        ...existingMedication,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(medicationKey, optimisticMedication);

      // Update client medications cache
      const clientMedicationsKey = ['medications', 'client', existingMedication.clientId];
      const existingClientMeds = queryClient.getQueryData<Medication[]>(clientMedicationsKey) || [];
      const optimisticClientMeds = existingClientMeds.map(med => 
        med.id === input.id ? optimisticMedication : med
      );
      queryClient.setQueryData(clientMedicationsKey, optimisticClientMeds);

      // Register optimistic update
      const rollback = () => {
        queryClient.setQueryData(medicationKey, existingMedication);
        queryClient.setQueryData(clientMedicationsKey, existingClientMeds);
      };

      realTimeSyncService.addOptimisticUpdate(
        'medication',
        input.id,
        'update',
        optimisticMedication,
        rollback
      );

      // Perform actual mutation
      const response = await client.models.Medication.update(input);
      
      if (response.errors) {
        rollback();
        throw new Error(response.errors[0]?.message || 'Failed to update medication');
      }

      return response.data;
    },
    onError: (error) => {
      console.error('Failed to update medication:', error);
    },
  });
}

// Hook for optimistic appointment updates
export function useOptimisticAppointmentUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAppointmentInput) => {
      const appointmentKey = ['appointments', 'detail', input.id];
      const existingAppointment = queryClient.getQueryData<Appointment>(appointmentKey);
      
      if (!existingAppointment) {
        throw new Error('Appointment not found in cache');
      }

      // Optimistic update
      const optimisticAppointment: Appointment = {
        ...existingAppointment,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(appointmentKey, optimisticAppointment);

      // Update appointments list cache
      const appointmentsListKey = ['appointments', 'list'];
      const existingAppointments = queryClient.getQueryData<Appointment[]>(appointmentsListKey) || [];
      const optimisticAppointments = existingAppointments.map(apt => 
        apt.id === input.id ? optimisticAppointment : apt
      );
      queryClient.setQueryData(appointmentsListKey, optimisticAppointments);

      // Register optimistic update
      const rollback = () => {
        queryClient.setQueryData(appointmentKey, existingAppointment);
        queryClient.setQueryData(appointmentsListKey, existingAppointments);
      };

      realTimeSyncService.addOptimisticUpdate(
        'appointment',
        input.id,
        'update',
        optimisticAppointment,
        rollback
      );

      // Perform actual mutation
      const response = await client.models.Appointment.update(input);
      
      if (response.errors) {
        rollback();
        throw new Error(response.errors[0]?.message || 'Failed to update appointment');
      }

      return response.data;
    },
    onError: (error) => {
      console.error('Failed to update appointment:', error);
    },
  });
}

// Hook for optimistic message sending
export function useOptimisticMessageSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMessageInput) => {
      // Optimistic update: immediately show message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        clientId: input.clientId,
        senderId: input.senderId,
        content: input.content,
        messageType: input.messageType || 'text',
        priority: input.priority || 'normal',
        attachments: input.attachments,
        mentions: input.mentions,
        isRead: false,
        readBy: [],
        readAt: [],
        threadId: input.threadId,
        replyToId: input.replyToId,
        systemData: input.systemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update messages cache optimistically
      const messagesKey = ['messages', 'client', input.clientId];
      const existingMessages = queryClient.getQueryData<Message[]>(messagesKey) || [];
      const optimisticMessages = [optimisticMessage, ...existingMessages];
      queryClient.setQueryData(messagesKey, optimisticMessages);

      // Register optimistic update
      const rollback = () => {
        queryClient.setQueryData(messagesKey, existingMessages);
      };

      realTimeSyncService.addOptimisticUpdate(
        'message',
        optimisticMessage.id,
        'create',
        optimisticMessage,
        rollback
      );

      // Perform actual mutation
      const response = await client.models.Message.create(input);
      
      if (response.errors) {
        rollback();
        throw new Error(response.errors[0]?.message || 'Failed to send message');
      }

      return response.data;
    },
    onSuccess: (newMessage) => {
      if (newMessage) {
        // Remove the temporary optimistic message
        const messagesKey = ['messages', 'client', newMessage.clientId];
        const currentMessages = queryClient.getQueryData<Message[]>(messagesKey) || [];
        const updatedMessages = currentMessages.filter(msg => !msg.id.startsWith('temp-'));
        updatedMessages.unshift(newMessage);
        queryClient.setQueryData(messagesKey, updatedMessages);
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
}

// Hook for batch operations with optimistic updates
export function useOptimisticBatchOperations() {
  const queryClient = useQueryClient();

  const batchLogMedications = useMutation({
    mutationFn: async (logs: CreateMedicationLogInput[]) => {
      const rollbacks: (() => void)[] = [];
      const optimisticLogs: MedicationLog[] = [];

      // Apply optimistic updates for all logs
      logs.forEach((input, index) => {
        const optimisticLog: MedicationLog = {
          id: `temp-batch-${Date.now()}-${index}`,
          medicationId: input.medicationId,
          takenAt: input.takenAt,
          scheduledFor: input.scheduledFor,
          dosageTaken: input.dosageTaken,
          takenBy: input.takenBy,
          status: input.status,
          notes: input.notes,
          sideEffectsNoted: input.sideEffectsNoted,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        optimisticLogs.push(optimisticLog);

        // Update medication logs cache
        const logsKey = ['medication-logs', input.medicationId];
        const existingLogs = queryClient.getQueryData<MedicationLog[]>(logsKey) || [];
        const optimisticLogsForMed = [optimisticLog, ...existingLogs];
        queryClient.setQueryData(logsKey, optimisticLogsForMed);

        // Store rollback function
        rollbacks.push(() => {
          queryClient.setQueryData(logsKey, existingLogs);
        });
      });

      // Register batch optimistic update
      const batchRollback = () => {
        rollbacks.forEach(rollback => rollback());
      };

      realTimeSyncService.addOptimisticUpdate(
        'medication-log-batch',
        `batch-${Date.now()}`,
        'create',
        optimisticLogs,
        batchRollback
      );

      // Perform actual mutations
      const results = await Promise.allSettled(
        logs.map(input => client.models.MedicationLog.create(input))
      );

      // Check for errors
      const errors = results
        .filter((result): result is PromiseRejectedReason => result.status === 'rejected')
        .map(result => result.reason);

      if (errors.length > 0) {
        batchRollback();
        throw new Error(`Batch operation failed: ${errors.length} errors`);
      }

      // Return successful results
      return results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value.data)
        .filter(Boolean);
    },
    onError: (error) => {
      console.error('Batch medication logging failed:', error);
    },
  });

  return {
    batchLogMedications,
  };
}

// Hook for managing optimistic updates
export function useOptimisticUpdates() {
  const [updates, setUpdates] = useState(realTimeSyncService.getOptimisticUpdates());

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdates(realTimeSyncService.getOptimisticUpdates());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const rollbackUpdate = useCallback((updateId: string) => {
    realTimeSyncService.rollbackOptimisticUpdate(updateId);
  }, []);

  const rollbackAll = useCallback(() => {
    realTimeSyncService.rollbackAllOptimisticUpdates();
  }, []);

  return {
    updates,
    rollbackUpdate,
    rollbackAll,
  };
}

// Hook for connection recovery
export function useConnectionRecovery() {
  const connectionStatus = useConnectionStatus();
  const queryClient = useQueryClient();

  const forceReconnect = useCallback(() => {
    realTimeSyncService.unsubscribeAll();
    // Reconnection will happen automatically when components re-subscribe
  }, []);

  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const isOnline = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  const hasError = connectionStatus === 'error';

  return {
    connectionStatus,
    isOnline,
    isConnecting,
    hasError,
    forceReconnect,
    refreshAllData,
  };
}