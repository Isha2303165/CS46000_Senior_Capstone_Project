'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useCreateClient, useUpdateClient } from '@/hooks/use-clients';
import type { Client, CreateClientInput, Gender } from '@/types';

const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  medicalRecordNumber: z.string().optional(),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceGroupNumber: z.string().optional(),
  primaryPhysician: z.string().optional(),
  preferredPharmacy: z.string().optional(),
  careNotes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  mode: 'create' | 'edit';
}

export function ClientDialog({ open, onOpenChange, client, mode }: ClientDialogProps) {
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  // Reset form when dialog opens/closes or client changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && client) {
        reset({
          firstName: client.firstName,
          lastName: client.lastName,
          dateOfBirth: client.dateOfBirth,
          gender: client.gender,
          medicalRecordNumber: client.medicalRecordNumber || '',
          emergencyContactName: client.emergencyContactName,
          emergencyContactPhone: client.emergencyContactPhone,
          emergencyContactRelationship: client.emergencyContactRelationship || '',
          insuranceProvider: client.insuranceProvider || '',
          insurancePolicyNumber: client.insurancePolicyNumber || '',
          insuranceGroupNumber: client.insuranceGroupNumber || '',
          primaryPhysician: client.primaryPhysician || '',
          preferredPharmacy: client.preferredPharmacy || '',
          careNotes: client.careNotes || '',
        });
        setMedicalConditions(client.medicalConditions || []);
        setAllergies(client.allergies || []);
        setCurrentMedications(client.currentMedications || []);
      } else {
        reset();
        setMedicalConditions([]);
        setAllergies([]);
        setCurrentMedications([]);
      }
    }
  }, [open, mode, client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const clientData = {
        ...data,
        medicalConditions: medicalConditions.length > 0 ? medicalConditions : undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        currentMedications: currentMedications.length > 0 ? currentMedications : undefined,
      };

      // Validate phone number format (AWS Phone type expects E.164 format)
      if (clientData.emergencyContactPhone && !clientData.emergencyContactPhone.startsWith('+')) {
        // Simple US phone number conversion - in production, use a proper phone library
        const cleaned = clientData.emergencyContactPhone.replace(/\D/g, '');
        if (cleaned.length === 10) {
          clientData.emergencyContactPhone = `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
          clientData.emergencyContactPhone = `+${cleaned}`;
        }
      }

      if (mode === 'create') {
        await createClient.mutateAsync(clientData as CreateClientInput);
      } else if (mode === 'edit' && client) {
        await updateClient.mutateAsync({
          id: client.id,
          ...clientData,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const addMedicalCondition = () => {
    if (newCondition.trim() && !medicalConditions.includes(newCondition.trim())) {
      setMedicalConditions([...medicalConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeMedicalCondition = (condition: string) => {
    setMedicalConditions(medicalConditions.filter(c => c !== condition));
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const addMedication = () => {
    if (newMedication.trim() && !currentMedications.includes(newMedication.trim())) {
      setCurrentMedications([...currentMedications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    setCurrentMedications(currentMedications.filter(m => m !== medication));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Client' : 'Edit Client'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Enter client information to create a new profile.'
              : 'Update client information and medical details.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalRecordNumber">Medical Record Number</Label>
              <Input
                id="medicalRecordNumber"
                {...register('medicalRecordNumber')}
                placeholder="Enter medical record number"
              />
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Medical Information</h3>
            
            {/* Medical Conditions */}
            <div className="space-y-2">
              <Label>Medical Conditions</Label>
              <div className="flex gap-2">
                <Input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add medical condition"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicalCondition())}
                />
                <Button type="button" onClick={addMedicalCondition} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {medicalConditions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {medicalConditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {condition}
                      <button
                        type="button"
                        onClick={() => removeMedicalCondition(condition)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label>Allergies</Label>
              <div className="flex gap-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <Button type="button" onClick={addAllergy} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="flex items-center gap-1">
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="ml-1 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Current Medications */}
            <div className="space-y-2">
              <Label>Current Medications</Label>
              <div className="flex gap-2">
                <Input
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add current medication"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                />
                <Button type="button" onClick={addMedication} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {currentMedications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentMedications.map((medication, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {medication}
                      <button
                        type="button"
                        onClick={() => removeMedication(medication)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  {...register('emergencyContactName')}
                  placeholder="Enter contact name"
                />
                {errors.emergencyContactName && (
                  <p className="text-sm text-red-600">{errors.emergencyContactName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  {...register('emergencyContactPhone')}
                  placeholder="Enter phone number"
                />
                {errors.emergencyContactPhone && (
                  <p className="text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelationship">Relationship</Label>
              <Input
                id="emergencyContactRelationship"
                {...register('emergencyContactRelationship')}
                placeholder="e.g., Spouse, Child, Parent"
              />
            </div>
          </div>

          {/* Insurance Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Insurance Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Input
                id="insuranceProvider"
                {...register('insuranceProvider')}
                placeholder="Enter insurance provider"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                <Input
                  id="insurancePolicyNumber"
                  {...register('insurancePolicyNumber')}
                  placeholder="Enter policy number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceGroupNumber">Group Number</Label>
                <Input
                  id="insuranceGroupNumber"
                  {...register('insuranceGroupNumber')}
                  placeholder="Enter group number"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryPhysician">Primary Physician</Label>
                <Input
                  id="primaryPhysician"
                  {...register('primaryPhysician')}
                  placeholder="Enter primary physician"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredPharmacy">Preferred Pharmacy</Label>
                <Input
                  id="preferredPharmacy"
                  {...register('preferredPharmacy')}
                  placeholder="Enter preferred pharmacy"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="careNotes">Care Notes</Label>
              <textarea
                id="careNotes"
                {...register('careNotes')}
                placeholder="Enter any additional care notes or instructions"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Update Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}