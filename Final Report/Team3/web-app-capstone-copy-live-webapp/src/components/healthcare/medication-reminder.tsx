'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Clock, 
  Pill, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Calendar,
  User
} from 'lucide-react';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { useLogMedication } from '@/hooks/use-medications';
import type { Medication, MedicationLogStatus } from '@/types';

interface MedicationReminderProps {
  medication: Medication;
  onDismiss?: () => void;
  className?: string;
}

export function MedicationReminder({ 
  medication, 
  onDismiss, 
  className 
}: MedicationReminderProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [logStatus, setLogStatus] = useState<MedicationLogStatus>('taken');
  const [dosageTaken, setDosageTaken] = useState(medication.dosage);
  const [notes, setNotes] = useState('');
  const [sideEffectsNoted, setSideEffectsNoted] = useState<string[]>([]);

  const logMedication = useLogMedication();

  const now = new Date();
  const nextDue = medication.nextDueAt ? new Date(medication.nextDueAt) : null;
  const isOverdue = nextDue && isBefore(nextDue, now);
  const isDueSoon = nextDue && isAfter(nextDue, now) && isBefore(nextDue, addHours(now, 1));

  const handleQuickLog = async (status: MedicationLogStatus) => {
    try {
      await logMedication.mutateAsync({
        medicationId: medication.id,
        takenAt: now.toISOString(),
        scheduledFor: medication.nextDueAt,
        dosageTaken: status === 'taken' ? `${medication.dosage} ${medication.unit}` : undefined,
        takenBy: 'current-user', // This should come from auth context
        status,
        notes: status === 'taken' ? 'Taken as scheduled' : 
               status === 'missed' ? 'Missed dose' : 
               status === 'skipped' ? 'Skipped dose' : 'Partial dose taken',
      });
      
      onDismiss?.();
    } catch (error) {
      console.error('Error logging medication:', error);
    }
  };

  const handleDetailedLog = async () => {
    try {
      await logMedication.mutateAsync({
        medicationId: medication.id,
        takenAt: now.toISOString(),
        scheduledFor: medication.nextDueAt,
        dosageTaken: logStatus === 'taken' || logStatus === 'partial' 
          ? dosageTaken 
          : undefined,
        takenBy: 'current-user', // This should come from auth context
        status: logStatus,
        notes: notes || undefined,
        sideEffectsNoted: sideEffectsNoted.length > 0 ? sideEffectsNoted : undefined,
      });
      
      setShowLogDialog(false);
      onDismiss?.();
    } catch (error) {
      console.error('Error logging medication:', error);
    }
  };

  const toggleSideEffect = (effect: string) => {
    setSideEffectsNoted(prev => 
      prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    );
  };

  const getStatusColor = () => {
    if (isOverdue) return 'border-red-500 bg-red-50';
    if (isDueSoon) return 'border-orange-500 bg-orange-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getStatusIcon = () => {
    if (isOverdue) return <AlertCircle className="w-6 h-6 text-red-600" />;
    if (isDueSoon) return <Clock className="w-6 h-6 text-orange-600" />;
    return <Pill className="w-6 h-6 text-blue-600" />;
  };

  const getStatusText = () => {
    if (isOverdue) return 'Overdue';
    if (isDueSoon) return 'Due Soon';
    return 'Scheduled';
  };

  return (
    <>
      <Card 
        className={`${getStatusColor()} border-2 ${className}`}
        role="alert"
        aria-labelledby={`medication-${medication.id}-name`}
        aria-describedby={`medication-${medication.id}-status`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div aria-hidden="true">
                {getStatusIcon()}
              </div>
              <div>
                <CardTitle 
                  id={`medication-${medication.id}-name`}
                  className="text-lg font-semibold"
                >
                  {medication.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {medication.dosage} {medication.unit} • {medication.frequency}
                </p>
              </div>
            </div>
            <Badge 
              variant={isOverdue ? 'destructive' : isDueSoon ? 'default' : 'secondary'}
              role="status"
              aria-label={`Medication status: ${getStatusText()}`}
            >
              {getStatusText()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Time Information */}
          <div 
            id={`medication-${medication.id}-status`}
            className="flex items-center gap-2 text-sm"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>
              {nextDue ? (
                isOverdue ? 
                  `Overdue since ${format(nextDue, 'h:mm a')}` :
                  `Due at ${format(nextDue, 'h:mm a')}`
              ) : 'As needed'}
            </span>
          </div>

          {/* Instructions */}
          {medication.instructions && (
            <div className="text-sm p-2 bg-white/50 rounded border">
              <strong>Instructions:</strong> {medication.instructions}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2" role="group" aria-label="Medication actions">
            <Button
              onClick={() => handleQuickLog('taken')}
              disabled={logMedication.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
              aria-label={`Mark ${medication.name} as taken`}
            >
              <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
              Taken
            </Button>
            
            <Button
              onClick={() => handleQuickLog('missed')}
              disabled={logMedication.isPending}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              aria-label={`Mark ${medication.name} as missed`}
            >
              <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
              Missed
            </Button>
            
            <Button
              onClick={() => setShowLogDialog(true)}
              disabled={logMedication.isPending}
              variant="outline"
              className="flex-1"
              aria-label={`Open detailed logging for ${medication.name}`}
            >
              Details
            </Button>
          </div>

          {/* Dismiss Option */}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
            >
              Dismiss Reminder
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detailed Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Medication</DialogTitle>
            <DialogDescription>
              Record details about taking {medication.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Selection */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={logStatus === 'taken' ? 'default' : 'outline'}
                  onClick={() => setLogStatus('taken')}
                  className="justify-start"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Taken
                </Button>
                <Button
                  type="button"
                  variant={logStatus === 'partial' ? 'default' : 'outline'}
                  onClick={() => setLogStatus('partial')}
                  className="justify-start"
                >
                  <Pill className="w-4 h-4 mr-2" />
                  Partial
                </Button>
                <Button
                  type="button"
                  variant={logStatus === 'missed' ? 'default' : 'outline'}
                  onClick={() => setLogStatus('missed')}
                  className="justify-start"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Missed
                </Button>
                <Button
                  type="button"
                  variant={logStatus === 'skipped' ? 'default' : 'outline'}
                  onClick={() => setLogStatus('skipped')}
                  className="justify-start"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Skipped
                </Button>
              </div>
            </div>

            {/* Dosage Taken */}
            {(logStatus === 'taken' || logStatus === 'partial') && (
              <div className="space-y-2">
                <Label htmlFor="dosageTaken">Dosage Taken</Label>
                <Input
                  id="dosageTaken"
                  value={dosageTaken}
                  onChange={(e) => setDosageTaken(e.target.value)}
                  placeholder={`${medication.dosage} ${medication.unit}`}
                />
              </div>
            )}

            {/* Side Effects */}
            {medication.sideEffects && medication.sideEffects.length > 0 && (
              <div className="space-y-2">
                <Label>Any side effects experienced?</Label>
                <div className="flex flex-wrap gap-2">
                  {medication.sideEffects.map((effect) => (
                    <Button
                      key={effect}
                      type="button"
                      variant={sideEffectsNoted.includes(effect) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSideEffect(effect)}
                    >
                      {effect}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDetailedLog}
              disabled={logMedication.isPending}
            >
              {logMedication.isPending ? 'Logging...' : 'Log Medication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}