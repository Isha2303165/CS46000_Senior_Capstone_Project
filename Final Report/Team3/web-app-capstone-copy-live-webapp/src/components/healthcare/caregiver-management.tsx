'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { InvitationDialog } from './invitation-dialog';
import { useInvitations } from '../../hooks/use-invitations';
import { useClients } from '../../hooks/use-clients';
import type { Client, ClientCaregiver } from '../../types';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  UserCheck,
  UserX,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  XCircle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CaregiverManagementProps {
  client: Client;
}

export function CaregiverManagement({ client }: CaregiverManagementProps) {
  const { 
    invitations, 
    loading: invitationsLoading,
    getInvitationsByClient,
    cancelInvitation,
    resendInvitation 
  } = useInvitations();
  
  const { toast } = useToast();
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [caregivers, setCaregivers] = useState<ClientCaregiver[]>([]);
  const [caregiversLoading, setCaregiversLoading] = useState(false);
  const [removingCaregiver, setRemovingCaregiver] = useState<ClientCaregiver | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<ClientCaregiver | null>(null);
  const dataClient = generateClient<Schema>();

  // Load invitations
  useEffect(() => {
    if (client?.id) {
      getInvitationsByClient(client.id);
    }
  }, [client?.id, getInvitationsByClient]);

  // Load current caregivers
  useEffect(() => {
    const loadCaregivers = async () => {
      if (!client?.id) return;
      setCaregiversLoading(true);
      try {
        const rels = await dataClient.models.ClientCaregiver.list({
          filter: { and: [ { clientId: { eq: client.id } }, { isActive: { eq: true } } ] }
        });
        const items = rels.data || [];
        const withProfiles: ClientCaregiver[] = await Promise.all(
          items.map(async (rel: any) => {
            const up = await dataClient.models.UserProfile.get({ id: rel.caregiverId });
            return {
              ...(rel as any),
              caregiver: (up.data || undefined) as any,
            } as ClientCaregiver;
          })
        );
        setCaregivers(withProfiles);
      } catch (e) {
        console.error('Failed to load caregivers', e);
        setCaregivers([]);
      } finally {
        setCaregiversLoading(false);
      }
    };
    loadCaregivers();
  }, [client?.id]);

  const handleRemoveCaregiver = async () => {
    if (!removingCaregiver) return;
    
    setActionLoading(removingCaregiver.id);
    try {
      // Update the ClientCaregiver record to set isActive to false
      await dataClient.models.ClientCaregiver.update({
        id: removingCaregiver.id,
        isActive: false
      });
      
      // Remove from local state
      setCaregivers(prev => prev.filter(c => c.id !== removingCaregiver.id));
      
      toast({
        title: 'Caregiver removed',
        description: 'The caregiver has been removed from this client.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove caregiver. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setRemovingCaregiver(null);
    }
  };

  const handleUpdatePermissions = async (caregiver: ClientCaregiver, newPermissions: string[]) => {
    setActionLoading(caregiver.id);
    try {
      await dataClient.models.ClientCaregiver.update({
        id: caregiver.id,
        permissions: newPermissions
      });
      
      // Update local state
      setCaregivers(prev => prev.map(c => 
        c.id === caregiver.id ? { ...c, permissions: newPermissions } : c
      ));
      
      toast({
        title: 'Permissions updated',
        description: 'The caregiver permissions have been updated.',
      });
      setEditingPermissions(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await cancelInvitation(invitationId);
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await resendInvitation(invitationId);
      toast({
        title: 'Invitation resent',
        description: 'The invitation has been resent.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'primary':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'secondary':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view':
        return <Eye className="w-3 h-3" />;
      case 'edit':
        return <Edit3 className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const pendingInvitations = Array.isArray(invitations) 
    ? invitations.filter(inv => 
        inv.clientId === client.id && 
        inv.status === 'pending' &&
        !isExpired(inv.expiresAt)
      )
    : [];

  const expiredInvitations = Array.isArray(invitations)
    ? invitations.filter(inv => 
        inv.clientId === client.id && 
        (inv.status === 'pending' && isExpired(inv.expiresAt))
      )
    : [];

  if (!client) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">No client selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Caregiver Team
              </CardTitle>
              <CardDescription>
                Manage who can access and care for {client.firstName} {client.lastName}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowInvitationDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Caregiver
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Active ({caregivers.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingInvitations.length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <UserX className="w-4 h-4" />
                Expired ({expiredInvitations.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Caregivers Tab */}
            <TabsContent value="active" className="mt-6">
              {caregiversLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : caregivers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No caregivers assigned yet</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowInvitationDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite First Caregiver
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {caregivers.map((caregiver) => (
                    <div
                      key={caregiver.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {caregiver.caregiver?.firstName?.[0]}{caregiver.caregiver?.lastName?.[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">
                                {caregiver.caregiver?.firstName || 'Unknown'} {caregiver.caregiver?.lastName || 'User'}
                              </h4>
                              <Badge className={`${getRoleBadgeColor(caregiver.role || 'secondary')} text-xs`}>
                                {caregiver.role || 'secondary'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {caregiver.caregiver?.email || 'No email provided'}
                            </p>
                            
                            {/* Permissions */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {caregiver.role === 'primary' ? (
                                // Primary caregivers always have full permissions
                                ['view', 'edit', 'admin'].map((permission) => (
                                  <div key={permission} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs">
                                    {getPermissionIcon(permission)}
                                    <span>{permission}</span>
                                  </div>
                                ))
                              ) : (
                                // Other caregivers show their assigned permissions
                                Array.isArray(caregiver.permissions) && caregiver.permissions.map((permission) => (
                                  <div key={permission} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs">
                                    {getPermissionIcon(permission)}
                                    <span>{permission}</span>
                                  </div>
                                ))
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500">
                              Added on {formatDate(caregiver.addedAt || caregiver.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {caregiver.role !== 'primary' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setEditingPermissions(caregiver)}
                                >
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setRemovingCaregiver(caregiver)}
                              disabled={caregiver.role === 'primary'}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {caregiver.role === 'primary' ? 'Cannot Remove Primary' : 'Remove Caregiver'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pending Invitations Tab */}
            <TabsContent value="pending" className="mt-6">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No pending invitations</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="border rounded-lg p-4 bg-yellow-50 border-yellow-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-5 h-5 text-yellow-600" />
                            <h4 className="font-semibold">{invitation.invitedEmail}</h4>
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Pending
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Role: <span className="font-medium">{invitation.role}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Invited by {invitation.inviter?.firstName} {invitation.inviter?.lastName} • 
                            Expires {formatDate(invitation.expiresAt)}
                          </p>
                          {invitation.personalMessage && (
                            <div className="mt-2 p-2 bg-white rounded border border-yellow-100">
                              <p className="text-sm italic text-gray-600">"{invitation.personalMessage}"</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvitation(invitation.id)}
                            disabled={actionLoading === invitation.id}
                          >
                            <RefreshCw className={`w-4 h-4 ${actionLoading === invitation.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            disabled={actionLoading === invitation.id}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Expired Invitations Tab */}
            <TabsContent value="expired" className="mt-6">
              {expiredInvitations.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No expired invitations</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {expiredInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="border rounded-lg p-4 bg-gray-50 opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <UserX className="w-5 h-5 text-gray-400" />
                            <h4 className="font-semibold text-gray-600">{invitation.invitedEmail}</h4>
                            <Badge variant="secondary" className="text-xs">
                              Expired
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            Expired on {formatDate(invitation.expiresAt)}
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Create new invitation
                            setShowInvitationDialog(true);
                          }}
                        >
                          Reinvite
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Remove Caregiver Confirmation Dialog */}
      <Dialog open={!!removingCaregiver} onOpenChange={() => setRemovingCaregiver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Caregiver</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>
                {removingCaregiver?.caregiver?.firstName} {removingCaregiver?.caregiver?.lastName}
              </strong> as a caregiver for {client.firstName} {client.lastName}? 
              They will no longer have access to this client's information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemovingCaregiver(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveCaregiver}
              disabled={actionLoading === removingCaregiver?.id}
            >
              {actionLoading === removingCaregiver?.id ? 'Removing...' : 'Remove Caregiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      {editingPermissions && (
        <Dialog open={!!editingPermissions} onOpenChange={() => setEditingPermissions(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Permissions</DialogTitle>
              <DialogDescription>
                Update permissions for {editingPermissions.caregiver?.firstName} {editingPermissions.caregiver?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {['view', 'edit', 'admin'].map((permission) => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingPermissions.permissions?.includes(permission) || false}
                    onChange={(e) => {
                      const newPermissions = e.target.checked
                        ? [...(editingPermissions.permissions || []), permission]
                        : (editingPermissions.permissions || []).filter(p => p !== permission);
                      setEditingPermissions({
                        ...editingPermissions,
                        permissions: newPermissions
                      });
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{permission} Access</span>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingPermissions(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdatePermissions(editingPermissions, editingPermissions.permissions || [])}
                disabled={actionLoading === editingPermissions.id}
              >
                {actionLoading === editingPermissions.id ? 'Updating...' : 'Update Permissions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invitation Dialog */}
      <InvitationDialog
        isOpen={showInvitationDialog}
        onClose={() => setShowInvitationDialog(false)}
        client={client}
        onInvitationSent={() => {
          if (client?.id) {
            getInvitationsByClient(client.id);
          }
        }}
      />
    </div>
  );
}