'use client';

import React, { useState, useEffect } from 'react';
import { PageErrorBoundary } from '@/components/error/page-error-boundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Users, 
  AlertTriangle, 
  Trash2,
  Eye,
  Edit
} from 'lucide-react';
import { ClientCard } from '@/components/healthcare/client-card';
import { ClientDialog } from '@/components/healthcare/client-dialog';
import { ClientDetailView } from '@/components/healthcare/client-detail-view';
import { InvitationsModal } from '@/components/healthcare/invitations-modal';
import { 
  useClients, 
  useDeleteClient, 
  useClientSubscription 
} from '@/hooks/use-clients';
import type { Client } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function ClientsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading, error } = useClients();
  const deleteClient = useDeleteClient();
  const clientSubscription = useClientSubscription();

  // Set up real-time subscription
  useEffect(() => {
    const subscription = clientSubscription.subscribe();
    return () => subscription.unsubscribe();
  }, []);

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      client.medicalConditions?.some(condition => 
        condition.toLowerCase().includes(searchLower)
      ) ||
      client.allergies?.some(allergy => 
        allergy.toLowerCase().includes(searchLower)
      )
    );
  });

  const handleCreateClient = () => {
    setSelectedClient(null);
    setDialogMode('create');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setDialogMode('edit');
  };

  const handleViewClient = (client: Client) => {
    // Navigate to the new client detail page
    window.location.href = `/clients/${client.id}`;
  };

  const handleDeleteClient = (client: Client) => {
    setDeleteConfirmClient(client);
  };

  const confirmDelete = async () => {
    if (deleteConfirmClient) {
      try {
        await deleteClient.mutateAsync(deleteConfirmClient.id);
        setDeleteConfirmClient(null);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedClient(null);
  };

  // Count clients with allergies for quick stats
  const clientsWithAllergies = clients.filter(p => p.allergies && p.allergies.length > 0).length;
  const clientsWithConditions = clients.filter(p => p.medicalConditions && p.medicalConditions.length > 0).length;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p>Error loading clients: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [showInvitations, setShowInvitations] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Clients
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Manage Client profiles and medical information
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowInvitations(true)}>
            My Invitations
          </Button>
          <Button onClick={handleCreateClient} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover-lift group cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{clients.length}</p>
                  <p className="text-sm text-gray-500 font-medium">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-lift group cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{clientsWithAllergies}</p>
                  <p className="text-sm text-gray-500 font-medium">With Allergies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-lift group cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <div className="w-6 h-6 bg-white rounded-full" />
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{clientsWithConditions}</p>
                  <p className="text-sm text-gray-500 font-medium">With Conditions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      {clients.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <Input
                   placeholder="Search clients by name, conditions, or allergies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 text-base"
                />
              </div>
              {searchTerm && (
                <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300 px-3 py-1 font-semibold animate-scaleIn">
                  {filteredClients.length} of {clients.length} clients
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      {isLoading ? (
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-full animate-spin"></div>
                <div className="absolute inset-1 bg-white rounded-full"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-600 font-medium animate-pulse">Loading clients...</p>
            </div>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardHeader>
             <CardTitle>Client Management</CardTitle>
            <CardDescription>
               Add and manage client profiles, medical conditions, and emergency contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
               <p className="text-gray-600 mb-4">No clients added yet.</p>
               <Button onClick={handleCreateClient}>Add First Client</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, index) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEditClient}
              onView={handleViewClient}
              className="relative group hover-lift animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Additional action buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewClient(client);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClient(client);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(client);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </ClientCard>
          ))}
        </div>
      )}

      {/* Create/Edit Client Dialog */}
      <ClientDialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        onOpenChange={(open) => !open && closeDialog()}
        client={selectedClient}
        mode={dialogMode === 'create' ? 'create' : 'edit'}
      />

      {/* Client Detail View Dialog */}
      <Dialog open={dialogMode === 'view'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Complete client information and medical history
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <ClientDetailView
              client={selectedClient}
              onEdit={(client) => {
                setDialogMode('edit');
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deleteConfirmClient} 
        onOpenChange={(open) => !open && setDeleteConfirmClient(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteConfirmClient?.firstName} {deleteConfirmClient?.lastName}? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmClient(null)}
              disabled={deleteClient.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? 'Deleting...' : 'Delete Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invitations Modal */}
      <InvitationsModal open={showInvitations} onOpenChange={setShowInvitations} />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <PageErrorBoundary pageName="Clients">
      <ClientsContent />
    </PageErrorBoundary>
  );
}