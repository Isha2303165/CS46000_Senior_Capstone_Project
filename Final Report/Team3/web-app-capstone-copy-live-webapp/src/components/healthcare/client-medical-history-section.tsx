'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Client, UpdateClientInput } from '@/types';
import { useUpdateClient } from '@/hooks/use-clients';
import { useAuthStore } from '@/lib/stores/auth-store';
import { 
  AlertTriangle, 
  Plus, 
  X, 
  Edit, 
  Calendar,
  User,
  Clock,
  FileText,
  Heart,
  Shield,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

// Severity levels for allergies
type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

interface AllergyWithSeverity {
  name: string;
  severity: AllergySeverity;
  notes?: string;
}

interface MedicalEvent {
  id: string;
  date: string;
  type: 'diagnosis' | 'allergy_added' | 'condition_updated' | 'notes_updated';
  description: string;
  performedBy: string;
  performedByName: string;
  details?: string;
}

interface ClientMedicalHistorySectionProps {
  client: Client;
  className?: string;
}

// Form schemas
const medicalConditionSchema = z.object({
  condition: z.string().min(1, 'Medical condition is required'),
});

const allergySchema = z.object({
  allergy: z.string().min(1, 'Allergy name is required'),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']),
  notes: z.string().optional(),
});

const careNotesSchema = z.object({
  careNotes: z.string().min(1, 'Care notes cannot be empty'),
});

type MedicalConditionFormData = z.infer<typeof medicalConditionSchema>;
type AllergyFormData = z.infer<typeof allergySchema>;
type CareNotesFormData = z.infer<typeof careNotesSchema>;

export function ClientMedicalHistorySection({ client, className }: ClientMedicalHistorySectionProps) {
  const [showAddConditionDialog, setShowAddConditionDialog] = useState(false);
  const [showAddAllergyDialog, setShowAddAllergyDialog] = useState(false);
  const [showEditNotesDialog, setShowEditNotesDialog] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(false);

  const { user } = useAuthStore();
  const updateClient = useUpdateClient();

  // Parse allergies with severity (for demo purposes, we'll treat existing allergies as moderate)
  const allergiesWithSeverity: AllergyWithSeverity[] = React.useMemo(() => {
    return (client.allergies || []).map(allergy => ({
      name: allergy,
      severity: 'moderate' as AllergySeverity, // Default severity for existing allergies
    }));
  }, [client.allergies]);

  // Mock medical timeline data (in real app, this would come from a separate API)
  const medicalTimeline: MedicalEvent[] = React.useMemo(() => {
    const events: MedicalEvent[] = [];
    
    // Add events for existing conditions
    (client.medicalConditions || []).forEach((condition, index) => {
      events.push({
        id: `condition-${index}`,
        date: client.createdAt,
        type: 'diagnosis',
        description: `Diagnosed with ${condition}`,
        performedBy: user?.id || 'system',
        performedByName: user ? `${user.firstName} ${user.lastName}` : 'System',
      });
    });

    // Add events for allergies
    (client.allergies || []).forEach((allergy, index) => {
      events.push({
        id: `allergy-${index}`,
        date: client.createdAt,
        type: 'allergy_added',
        description: `Allergy to ${allergy} documented`,
        performedBy: user?.id || 'system',
        performedByName: user ? `${user.firstName} ${user.lastName}` : 'System',
      });
    });

    // Add care notes update event if notes exist
    if (client.careNotes) {
      events.push({
        id: 'notes-update',
        date: client.updatedAt,
        type: 'notes_updated',
        description: 'Care notes updated',
        performedBy: user?.id || 'system',
        performedByName: user ? `${user.firstName} ${user.lastName}` : 'System',
        details: client.careNotes,
      });
    }

    // Sort by date (most recent first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [client, user]);

  // Form handlers
  const conditionForm = useForm<MedicalConditionFormData>({
    resolver: zodResolver(medicalConditionSchema),
  });

  const allergyForm = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      severity: 'moderate',
    },
  });

  const notesForm = useForm<CareNotesFormData>({
    resolver: zodResolver(careNotesSchema),
    defaultValues: {
      careNotes: client.careNotes || '',
    },
  });

  // Add medical condition
  const onAddCondition = async (data: MedicalConditionFormData) => {
    try {
      const updatedConditions = [...(client.medicalConditions || []), data.condition];
      await updateClient.mutateAsync({
        id: client.id,
        medicalConditions: updatedConditions,
      });
      setShowAddConditionDialog(false);
      conditionForm.reset();
    } catch (error) {
      console.error('Error adding medical condition:', error);
    }
  };

  // Remove medical condition
  const removeCondition = async (conditionToRemove: string) => {
    try {
      const updatedConditions = (client.medicalConditions || []).filter(
        condition => condition !== conditionToRemove
      );
      await updateClient.mutateAsync({
        id: client.id,
        medicalConditions: updatedConditions.length > 0 ? updatedConditions : undefined,
      });
    } catch (error) {
      console.error('Error removing medical condition:', error);
    }
  };

  // Add allergy
  const onAddAllergy = async (data: AllergyFormData) => {
    try {
      const updatedAllergies = [...(client.allergies || []), data.allergy];
      await updateClient.mutateAsync({
        id: client.id,
        allergies: updatedAllergies,
      });
      setShowAddAllergyDialog(false);
      allergyForm.reset();
    } catch (error) {
      console.error('Error adding allergy:', error);
    }
  };

  // Remove allergy
  const removeAllergy = async (allergyToRemove: string) => {
    try {
      const updatedAllergies = (client.allergies || []).filter(
        allergy => allergy !== allergyToRemove
      );
      await updateClient.mutateAsync({
        id: client.id,
        allergies: updatedAllergies.length > 0 ? updatedAllergies : undefined,
      });
    } catch (error) {
      console.error('Error removing allergy:', error);
    }
  };

  // Update care notes
  const onUpdateNotes = async (data: CareNotesFormData) => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        careNotes: data.careNotes,
      });
      setShowEditNotesDialog(false);
    } catch (error) {
      console.error('Error updating care notes:', error);
    }
  };

  // Get severity badge variant
  const getSeverityVariant = (severity: AllergySeverity) => {
    switch (severity) {
      case 'mild':
        return 'secondary';
      case 'moderate':
        return 'default';
      case 'severe':
        return 'destructive';
      case 'life-threatening':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get severity color for warnings
  const getSeverityColor = (severity: AllergySeverity) => {
    switch (severity) {
      case 'mild':
        return 'text-yellow-600';
      case 'moderate':
        return 'text-orange-600';
      case 'severe':
        return 'text-red-600';
      case 'life-threatening':
        return 'text-red-800';
      default:
        return 'text-orange-600';
    }
  };

  // Get timeline icon
  const getTimelineIcon = (type: MedicalEvent['type']) => {
    switch (type) {
      case 'diagnosis':
        return <Heart className="w-4 h-4" />;
      case 'allergy_added':
        return <Shield className="w-4 h-4" />;
      case 'condition_updated':
        return <Activity className="w-4 h-4" />;
      case 'notes_updated':
        return <FileText className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <section 
      className={`space-y-6 ${className}`}
      role="region"
      aria-labelledby="medical-history-title"
    >
      <div className="flex items-center justify-between">
        <h2 
          id="medical-history-title"
          className="text-2xl font-semibold text-gray-900"
        >
          Medical History
        </h2>
      </div>

      {/* Critical Allergies Alert */}
      {allergiesWithSeverity.some(allergy => allergy.severity === 'severe' || allergy.severity === 'life-threatening') && (
        <Card 
          className="border-red-200 bg-red-50"
          role="alert"
          aria-labelledby="critical-allergies-title"
        >
          <CardHeader className="pb-3">
            <CardTitle 
              id="critical-allergies-title"
              className="text-red-800 flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              Critical Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allergiesWithSeverity
                .filter(allergy => allergy.severity === 'severe' || allergy.severity === 'life-threatening')
                .map((allergy, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="destructive" className="font-semibold">
                      {allergy.name}
                    </Badge>
                    <span className={`text-sm font-medium ${getSeverityColor(allergy.severity)}`}>
                      {allergy.severity.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medical Conditions */}
        <Card role="region" aria-labelledby="conditions-title">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle 
                id="conditions-title"
                className="flex items-center gap-2"
              >
                <Heart className="w-5 h-5 text-red-500" aria-hidden="true" />
                Medical Conditions
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddConditionDialog(true)}
                className="flex items-center gap-2"
                aria-label="Add new medical condition"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Condition
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {client.medicalConditions && client.medicalConditions.length > 0 ? (
              <div 
                className="space-y-2"
                role="list"
                aria-label="Medical conditions"
              >
                {client.medicalConditions.map((condition, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    role="listitem"
                  >
                    <span className="font-medium text-gray-900">{condition}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      aria-label={`Remove ${condition} condition`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No medical conditions recorded
              </p>
            )}
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card role="region" aria-labelledby="allergies-title">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle 
                id="allergies-title"
                className="flex items-center gap-2"
              >
                <Shield className="w-5 h-5 text-orange-500" aria-hidden="true" />
                Allergies
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddAllergyDialog(true)}
                className="flex items-center gap-2"
                aria-label="Add new allergy"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Allergy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {allergiesWithSeverity.length > 0 ? (
              <div 
                className="space-y-2"
                role="list"
                aria-label="Client allergies"
              >
                {allergiesWithSeverity.map((allergy, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    role="listitem"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{allergy.name}</span>
                      <Badge variant={getSeverityVariant(allergy.severity)} className="text-xs">
                        {allergy.severity}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllergy(allergy.name)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      aria-label={`Remove ${allergy.name} allergy`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No allergies recorded
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Care Notes */}
      <Card role="region" aria-labelledby="care-notes-title">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle 
              id="care-notes-title"
              className="flex items-center gap-2"
            >
              <FileText className="w-5 h-5 text-blue-500" aria-hidden="true" />
              Care Notes
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditNotesDialog(true)}
              className="flex items-center gap-2"
              aria-label="Edit care notes"
            >
              <Edit className="w-4 h-4" aria-hidden="true" />
              Edit Notes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.careNotes ? (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">{client.careNotes}</p>
              <div className="mt-2 text-xs text-gray-500">
                Last updated: {format(new Date(client.updatedAt), 'MMM dd, yyyy h:mm a')}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No care notes recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Medical Timeline */}
      <Card role="region" aria-labelledby="timeline-title">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle 
              id="timeline-title"
              className="flex items-center gap-2"
            >
              <Clock className="w-5 h-5 text-green-500" aria-hidden="true" />
              Medical Timeline
            </CardTitle>
            {medicalTimeline.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedTimeline(!expandedTimeline)}
                aria-label={expandedTimeline ? "Show less timeline events" : "Show all timeline events"}
              >
                {expandedTimeline ? 'Show Less' : `Show All (${medicalTimeline.length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {medicalTimeline.length > 0 ? (
            <div 
              className="space-y-4"
              role="list"
              aria-label="Medical timeline events"
            >
              {(expandedTimeline ? medicalTimeline : medicalTimeline.slice(0, 3)).map((event, index) => (
                <div 
                  key={event.id} 
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                  role="listitem"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                    {getTimelineIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <time 
                        className="text-sm text-gray-500"
                        dateTime={event.date}
                      >
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </time>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                      <User className="w-3 h-3" aria-hidden="true" />
                      <span>by {event.performedByName}</span>
                    </div>
                    {event.details && (
                      <p className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border">
                        {event.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No medical history events recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Medical Condition Dialog */}
      <Dialog open={showAddConditionDialog} onOpenChange={setShowAddConditionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Medical Condition</DialogTitle>
            <DialogDescription>
              Add a new medical condition to the client's record.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={conditionForm.handleSubmit(onAddCondition)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Medical Condition *</Label>
              <Input
                id="condition"
                {...conditionForm.register('condition')}
                placeholder="Enter medical condition"
                aria-describedby={conditionForm.formState.errors.condition ? 'condition-error' : undefined}
              />
              {conditionForm.formState.errors.condition && (
                <p id="condition-error" className="text-sm text-red-600" role="alert">
                  {conditionForm.formState.errors.condition.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddConditionDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={conditionForm.formState.isSubmitting}
              >
                {conditionForm.formState.isSubmitting ? 'Adding...' : 'Add Condition'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Allergy Dialog */}
      <Dialog open={showAddAllergyDialog} onOpenChange={setShowAddAllergyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Allergy</DialogTitle>
            <DialogDescription>
              Add a new allergy to the client's record with severity level.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={allergyForm.handleSubmit(onAddAllergy)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergy">Allergy *</Label>
              <Input
                id="allergy"
                {...allergyForm.register('allergy')}
                placeholder="Enter allergy name"
                aria-describedby={allergyForm.formState.errors.allergy ? 'allergy-error' : undefined}
              />
              {allergyForm.formState.errors.allergy && (
                <p id="allergy-error" className="text-sm text-red-600" role="alert">
                  {allergyForm.formState.errors.allergy.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <select
                id="severity"
                {...allergyForm.register('severity')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life-threatening">Life-threatening</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...allergyForm.register('notes')}
                placeholder="Additional notes about this allergy"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddAllergyDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={allergyForm.formState.isSubmitting}
              >
                {allergyForm.formState.isSubmitting ? 'Adding...' : 'Add Allergy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Care Notes Dialog */}
      <Dialog open={showEditNotesDialog} onOpenChange={setShowEditNotesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Care Notes</DialogTitle>
            <DialogDescription>
              Update care notes and important information about the client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={notesForm.handleSubmit(onUpdateNotes)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="careNotes">Care Notes *</Label>
              <Textarea
                id="careNotes"
                {...notesForm.register('careNotes')}
                placeholder="Enter care notes and important information"
                rows={8}
                className="resize-none"
                aria-describedby={notesForm.formState.errors.careNotes ? 'care-notes-error' : undefined}
              />
              {notesForm.formState.errors.careNotes && (
                <p id="care-notes-error" className="text-sm text-red-600" role="alert">
                  {notesForm.formState.errors.careNotes.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditNotesDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={notesForm.formState.isSubmitting}
              >
                {notesForm.formState.isSubmitting ? 'Saving...' : 'Save Notes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}