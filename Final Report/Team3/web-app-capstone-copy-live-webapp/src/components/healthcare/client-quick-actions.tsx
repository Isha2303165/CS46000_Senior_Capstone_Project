'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pill, 
  Calendar, 
  MessageSquare, 
  Phone, 
  AlertTriangle,
  Undo2,
  X,
  Check,
  Clock,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { Client, Medication, MedicationLogStatus } from '@/types';

interface RecentAction {
  id: string;
  type: 'medication_logged' | 'appointment_scheduled' | 'message_sent';
  timestamp: string;
  description: string;
  undoable: boolean;
  undoAction: () => Promise<void>;
  data?: any;
}

interface ClientQuickActionsProps {
  client: Client;
  dueMedications?: Medication[];
  onAddMedication?: () => void;
  onScheduleAppointment?: () => void;
  onSendMessage?: () => void;
  onLogMedication?: (medicationId: string, status: MedicationLogStatus) => Promise<void>;
  onEmergencyContact?: () => void;
  onViewCriticalInfo?: () => void;
  className?: string;
}

export function ClientQuickActions({
  client,
  dueMedications = [],
  onAddMedication,
  onScheduleAppointment,
  onSendMessage,
  onLogMedication,
  onEmergencyContact,
  onViewCriticalInfo,
  className
}: ClientQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [medicationLoading, setMedicationLoading] = useState<Record<string, boolean>>({});
  
  const { addToast } = useToast();

  // Auto-hide after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setIsVisible(true);
      timeout = setTimeout(() => {
        if (!isExpanded) {
          setIsVisible(false);
        }
      }, 10000); // Hide after 10 seconds of inactivity
    };

    const handleActivity = () => resetTimeout();
    
    // Listen for user activity
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleActivity);
    
    resetTimeout();

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleActivity);
    };
  }, [isExpanded]);

  // Clean up old actions (keep only last 5, remove after 5 minutes)
  useEffect(() => {
    const cleanup = () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setRecentActions(prev => 
        prev
          .filter(action => new Date(action.timestamp).getTime() > fiveMinutesAgo)
          .slice(0, 5)
      );
    };

    const interval = setInterval(cleanup, 60000); // Clean up every minute
    return () => clearInterval(interval);
  }, []);

  const addRecentAction = (action: Omit<RecentAction, 'id' | 'timestamp'>) => {
    const newAction: RecentAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setRecentActions(prev => [newAction, ...prev.slice(0, 4)]);
    
    // Show toast notification
    addToast({
      type: 'success',
      message: action.description,
      action: action.undoable ? {
        label: 'Undo',
        onClick: () => handleUndo(newAction.id)
      } : undefined
    });
  };

  const handleUndo = async (actionId: string) => {
    const action = recentActions.find(a => a.id === actionId);
    if (!action || !action.undoable) return;

    try {
      await action.undoAction();
      
      // Remove the action from recent actions
      setRecentActions(prev => prev.filter(a => a.id !== actionId));
      
      addToast({
        type: 'info',
        message: `Undid: ${action.description}`
      });
    } catch (error) {
      console.error('Error undoing action:', error);
      addToast({
        type: 'error',
        message: 'Failed to undo action'
      });
    }
  };

  const handleLogMedication = async (medication: Medication, status: MedicationLogStatus) => {
    if (!onLogMedication) return;

    const medicationId = medication.id;
    setMedicationLoading(prev => ({ ...prev, [medicationId]: true }));

    try {
      await onLogMedication(medicationId, status);
      
      const actionDescription = status === 'taken' 
        ? `Marked ${medication.name} as taken`
        : `Marked ${medication.name} as ${status}`;

      addRecentAction({
        type: 'medication_logged',
        description: actionDescription,
        undoable: true,
        undoAction: async () => {
          // In a real implementation, this would call an API to undo the medication log
          // Mock implementation - in production, this would call an API to undo the medication log
        },
        data: { medicationId, status, medicationName: medication.name }
      });
    } catch (error) {
      console.error('Error logging medication:', error);
      addToast({
        type: 'error',
        message: `Failed to log ${medication.name}`
      });
    } finally {
      setMedicationLoading(prev => ({ ...prev, [medicationId]: false }));
    }
  };

  const handleAddMedication = () => {
    onAddMedication?.();
    addRecentAction({
      type: 'medication_logged',
      description: 'Opened add medication dialog',
      undoable: false,
      undoAction: async () => {}
    });
  };

  const handleScheduleAppointment = () => {
    onScheduleAppointment?.();
    addRecentAction({
      type: 'appointment_scheduled',
      description: 'Opened schedule appointment dialog',
      undoable: false,
      undoAction: async () => {}
    });
  };

  const handleSendMessage = () => {
    onSendMessage?.();
    addRecentAction({
      type: 'message_sent',
      description: 'Opened send message dialog',
      undoable: false,
      undoAction: async () => {}
    });
  };

  const primaryActions = [
    {
      id: 'add_medication',
      label: 'Add Medication',
      icon: <Pill className="w-4 h-4" />,
      onClick: handleAddMedication,
      color: 'bg-green-500 hover:bg-green-600 text-white',
      disabled: !onAddMedication
    },
    {
      id: 'schedule_appointment',
      label: 'Schedule Appointment',
      icon: <Calendar className="w-4 h-4" />,
      onClick: handleScheduleAppointment,
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      disabled: !onScheduleAppointment
    },
    {
      id: 'send_message',
      label: 'Send Message',
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: handleSendMessage,
      color: 'bg-purple-500 hover:bg-purple-600 text-white',
      disabled: !onSendMessage
    }
  ];

  const emergencyActions = [
    {
      id: 'emergency_contact',
      label: 'Emergency Contact',
      icon: <Phone className="w-4 h-4" />,
      onClick: onEmergencyContact,
      color: 'bg-red-500 hover:bg-red-600 text-white',
      disabled: !onEmergencyContact
    },
    {
      id: 'critical_info',
      label: 'Critical Info',
      icon: <AlertTriangle className="w-4 h-4" />,
      onClick: onViewCriticalInfo,
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
      disabled: !onViewCriticalInfo
    }
  ];

  if (!isVisible && !isExpanded) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setIsVisible(true)}
          aria-label="Show quick actions"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 space-y-3", className)}>
      {/* Recent Actions with Undo */}
      {recentActions.length > 0 && isExpanded && (
        <div className="bg-white rounded-lg shadow-lg border p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Actions</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRecentActions([])}
              className="h-6 w-6 p-0"
              aria-label="Clear recent actions"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentActions.slice(0, 3).map((action) => (
              <div key={action.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 truncate flex-1">
                  {action.description}
                </span>
                {action.undoable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUndo(action.id)}
                    className="h-6 w-6 p-0 ml-2"
                    aria-label={`Undo ${action.description}`}
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Medications Quick Actions */}
      {dueMedications.length > 0 && isExpanded && (
        <div className="bg-white rounded-lg shadow-lg border p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-500" />
            <h4 className="text-sm font-medium text-gray-700">Due Medications</h4>
            <Badge variant="secondary" className="text-xs">
              {dueMedications.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {dueMedications.slice(0, 3).map((medication) => (
              <div key={medication.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {medication.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {medication.dosage} {medication.unit}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLogMedication(medication, 'taken')}
                    disabled={medicationLoading[medication.id]}
                    className="h-7 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    aria-label={`Mark ${medication.name} as taken`}
                  >
                    {medicationLoading[medication.id] ? (
                      <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLogMedication(medication, 'skipped')}
                    disabled={medicationLoading[medication.id]}
                    className="h-7 px-2 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    aria-label={`Mark ${medication.name} as skipped`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {dueMedications.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{dueMedications.length - 3} more due
              </p>
            )}
          </div>
        </div>
      )}

      {/* Emergency Actions */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg border p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency</h4>
          <div className="flex gap-2">
            {emergencyActions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn("flex-1 h-10", action.color)}
                aria-label={action.label}
              >
                {action.icon}
                <span className="ml-1 text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Primary Actions */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg border p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            {primaryActions.map((action) => (
              <Button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn("w-full justify-start gap-3 h-10", action.color)}
                aria-label={action.label}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
          aria-label={isExpanded ? "Collapse quick actions" : "Expand quick actions"}
        >
          {isExpanded ? (
            <ChevronDown className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
          
          {/* Notification badges */}
          {dueMedications.length > 0 && !isExpanded && (
            <Badge 
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-orange-500 text-white text-xs"
              aria-label={`${dueMedications.length} medications due`}
            >
              {dueMedications.length > 9 ? '9+' : dueMedications.length}
            </Badge>
          )}
          
          {recentActions.filter(a => a.undoable).length > 0 && !isExpanded && (
            <Badge 
              className="absolute -top-1 -left-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500 text-white"
              aria-label="Undoable actions available"
            >
              <Undo2 className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}