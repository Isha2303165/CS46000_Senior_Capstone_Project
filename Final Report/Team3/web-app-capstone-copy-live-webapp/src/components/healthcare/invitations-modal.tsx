'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useInvitations } from '@/hooks/use-invitations';

interface InvitationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitationsModal({ open, onOpenChange }: InvitationsModalProps) {
  const { user } = useAuthStore();
  const { invitations, loading, error, getInvitationsByEmail, getInvitationsByInviter, acceptInvitation, declineInvitation } = useInvitations();
  const [sent, setSent] = useState<typeof invitations>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    const load = async () => {
      if (user?.email) {
        // Normalize to lower-case for matching stored invites
        await getInvitationsByEmail(user.email.toLowerCase());
      }
      if (user?.id) {
        const mine = await getInvitationsByInviter(user.id);
        setSent(mine);
      }
    };
    if (open) load();
  }, [open, user?.email, user?.id, getInvitationsByEmail, getInvitationsByInviter]);

  const pending = invitations.filter(i => i.status === 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>My Invitations</DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex gap-2">
          <Button variant={activeTab === 'received' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('received')}>Received</Button>
          <Button variant={activeTab === 'sent' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('sent')}>Sent</Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-4">
            <CardContent className="pt-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'received' ? (
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-gray-500">No pending invitations</p>
            ) : (
              pending.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        For {inv.client?.firstName} {inv.client?.lastName}
                      </span>
                      <Badge variant="outline">{inv.role}</Badge>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    {inv.personalMessage && (
                      <p className="text-sm text-gray-600 mt-1">"{inv.personalMessage}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Invited by {inv.inviter?.firstName && inv.inviter?.lastName ? `${inv.inviter.firstName} ${inv.inviter.lastName}` : 'Unknown'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptInvitation({ token: inv.token, userId: user!.id })} disabled={loading}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => declineInvitation(inv.id)} disabled={loading}>Decline</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : sent.length === 0 ? (
              <p className="text-gray-500">No invitations sent yet</p>
            ) : (
              sent.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{inv.invitedEmail}</span>
                      <Badge variant="outline">{inv.role}</Badge>
                      <Badge variant={inv.status === 'accepted' ? 'secondary' : inv.status === 'declined' ? 'destructive' : 'outline'}>
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">For {inv.client?.firstName} {inv.client?.lastName}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


