'use client';

import React, { useState, useEffect } from 'react';
import { 
  checkMedicationInteractions, 
  getSeverityColor, 
  getSeverityText,
  formatInteractionSummary,
  type InteractionCheckResult,
  InteractionSeverity
} from '@/lib/medication-interactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedicationInteractionCheckerProps {
  medications: Array<{
    id: string;
    name: string;
    dosage?: string;
  }>;
  clientName?: string;
  onInteractionFound?: (result: InteractionCheckResult) => void;
}

export function MedicationInteractionChecker({ 
  medications, 
  clientName,
  onInteractionFound 
}: MedicationInteractionCheckerProps) {
  const [result, setResult] = useState<InteractionCheckResult | null>(null);
  const [expandedInteractions, setExpandedInteractions] = useState<Set<number>>(new Set());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (medications.length > 1) {
      checkInteractions();
    } else {
      setResult(null);
    }
  }, [medications]);

  const checkInteractions = async () => {
    setIsChecking(true);
    
    // Simulate async check (in production, this might call an API)
    setTimeout(() => {
      const medicationNames = medications.map(m => m.name);
      const checkResult = checkMedicationInteractions(medicationNames);
      setResult(checkResult);
      
      if (checkResult.hasInteractions && onInteractionFound) {
        onInteractionFound(checkResult);
      }
      
      setIsChecking(false);
    }, 500);
  };

  const toggleInteraction = (index: number) => {
    const newExpanded = new Set(expandedInteractions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInteractions(newExpanded);
  };

  const getSeverityIcon = (severity: InteractionSeverity) => {
    switch (severity) {
      case InteractionSeverity.CONTRAINDICATED:
        return <XCircle className="h-5 w-5" />;
      case InteractionSeverity.MAJOR:
        return <AlertTriangle className="h-5 w-5" />;
      case InteractionSeverity.MODERATE:
        return <AlertCircle className="h-5 w-5" />;
      case InteractionSeverity.MINOR:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityAlertClass = (severity: InteractionSeverity) => {
    switch (severity) {
      case InteractionSeverity.CONTRAINDICATED:
        return 'border-red-500 bg-red-50';
      case InteractionSeverity.MAJOR:
        return 'border-orange-500 bg-orange-50';
      case InteractionSeverity.MODERATE:
        return 'border-yellow-500 bg-yellow-50';
      case InteractionSeverity.MINOR:
        return 'border-blue-500 bg-blue-50';
      default:
        return '';
    }
  };

  if (!result || !result.hasInteractions) {
    if (medications.length <= 1) {
      return null;
    }

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <Pill className="h-5 w-5" />
            No Drug Interactions Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            {clientName ? `${clientName}'s` : 'The'} current medications do not have any known interactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'border-2',
      result.summary.contraindicated > 0 ? 'border-red-500' :
      result.summary.major > 0 ? 'border-orange-500' :
      result.summary.moderate > 0 ? 'border-yellow-500' :
      'border-blue-500'
    )}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Drug Interaction Warning
        </CardTitle>
        <CardDescription>
          {formatInteractionSummary(result.summary)}
          {clientName && ` for ${clientName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          {result.summary.contraindicated > 0 && (
            <Badge variant="destructive">
              {result.summary.contraindicated} Contraindicated
            </Badge>
          )}
          {result.summary.major > 0 && (
            <Badge className="bg-orange-500 hover:bg-orange-600">
              {result.summary.major} Major
            </Badge>
          )}
          {result.summary.moderate > 0 && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              {result.summary.moderate} Moderate
            </Badge>
          )}
          {result.summary.minor > 0 && (
            <Badge className="bg-blue-500 hover:bg-blue-600">
              {result.summary.minor} Minor
            </Badge>
          )}
        </div>

        {/* Detailed interactions */}
        <div className="space-y-3">
          {result.interactions.map((interaction, index) => (
            <Alert 
              key={index}
              className={cn(
                'cursor-pointer transition-all',
                getSeverityAlertClass(interaction.severity)
              )}
              onClick={() => toggleInteraction(index)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'mt-0.5',
                  interaction.severity === InteractionSeverity.CONTRAINDICATED ? 'text-red-600' :
                  interaction.severity === InteractionSeverity.MAJOR ? 'text-orange-600' :
                  interaction.severity === InteractionSeverity.MODERATE ? 'text-yellow-600' :
                  'text-blue-600'
                )}>
                  {getSeverityIcon(interaction.severity)}
                </div>
                <div className="flex-1">
                  <AlertTitle className="flex items-center justify-between">
                    <span>
                      <span className="font-semibold capitalize">{interaction.drug1}</span>
                      {' + '}
                      <span className="font-semibold capitalize">{interaction.drug2}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={cn(
                          'text-xs',
                          interaction.severity === InteractionSeverity.CONTRAINDICATED ? 'border-red-600 text-red-600' :
                          interaction.severity === InteractionSeverity.MAJOR ? 'border-orange-600 text-orange-600' :
                          interaction.severity === InteractionSeverity.MODERATE ? 'border-yellow-600 text-yellow-600' :
                          'border-blue-600 text-blue-600'
                        )}
                      >
                        {getSeverityText(interaction.severity)}
                      </Badge>
                      {expandedInteractions.has(index) ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </div>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm">{interaction.description}</p>
                    
                    {expandedInteractions.has(index) && (
                      <div className="mt-3 space-y-2">
                        <div className="p-3 bg-white/50 rounded-md">
                          <p className="text-sm font-medium mb-1">Recommendation:</p>
                          <p className="text-sm">{interaction.recommendation}</p>
                        </div>
                        
                        {interaction.mechanism && (
                          <div className="p-3 bg-white/50 rounded-md">
                            <p className="text-sm font-medium mb-1">Mechanism:</p>
                            <p className="text-sm text-gray-600">{interaction.mechanism}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.print()}
          >
            Print Report
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // In production, this would notify the provider
              alert('Provider will be notified of these interactions');
            }}
          >
            Notify Provider
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Standalone interaction checker dialog/modal
 */
export function InteractionCheckerDialog({ 
  open, 
  onOpenChange,
  medications 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: Array<{ id: string; name: string; dosage?: string }>;
}) {
  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center p-4',
      open ? 'block' : 'hidden'
    )}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Check Medication Interactions</h2>
          <MedicationInteractionChecker medications={medications} />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}