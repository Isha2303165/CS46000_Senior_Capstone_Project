'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Shield, 
  Edit, 
  Save, 
  X, 
  AlertTriangle,
  User,
  CreditCard
} from 'lucide-react';
import { useUpdateClient } from '@/hooks/use-clients';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/types';

const contactSchema = z.object({
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceGroupNumber: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ClientContactsSectionProps {
  client: Client;
}

export function ClientContactsSection({ client }: ClientContactsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateClient = useUpdateClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      emergencyContactName: client.emergencyContactName || '',
      emergencyContactPhone: client.emergencyContactPhone || '',
      emergencyContactRelationship: client.emergencyContactRelationship || '',
      insuranceProvider: client.insuranceProvider || '',
      insurancePolicyNumber: client.insurancePolicyNumber || '',
      insuranceGroupNumber: client.insuranceGroupNumber || '',
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      emergencyContactName: client.emergencyContactName || '',
      emergencyContactPhone: client.emergencyContactPhone || '',
      emergencyContactRelationship: client.emergencyContactRelationship || '',
      insuranceProvider: client.insuranceProvider || '',
      insurancePolicyNumber: client.insurancePolicyNumber || '',
      insuranceGroupNumber: client.insuranceGroupNumber || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Format phone number for E.164 if needed
      let formattedPhone = data.emergencyContactPhone;
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        const cleaned = formattedPhone.replace(/\D/g, '');
        if (cleaned.length === 10) {
          formattedPhone = `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
          formattedPhone = `+${cleaned}`;
        }
      }

      await updateClient.mutateAsync({
        id: client.id,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: formattedPhone,
        emergencyContactRelationship: data.emergencyContactRelationship || undefined,
        insuranceProvider: data.insuranceProvider || undefined,
        insurancePolicyNumber: data.insurancePolicyNumber || undefined,
        insuranceGroupNumber: data.insuranceGroupNumber || undefined,
      });

      setIsEditing(false);
      toast({
        title: 'Contact information updated',
        description: 'Emergency contact and insurance information has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating contact information:', error);
      toast({
        title: 'Error updating contact information',
        description: 'Please try again or contact support if the problem persists.',
        variant: 'destructive',
      });
    }
  };

  // Check for missing emergency contact information
  const hasMissingEmergencyInfo = !client.emergencyContactName || !client.emergencyContactPhone;
  const hasMissingInsuranceInfo = !client.insuranceProvider;

  return (
    <div className="space-y-6">
      {/* Emergency Contacts Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Emergency Contacts
              {hasMissingEmergencyInfo && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Incomplete
                </Badge>
              )}
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
                aria-label="Edit contact information"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasMissingEmergencyInfo && !isEditing && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Missing Emergency Contact Information</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Please add emergency contact information for this client. This is critical for emergency situations.
              </p>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  placeholder="e.g., Spouse, Child, Parent, Friend"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex items-center gap-2"
                  aria-label="Save contact information changes"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                  aria-label="Cancel editing contact information"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {client.emergencyContactName && client.emergencyContactPhone ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">Primary Emergency Contact</h4>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">
                          {client.emergencyContactName}
                        </p>
                        {client.emergencyContactRelationship && (
                          <p className="text-sm text-gray-600">
                            {client.emergencyContactRelationship}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <a 
                            href={`tel:${client.emergencyContactPhone}`}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 hover:underline"
                            aria-label={`Call ${client.emergencyContactName} at ${client.emergencyContactPhone}`}
                          >
                            <Phone className="w-3 h-3" />
                            {client.emergencyContactPhone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Phone className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No emergency contact information available</p>
                  <p className="text-xs text-gray-400 mt-1">Click Edit to add emergency contact details</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Insurance Information
            {hasMissingInsuranceInfo && (
              <Badge variant="secondary" className="ml-2">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Not Provided
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  {...register('insuranceProvider')}
                  placeholder="Enter insurance provider name"
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
          ) : (
            <div className="space-y-4">
              {client.insuranceProvider ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Provider</h4>
                          <p className="text-sm text-gray-700">{client.insuranceProvider}</p>
                        </div>
                        
                        {client.insurancePolicyNumber && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Policy Number</h4>
                            <p className="text-sm text-gray-700 font-mono bg-white px-2 py-1 rounded border">
                              {client.insurancePolicyNumber}
                            </p>
                          </div>
                        )}
                        
                        {client.insuranceGroupNumber && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Group Number</h4>
                            <p className="text-sm text-gray-700 font-mono bg-white px-2 py-1 rounded border">
                              {client.insuranceGroupNumber}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No insurance information available</p>
                  <p className="text-xs text-gray-400 mt-1">Click Edit to add insurance details</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}