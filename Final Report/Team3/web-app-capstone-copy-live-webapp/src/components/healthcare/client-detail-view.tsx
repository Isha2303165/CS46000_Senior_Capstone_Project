'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Calendar, 
  Phone, 
  AlertTriangle, 
  Heart, 
  Pill, 
  Shield, 
  Stethoscope,
  MapPin,
  FileText,
  Edit
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { CaregiverManagement } from './caregiver-management';
import type { Client } from '@/types';

interface ClientDetailViewProps {
  client: Client;
  onEdit?: (client: Client) => void;
  className?: string;
}

export function ClientDetailView({ client, onEdit, className }: ClientDetailViewProps) {
  const age = differenceInYears(new Date(), new Date(client.dateOfBirth));
  const hasAllergies = client.allergies && client.allergies.length > 0;
  const hasMedicalConditions = client.medicalConditions && client.medicalConditions.length > 0;
  const hasCurrentMedications = client.currentMedications && client.currentMedications.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-600">
              Age {age} • {client.gender ? client.gender.charAt(0).toUpperCase() + client.gender.slice(1).replace('_', ' ') : 'Not specified'}
            </p>
            {client.medicalRecordNumber && (
              <p className="text-sm text-gray-500">
                MRN: {client.medicalRecordNumber}
              </p>
            )}
          </div>
        </div>
        
        {onEdit && (
          <Button onClick={() => onEdit(client)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Client
          </Button>
        )}
      </div>

      {/* Critical Alerts */}
      {hasAllergies && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {client.allergies?.map((allergy, index) => (
                <Badge key={index} variant="destructive" className="text-sm">
                  {allergy}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="text-sm">{format(new Date(client.dateOfBirth), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Age</p>
                <p className="text-sm">{age} years old</p>
              </div>
            </div>
            
            {client.gender && (
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-sm capitalize">
                  {client.gender.replace('_', ' ')}
                </p>
              </div>
            )}

            {client.medicalRecordNumber && (
              <div>
                <p className="text-sm font-medium text-gray-500">Medical Record Number</p>
                <p className="text-sm font-mono">{client.medicalRecordNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-sm font-semibold">{client.emergencyContactName}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm">
                <a 
                  href={`tel:${client.emergencyContactPhone}`}
                  className="text-blue-600 hover:underline"
                >
                  {client.emergencyContactPhone}
                </a>
              </p>
            </div>

            {client.emergencyContactRelationship && (
              <div>
                <p className="text-sm font-medium text-gray-500">Relationship</p>
                <p className="text-sm">{client.emergencyContactRelationship}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Conditions */}
        {hasMedicalConditions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Medical Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {client.medicalConditions?.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {condition}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Medications */}
        {hasCurrentMedications && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {client.currentMedications?.map((medication, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {medication}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insurance Information */}
        {(client.insuranceProvider || client.insurancePolicyNumber || client.insuranceGroupNumber) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.insuranceProvider && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <p className="text-sm">{client.insuranceProvider}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {client.insurancePolicyNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Policy Number</p>
                    <p className="text-sm font-mono">{client.insurancePolicyNumber}</p>
                  </div>
                )}
                
                {client.insuranceGroupNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Group Number</p>
                    <p className="text-sm font-mono">{client.insuranceGroupNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Healthcare Providers */}
        {(client.primaryPhysician || client.preferredPharmacy) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Healthcare Providers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.primaryPhysician && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Primary Physician</p>
                  <p className="text-sm">{client.primaryPhysician}</p>
                </div>
              )}
              
              {client.preferredPharmacy && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Preferred Pharmacy</p>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {client.preferredPharmacy}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Care Notes */}
      {client.careNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Care Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{client.careNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Caregiver Management */}
      <CaregiverManagement client={client} />

      {/* Metadata */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Record Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-medium">Created</p>
              <p>{format(new Date(client.createdAt), 'MMM dd, yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p>{format(new Date(client.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}