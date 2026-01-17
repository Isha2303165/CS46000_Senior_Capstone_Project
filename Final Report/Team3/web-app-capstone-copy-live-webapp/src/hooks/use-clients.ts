import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Client, CreateClientInput, UpdateClientInput } from '@/types';

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...clientKeys.lists(), { filters }] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

// Hook to fetch all clients
export function useClients() {
  const { user } = useAuthStore();

  return useQuery({
    // Include caregiverId in the key so lists refetch on auth/user change
    queryKey: clientKeys.list({ caregiverId: user?.id ?? 'anonymous' }),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      // Resolve the caregiver key id (UserProfile.id if available; fallback to Cognito user id)
      const profileLookup = await client.models.UserProfile.list({
        filter: { userId: { eq: user.id } },
        limit: 1,
      });
      const caregiverKeyId = profileLookup.data?.[0]?.id || user.id;

      // Find all client relationships for this caregiver
      const relationshipsResult = await client.models.ClientCaregiver.list({
        filter: {
          and: [
            { isActive: { eq: true } },
            { or: [
              { caregiverId: { eq: user.id } },
              { caregiverId: { eq: caregiverKeyId } },
            ]}
          ]
        },
      });

      const relationshipItems = relationshipsResult.data || [];
      if (relationshipItems.length === 0) {
        return [];
      }

      const clientIdFilters = relationshipItems.map((rel) => ({ id: { eq: rel.clientId } }));

      // Fetch active clients limited to those linked to the caregiver
      const clientsResult = await client.models.Client.list({
        filter: {
          and: [
            { isActive: { eq: true } },
            { or: clientIdFilters },
          ],
        },
      });

      return clientsResult.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch a single client by ID
export function useClient(id: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      if (!user?.id) {
        throw new Error('Access denied');
      }

      // Verify caregiver has access to this client
      const profileLookup = await client.models.UserProfile.list({
        filter: { userId: { eq: user.id } },
        limit: 1,
      });
      const caregiverKeyId = profileLookup.data?.[0]?.id || user.id;

      const accessCheck = await client.models.ClientCaregiver.list({
        filter: {
          and: [
            { isActive: { eq: true } },
            { clientId: { eq: id } },
            { or: [
              { caregiverId: { eq: user.id } },
              { caregiverId: { eq: caregiverKeyId } },
            ]}
          ]
        },
      });

      const hasAccess = (accessCheck.data || []).length > 0;
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const response = await client.models.Client.get({ id });
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook to create a new client
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const response = await client.models.Client.create(input);
      
      if (!response.data) {
        const apiError = response.errors?.[0]?.message || 'Failed to create client';
        throw new Error(apiError);
      }
      
      // Ensure the creating caregiver is linked to the client
      if (user?.id) {
        try {
          const profileLookup = await client.models.UserProfile.list({
            filter: { userId: { eq: user.id } },
            limit: 1,
          });
          const caregiverKeyId = profileLookup.data?.[0]?.id || user.id;

          await client.models.ClientCaregiver.create({
            clientId: response.data.id,
            caregiverId: caregiverKeyId,
            role: 'primary',
            permissions: ['view', 'edit', 'admin'],
            addedAt: new Date().toISOString(),
            addedBy: user.id,
            isActive: true,
          });
        } catch (relationshipError) {
          console.error('Failed to create ClientCaregiver relationship:', relationshipError);
        }
      }
      
      return response.data;
    },
    onSuccess: (newClient) => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      
      // Add the new client to the cache
      if (newClient) {
        queryClient.setQueryData(clientKeys.detail(newClient.id), newClient);

        // Optimistically add to the current caregiver's list
        if (user?.id) {
          const listKey = clientKeys.list({ caregiverId: user.id });
          const existing = queryClient.getQueryData<Client[]>(listKey) || [];
          const exists = existing.some((p) => p.id === newClient.id);
          if (!exists) {
            queryClient.setQueryData(listKey, [newClient, ...existing]);
          }
        }
      }
    },
  });
}

// Hook to update a client
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateClientInput) => {
      const response = await client.models.Client.update({ id, ...input });
      return response.data;
    },
    onSuccess: (updatedClient) => {
      if (updatedClient) {
        // Update the client in the cache
        queryClient.setQueryData(clientKeys.detail(updatedClient.id), updatedClient);
        
        // Invalidate the clients list to ensure consistency
        queryClient.invalidateQueries({ queryKey: clientKeys.all });
      }
    },
  });
}

// Hook to delete a client
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by setting isActive to false
      const response = await client.models.Client.update({ 
        id, 
        isActive: false 
      });
      return response.data;
    },
    onSuccess: (deletedClient) => {
      if (deletedClient) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: clientKeys.detail(deletedClient.id) });
        
        // Invalidate the clients list
        queryClient.invalidateQueries({ queryKey: clientKeys.all });
      }
    },
  });
}

// Hook to subscribe to client updates (real-time)
export function useClientSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return {
    subscribe: () => {
      const baseFilter: any = { isActive: { eq: true } };

      // Note: observeQuery filter supports compound filters. Limit by caregiver's clientIds when available.
      const setupSubscription = async () => {
        let filter = baseFilter;
        if (user?.id) {
          const relationshipsResult = await client.models.ClientCaregiver.list({
            filter: {
              caregiverId: { eq: user.id },
              isActive: { eq: true },
            },
          });
          const rels = relationshipsResult.data || [];
          if (rels.length > 0) {
            filter = { and: [baseFilter, { or: rels.map((r) => ({ id: { eq: r.clientId } })) }] };
          } else {
            // No access -> keep filter impossible to avoid receiving anything
            filter = { and: [baseFilter, { id: { eq: '__none__' } }] };
          }
        }

        return client.models.Client.observeQuery({ filter }).subscribe({
        next: ({ items }) => {
          // Update the clients list cache with real-time data
          queryClient.setQueryData(
              clientKeys.list({ caregiverId: user?.id ?? 'anonymous' }),
              items
            );
          
          // Update individual client caches
          items.forEach(client => {
            queryClient.setQueryData(clientKeys.detail(client.id), client);
          });
        },
        error: (error) => {
          console.error('Client subscription error:', error);
        }
        });
      };

      // Start subscription
      const subscriptionPromise = setupSubscription();
      // Return a minimal subscription-like object compatible with existing cleanup
      return {
        unsubscribe: async () => {
          const sub = await subscriptionPromise;
          sub.unsubscribe();
        }
      } as any;
    }
  };
}