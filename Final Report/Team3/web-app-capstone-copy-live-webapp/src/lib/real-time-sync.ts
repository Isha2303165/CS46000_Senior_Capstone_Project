import { client } from '@/lib/graphql-client';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { 
  Client, 
  Medication, 
  Appointment, 
  Message,
  MedicationLog,
  ClientCaregiver 
} from '@/types';

// Connection status types
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// Real-time update types
export interface RealTimeUpdate<T = any> {
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: T;
  timestamp: string;
  userId?: string;
}

// Conflict resolution types
export interface DataConflict<T = any> {
  id: string;
  entity: string;
  localVersion: T;
  remoteVersion: T;
  timestamp: string;
  conflictFields: string[];
}

export interface ConflictResolution<T = any> {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolvedData?: T;
}

// Optimistic update types
export interface OptimisticUpdate<T = any> {
  id: string;
  entity: string;
  operation: 'create' | 'update' | 'delete';
  data: T;
  timestamp: string;
  rollback: () => void;
}

// Real-time synchronization service
class RealTimeSyncService {
  private subscriptions: Map<string, any> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private optimisticUpdates: Map<string, OptimisticUpdate> = new Map();
  private conflictQueue: Map<string, DataConflict> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  // Connection status management
  setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  onConnectionStatusChange(listener: (status: ConnectionStatus) => void) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  // Client data subscriptions
  subscribeToClientUpdates(clientId: string) {
    const subscriptionKey = `client-${clientId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    this.setConnectionStatus('connecting');

    try {
      const subscription = client.models.Client.observeQuery({
        filter: { id: { eq: clientId } }
      }).subscribe({
        next: ({ items }) => {
          this.setConnectionStatus('connected');
          this.resetRetryAttempts(subscriptionKey);
          
          const client = items[0];
          if (client) {
            this.handleClientUpdate(client);
          }
        },
        error: (error) => {
          console.error('Client subscription error:', error);
          this.handleSubscriptionError(subscriptionKey, error);
        }
      });

      this.subscriptions.set(subscriptionKey, subscription);
    } catch (error) {
      console.error('Failed to create client subscription:', error);
      this.setConnectionStatus('error');
    }
  }

  // Medication data subscriptions
  subscribeToMedicationUpdates(clientId: string) {
    const subscriptionKey = `medications-${clientId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    this.setConnectionStatus('connecting');

    try {
      const subscription = client.models.Medication.observeQuery({
        filter: { 
          clientId: { eq: clientId },
          isActive: { eq: true }
        }
      }).subscribe({
        next: ({ items }) => {
          this.setConnectionStatus('connected');
          this.resetRetryAttempts(subscriptionKey);
          
          items.forEach(medication => {
            this.handleMedicationUpdate(medication);
          });
        },
        error: (error) => {
          console.error('Medication subscription error:', error);
          this.handleSubscriptionError(subscriptionKey, error);
        }
      });

      this.subscriptions.set(subscriptionKey, subscription);
    } catch (error) {
      console.error('Failed to create medication subscription:', error);
      this.setConnectionStatus('error');
    }
  }

  // Appointment data subscriptions
  subscribeToAppointmentUpdates(clientId: string) {
    const subscriptionKey = `appointments-${clientId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    this.setConnectionStatus('connecting');

    try {
      const subscription = client.models.Appointment.observeQuery({
        filter: { clientId: { eq: clientId } }
      }).subscribe({
        next: ({ items }) => {
          this.setConnectionStatus('connected');
          this.resetRetryAttempts(subscriptionKey);
          
          items.forEach(appointment => {
            this.handleAppointmentUpdate(appointment);
          });
        },
        error: (error) => {
          console.error('Appointment subscription error:', error);
          this.handleSubscriptionError(subscriptionKey, error);
        }
      });

      this.subscriptions.set(subscriptionKey, subscription);
    } catch (error) {
      console.error('Failed to create appointment subscription:', error);
      this.setConnectionStatus('error');
    }
  }

  // Message data subscriptions
  subscribeToMessageUpdates(clientId: string) {
    const subscriptionKey = `messages-${clientId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    this.setConnectionStatus('connecting');

    try {
      const subscription = client.models.Message.observeQuery({
        filter: { clientId: { eq: clientId } }
      }).subscribe({
        next: ({ items }) => {
          this.setConnectionStatus('connected');
          this.resetRetryAttempts(subscriptionKey);
          
          items.forEach(message => {
            this.handleMessageUpdate(message);
          });
        },
        error: (error) => {
          console.error('Message subscription error:', error);
          this.handleSubscriptionError(subscriptionKey, error);
        }
      });

      this.subscriptions.set(subscriptionKey, subscription);
    } catch (error) {
      console.error('Failed to create message subscription:', error);
      this.setConnectionStatus('error');
    }
  }

  // Medication log subscriptions for real-time medication tracking
  subscribeToMedicationLogUpdates(clientId: string) {
    const subscriptionKey = `medication-logs-${clientId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    this.setConnectionStatus('connecting');

    try {
      // First get medications for this client to filter logs
      const medicationSubscription = client.models.Medication.observeQuery({
        filter: { 
          clientId: { eq: clientId },
          isActive: { eq: true }
        }
      }).subscribe({
        next: ({ items: medications }) => {
          if (medications.length === 0) return;

          const medicationIds = medications.map(med => med.id);
          
          // Subscribe to logs for these medications
          const logSubscription = client.models.MedicationLog.observeQuery({
            filter: {
              or: medicationIds.map(id => ({ medicationId: { eq: id } }))
            }
          }).subscribe({
            next: ({ items: logs }) => {
              this.setConnectionStatus('connected');
              this.resetRetryAttempts(subscriptionKey);
              
              logs.forEach(log => {
                this.handleMedicationLogUpdate(log);
              });
            },
            error: (error) => {
              console.error('Medication log subscription error:', error);
              this.handleSubscriptionError(subscriptionKey, error);
            }
          });

          // Store the log subscription
          this.subscriptions.set(`${subscriptionKey}-logs`, logSubscription);
        },
        error: (error) => {
          console.error('Medication subscription for logs error:', error);
          this.handleSubscriptionError(subscriptionKey, error);
        }
      });

      this.subscriptions.set(subscriptionKey, medicationSubscription);
    } catch (error) {
      console.error('Failed to create medication log subscription:', error);
      this.setConnectionStatus('error');
    }
  }

  // Subscribe to all client-related data
  subscribeToClientData(clientId: string) {
    this.subscribeToClientUpdates(clientId);
    this.subscribeToMedicationUpdates(clientId);
    this.subscribeToAppointmentUpdates(clientId);
    this.subscribeToMessageUpdates(clientId);
    this.subscribeToMedicationLogUpdates(clientId);
  }

  // Unsubscribe from specific client data
  unsubscribeFromClientData(clientId: string) {
    const subscriptionKeys = [
      `client-${clientId}`,
      `medications-${clientId}`,
      `appointments-${clientId}`,
      `messages-${clientId}`,
      `medication-logs-${clientId}`,
      `medication-logs-${clientId}-logs`
    ];

    subscriptionKeys.forEach(key => {
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(key);
      }
    });
  }

  // Unsubscribe from all data
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.setConnectionStatus('disconnected');
  }

  // Handle real-time updates
  private handleClientUpdate(client: Client) {
    const queryKey = ['clients', 'detail', client.id];
    
    // Check for conflicts with optimistic updates
    const optimisticUpdate = this.optimisticUpdates.get(`client-${client.id}`);
    if (optimisticUpdate) {
      const conflict = this.detectConflict(optimisticUpdate.data, client);
      if (conflict) {
        this.handleConflict(conflict);
        return;
      }
      // Remove successful optimistic update
      this.optimisticUpdates.delete(`client-${client.id}`);
    }

    // Update React Query cache
    queryClient.setQueryData(queryKey, client);
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
  }

  private handleMedicationUpdate(medication: Medication) {
    const queryKey = ['medications', 'detail', medication.id];
    
    // Check for conflicts with optimistic updates
    const optimisticUpdate = this.optimisticUpdates.get(`medication-${medication.id}`);
    if (optimisticUpdate) {
      const conflict = this.detectConflict(optimisticUpdate.data, medication);
      if (conflict) {
        this.handleConflict(conflict);
        return;
      }
      this.optimisticUpdates.delete(`medication-${medication.id}`);
    }

    // Update React Query cache
    queryClient.setQueryData(queryKey, medication);
    
    // Update client medications cache
    const clientMedicationsKey = ['medications', 'client', medication.clientId];
    const existingMedications = queryClient.getQueryData<Medication[]>(clientMedicationsKey) || [];
    const updatedMedications = existingMedications.map(med => 
      med.id === medication.id ? medication : med
    );
    
    // Add if not exists
    if (!existingMedications.find(med => med.id === medication.id)) {
      updatedMedications.push(medication);
    }
    
    queryClient.setQueryData(clientMedicationsKey, updatedMedications);
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['medications', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['medications', 'due'] });
  }

  private handleAppointmentUpdate(appointment: Appointment) {
    const queryKey = ['appointments', 'detail', appointment.id];
    
    // Check for conflicts with optimistic updates
    const optimisticUpdate = this.optimisticUpdates.get(`appointment-${appointment.id}`);
    if (optimisticUpdate) {
      const conflict = this.detectConflict(optimisticUpdate.data, appointment);
      if (conflict) {
        this.handleConflict(conflict);
        return;
      }
      this.optimisticUpdates.delete(`appointment-${appointment.id}`);
    }

    // Update React Query cache
    queryClient.setQueryData(queryKey, appointment);
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['appointments', 'client', appointment.clientId] });
  }

  private handleMessageUpdate(message: Message) {
    const queryKey = ['messages', 'detail', message.id];
    
    // Update React Query cache
    queryClient.setQueryData(queryKey, message);
    
    // Update client messages cache
    const clientMessagesKey = ['messages', 'client', message.clientId];
    const existingMessages = queryClient.getQueryData<Message[]>(clientMessagesKey) || [];
    const updatedMessages = existingMessages.map(msg => 
      msg.id === message.id ? message : msg
    );
    
    // Add if not exists
    if (!existingMessages.find(msg => msg.id === message.id)) {
      updatedMessages.push(message);
    }
    
    // Sort by creation time
    updatedMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    queryClient.setQueryData(clientMessagesKey, updatedMessages);
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['messages', 'list'] });
  }

  private handleMedicationLogUpdate(log: MedicationLog) {
    const queryKey = ['medication-logs', log.medicationId];
    
    // Update medication logs cache
    const existingLogs = queryClient.getQueryData<MedicationLog[]>(queryKey) || [];
    const updatedLogs = existingLogs.map(l => 
      l.id === log.id ? log : l
    );
    
    // Add if not exists
    if (!existingLogs.find(l => l.id === log.id)) {
      updatedLogs.push(log);
    }
    
    // Sort by taken time
    updatedLogs.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    
    queryClient.setQueryData(queryKey, updatedLogs);
    
    // Invalidate medication queries to update stats
    queryClient.invalidateQueries({ queryKey: ['medications', 'detail', log.medicationId] });
    queryClient.invalidateQueries({ queryKey: ['medications', 'due'] });
  }

  // Optimistic updates
  addOptimisticUpdate<T>(
    entity: string,
    id: string,
    operation: 'create' | 'update' | 'delete',
    data: T,
    rollback: () => void
  ) {
    const optimisticUpdate: OptimisticUpdate<T> = {
      id: `${entity}-${id}`,
      entity,
      operation,
      data,
      timestamp: new Date().toISOString(),
      rollback
    };

    this.optimisticUpdates.set(optimisticUpdate.id, optimisticUpdate);

    // Auto-remove after 30 seconds if not resolved
    setTimeout(() => {
      if (this.optimisticUpdates.has(optimisticUpdate.id)) {
        console.warn(`Optimistic update ${optimisticUpdate.id} timed out`);
        this.optimisticUpdates.delete(optimisticUpdate.id);
      }
    }, 30000);
  }

  // Conflict detection and resolution
  private detectConflict<T extends Record<string, any>>(localData: T, remoteData: T): DataConflict<T> | null {
    const conflictFields: string[] = [];
    
    // Compare updatedAt timestamps if available
    if (localData.updatedAt && remoteData.updatedAt) {
      const localTime = new Date(localData.updatedAt).getTime();
      const remoteTime = new Date(remoteData.updatedAt).getTime();
      
      // If remote is newer, no conflict
      if (remoteTime >= localTime) {
        return null;
      }
    }

    // Check for field-level conflicts
    Object.keys(localData).forEach(key => {
      if (key === 'updatedAt' || key === 'createdAt') return;
      
      if (localData[key] !== remoteData[key]) {
        conflictFields.push(key);
      }
    });

    if (conflictFields.length === 0) {
      return null;
    }

    return {
      id: localData.id || 'unknown',
      entity: 'unknown',
      localVersion: localData,
      remoteVersion: remoteData,
      timestamp: new Date().toISOString(),
      conflictFields
    };
  }

  private handleConflict<T>(conflict: DataConflict<T>) {
    console.warn('Data conflict detected:', conflict);
    
    // Add to conflict queue for manual resolution
    this.conflictQueue.set(conflict.id, conflict);
    
    // For now, use remote version (server wins)
    // In a real app, you might want to show a UI for manual resolution
    this.resolveConflict(conflict.id, { strategy: 'remote' });
  }

  resolveConflict<T>(conflictId: string, resolution: ConflictResolution<T>) {
    const conflict = this.conflictQueue.get(conflictId);
    if (!conflict) return;

    let resolvedData: T;

    switch (resolution.strategy) {
      case 'local':
        resolvedData = conflict.localVersion;
        break;
      case 'remote':
        resolvedData = conflict.remoteVersion;
        break;
      case 'merge':
        resolvedData = { ...conflict.remoteVersion, ...conflict.localVersion };
        break;
      case 'manual':
        if (!resolution.resolvedData) {
          console.error('Manual resolution requires resolvedData');
          return;
        }
        resolvedData = resolution.resolvedData;
        break;
    }

    // Update cache with resolved data
    const queryKey = [conflict.entity, 'detail', conflict.id];
    queryClient.setQueryData(queryKey, resolvedData);

    // Remove from conflict queue
    this.conflictQueue.delete(conflictId);
  }

  getConflicts(): DataConflict[] {
    return Array.from(this.conflictQueue.values());
  }

  // Error handling and retry logic
  private handleSubscriptionError(subscriptionKey: string, error: any) {
    console.error(`Subscription error for ${subscriptionKey}:`, error);
    
    this.setConnectionStatus('error');
    
    const retryCount = this.retryAttempts.get(subscriptionKey) || 0;
    
    if (retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
      
      
      setTimeout(() => {
        this.retryAttempts.set(subscriptionKey, retryCount + 1);
        this.retrySubscription(subscriptionKey);
      }, delay);
    } else {
      console.error(`Max retries exceeded for subscription ${subscriptionKey}`);
      this.retryAttempts.delete(subscriptionKey);
    }
  }

  private retrySubscription(subscriptionKey: string) {
    // Extract client ID from subscription key
    const clientId = subscriptionKey.split('-').slice(1).join('-');
    
    if (subscriptionKey.startsWith('client-')) {
      this.subscribeToClientUpdates(clientId);
    } else if (subscriptionKey.startsWith('medications-')) {
      this.subscribeToMedicationUpdates(clientId);
    } else if (subscriptionKey.startsWith('appointments-')) {
      this.subscribeToAppointmentUpdates(clientId);
    } else if (subscriptionKey.startsWith('messages-')) {
      this.subscribeToMessageUpdates(clientId);
    } else if (subscriptionKey.startsWith('medication-logs-')) {
      this.subscribeToMedicationLogUpdates(clientId);
    }
  }

  private resetRetryAttempts(subscriptionKey: string) {
    this.retryAttempts.delete(subscriptionKey);
  }

  // Utility methods
  getOptimisticUpdates(): OptimisticUpdate[] {
    return Array.from(this.optimisticUpdates.values());
  }

  rollbackOptimisticUpdate(updateId: string) {
    const update = this.optimisticUpdates.get(updateId);
    if (update) {
      update.rollback();
      this.optimisticUpdates.delete(updateId);
    }
  }

  rollbackAllOptimisticUpdates() {
    this.optimisticUpdates.forEach(update => {
      update.rollback();
    });
    this.optimisticUpdates.clear();
  }
}

// Export singleton instance
export const realTimeSyncService = new RealTimeSyncService();

// React hooks for using the service
export function useRealTimeSync() {
  return realTimeSyncService;
}