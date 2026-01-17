'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Phone,
  Plus,
  Search,
  User,
  Heart,
  AlertCircle,
  Edit2,
  Trash2,
  PhoneCall,
  Mail,
  MapPin,
  Clock
} from 'lucide-react';
import { useClients } from '@/hooks/use-clients';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FormField } from '@/components/forms/form-field';
import { SelectField } from '@/components/forms/select-field';

interface EmergencyContact {
  id: string;
  clientId: string;
  clientName: string;
  contactName: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  notes?: string;
}

export default function EmergencyContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const { data: clients = [], isLoading } = useClients();

  // Mock emergency contacts data - in production, this would come from the database
  const mockContacts: EmergencyContact[] = clients.flatMap(client => {
    if (client.emergencyContactName && client.emergencyContactPhone) {
      return [{
        id: `${client.id}-primary`,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        contactName: client.emergencyContactName,
        relationship: client.emergencyContactRelationship || 'Not specified',
        phone: client.emergencyContactPhone,
        isPrimary: true,
      }];
    }
    return [];
  });

  const filteredContacts = mockContacts.filter(contact =>
    contact.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const handleCallContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmailContact = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Emergency Contacts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage emergency contacts for all clients
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
                  <p className="text-2xl font-bold">{mockContacts.length}</p>
                </div>
                <Phone className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Primary Contacts</p>
                  <p className="text-2xl font-bold">
                    {mockContacts.filter(c => c.isPrimary).length}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clients Covered</p>
                  <p className="text-2xl font-bold">{clients.length}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Missing Contacts</p>
                  <p className="text-2xl font-bold">
                    {clients.filter(p => !p.emergencyContactName).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                No emergency contacts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {searchTerm ? 'Try adjusting your search' : 'Add emergency contacts for your clients'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{contact.contactName}</CardTitle>
                      <CardDescription className="text-sm">
                        For: {contact.clientName}
                      </CardDescription>
                    </div>
                    {contact.isPrimary && (
                      <Badge className="bg-green-100 text-green-800">Primary</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {contact.relationship}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a 
                        href={`tel:${contact.phone}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {contact.phone}
                      </a>
                    </div>
                    
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a 
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:text-blue-700 truncate"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    
                    {contact.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                          {contact.address}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCallContact(contact.phone)}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </Button>
                    {contact.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEmailContact(contact.email)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingContact(contact)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Clients Without Emergency Contacts */}
        {clients.filter(p => !p.emergencyContactName).length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-400">
                <AlertCircle className="w-5 h-5" />
                Clients Without Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clients
                  .filter(p => !p.emergencyContactName)
                  .map(client => (
                    <div 
                      key={client.id}
                      className="bg-white dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{client.firstName} {client.lastName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No emergency contact
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Navigate to client page to add emergency contact
                          window.location.href = `/clients/${client.id}`;
                        }}
                      >
                        Add Contact
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}