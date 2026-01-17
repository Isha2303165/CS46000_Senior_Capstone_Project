
'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useInvitationEmails } from '../lib/ses-email-service';
import type { Schema } from '../../amplify/data/resource';
import type { 
  CaregiverInvitation, 
  CreateCaregiverInvitationInput,
  UpdateCaregiverInvitationInput,
  InvitationStatus,
  CaregiverRole 
} from '../types';
import { useAuthStore } from '@/lib/stores/auth-store';

const client = generateClient<Schema>();

export interface SendInvitationData {
  clientId: string;
  invitedEmail: string;
  role: CaregiverRole;
  permissions?: string[];
  personalMessage?: string;
}

export interface AcceptInvitationData {
  token: string;
  userId: string;
}

export interface InvitationHookReturn {
  invitations: CaregiverInvitation[];
  loading: boolean;
  error: string | null;
  sendInvitation: (data: SendInvitationData) => Promise<CaregiverInvitation | null>;
  acceptInvitation: (data: AcceptInvitationData) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  resendInvitation: (invitationId: string) => Promise<boolean>;
  declineInvitation: (invitationId: string) => Promise<boolean>;
  getInvitationsByClient: (clientId: string) => Promise<CaregiverInvitation[]>;
  getInvitationsByEmail: (email: string) => Promise<CaregiverInvitation[]>;
  getInvitationsByInviter: (inviterUserProfileId: string) => Promise<CaregiverInvitation[]>;
  validateInvitationToken: (token: string) => Promise<CaregiverInvitation | null>;
  refreshInvitations: () => Promise<void>;
}

export function useInvitations(): InvitationHookReturn {
  const [invitations, setInvitations] = useState<CaregiverInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendInvitation: sendInvitationEmail } = useInvitationEmails();
  const { user } = useAuthStore();

  const handleError = useCallback((err: any, defaultMessage: string) => {
    console.error('Invitation error:', err);
    const errorMessage = err?.message || defaultMessage;
    setError(errorMessage);
    return null;
  }, []);

  const generateSecureToken = useCallback((): string => {
    // Generate a secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }, []);

  const sendInvitation = useCallback(async (data: SendInvitationData): Promise<CaregiverInvitation | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      // Generate secure token and expiration
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      // Get current user info for the invitation
      // Profiles are stored with id equal to Cognito userId
      const inviterResult = await client.models.UserProfile.get({ id: user.id });
      if (!inviterResult.data) {
        throw new Error('Current user profile not found');
      }
      const inviter = inviterResult.data;

      // Get client info
      const clientResult = await client.models.Client.get({ id: data.clientId });
      if (!clientResult.data) {
        throw new Error('Client not found');
      }

      const client = clientResult.data;

      // Create invitation record
      const invitationInput: CreateCaregiverInvitationInput = {
        clientId: data.clientId,
        invitedBy: inviter.id,
        invitedEmail: data.invitedEmail.trim().toLowerCase(),
        role: data.role,
        permissions: data.permissions || ['view'],
        personalMessage: data.personalMessage,
        // Ensure status is explicitly set for filtering
        // @ts-expect-error - status is part of model but not in input type
        status: 'pending',
        token,
        expiresAt,
      };

      const result = await client.models.CaregiverInvitation.create(invitationInput as any);

      if (!result.data) {
        throw new Error('Failed to create invitation');
      }

      // Send email via SES
      try {
        const invitationLink = `${window.location.origin}/accept-invitation?token=${token}`;
        await sendInvitationEmail({
          to: data.invitedEmail,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          clientName: `${client.firstName} ${client.lastName}`,
          role: data.role,
          personalMessage: data.personalMessage,
          invitationLink,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the entire operation if email fails
      }

      const invitation = result.data as any;
      const hydrated: CaregiverInvitation = {
        ...(invitation as any),
        client: client as any,
        inviter: inviter as any,
      } as CaregiverInvitation;
      setInvitations(prev => [...prev, hydrated]);
      
      return invitation;
    } catch (err) {
      return handleError(err, 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  }, [handleError, generateSecureToken, user]);

  const acceptInvitation = useCallback(async (data: AcceptInvitationData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Find invitation by token
      const invitationResult = await client.models.CaregiverInvitation.list({
        filter: { 
          token: { eq: data.token },
          status: { eq: 'pending' }
        }
      });

      if (!invitationResult.data || invitationResult.data.length === 0) {
        throw new Error('Invalid or expired invitation');
      }

      const invitation = invitationResult.data[0];

      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Update invitation status
      const updateResult = await client.models.CaregiverInvitation.update({
        id: invitation.id,
        status: 'accepted' as InvitationStatus,
        invitedUserId: data.userId,
        acceptedAt: new Date().toISOString(),
      });

      if (!updateResult.data) {
        throw new Error('Failed to update invitation');
      }

      // Create ClientCaregiver relationship
      await client.models.ClientCaregiver.create({
        clientId: invitation.clientId,
        caregiverId: data.userId,
        role: invitation.role,
        permissions: invitation.permissions || ['view'],
        addedBy: invitation.invitedBy,
        addedAt: new Date().toISOString(),
      });

      // Update local state
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitation.id 
            ? { ...inv, status: 'accepted' as InvitationStatus, acceptedAt: new Date().toISOString() }
            : inv
        )
      );

      return true;
    } catch (err) {
      handleError(err, 'Failed to accept invitation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const cancelInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.CaregiverInvitation.update({
        id: invitationId,
        status: 'cancelled' as InvitationStatus,
      });

      if (!result.data) {
        throw new Error('Failed to cancel invitation');
      }

      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'cancelled' as InvitationStatus }
            : inv
        )
      );

      return true;
    } catch (err) {
      handleError(err, 'Failed to cancel invitation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const declineInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.CaregiverInvitation.update({
        id: invitationId,
        status: 'declined' as InvitationStatus,
      });

      if (!result.data) {
        throw new Error('Failed to decline invitation');
      }

      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'declined' as InvitationStatus }
            : inv
        )
      );

      return true;
    } catch (err) {
      handleError(err, 'Failed to decline invitation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const resendInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Get the existing invitation
      const invitationResult = await client.models.CaregiverInvitation.get({ id: invitationId });
      if (!invitationResult.data) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationResult.data;

      // Generate new token and extend expiration
      const newToken = generateSecureToken();
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Update invitation with new token
      const updateResult = await client.models.CaregiverInvitation.update({
        id: invitationId,
        token: newToken,
        expiresAt: newExpiresAt,
        status: 'pending' as InvitationStatus,
      });

      if (!updateResult.data) {
        throw new Error('Failed to update invitation');
      }

      // Resend email (would invoke Lambda function in real implementation)
      // Mock implementation - in production, this would invoke Lambda function to resend email

      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, token: newToken, expiresAt: newExpiresAt, status: 'pending' as InvitationStatus }
            : inv
        )
      );

      return true;
    } catch (err) {
      handleError(err, 'Failed to resend invitation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, generateSecureToken]);

  const getInvitationsByClient = useCallback(async (clientId: string): Promise<CaregiverInvitation[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.CaregiverInvitation.list({
        filter: { clientId: { eq: clientId } }
      });

      const invitations = (result.data || []) as unknown as CaregiverInvitation[];
      setInvitations(invitations);
      return invitations;
    } catch (err) {
      handleError(err, 'Failed to fetch invitations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getInvitationsByEmail = useCallback(async (email: string): Promise<CaregiverInvitation[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.CaregiverInvitation.list({
        filter: { invitedEmail: { eq: email.trim().toLowerCase() } }
      });

      const data = (result.data || []) as any[];
      // Hydrate related client and inviter profiles
      const invitations: CaregiverInvitation[] = await Promise.all(
        data.map(async (inv: any) => {
          const [clientRes, inviterRes] = await Promise.all([
            client.models.Client.get({ id: inv.clientId }),
            client.models.UserProfile.get({ id: inv.invitedBy }),
          ]);
          return {
            ...(inv as any),
            client: (clientRes.data || undefined) as any,
            inviter: (inviterRes.data || undefined) as any,
          } as CaregiverInvitation;
        })
      );
      setInvitations(invitations);
      return invitations;
    } catch (err) {
      handleError(err, 'Failed to fetch invitations by email');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getInvitationsByInviter = useCallback(async (inviterUserProfileId: string): Promise<CaregiverInvitation[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.CaregiverInvitation.list({
        filter: { invitedBy: { eq: inviterUserProfileId } }
      });

      const data = (result.data || []) as any[];
      const invitations: CaregiverInvitation[] = await Promise.all(
        data.map(async (inv: any) => {
          const clientRes = await client.models.Client.get({ id: inv.clientId });
          return {
            ...(inv as any),
            client: (clientRes.data || undefined) as any,
          } as CaregiverInvitation;
        })
      );
      return invitations;
    } catch (err) {
      handleError(err, 'Failed to fetch sent invitations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const validateInvitationToken = useCallback(async (token: string): Promise<CaregiverInvitation | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.CaregiverInvitation.list({
        filter: { 
          token: { eq: token },
          status: { eq: 'pending' }
        }
      });

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const invitation = result.data[0] as unknown as CaregiverInvitation;

      // Check if expired
      if (new Date(invitation.expiresAt) < new Date()) {
        // Mark as expired
        await client.models.CaregiverInvitation.update({
          id: invitation.id,
          status: 'expired' as InvitationStatus,
        });
        return null;
      }

      return invitation;
    } catch (err) {
      handleError(err, 'Failed to validate invitation token');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const refreshInvitations = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.CaregiverInvitation.list();
      const invitations = (result.data || []) as unknown as CaregiverInvitation[];
      setInvitations(invitations);
    } catch (err) {
      handleError(err, 'Failed to refresh invitations');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    invitations,
    loading,
    error,
    sendInvitation,
    acceptInvitation,
    cancelInvitation,
    resendInvitation,
    declineInvitation,
    getInvitationsByClient,
    getInvitationsByEmail,
    getInvitationsByInviter,
    validateInvitationToken,
    refreshInvitations,
  };
}