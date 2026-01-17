/**
 * GraphQL Cache Service for Offline Functionality
 * 
 * This service provides caching capabilities for GraphQL queries
 * to enable offline functionality and improve performance.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  query: string;
  variables?: Record<string, any>;
}

interface CacheConfig {
  maxEntries: number;
  defaultTtl: number;
  storageKey: string;
}

export interface OfflineMutation {
  id: string;
  mutation: string;
  variables?: Record<string, any>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class GraphQLCache {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry>;
  private mutationQueue: Map<string, OfflineMutation>;
  private mutationQueueKey = 'healthcare_mutation_queue';
  private isProcessingQueue = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxEntries: 100,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      storageKey: 'healthcare_graphql_cache',
      ...config,
    };
    this.cache = new Map();
    this.mutationQueue = new Map();
    
    // Only initialize browser-specific features if in browser environment
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.loadMutationQueue();
      this.setupOnlineListener();
    }
  }

  /**
   * Generate a cache key from query and variables
   */
  private generateKey(query: string, variables?: Record<string, any>): string {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const variablesStr = variables ? JSON.stringify(variables, Object.keys(variables).sort()) : '';
    return `${normalizedQuery}:${variablesStr}`;
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const entries = JSON.parse(stored);
        entries.forEach((entry: CacheEntry) => {
          if (this.isValid(entry)) {
            const key = this.generateKey(entry.query, entry.variables);
            this.cache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load GraphQL cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      const entries = Array.from(this.cache.values()).filter(entry => this.isValid(entry));
      localStorage.setItem(this.config.storageKey, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save GraphQL cache to storage:', error);
    }
  }

  /**
   * Clean up expired entries and enforce size limits
   */
  private cleanup(): void {
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
      }
    }

    // Enforce size limit by removing oldest entries
    if (this.cache.size > this.config.maxEntries) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.config.maxEntries);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cached data for a query
   */
  get(query: string, variables?: Record<string, any>): any | null {
    const key = this.generateKey(query, variables);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry)) {
      return entry.data;
    }

    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Set cached data for a query
   */
  set(
    query: string, 
    data: any, 
    variables?: Record<string, any>, 
    ttl: number = this.config.defaultTtl
  ): void {
    const key = this.generateKey(query, variables);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      query,
      variables,
    };

    this.cache.set(key, entry);
    this.cleanup();
    this.saveToStorage();
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern: string | RegExp): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const matches = typeof pattern === 'string' 
        ? entry.query.includes(pattern)
        : pattern.test(entry.query);

      if (matches) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.saveToStorage();
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    cacheSize: number;
  } {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isValid(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheSize: new Blob([JSON.stringify(Array.from(this.cache.values()))]).size,
    };
  }

  /**
   * Check if the app is online
   */
  isOnline(): boolean {
    if (typeof window === 'undefined' || !window.navigator) {
      return true; // Assume online in non-browser environment
    }
    return navigator.onLine;
  }

  /**
   * Get cached queries for offline access
   */
  getOfflineQueries(): Array<{ query: string; variables?: Record<string, any>; data: any }> {
    const offlineQueries: Array<{ query: string; variables?: Record<string, any>; data: any }> = [];

    for (const entry of this.cache.values()) {
      if (this.isValid(entry)) {
        offlineQueries.push({
          query: entry.query,
          variables: entry.variables,
          data: entry.data,
        });
      }
    }

    return offlineQueries;
  }

  /**
   * Load mutation queue from localStorage
   */
  private loadMutationQueue(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      const stored = localStorage.getItem(this.mutationQueueKey);
      if (stored) {
        const mutations = JSON.parse(stored);
        mutations.forEach((mutation: OfflineMutation) => {
          this.mutationQueue.set(mutation.id, mutation);
        });
      }
    } catch (error) {
      console.warn('Failed to load mutation queue from storage:', error);
    }
  }

  /**
   * Save mutation queue to localStorage
   */
  private saveMutationQueue(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      const mutations = Array.from(this.mutationQueue.values());
      localStorage.setItem(this.mutationQueueKey, JSON.stringify(mutations));
    } catch (error) {
      console.warn('Failed to save mutation queue to storage:', error);
    }
  }

  /**
   * Setup listener for online/offline events
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      // Process queued mutations when coming back online
      this.processMutationQueue();
    });
  }

  /**
   * Add mutation to offline queue
   */
  queueMutation(mutation: string, variables?: Record<string, any>): string {
    const id = `mutation_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const offlineMutation: OfflineMutation = {
      id,
      mutation,
      variables,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.mutationQueue.set(id, offlineMutation);
    this.saveMutationQueue();
    
    // Return the mutation ID for tracking
    return id;
  }

  /**
   * Process queued mutations when online
   */
  async processMutationQueue(client?: any): Promise<void> {
    if (this.isProcessingQueue || !this.isOnline() || this.mutationQueue.size === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const mutations = Array.from(this.mutationQueue.values());
    
    // Sort by timestamp to maintain order
    mutations.sort((a, b) => a.timestamp - b.timestamp);

    for (const mutation of mutations) {
      try {
        if (client) {
          // Execute the mutation
          await client.mutate({
            mutation: mutation.mutation,
            variables: mutation.variables,
          });
          
          // Remove successful mutation from queue
          this.mutationQueue.delete(mutation.id);
          this.saveMutationQueue();
        }
      } catch (error) {
        console.error(`Failed to process queued mutation ${mutation.id}:`, error);
        
        // Increment retry count
        mutation.retryCount++;
        
        if (mutation.retryCount >= mutation.maxRetries) {
          // Remove mutation if max retries exceeded
          this.mutationQueue.delete(mutation.id);
          console.error(`Mutation ${mutation.id} exceeded max retries and was removed from queue`);
        } else {
          // Update the mutation in queue
          this.mutationQueue.set(mutation.id, mutation);
        }
        
        this.saveMutationQueue();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get pending mutations
   */
  getPendingMutations(): OfflineMutation[] {
    return Array.from(this.mutationQueue.values());
  }

  /**
   * Clear mutation queue
   */
  clearMutationQueue(): void {
    this.mutationQueue.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.mutationQueueKey);
    }
  }

  /**
   * Get mutation queue statistics
   */
  getMutationQueueStats(): {
    pendingMutations: number;
    oldestMutation: number | null;
    failedMutations: number;
  } {
    const mutations = Array.from(this.mutationQueue.values());
    const failedMutations = mutations.filter(m => m.retryCount > 0).length;
    const oldestMutation = mutations.length > 0 
      ? Math.min(...mutations.map(m => m.timestamp))
      : null;

    return {
      pendingMutations: this.mutationQueue.size,
      oldestMutation,
      failedMutations,
    };
  }
}

// Create singleton instance
export const graphqlCache = new GraphQLCache({
  maxEntries: 150,
  defaultTtl: 10 * 60 * 1000, // 10 minutes for healthcare data
  storageKey: 'healthcare_graphql_cache',
});

// Cache configuration for different query types
export const CACHE_CONFIGS = {
  // Client data - cache for longer periods
  CLIENT_QUERIES: {
    ttl: 15 * 60 * 1000, // 15 minutes
    patterns: ['listClients', 'getClient'],
  },
  // Medication data - cache for medium periods
  MEDICATION_QUERIES: {
    ttl: 10 * 60 * 1000, // 10 minutes
    patterns: ['listMedications', 'getMedication'],
  },
  // Appointment data - cache for medium periods
  APPOINTMENT_QUERIES: {
    ttl: 10 * 60 * 1000, // 10 minutes
    patterns: ['listAppointments', 'getAppointment'],
  },
  // Real-time data - minimal caching
  REALTIME_QUERIES: {
    ttl: 1 * 60 * 1000, // 1 minute
    patterns: ['listMessages', 'listNotifications'],
  },
  // User profile data - cache for longer periods
  USER_QUERIES: {
    ttl: 30 * 60 * 1000, // 30 minutes
    patterns: ['listUserProfiles', 'getUserProfile'],
  },
};

/**
 * Get appropriate TTL for a query based on its type
 */
export function getTTLForQuery(query: string): number {
  for (const config of Object.values(CACHE_CONFIGS)) {
    if (config.patterns.some(pattern => query.includes(pattern))) {
      return config.ttl;
    }
  }
  return 5 * 60 * 1000; // Default 5 minutes
}

/**
 * Enhanced GraphQL client with caching
 */
export function createCachedGraphQLClient(originalClient: any) {
  return {
    ...originalClient,
    async query(options: { query: string; variables?: Record<string, any> }) {
      const { query, variables } = options;
      
      // Try to get from cache first
      const cachedData = graphqlCache.get(query, variables);
      if (cachedData && !graphqlCache.isOnline()) {
        return { data: cachedData, fromCache: true };
      }

      try {
        // Make network request
        const result = await originalClient.query(options);
        
        // Cache the result
        const ttl = getTTLForQuery(query);
        graphqlCache.set(query, result.data, variables, ttl);
        
        return { ...result, fromCache: false };
      } catch (error) {
        // If network fails and we have cached data, return it
        if (cachedData) {
          console.warn('Network request failed, returning cached data:', error);
          return { data: cachedData, fromCache: true, error };
        }
        throw error;
      }
    },

    async mutate(options: { mutation: string; variables?: Record<string, any> }) {
      // Check if we're offline
      if (!graphqlCache.isOnline()) {
        // Queue the mutation for later execution
        const mutationId = graphqlCache.queueMutation(options.mutation, options.variables);
        console.warn('Offline: Mutation queued for later sync', { id: mutationId });
        
        // Return a pending result
        return {
          data: null,
          queued: true,
          mutationId,
          message: 'Mutation queued for execution when online',
        };
      }

      try {
        const result = await originalClient.mutate(options);
        
        // Invalidate related cache entries after mutations
        const mutation = options.mutation;
        if (mutation.includes('createClient') || mutation.includes('updateClient') || mutation.includes('deleteClient')) {
          graphqlCache.invalidate(/Client/);
        }
        if (mutation.includes('createMedication') || mutation.includes('updateMedication') || mutation.includes('deleteMedication')) {
          graphqlCache.invalidate(/Medication/);
        }
        if (mutation.includes('createAppointment') || mutation.includes('updateAppointment') || mutation.includes('deleteAppointment')) {
          graphqlCache.invalidate(/Appointment/);
        }
        
        return result;
      } catch (error: any) {
        // If the network request fails, queue it for retry
        if (error.networkError || error.message?.includes('Network')) {
          const mutationId = graphqlCache.queueMutation(options.mutation, options.variables);
          console.warn('Network error: Mutation queued for retry', { id: mutationId, error });
          
          return {
            data: null,
            queued: true,
            mutationId,
            message: 'Network error: Mutation queued for retry',
            error,
          };
        }
        throw error;
      }
    },
    
    // Process pending mutations when client is ready
    async processPendingMutations() {
      await graphqlCache.processMutationQueue(originalClient);
    },
    
    // Get pending mutations info
    getPendingMutations() {
      return graphqlCache.getPendingMutations();
    },
    
    // Get mutation queue stats
    getMutationQueueStats() {
      return graphqlCache.getMutationQueueStats();
    },
  };
}