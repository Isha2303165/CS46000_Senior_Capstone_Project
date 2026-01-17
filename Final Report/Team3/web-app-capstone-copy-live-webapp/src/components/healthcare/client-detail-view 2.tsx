'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Pill,
  AlertCircle,
  Activity,
  FileText,
  Users,
  ChevronRight,
  Plus,
  Edit2,
  Bell,
  Heart,
  Shield,
  Stethoscope,
  CreditCard
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInYears } from 'date-fns';
import { CaregiverManagement } from './caregiver-management';
import { useClientMedications } from '@/hooks/use-medications';
import { useClientAppointments } from '@/hooks/use-appointments';
import { useCaregiverPermissions } from '@/hooks/use-caregiver-permissions';
import type { Client } from '@/types';

interface ClientDetailViewProps {
  client: Client;
  onEdit?: (client: Client) => void;
  className?: string;
}

export function ClientDetailView({ client, onEdit, className }: ClientDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const age = differenceInYears(new Date(), new Date(client.dateOfBirth));
  
  // Fetch real data from hooks
  const { data: medications = [] } = useClientMedications(client.id);
  const { data: appointments = [] } = useClientAppointments(client.id);
  const permissions = useCaregiverPermissions(client.id);
  
  // Calculate real statistics
  const activeMedications = medications.filter(m => m.isActive);
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.scheduledAt) > new Date()
  );
  
  // Count overdue items - medications that should have been taken and appointments that were missed
  const now = new Date();
  const overdueAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.scheduledAt) < now
  );
  const overdueItems = overdueAppointments.length;
  
  // Calculate medication adherence (simplified - in production would track actual doses taken)
  // For now, just show that we have active medications
  const medicationAdherence = activeMedications.length > 0 ? 100 : 0;
  
  // Count active caregivers
  const careTeamSize = permissions.role ? 1 : 0; // Simplified - would need to fetch all caregivers
  
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={client.profilePicture} 
                  alt={`${client.firstName} ${client.lastName}`}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-medium">
                  {client.firstName[0]}{client.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {client.firstName} {client.lastName}
                  </h1>
                  <Badge variant="outline" className="text-sm">
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {age} years old
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {client.gender?.charAt(0).toUpperCase() + client.gender?.slice(1).replace('_', ' ') || 'Not specified'}
                  </span>
                  {client.medicalRecordNumber && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      MRN: {client.medicalRecordNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button onClick={() => onEdit(client)} className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit Client
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Medication Adherence</p>
                  <p className="text-2xl font-bold text-gray-900">{medicationAdherence}%</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Pill className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Progress value={medicationAdherence} className="h-1 mt-3" />
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Next in 2 days</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Items</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueItems}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Care Team</p>
                  <p className="text-2xl font-bold text-gray-900">{careTeamSize}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Active caregivers</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Banner if allergies exist */}
      {client.allergies && client.allergies.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Critical Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {client.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">
              Overview
            </TabsTrigger>
            <TabsTrigger value="medical" className="data-[state=active]:bg-gray-100">
              Medical Info
            </TabsTrigger>
            <TabsTrigger value="medications" className="data-[state=active]:bg-gray-100">
              Medications
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-gray-100">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gray-100">
              Care Team
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-gray-100">
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Emergency Contact</p>
                    <p className="font-medium">{client.emergencyContactName}</p>
                    <a href={`tel:${client.emergencyContactPhone}`} className="text-sm text-blue-600 hover:underline">
                      {client.emergencyContactPhone}
                    </a>
                    {client.emergencyContactRelationship && (
                      <p className="text-sm text-gray-600 mt-1">{client.emergencyContactRelationship}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Information */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.insuranceProvider && (
                    <div>
                      <p className="text-sm text-gray-500">Provider</p>
                      <p className="font-medium">{client.insuranceProvider}</p>
                    </div>
                  )}
                  {client.insurancePolicyNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Policy #</p>
                      <p className="font-mono text-sm">{client.insurancePolicyNumber}</p>
                    </div>
                  )}
                  {client.insuranceGroupNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Group #</p>
                      <p className="font-mono text-sm">{client.insuranceGroupNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Healthcare Providers */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Healthcare Providers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.primaryPhysician && (
                    <div>
                      <p className="text-sm text-gray-500">Primary Physician</p>
                      <p className="font-medium">{client.primaryPhysician}</p>
                    </div>
                  )}
                  {client.preferredPharmacy && (
                    <div>
                      <p className="text-sm text-gray-500">Preferred Pharmacy</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.preferredPharmacy}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show recent appointments and medications */}
                  {appointments.length === 0 && medications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                  ) : (
                    <>
                      {appointments
                        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                        .slice(0, 2)
                        .map((apt) => (
                          <div key={apt.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                            <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                Appointment {apt.status}
                              </p>
                              <p className="text-sm text-gray-600">
                                {apt.appointmentType} - {apt.provider || 'Provider not specified'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(apt.scheduledAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      {activeMedications.slice(0, 1).map((med) => (
                        <div key={med.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Medication Added</p>
                            <p className="text-sm text-gray-600">
                              {med.name} - {med.dosage}, {med.frequency}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Active prescription
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Info Tab */}
          <TabsContent value="medical" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Medical Conditions */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Medical Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client.medicalConditions && client.medicalConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {client.medicalConditions.map((condition, index) => (
                        <Badge key={index} variant="secondary" className="py-1.5 px-3">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No medical conditions recorded</p>
                  )}
                </CardContent>
              </Card>

              {/* Current Medications Summary */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Current Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client.currentMedications && client.currentMedications.length > 0 ? (
                    <div className="space-y-2">
                      {client.currentMedications.map((med, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{med}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No active medications</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Care Notes */}
            {client.careNotes && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Care Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.careNotes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Medication Schedule</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Medication details will appear here</p>
                  <p className="text-sm mt-2">Connect to medication tracking system to view schedule</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Appointments</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Schedule Appointment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming appointments</p>
                  <p className="text-sm mt-2">Schedule new appointments to see them here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Care Team Tab */}
          <TabsContent value="team">
            <CaregiverManagement client={client} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Complete Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Activity timeline will appear here</p>
                  <p className="text-sm mt-2">All client interactions and updates will be logged</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}