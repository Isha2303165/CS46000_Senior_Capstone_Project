'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Medication } from '@/types';
import { Clock, Pill, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { format, isAfter, isBefore, addHours } from 'date-fns';

interface MedicationCardProps {
  medication: Medication;
  onTakeMedication?: (medication: Medication) => void;
  onEdit?: (medication: Medication) => void;
  onView?: (medication: Medication) => void;
  className?: string;
}

export function MedicationCard({ 
  medication, 
  onTakeMedication, 
  onEdit, 
  onView, 
  className 
}: MedicationCardProps) {
  const now = new Date();
  const nextDue = medication.nextDueAt ? new Date(medication.nextDueAt) : null;
  const lastTaken = medication.lastTakenAt ? new Date(medication.lastTakenAt) : null;
  
  // Determine medication status
  const isOverdue = nextDue && isBefore(nextDue, now);
  const isDueSoon = nextDue && isAfter(nextDue, now) && isBefore(nextDue, addHours(now, 1));
  const isActive = medication.isActive;
  const isPRN = medication.isPRN;

  const getStatusBadge = () => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (isPRN) {
      return <Badge variant="outline">As Needed</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Overdue
      </Badge>;
    }
    if (isDueSoon) {
      return <Badge variant="default" className="flex items-center gap-1 bg-orange-500">
        <Clock className="w-3 h-3" />
        Due Soon
      </Badge>;
    }
    if (lastTaken && isAfter(lastTaken, addHours(now, -24))) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="w-3 h-3" />
        Up to Date
      </Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const formatNextDue = () => {
    if (!nextDue) return null;
    if (isOverdue) {
      return `Overdue since ${format(nextDue, 'h:mm a')}`;
    }
    return `Next due: ${format(nextDue, 'h:mm a')}`;
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isOverdue ? 'bg-red-100' : isDueSoon ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              <Pill className={`w-6 h-6 ${
                isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{medication.name}</CardTitle>
              {medication.genericName && (
                <p className="text-sm text-muted-foreground">({medication.genericName})</p>
              )}
              <p className="text-sm font-medium text-muted-foreground">
                {medication.dosage} {medication.unit}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Dosage and Frequency */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Frequency:</span>
            <p className="font-medium">{medication.frequency}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Route:</span>
            <p className="font-medium capitalize">{medication.route || 'Oral'}</p>
          </div>
        </div>

        {/* Schedule Information */}
        {nextDue && (
          <div className={`p-3 rounded-lg border ${
            isOverdue ? 'bg-red-50 border-red-200' : 
            isDueSoon ? 'bg-orange-50 border-orange-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${
                isOverdue ? 'text-red-600' : 
                isDueSoon ? 'text-orange-600' : 
                'text-blue-600'
              }`} />
              <span className={`text-sm font-medium ${
                isOverdue ? 'text-red-800' : 
                isDueSoon ? 'text-orange-800' : 
                'text-blue-800'
              }`}>
                {formatNextDue()}
              </span>
            </div>
          </div>
        )}

        {/* Last Taken */}
        {lastTaken && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4" />
            <span>Last taken: {format(lastTaken, 'MMM dd, h:mm a')}</span>
          </div>
        )}

        {/* Prescribing Doctor */}
        <div className="text-sm">
          <span className="text-muted-foreground">Prescribed by:</span>
          <p className="font-medium">{medication.prescribingDoctor}</p>
        </div>

        {/* Instructions */}
        {medication.instructions && (
          <div className="text-sm">
            <span className="text-muted-foreground">Instructions:</span>
            <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
              {medication.instructions}
            </p>
          </div>
        )}

        {/* Side Effects Warning */}
        {medication.sideEffects && medication.sideEffects.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              Possible side effects:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {medication.sideEffects.slice(0, 3).map((effect, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {effect}
                </Badge>
              ))}
              {medication.sideEffects.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{medication.sideEffects.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Medication Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
          <div>
            <span className="text-muted-foreground">Total doses:</span>
            <p className="font-medium">{medication.totalDoses}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Missed doses:</span>
            <p className={`font-medium ${medication.missedDoses > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {medication.missedDoses}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onTakeMedication && isActive && (
            <Button 
              variant={isOverdue || isDueSoon ? "default" : "outline"} 
              size="sm" 
              onClick={() => onTakeMedication(medication)}
              className="flex-1"
            >
              Mark as Taken
            </Button>
          )}
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(medication)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(medication)}>
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}