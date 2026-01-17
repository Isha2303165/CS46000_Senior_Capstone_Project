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
import { MedicationAutocomplete } from '@/components/forms/MedicationAutocomplete';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Clock, AlertTriangle } from 'lucide-react';
import { useCreateMedication, useUpdateMedication, useMedications } from '@/hooks/use-medications';
import { useClients } from '@/hooks/use-clients';
import { checkDrugPair, InteractionSeverity } from '@/lib/medication-interactions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Medication, CreateMedicationInput, MedicationRoute, ScheduleType } from '@/types';

const medicationSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  name: z.string().min(1, 'Medication name is required'),
  genericName: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  unit: z.string().min(1, 'Unit is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  route: z.enum(['oral', 'injection', 'topical', 'inhalation', 'other']).optional(),
  scheduleType: z.enum(['fixed_times', 'interval', 'as_needed']),
  intervalHours: z.union([z.number(), z.nan(), z.null()]).optional().transform(val => 
    (val === null || Number.isNaN(val)) ? undefined : val
  ),
  prescribingDoctor: z.string().min(1, 'Prescribing doctor is required'),
  prescriptionDate: z.string().optional(),
  instructions: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isPRN: z.boolean().default(false),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication?: Medication | null;
  mode: 'create' | 'edit';
  clientId?: string;
}

export function MedicationDialog({ 
  open, 
  onOpenChange, 
  medication, 
  mode, 
  clientId 
}: MedicationDialogProps) {
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [newSideEffect, setNewSideEffect] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [interactionWarning, setInteractionWarning] = useState<{
    severity: InteractionSeverity;
    message: string;
    recommendation: string;
  } | null>(null);

  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();
  const { data: clients = [] } = useClients();
  const { data: existingMedications = [] } = useMedications(clientId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      scheduleType: 'fixed_times',
      route: 'oral',
      isPRN: false,
    },
  });
  

  const scheduleType = watch('scheduleType');
  const isPRN = watch('isPRN');
  const medicationName = watch('name');

  // Check for drug interactions when medication name changes
  useEffect(() => {
    if (medicationName && mode === 'create' && existingMedications.length > 0) {
      let foundInteraction = false;
      let mostSevereInteraction: typeof interactionWarning = null;

      for (const existingMed of existingMedications) {
        const interaction = checkDrugPair(medicationName, existingMed.name);
        if (interaction) {
          foundInteraction = true;
          if (!mostSevereInteraction || 
              (interaction.severity === InteractionSeverity.CONTRAINDICATED) ||
              (interaction.severity === InteractionSeverity.MAJOR && mostSevereInteraction.severity !== InteractionSeverity.CONTRAINDICATED)) {
            mostSevereInteraction = {
              severity: interaction.severity,
              message: `${interaction.description} (with ${existingMed.name})`,
              recommendation: interaction.recommendation
            };
          }
        }
      }

      setInteractionWarning(mostSevereInteraction);
    } else {
      setInteractionWarning(null);
    }
  }, [medicationName, existingMedications, mode]);

  // Reset form when dialog opens/closes or medication changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && medication) {
        reset({
          clientId: medication.clientId,
          name: medication.name,
          genericName: medication.genericName || '',
          dosage: medication.dosage,
          unit: medication.unit,
          frequency: medication.frequency,
          route: medication.route,
          scheduleType: medication.scheduleType,
          intervalHours: medication.intervalHours || undefined,
          prescribingDoctor: medication.prescribingDoctor,
          prescriptionDate: medication.prescriptionDate || '',
          instructions: medication.instructions || '',
          startDate: medication.startDate,
          endDate: medication.endDate || '',
          isPRN: medication.isPRN,
        });
        setSideEffects(medication.sideEffects || []);
        setScheduledTimes(medication.scheduledTimes || []);
      } else {
        reset({
          clientId: clientId || '',
          scheduleType: 'fixed_times',
          route: 'oral',
          isPRN: false,
        });
        setSideEffects([]);
        setScheduledTimes([]);
      }
    }
  }, [open, mode, medication, clientId, reset]);

  const onSubmit = async (data: MedicationFormData) => {
    try {
      const medicationData = {
        ...data,
        intervalHours: data.intervalHours || undefined,
        sideEffects: sideEffects.length > 0 ? sideEffects : undefined,
        scheduledTimes: scheduleType === 'fixed_times' && scheduledTimes.length > 0 
          ? scheduledTimes 
          : undefined,
      };


      if (mode === 'create') {
        await createMedication.mutateAsync(medicationData as CreateMedicationInput);
      } else if (mode === 'edit' && medication) {
        const updateData = {
          id: medication.id,
          ...medicationData,
        };
        await updateMedication.mutateAsync(updateData);
      } else {
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving medication - full error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save medication. Please try again.');
      }
    }
  };

  const addSideEffect = () => {
    if (newSideEffect.trim() && !sideEffects.includes(newSideEffect.trim())) {
      setSideEffects([...sideEffects, newSideEffect.trim()]);
      setNewSideEffect('');
    }
  };

  const removeSideEffect = (effect: string) => {
    setSideEffects(sideEffects.filter(e => e !== effect));
  };

  const addScheduledTime = () => {
    if (newScheduledTime && !scheduledTimes.includes(newScheduledTime)) {
      setScheduledTimes([...scheduledTimes, newScheduledTime].sort());
      setNewScheduledTime('');
    }
  };

  const removeScheduledTime = (time: string) => {
    setScheduledTimes(scheduledTimes.filter(t => t !== time));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Medication' : 'Edit Medication'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Enter medication details and schedule information.'
              : 'Update medication information and schedule.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Display */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}
          
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            {/* Client Selector - only show when no clientId is provided */}
            {!clientId && (
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <select
                  id="clientId"
                  {...register('clientId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="text-sm text-red-600">{errors.clientId.message}</p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label htmlFor="name">Medication Name *</Label>
                <MedicationAutocomplete
                  value={watch('name')}
                  onChange={val => setValue('name', val, { shouldValidate: true })}
                  placeholder="Enter medication name"
                  error={errors.name?.message}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  {...register('genericName')}
                  placeholder="Enter generic name"
                />
              </div>
            </div>

            {/* Drug Interaction Warning */}
            {interactionWarning && (
              <Alert className={
                interactionWarning.severity === InteractionSeverity.CONTRAINDICATED ? 'border-red-500 bg-red-50' :
                interactionWarning.severity === InteractionSeverity.MAJOR ? 'border-orange-500 bg-orange-50' :
                interactionWarning.severity === InteractionSeverity.MODERATE ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }>
                <AlertTriangle className={
                  interactionWarning.severity === InteractionSeverity.CONTRAINDICATED ? 'h-4 w-4 text-red-600' :
                  interactionWarning.severity === InteractionSeverity.MAJOR ? 'h-4 w-4 text-orange-600' :
                  interactionWarning.severity === InteractionSeverity.MODERATE ? 'h-4 w-4 text-yellow-600' :
                  'h-4 w-4 text-blue-600'
                } />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {interactionWarning.severity === InteractionSeverity.CONTRAINDICATED && '⚠️ CONTRAINDICATED - Do not use together'}
                      {interactionWarning.severity === InteractionSeverity.MAJOR && '⚠️ Major Drug Interaction'}
                      {interactionWarning.severity === InteractionSeverity.MODERATE && 'Moderate Drug Interaction'}
                      {interactionWarning.severity === InteractionSeverity.MINOR && 'Minor Drug Interaction'}
                    </p>
                    <p className="text-sm">{interactionWarning.message}</p>
                    <p className="text-sm font-medium">Recommendation:</p>
                    <p className="text-sm">{interactionWarning.recommendation}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  {...register('dosage')}
                  placeholder="e.g., 500"
                />
                {errors.dosage && (
                  <p className="text-sm text-red-600">{errors.dosage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  {...register('unit')}
                  placeholder="e.g., mg, ml"
                />
                {errors.unit && (
                  <p className="text-sm text-red-600">{errors.unit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <select
                  id="route"
                  {...register('route')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="oral">Oral</option>
                  <option value="injection">Injection</option>
                  <option value="topical">Topical</option>
                  <option value="inhalation">Inhalation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Input
                id="frequency"
                {...register('frequency')}
                placeholder="e.g., Twice daily, Every 8 hours"
              />
              {errors.frequency && (
                <p className="text-sm text-red-600">{errors.frequency.message}</p>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Schedule Information</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPRN"
                checked={isPRN}
                onCheckedChange={(checked) => setValue('isPRN', checked)}
              />
              <Label htmlFor="isPRN">As needed (PRN) medication</Label>
            </div>

            {!isPRN && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="scheduleType">Schedule Type</Label>
                  <select
                    id="scheduleType"
                    {...register('scheduleType')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="fixed_times">Fixed Times</option>
                    <option value="interval">Interval</option>
                  </select>
                </div>

                {scheduleType === 'fixed_times' && (
                  <div className="space-y-2">
                    <Label>Scheduled Times</Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={newScheduledTime}
                        onChange={(e) => setNewScheduledTime(e.target.value)}
                        placeholder="Add time"
                      />
                      <Button type="button" onClick={addScheduledTime} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {scheduledTimes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {scheduledTimes.map((time, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {time}
                            <button
                              type="button"
                              onClick={() => removeScheduledTime(time)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {scheduleType === 'interval' && (
                  <div className="space-y-2">
                    <Label htmlFor="intervalHours">Interval (hours)</Label>
                    <Input
                      id="intervalHours"
                      type="number"
                      {...register('intervalHours', { valueAsNumber: true })}
                      placeholder="e.g., 8"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Prescription Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prescription Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prescribingDoctor">Prescribing Doctor *</Label>
                <Input
                  id="prescribingDoctor"
                  {...register('prescribingDoctor')}
                  placeholder="Enter doctor's name"
                />
                {errors.prescribingDoctor && (
                  <p className="text-sm text-red-600">{errors.prescribingDoctor.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescriptionDate">Prescription Date</Label>
                <Input
                  id="prescriptionDate"
                  type="date"
                  {...register('prescriptionDate')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <textarea
                id="instructions"
                {...register('instructions')}
                placeholder="Enter medication instructions"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Side Effects */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Side Effects</h3>
            
            <div className="flex gap-2">
              <Input
                value={newSideEffect}
                onChange={(e) => setNewSideEffect(e.target.value)}
                placeholder="Add side effect"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSideEffect())}
              />
              <Button type="button" onClick={addSideEffect} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {sideEffects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {sideEffects.map((effect, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {effect}
                    <button
                      type="button"
                      onClick={() => removeSideEffect(effect)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Medication' : 'Update Medication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}