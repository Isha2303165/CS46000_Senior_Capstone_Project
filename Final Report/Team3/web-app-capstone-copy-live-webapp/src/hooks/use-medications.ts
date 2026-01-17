import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql-client';
import { useMedicationScheduler } from '@/lib/eventbridge-scheduler';
import { usePushNotifications } from '@/lib/push-notifications';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { 
  Medication, 
  MedicationLog,
  CreateMedicationInput, 
  UpdateMedicationInput,
  CreateMedicationLogInput 
} from '@/types';

// Query keys
export const medicationKeys = {
  all: ['medications'] as const,
  lists: () => [...medicationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...medicationKeys.lists(), { filters }] as const,
  details: () => [...medicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...medicationKeys.details(), id] as const,
  logs: () => [...medicationKeys.all, 'logs'] as const,
  clientMedications: (clientId: string) => [...medicationKeys.all, 'client', clientId] as const,
  dueMedications: () => [...medicationKeys.all, 'due'] as const,
};

// Hook to fetch medications for a client
export function useClientMedications(clientId: string) {
  return useQuery({
    queryKey: medicationKeys.clientMedications(clientId),
    queryFn: async () => {
      const response = await client.models.Medication.list({
        filter: { 
          clientId: { eq: clientId },
          isActive: { eq: true }
        }
      });
      return response.data || [];
    },
    enabled: !!clientId,
    staleTime: 0, // Always consider stale to ensure fresh data
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

// Hook to fetch all medications
export function useMedications() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: medicationKeys.list({ caregiverId: user?.id ?? 'anonymous' }),
    queryFn: async () => {
      if (!user?.id) return [];

      // Resolve caregiver key id
      const profileLookup = await client.models.UserProfile.list({
        filter: { userId: { eq: user.id } },
        limit: 1,
      });
      const caregiverKeyId = profileLookup.data?.[0]?.id || user.id;

      // Get clientIds the caregiver has access to
      const relationships = await client.models.ClientCaregiver.list({
        filter: {
          and: [
            { isActive: { eq: true } },
            { or: [ { caregiverId: { eq: user.id } }, { caregiverId: { eq: caregiverKeyId } } ] }
          ]
        },
      });
      const rels = relationships.data || [];
      if (rels.length === 0) return [];

      const clientIdOr = rels.map((r) => ({ clientId: { eq: r.clientId } }));
      const response = await client.models.Medication.list({
        filter: { and: [ { isActive: { eq: true } }, { or: clientIdOr } ] },
      });
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to fetch due medications (for reminders)
export function useDueMedications() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: [...medicationKeys.dueMedications(), { caregiverId: user?.id ?? 'anonymous' }],
    queryFn: async () => {
      if (!user?.id) return [];
      const now = new Date().toISOString();

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
      if (rels.length === 0) return [];
      const clientIdOr = rels.map((r) => ({ clientId: { eq: r.clientId } }));

      const response = await client.models.Medication.list({
        filter: { and: [ { isActive: { eq: true } }, { nextDueAt: { le: now } }, { or: clientIdOr } ] },
      });
      return response.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds for due medications
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook to fetch a single medication by ID
export function useMedication(id: string) {
  return useQuery({
    queryKey: medicationKeys.detail(id),
    queryFn: async () => {
      const response = await client.models.Medication.get({ id });
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook to create a new medication with EventBridge scheduling
export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMedicationInput) => {
      // Sanitize: drop empty-string fields and empty arrays to prevent backend validation errors
      const sanitize = <T extends Record<string, any>>(obj: T): T => {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value === '') continue;
          if (Array.isArray(value) && value.length === 0) continue;
          cleaned[key] = value;
        }
        return cleaned as T;
      };

      const baseInput = sanitize(input);
      // Calculate next due time based on schedule
      const nextDueAt = calculateNextDueTime(baseInput);
      
      const response = await client.models.Medication.create({
        ...baseInput,
        nextDueAt: nextDueAt?.toISOString(),
        totalDoses: 0,
        missedDoses: 0,
      });

      // Set up EventBridge scheduling for non-PRN medications
      if (response.data && !baseInput.isPRN && baseInput.scheduledTimes) {
        try {
          const { eventBridgeScheduler } = await import('@/lib/eventbridge-scheduler');
          await eventBridgeScheduler.createMedicationSchedule({
            medicationId: response.data.id,
            clientId: response.data.clientId,
            medicationName: response.data.name,
            scheduledTimes: baseInput.scheduledTimes,
          });
        } catch (error) {
          console.error('Error setting up medication schedule:', error);
        }
      }

      return response.data;
    },
    onSuccess: (newMedication) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: medicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: medicationKeys.dueMedications() });
      
      if (newMedication) {
        // Add to client medications cache
        queryClient.invalidateQueries({ 
          queryKey: medicationKeys.clientMedications(newMedication.clientId) 
        });
        
        // Add the new medication to the cache
        queryClient.setQueryData(medicationKeys.detail(newMedication.id), newMedication);
      }
    },
  });
}

// Hook to update a medication with EventBridge rescheduling
export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateMedicationInput) => {
      
      const sanitize = <T extends Record<string, any>>(obj: T): T => {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value === '') continue;
          if (Array.isArray(value) && value.length === 0) continue;
          cleaned[key] = value;
        }
        return cleaned as T;
      };

      const sanitized = sanitize(input as any);
      
      // Recalculate next due time if schedule changed
      const nextDueAt = sanitized.scheduleType || sanitized.scheduledTimes || sanitized.intervalHours 
        ? calculateNextDueTime(sanitized as CreateMedicationInput)
        : undefined;
      
      const updateData = nextDueAt 
        ? { ...sanitized, nextDueAt: nextDueAt.toISOString() }
        : sanitized;
      
      const response = await client.models.Medication.update({ id, ...updateData });
      
      if (!response.data) {
        console.error('No data in response:', response);
        if (response.errors) {
          console.error('GraphQL errors:', response.errors);
          throw new Error(response.errors[0]?.message || 'Failed to update medication');
        }
      }

      // Update EventBridge scheduling if schedule changed
      if (response.data && (sanitized.scheduledTimes || sanitized.scheduleType)) {
        try {
          const { eventBridgeScheduler } = await import('@/lib/eventbridge-scheduler');
          
          if (sanitized.isPRN) {
            // Remove scheduling for PRN medications
            await eventBridgeScheduler.deleteMedicationSchedule(id);
          } else if (sanitized.scheduledTimes) {
            // Update scheduling
            await eventBridgeScheduler.updateMedicationSchedule(id, {
              medicationId: id,
              clientId: response.data.clientId,
              medicationName: response.data.name,
              scheduledTimes: sanitized.scheduledTimes,
            });
          }
        } catch (error) {
          console.error('Error updating medication schedule:', error);
        }
      }

      return response.data;
    },
    onSuccess: (updatedMedication) => {
      if (updatedMedication) {
        // Update the medication in the cache
        queryClient.setQueryData(medicationKeys.detail(updatedMedication.id), updatedMedication);
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: medicationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: medicationKeys.dueMedications() });
        queryClient.invalidateQueries({ 
          queryKey: medicationKeys.clientMedications(updatedMedication.clientId) 
        });
      }
    },
  });
}

// Hook to delete a medication with EventBridge cleanup
export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by setting isActive to false
      const response = await client.models.Medication.update({ 
        id, 
        isActive: false 
      });

      // Clean up EventBridge schedules
      if (response.data) {
        try {
          const { eventBridgeScheduler } = await import('@/lib/eventbridge-scheduler');
          await eventBridgeScheduler.deleteMedicationSchedule(id);
        } catch (error) {
          console.error('Error cleaning up medication schedule:', error);
        }
      }

      return response.data;
    },
    onSuccess: (deletedMedication) => {
      if (deletedMedication) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: medicationKeys.detail(deletedMedication.id) });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: medicationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: medicationKeys.dueMedications() });
        queryClient.invalidateQueries({ 
          queryKey: medicationKeys.clientMedications(deletedMedication.clientId) 
        });
      }
    },
  });
}

// Hook to log medication taken - COMPLETELY REWRITTEN
export function useLogMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMedicationLogInput) => {
      // Create medication log
      const logResponse = await client.models.MedicationLog.create(input);
      
      if (!logResponse.data) {
        throw new Error('Failed to create medication log');
      }
      
      // Get current medication
      const medication = await client.models.Medication.get({ id: input.medicationId });
      if (!medication.data) {
        throw new Error('Medication not found');
      }
      
      // Calculate next due time PROPERLY
      const nextDueAt = calculateNextDueTime(medication.data);
      
      // Build update based on action type
      const updateData: any = {
        id: input.medicationId,
        nextDueAt: nextDueAt?.toISOString(),
      };
      
      // Only update relevant fields based on status
      if (input.status === 'taken' || input.status === 'partial') {
        updateData.lastTakenAt = input.takenAt;
        updateData.totalDoses = (medication.data.totalDoses || 0) + 1;
      }
      
      if (input.status === 'missed' || input.status === 'skipped') {
        updateData.missedDoses = (medication.data.missedDoses || 0) + 1;
      }
      
      // Update medication
      const updatedMedication = await client.models.Medication.update(updateData);
      
      if (!updatedMedication.data) {
        throw new Error('Failed to update medication');
      }
      
      return { 
        log: logResponse.data, 
        medication: updatedMedication.data,
        clientId: medication.data.clientId 
      };
    },
    onSuccess: async (result) => {
      // COMPLETELY CLEAR AND REFETCH - don't try to be clever with cache updates
      await queryClient.invalidateQueries({ 
        queryKey: medicationKeys.clientMedications(result.clientId)
      });
      
      // Refetch immediately
      await queryClient.refetchQueries({ 
        queryKey: medicationKeys.clientMedications(result.clientId)
      });
    },
    onError: (error) => {
      console.error('Medication log error:', error);
    }
    
  });
  
}

// Hook to get medication logs for a medication
export function useMedicationLogs(medicationId: string) {
  return useQuery({
    queryKey: [...medicationKeys.logs(), medicationId],
    queryFn: async () => {
      const response = await client.models.MedicationLog.list({
        filter: { medicationId: { eq: medicationId } }
      });
      return response.data || [];
    },
    enabled: !!medicationId,
  });
}

// Hook to subscribe to medication updates (real-time)
export function useMedicationSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return {
    subscribe: () => {
    const setupSubscription = async () => {
        let filter: any = { isActive: { eq: true } };
      if (user?.id) {
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
          if (rels.length > 0) {
            filter = { and: [ filter, { or: rels.map((r) => ({ clientId: { eq: r.clientId } })) } ] };
          } else {
            filter = { and: [ filter, { clientId: { eq: '__none__' } } ] };
          }
        }

        return client.models.Medication.observeQuery({ filter }).subscribe({
          next: ({ items }) => {
          // Update the medications list cache with real-time data
          queryClient.setQueryData(
              medicationKeys.list({ caregiverId: user?.id ?? 'anonymous' }),
              items
            );
          
          // Update individual medication caches
          items.forEach(medication => {
            queryClient.setQueryData(medicationKeys.detail(medication.id), medication);
          });
          
          // Update client-specific caches
          const clientGroups = items.reduce((acc, medication) => {
            if (!acc[medication.clientId]) {
              acc[medication.clientId] = [];
            }
            acc[medication.clientId].push(medication);
            return acc;
          }, {} as Record<string, Medication[]>);
          
          Object.entries(clientGroups).forEach(([clientId, medications]) => {
            queryClient.setQueryData(
              medicationKeys.clientMedications(clientId), 
              medications
            );
          });
          },
          error: (error) => {
            console.error('Medication subscription error:', error);
          }
        });
      };

      const subscriptionPromise = setupSubscription();
      return {
        unsubscribe: async () => {
          const sub = await subscriptionPromise;
          sub.unsubscribe();
        }
      } as any;
    }
  };
}

// Utility function to calculate next due time - SIMPLIFIED AND FIXED
function calculateNextDueTime(medication: CreateMedicationInput | Medication): Date | null {
  if (medication.isPRN) {
    return null;
  }

  const now = new Date();
  
  if (medication.scheduleType === 'fixed_times' && medication.scheduledTimes && medication.scheduledTimes.length > 0) {
    // Sort times
    const sortedTimes = [...medication.scheduledTimes].sort();
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check each scheduled time
    for (const timeStr of sortedTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Today's scheduled time
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If this time hasn't passed yet today, use it
      if (scheduledTime > now) {
        return scheduledTime;
      }
    }
    
    // All times have passed today, use first time tomorrow
    const [hours, minutes] = sortedTimes[0].split(':').map(Number);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }
  
  if (medication.scheduleType === 'interval' && medication.intervalHours) {
    // Add interval hours to last taken time or now
    const baseTime = medication.lastTakenAt ? new Date(medication.lastTakenAt) : now;
    const nextTime = new Date(baseTime);
    nextTime.setHours(nextTime.getHours() + medication.intervalHours);
    return nextTime;
  }
  
  return null;
}