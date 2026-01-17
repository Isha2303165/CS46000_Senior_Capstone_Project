'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pill,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Edit2,
  Trash2,
  ChevronRight,
  Info,
  Lock,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { MedicationDialog } from './medication-dialog';
import { MedicationInteractionChecker } from './medication-interaction-checker';
import { useClientMedications, useDeleteMedication, useMedicationSubscription, useLogMedication, useMedicationLogs } from '@/hooks/use-medications';
import { useCaregiverPermissions } from '@/hooks/use-caregiver-permissions';
import { useToast } from '@/hooks/use-toast';
import {
  useConnectionStatus
} from '@/hooks/use-real-time-sync';
import { CompactOptimisticIndicator } from './optimistic-updates-indicator';
import type { Medication, MedicationLogStatus } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ClientMedicationsSectionProps {
  clientId: string;
  className?: string;
}
//function location temporary, will be added to hooks later
//Adherence errors: administered-by does not update according to user input in log-dose
//notes need to be added to logs
//Errors with proper tracking when user has multiple medications
//accessibility features are not tracking correctly for log dose and view logs windows
function LogDoseDialog({
  medication,
  open,
  onClose,
  onSubmit,
}: {
  medication: Medication | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { status: MedicationLogStatus; notes?: string; takenAt?: string; takenBy?: string }) => void;
}) {
  const [status, setStatus] = useState<MedicationLogStatus>('taken');
  const [notes, setNotes] = useState('');
  const [takenAt, setTakenAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [takenBy, setTakenBy] = useState('');

  useEffect(() => {
    if (!open) {
      setStatus('taken');
      setNotes('');
      setTakenAt(new Date().toISOString().slice(0, 16));
      setTakenBy('');
    }
  }, [open]);

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Dose for {medication.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationLogStatus)}
              className="border rounded p-1 w-full"
            >
              <option value="taken">Taken</option>
              <option value="skipped">Skipped</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Time Taken:</label>
            <input
              type="datetime-local"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="border rounded p-1 w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Observed By:</label>
            <input
              type="text"
              value={takenBy}
              onChange={(e) => setTakenBy(e.target.value)}
              placeholder="Name of caregiver"
              className="border rounded p-1 w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Notes:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded p-1 w-full"
            />
          </div>

          <Button
            onClick={async () => {
              await onSubmit({ status, notes, takenAt, takenBy });
              onClose();
            }}
          >
            Log Dose
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MedicationLogsDialog({
  medication,
  open,
  onClose,
}: {
  medication: Medication | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!medication) return null;

  // Fetch logs for this medication
  const { data: logs = [], isLoading } = useMedicationLogs(medication.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[400px]" aria-describedby="medication-logs-desc">
        <DialogHeader>
          <DialogTitle>{medication.name} - Logs</DialogTitle>
          <DialogDescription id="medication-logs-desc">
            Shows the recent medication logs for {medication.name}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p>Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500">No logs yet</p>
        ) : (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {logs
              .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
              .map((log) => (
                <li
                  key={log.id}
                  className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{log.status}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.takenAt).toLocaleString()}
                    </span>
                  </div>
                  {log.dosageTaken && <p>Dosage: {log.dosageTaken}</p>}
                  {log.takenBy && <p>Administered by: {log.takenBy}</p>}
                  {log.notes && <p>Notes: {log.notes}</p>}
                </li>
              ))}
          </ul>
        )}

        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}





export function ClientMedicationsSection({ clientId, className }: ClientMedicationsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
  const [expandedMedication, setExpandedMedication] = useState<string | null>(null);
  const [logDoseMedication, setLogDoseMedication] = useState<Medication | null>(null);
  const [viewLogsMedication, setViewLogsMedication] = useState<Medication | null>(null);

  // Removed missed doses state - will fetch from actual logs instead

  const { data: medications = [], isLoading, refetch: refetchMedications } = useClientMedications(clientId);
  const deleteMedication = useDeleteMedication();
  const { toast } = useToast();
  const medicationSubscription = useMedicationSubscription();
  const logMedication = useLogMedication();
  const connectionStatus = useConnectionStatus();

  // Check caregiver permissions
  const permissions = useCaregiverPermissions(clientId);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = medicationSubscription.subscribe();
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [medicationSubscription]);

  // Force refresh state
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter medications - memoize to prevent infinite loops
  const activeMedications = useMemo(() =>
    medications.filter(med => med.isActive),
    [medications]
  );

  // Calculate overdue and due soon medications - SIMPLIFIED
  const overdueMedications = useMemo(() => {
    const now = new Date();
    return activeMedications.filter(med => {
      if (!med.nextDueAt) return false;
      const nextDue = new Date(med.nextDueAt);
      return nextDue < now;
    });
  }, [activeMedications, refreshKey]);

  const dueSoonMedications = useMemo(() => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    return activeMedications.filter(med => {
      if (!med.nextDueAt) return false;
      const nextDue = new Date(med.nextDueAt);
      return nextDue >= now && nextDue <= twoHoursFromNow;
    });
  }, [activeMedications, refreshKey]);

  // Removed the broken missed doses calculation

  const handleMedicationAction = async (
    medication: Medication,
    status: MedicationLogStatus,
    scheduledFor?: string,
    dosageTaken?: string,
    takenBy?: string,
    notes?: string
  ) => {
    const timestamp = new Date().toISOString();
    try {
      await logMedication.mutateAsync({
        medicationId: medication.id,
        takenAt: timestamp,
        scheduledFor: scheduledFor || medication.nextDueAt || timestamp,
        dosageTaken: dosageTaken || `${medication.dosage} ${medication.unit}`,
        takenBy: 'current-user',
        status,
        notes,

      });

      await refetchMedications();
      setRefreshKey(prev => prev + 1);

      toast({
        title: status === 'taken' ? 'Medication logged' : 'Medication skipped',
        description: `${medication.name} has been marked as ${status}`,
      });
    } catch (error) {
      console.error('Error logging medication:', error);
      toast({
        title: 'Error',
        description: `Failed to log medication`,
        variant: 'destructive',
      });
    }
  };


  const calculateAdherence = (medication: Medication): number => {
    const total = medication.totalDoses + medication.missedDoses;
    if (total === 0) return 100;
    return Math.round((medication.totalDoses / total) * 100);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Medications
            </CardTitle>
            {(overdueMedications.length > 0 || dueSoonMedications.length > 0) && (
              <div className="flex gap-2">
                {overdueMedications.length > 0 && (
                  <Badge variant="destructive">
                    {overdueMedications.length} overdue
                  </Badge>
                )}
                {dueSoonMedications.length > 0 && (
                  <Badge variant="default">
                    {dueSoonMedications.length} due soon
                  </Badge>
                )}
              </div>
            )}
            <CompactOptimisticIndicator />
          </div>
          {permissions.canManageMedications ? (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              disabled={connectionStatus === 'error'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              <span>View Only</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">Active Medications</TabsTrigger>
            <TabsTrigger value="schedule">Schedule View</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {/* Medication Interaction Checker */}
            {activeMedications.length > 1 && (
              <MedicationInteractionChecker
                medications={activeMedications.map(med => ({
                  id: med.id,
                  name: med.name,
                  dosage: med.dosage
                }))}
              />
            )}

            {/* Removed the broken Missed Doses section - medications should only appear in one place */}

            {/* Critical Section - Overdue & Due Soon */}
            {(overdueMedications.length > 0 || dueSoonMedications.length > 0) && (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-900">
                <h3 className="font-semibold text-red-900 dark:text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Attention Required
                </h3>
                <div className="space-y-2">
                  {[...overdueMedications, ...dueSoonMedications].map((med) => {
                    const isOverdue = overdueMedications.includes(med);
                    const nextDue = med.nextDueAt ? new Date(med.nextDueAt) : null;

                    return (
                      <div
                        key={med.id}
                        className="bg-white dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-orange-500'} animate-pulse`} />
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {med.dosage} {med.unit} • {nextDue && (
                                <span className={isOverdue ? 'text-red-600' : 'text-orange-600'}>
                                  {isOverdue ? 'Overdue: ' : 'Due: '}
                                  {format(nextDue, 'h:mm a')}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleMedicationAction(med, 'taken')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Taken
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Active Medications */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                All Active Medications ({activeMedications.length})
              </h3>

              {activeMedications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No active medications</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Medication
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMedications.map((medication) => {
                    const adherence = calculateAdherence(medication);
                    const nextDue = medication.nextDueAt ? new Date(medication.nextDueAt) : null;
                    const isExpanded = expandedMedication === medication.id;

                    return (
                      <div
                        key={medication.id}
                        className="border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedMedication(isExpanded ? null : medication.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{medication.name}</h4>
                                {medication.isPRN && (
                                  <Badge variant="outline" className="text-xs">As Needed</Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Dosage</p>
                                  <p className="font-medium">{medication.dosage} {medication.unit}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Frequency</p>
                                  <p className="font-medium">{medication.frequency}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Adherence</p>
                                  <p className={`font-medium ${adherence >= 80 ? 'text-green-600' :
                                    adherence >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {adherence}%
                                  </p>
                                </div>
                                {nextDue && !medication.isPRN && (
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400">Next Dose</p>
                                    <p className="font-medium">{format(nextDue, 'h:mm a')}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <LogDoseDialog
                              medication={logDoseMedication}
                              open={!!logDoseMedication}
                              onClose={() => setLogDoseMedication(null)}
                              onSubmit={(data) => {
                                {
                                  handleMedicationAction(medication, data.status);
                                }
                              }

                              }
                            />
                            <MedicationLogsDialog
                              medication={viewLogsMedication}
                              open={!!viewLogsMedication}
                              onClose={() => setViewLogsMedication(null)}
                            />
                            <div className="flex flex-col justify-end h-full space-y-2">
                              <Button

                                variant="outline"
                                className="ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();

                                  setLogDoseMedication(medication);
                                }}
                              >
                                Log Dose
                              </Button>
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewLogsMedication(medication);
                                }}
                              >
                                View Logs
                              </Button>
                            </div>
                            <ChevronRight
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''
                                }`}
                            />

                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t px-4 py-3 bg-gray-50 dark:bg-gray-900">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 text-sm">
                                {medication.instructions && (
                                  <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                      <p className="text-gray-500 dark:text-gray-400">Instructions</p>
                                      <p>{medication.instructions}</p>
                                    </div>
                                  </div>
                                )}
                                {medication.prescribingDoctor && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Prescribed by: </span>
                                    <span>{medication.prescribingDoctor}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Total doses taken: </span>
                                  <span className="font-medium">{medication.totalDoses}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Missed doses: </span>
                                  <span className="font-medium text-red-600">{medication.missedDoses}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {permissions.canManageMedications && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingMedication(medication);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingMedication(medication);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
              <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today's Medication Schedule
              </h3>

              {activeMedications.filter(m => !m.isPRN).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No scheduled medications for today</p>
              ) : (
                <div className="space-y-2">
                  {activeMedications
                    .filter(m => !m.isPRN)
                    .sort((a, b) => {
                      const aTime = a.nextDueAt ? new Date(a.nextDueAt).getTime() : 0;
                      const bTime = b.nextDueAt ? new Date(b.nextDueAt).getTime() : 0;
                      return aTime - bTime;
                    })
                    .map((med) => {
                      const nextDue = med.nextDueAt ? new Date(med.nextDueAt) : null;
                      const isPast = nextDue && nextDue < new Date();

                      return (
                        <div
                          key={med.id}
                          className="bg-white dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className={`w-4 h-4 ${isPast ? 'text-red-500' : 'text-gray-400'}`} />
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {med.dosage} {med.unit} • {nextDue && format(nextDue, 'h:mm a')}
                              </p>
                            </div>
                          </div>
                          {isPast && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* PRN Medications */}
            {activeMedications.filter(m => m.isPRN).length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900">
                <h3 className="font-semibold text-purple-900 dark:text-purple-400 mb-3">
                  As-Needed Medications (PRN)
                </h3>
                <div className="space-y-2">
                  {activeMedications
                    .filter(m => m.isPRN)
                    .map((med) => (
                      <div
                        key={med.id}
                        className="bg-white dark:bg-gray-900 rounded-lg p-3"
                      >
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {med.dosage} {med.unit} • Take as needed
                        </p>
                        {med.instructions && (
                          <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <MedicationDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode="create"
          clientId={clientId}
        />

        <MedicationDialog
          open={!!editingMedication}
          onOpenChange={(open) => {
            if (!open) setEditingMedication(null);
          }}
          medication={editingMedication}
          mode="edit"
          clientId={clientId}
        />

        {/* Delete Confirmation Dialog */}
        {deletingMedication && (
          <Dialog open={!!deletingMedication} onOpenChange={() => setDeletingMedication(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Medication</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>{deletingMedication.name}</strong>?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeletingMedication(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await deleteMedication.mutateAsync(deletingMedication.id);
                      toast({
                        title: 'Medication deleted',
                        description: `${deletingMedication.name} has been removed`,
                      });
                      setDeletingMedication(null);
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to delete medication',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}