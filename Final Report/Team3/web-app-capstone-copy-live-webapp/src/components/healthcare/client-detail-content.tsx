'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Pill, 
  FileText, 
  MessageSquare, 
  Activity,
  Phone,
  Shield
} from 'lucide-react';
import { ClientMedicationsSection } from './client-medications-section';
import { CaregiverManagement } from './caregiver-management';
import { ClientAppointmentsSection } from './client-appointments-section';
import { CalendarView } from './calendar-view';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { ClientDetailContentProps } from '@/types';

export function ClientDetailContent({ client }: ClientDetailContentProps) {
  const { user } = useAuthStore();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overview Section */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Client Overview
            </CardTitle>
            <CardDescription>
              Quick summary of current status and upcoming items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Pill className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">
                  {client.currentMedications?.length || 0}
                </p>
                <p className="text-sm text-blue-600">Current Medications</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">0</p>
                <p className="text-sm text-green-600">Upcoming Appointments</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-700">0</p>
                <p className="text-sm text-orange-600">Unread Messages</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">0</p>
                <p className="text-sm text-purple-600">Recent Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Medical Conditions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Medical Conditions</h4>
            {client.medicalConditions && client.medicalConditions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {client.medicalConditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No medical conditions recorded</p>
            )}
          </div>

          {/* Allergies */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Allergies</h4>
            {client.allergies && client.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {client.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No known allergies</p>
            )}
          </div>

          {/* Primary Physician */}
          {client.primaryPhysician && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Primary Physician</h4>
              <p className="text-sm text-gray-700">{client.primaryPhysician}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Primary Emergency Contact</h4>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {client.emergencyContactName}
              </p>
              <p className="text-sm text-gray-600">
                {client.emergencyContactRelationship}
              </p>
              <a 
                href={`tel:${client.emergencyContactPhone}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {client.emergencyContactPhone}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Insurance Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.insuranceProvider ? (
            <>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Provider</h4>
                <p className="text-sm text-gray-700">{client.insuranceProvider}</p>
              </div>
              {client.insurancePolicyNumber && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Policy Number</h4>
                  <p className="text-sm text-gray-700 font-mono">
                    {client.insurancePolicyNumber}
                  </p>
                </div>
              )}
              {client.insuranceGroupNumber && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Group Number</h4>
                  <p className="text-sm text-gray-700 font-mono">
                    {client.insuranceGroupNumber}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No insurance information recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Medications Section */}
      <div className="lg:col-span-3">
        <ClientMedicationsSection clientId={client.id} />
      </div>

      {/* Appointments Section */}
      {user && (
        <div className="lg:col-span-3">
          <ClientAppointmentsSection
            clientId={client.id}
            client={client}
            currentUser={user as any}
          />
        </div>
      )}

      {/* Client Calendar */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Client Calendar
            </CardTitle>
            <CardDescription>
              Upcoming appointments and medication schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarView clientId={client.id} />
          </CardContent>
        </Card>
      </div>

      {/* Care Notes */}
      {client.careNotes && (
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Care Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {client.careNotes}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Caregiver Management and Invitations */}
      <div className="lg:col-span-3">
        <CaregiverManagement client={client} />
      </div>
    </div>
  );
}