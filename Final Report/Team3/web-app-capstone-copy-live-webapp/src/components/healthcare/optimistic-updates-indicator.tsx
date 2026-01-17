'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Clock, 
  Undo2, 
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useOptimisticUpdates } from '@/hooks/use-real-time-sync';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OptimisticUpdatesIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OptimisticUpdatesIndicator({ 
  className,
  showDetails = false 
}: OptimisticUpdatesIndicatorProps) {
  const { updates, rollbackUpdate, rollbackAll } = useOptimisticUpdates();

  if (updates.length === 0) {
    return null;
  }

  const pendingCount = updates.length;

  if (!showDetails) {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          'flex items-center gap-1.5 animate-pulse',
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        {pendingCount} pending
      </Badge>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Pending Changes ({pendingCount})
          </div>
          {pendingCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={rollbackAll}
              className="text-xs h-6"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Undo All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {updates.map((update) => (
          <OptimisticUpdateItem
            key={update.id}
            update={update}
            onRollback={() => rollbackUpdate(update.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Individual optimistic update item
interface OptimisticUpdateItemProps {
  update: any; // OptimisticUpdate type
  onRollback: () => void;
}

function OptimisticUpdateItem({ update, onRollback }: OptimisticUpdateItemProps) {
  const getOperationIcon = () => {
    switch (update.operation) {
      case 'create':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'update':
        return <AlertCircle className="h-3 w-3 text-blue-600" />;
      case 'delete':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  const getOperationText = () => {
    switch (update.operation) {
      case 'create':
        return 'Creating';
      case 'update':
        return 'Updating';
      case 'delete':
        return 'Deleting';
      default:
        return 'Processing';
    }
  };

  const getEntityDisplayName = () => {
    switch (update.entity) {
      case 'medication-log':
        return 'Medication Log';
      case 'medication':
        return 'Medication';
      case 'appointment':
        return 'Appointment';
      case 'message':
        return 'Message';
      case 'client':
        return 'Client';
      default:
        return update.entity;
    }
  };

  const getDataPreview = () => {
    if (!update.data) return '';
    
    // Extract meaningful preview based on entity type
    switch (update.entity) {
      case 'medication-log':
        return `${update.data.status} - ${format(new Date(update.data.takenAt), 'HH:mm')}`;
      case 'medication':
        return update.data.name || 'Unnamed medication';
      case 'appointment':
        return update.data.title || 'Unnamed appointment';
      case 'message':
        return update.data.content?.slice(0, 50) + (update.data.content?.length > 50 ? '...' : '');
      case 'client':
        return `${update.data.firstName} ${update.data.lastName}`;
      default:
        return 'Data update';
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getOperationIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium">
            {getOperationText()} {getEntityDisplayName()}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {getDataPreview()}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(update.timestamp), 'HH:mm:ss')}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRollback}
        className="h-6 w-6 p-0 ml-2 flex-shrink-0"
        title="Undo this change"
      >
        <Undo2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Compact version for status bars
export function CompactOptimisticIndicator({ className }: { className?: string }) {
  const { updates } = useOptimisticUpdates();

  if (updates.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
      <span className="text-xs text-muted-foreground">
        {updates.length} syncing
      </span>
    </div>
  );
}

// Toast-style notification for optimistic updates
export function OptimisticUpdateToast() {
  const { updates, rollbackAll } = useOptimisticUpdates();
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (updates.length === 0) {
      setDismissed(false);
    }
  }, [updates.length]);

  if (updates.length === 0 || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <div>
                <div className="text-sm font-medium">
                  Syncing Changes
                </div>
                <div className="text-xs text-muted-foreground">
                  {updates.length} update{updates.length !== 1 ? 's' : ''} in progress
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={rollbackAll}
                className="h-6 text-xs"
              >
                Undo All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}