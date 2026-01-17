'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, User, Merge } from 'lucide-react';
import { useConflicts } from '@/hooks/use-real-time-sync';
import type { DataConflict } from '@/lib/real-time-sync';
import { format } from 'date-fns';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConflictResolutionDialog({ 
  open, 
  onOpenChange 
}: ConflictResolutionDialogProps) {
  const { conflicts, resolveConflict } = useConflicts();
  const [selectedConflict, setSelectedConflict] = useState<DataConflict | null>(null);
  const [resolutionStrategy, setResolutionStrategy] = useState<'local' | 'remote' | 'merge'>('remote');

  const handleResolve = () => {
    if (selectedConflict) {
      resolveConflict(selectedConflict.id, resolutionStrategy);
      setSelectedConflict(null);
      
      // Close dialog if no more conflicts
      if (conflicts.length <= 1) {
        onOpenChange(false);
      }
    }
  };

  const handleResolveAll = (strategy: 'local' | 'remote') => {
    conflicts.forEach(conflict => {
      resolveConflict(conflict.id, strategy);
    });
    onOpenChange(false);
  };

  if (conflicts.length === 0) {
    return null;
  }

  const currentConflict = selectedConflict || conflicts[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Data Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            {conflicts.length === 1 
              ? 'A data conflict has been detected between your changes and updates from another caregiver.'
              : `${conflicts.length} data conflicts have been detected. Please resolve them to continue.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conflict List */}
          {conflicts.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Conflicts to resolve:</h4>
              <div className="flex flex-wrap gap-2">
                {conflicts.map((conflict) => (
                  <Button
                    key={conflict.id}
                    variant={selectedConflict?.id === conflict.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedConflict(conflict)}
                    className="text-xs"
                  >
                    {conflict.entity} - {conflict.id.slice(0, 8)}...
                    <Badge variant="secondary" className="ml-2">
                      {conflict.conflictFields.length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Current Conflict Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Conflict Details
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Entity: {currentConflict.entity}</span>
                <span>ID: {currentConflict.id}</span>
                <span>Time: {format(new Date(currentConflict.timestamp), 'PPp')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Conflicting Fields:</h5>
                  <div className="flex flex-wrap gap-1">
                    {currentConflict.conflictFields.map((field) => (
                      <Badge key={field} variant="outline">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Version Comparison */}
                <Tabs value={resolutionStrategy} onValueChange={(value) => setResolutionStrategy(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="local" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Your Version
                    </TabsTrigger>
                    <TabsTrigger value="remote" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Other Caregiver
                    </TabsTrigger>
                    <TabsTrigger value="merge" className="flex items-center gap-2">
                      <Merge className="h-4 w-4" />
                      Merge Both
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="local" className="space-y-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Your Changes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ConflictDataView 
                          data={currentConflict.localVersion} 
                          conflictFields={currentConflict.conflictFields}
                          highlight="local"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="remote" className="space-y-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Other Caregiver's Changes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ConflictDataView 
                          data={currentConflict.remoteVersion} 
                          conflictFields={currentConflict.conflictFields}
                          highlight="remote"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="merge" className="space-y-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Merged Result</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Your changes will be applied on top of the other caregiver's changes
                        </p>
                      </CardHeader>
                      <CardContent>
                        <ConflictDataView 
                          data={{ ...currentConflict.remoteVersion, ...currentConflict.localVersion }} 
                          conflictFields={currentConflict.conflictFields}
                          highlight="merge"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {conflicts.length > 1 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleResolveAll('remote')}
                  size="sm"
                >
                  Use All Remote
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleResolveAll('local')}
                  size="sm"
                >
                  Use All Local
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>
              Resolve Conflict
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to display conflict data with highlighting
interface ConflictDataViewProps {
  data: Record<string, any>;
  conflictFields: string[];
  highlight: 'local' | 'remote' | 'merge';
}

function ConflictDataView({ data, conflictFields, highlight }: ConflictDataViewProps) {
  const getHighlightClass = (field: string) => {
    if (!conflictFields.includes(field)) return '';
    
    switch (highlight) {
      case 'local':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'remote':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'merge':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      default:
        return '';
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      // Likely a date string
      try {
        return format(new Date(value), 'PPp');
      } catch {
        return value;
      }
    }
    return String(value);
  };

  return (
    <div className="space-y-2">
      {Object.entries(data)
        .filter(([key]) => !['createdAt', 'updatedAt', '__typename'].includes(key))
        .map(([key, value]) => (
          <div
            key={key}
            className={`p-2 rounded border text-sm ${getHighlightClass(key)}`}
          >
            <div className="flex justify-between items-start">
              <span className="font-medium">{key}:</span>
              <div className="text-right max-w-xs">
                <pre className="whitespace-pre-wrap text-xs">
                  {formatValue(value)}
                </pre>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

// Hook to automatically show conflict dialog
export function useConflictDialog() {
  const { conflicts } = useConflicts();
  const [dialogOpen, setDialogOpen] = useState(false);

  React.useEffect(() => {
    if (conflicts.length > 0 && !dialogOpen) {
      setDialogOpen(true);
    }
  }, [conflicts.length, dialogOpen]);

  return {
    dialogOpen,
    setDialogOpen,
    hasConflicts: conflicts.length > 0,
  };
}