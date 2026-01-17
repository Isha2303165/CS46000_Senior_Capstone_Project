'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { ClientDetailHeader } from '@/components/healthcare/client-detail-header';
import { ClientDetailContent } from '@/components/healthcare/client-detail-content';
import { ClientDetailErrorBoundary } from '@/components/healthcare/client-detail-error-boundary';
import { ClientDialog } from '@/components/healthcare/client-dialog';
import { useClient } from '@/hooks/use-clients';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ClientDetailPageProps {
  params: {
    clientId: string;
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Validate clientId parameter
  if (!clientId || typeof clientId !== 'string') {
    return (
        <div className="max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
                <p>Invalid client ID provided</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { data: client, isLoading, error } = useClient(clientId);
  

  const handleEditClient = () => {
    setIsEditDialogOpen(true);
  };

  const handleEmergencyContact = () => {
    // The tel: link will handle the actual call
    // This callback can be used for analytics or other side effects
    // Analytics or side effects can be added here
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p>
                {error ? `Error loading client: ${error.message}` : 'Client not found'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ClientDetailErrorBoundary clientId={clientId}>
      <div className="max-w-7xl mx-auto space-y-6">
        <ClientDetailHeader 
          client={client} 
          onEdit={handleEditClient}
          onEmergencyContact={handleEmergencyContact}
        />
        <ClientDetailContent client={client} />

        {/* Edit Client Dialog */}
        <ClientDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          client={client}
          mode="edit"
        />
      </div>
      
      {/* Debug component removed */}
    </ClientDetailErrorBoundary>
  );
}