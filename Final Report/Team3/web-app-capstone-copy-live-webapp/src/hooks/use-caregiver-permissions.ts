'use client';

import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/graphql-client';
import { ClientCaregiver, CaregiverRole } from '@/types';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface CaregiverPermissions {
  role: CaregiverRole | null;
  permissions: string[];
  canView: boolean;
  canEdit: boolean;
  canManageMedications: boolean;
  canManageAppointments: boolean;
  canSendMessages: boolean;
  canInviteCaregivers: boolean;
  canAdminister: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useCaregiverPermissions(clientId: string): CaregiverPermissions {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<CaregiverPermissions>({
    role: null,
    permissions: [],
    canView: false,
    canEdit: false,
    canManageMedications: false,
    canManageAppointments: false,
    canSendMessages: false,
    canInviteCaregivers: false,
    canAdminister: false,
    isLoading: true,
    error: null,
  });

  const fetchPermissions = useCallback(async () => {
    if (!user?.id || !clientId) {
      setPermissions(prev => ({
        ...prev,
        isLoading: false,
        error: 'User or client ID not available',
      }));
      return;
    }

    try {
      // First check if this user IS the client (self-care scenario)
      const clientLookup = await client.models.Client.get({ id: clientId });
      const clientData = clientLookup.data;
      
      // Check if this is a self-care scenario (user is the client themselves)
      if (clientData && (clientData.email === user.email || clientData.id === user.id)) {
        // User is managing their own care - grant full permissions
        setPermissions(prev => ({
          ...prev,
          role: 'primary' as CaregiverRole,
          permissions: ['view', 'edit', 'admin'],
          canView: true,
          canEdit: true,
          canAdmin: true,
          isLoading: false,
          error: null,
        }));
        return;
      }
      
      // First try to find the user profile
      const profileLookup = await client.models.UserProfile.list({
        filter: { userId: { eq: user.id } },
        limit: 1,
      });
      
      const userProfile = profileLookup.data?.[0];
      const caregiverKeyId = userProfile?.id || user.id;
      

      // Try multiple approaches to find the caregiver relationship
      // First, try with user IDs
      let relationships = await client.models.ClientCaregiver.list({
        filter: {
          and: [
            { clientId: { eq: clientId } },
            { isActive: { eq: true } },
            { 
              or: [
                { caregiverId: { eq: user.id } }, 
                { caregiverId: { eq: caregiverKeyId } },
                { caregiverId: { eq: user.email } } // Sometimes email is used as ID
              ] 
            }
          ]
        }
      });
      
      // If not found and we have a user profile, try searching with the profile email
      if (!relationships.data?.length && userProfile?.email) {
        relationships = await client.models.ClientCaregiver.list({
          filter: {
            and: [
              { clientId: { eq: clientId } },
              { isActive: { eq: true } },
              { caregiverId: { eq: userProfile.email } }
            ]
          }
        });
      }

      if (relationships.errors) {
        throw new Error(relationships.errors[0]?.message || 'Failed to fetch caregiver permissions');
      }

      const relationship = relationships.data?.[0];

      if (!relationship) {
        // Final fallback: Check if there are ANY caregiver relationships for this client
        // and if the current user might be the owner (first/primary caregiver)
        const allRelationships = await client.models.ClientCaregiver.list({
          filter: {
            and: [
              { clientId: { eq: clientId } },
              { isActive: { eq: true } }
            ]
          }
        });
        
        setPermissions(prev => ({
          ...prev,
          role: null,
          permissions: [],
          canView: false,
          canEdit: false,
          canManageMedications: false,
          canManageAppointments: false,
          canSendMessages: false,
          canInviteCaregivers: false,
          canAdminister: false,
          isLoading: false,
          error: 'No caregiver relationship found',
        }));
        return;
      }

      const userPermissions = relationship.permissions || [];
      const hasPermission = (perm: string) => userPermissions.includes(perm);

      // Determine capabilities based on role and permissions
      // Primary role always has full permissions
      const isPrimary = relationship.role === 'primary';
      const canView = hasPermission('view') || isPrimary || relationship.role === 'secondary';
      const canEdit = hasPermission('edit') || isPrimary;
      const canManageMedications = hasPermission('medications') || hasPermission('edit') || isPrimary;
      const canManageAppointments = hasPermission('appointments') || hasPermission('edit') || isPrimary;
      const canSendMessages = hasPermission('messages') || isPrimary || relationship.role === 'secondary';
      const canInviteCaregivers = hasPermission('invite') || hasPermission('admin') || isPrimary;
      const canAdminister = hasPermission('admin') || isPrimary;

      setPermissions({
        role: relationship.role,
        permissions: userPermissions,
        canView,
        canEdit,
        canManageMedications,
        canManageAppointments,
        canSendMessages,
        canInviteCaregivers,
        canAdminister,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching caregiver permissions:', err);
      setPermissions(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch permissions',
      }));
    }
  }, [user?.id, clientId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return permissions;
}

// Utility function to check if a user can perform an action
export function checkPermission(
  permissions: CaregiverPermissions,
  action: 'view' | 'edit' | 'medications' | 'appointments' | 'messages' | 'invite' | 'admin'
): boolean {
  switch (action) {
    case 'view':
      return permissions.canView;
    case 'edit':
      return permissions.canEdit;
    case 'medications':
      return permissions.canManageMedications;
    case 'appointments':
      return permissions.canManageAppointments;
    case 'messages':
      return permissions.canSendMessages;
    case 'invite':
      return permissions.canInviteCaregivers;
    case 'admin':
      return permissions.canAdminister;
    default:
      return false;
  }
}