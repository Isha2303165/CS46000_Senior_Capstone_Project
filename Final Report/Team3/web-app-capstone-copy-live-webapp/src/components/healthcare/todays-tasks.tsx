import { useMemo } from 'react';
import { CheckCircle, Clock, Pill, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime, formatDate } from '@/lib/utils';
import type { Medication, Appointment } from '@/types';

interface TodaysTasksProps {
  medications: Medication[];
  appointments: Appointment[];
  onTaskAction?: (type: 'medication' | 'appointment', id: string, action: string) => void;
}

export function TodaysTasks({ medications, appointments, onTaskAction }: TodaysTasksProps) {
  const todaysTasks = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const tasks: Array<{
      id: string;
      type: 'medication' | 'appointment';
      time: string;
      title: string;
      subtitle: string;
      status: 'pending' | 'completed' | 'overdue';
      priority: 'low' | 'normal' | 'high' | 'urgent';
      data: Medication | Appointment;
    }> = [];

    // Add today's medications
    medications
      .filter(med => {
        if (!med.nextDueAt || !med.isActive) return false;
        return med.nextDueAt.startsWith(today);
      })
      .forEach(med => {
        const dueTime = new Date(med.nextDueAt);
        const isOverdue = dueTime < now;
        const isTaken = med.lastTakenAt && new Date(med.lastTakenAt) > new Date(today);
        
        tasks.push({
          id: med.id,
          type: 'medication',
          time: formatTime(med.nextDueAt),
          title: med.name,
          subtitle: `${med.dosage} - ${med.frequency}`,
          status: isTaken ? 'completed' : isOverdue ? 'overdue' : 'pending',
          priority: med.priority || 'normal',
          data: med,
        });
      });

    // Add today's appointments
    appointments
      .filter(apt => apt.appointmentDate === today && apt.status === 'scheduled')
      .forEach(apt => {
        const aptTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
        const isOverdue = aptTime < now;
        
        tasks.push({
          id: apt.id,
          type: 'appointment',
          time: apt.appointmentTime,
          title: apt.title,
          subtitle: `with ${apt.providerName}`,
          status: isOverdue ? 'overdue' : 'pending',
          priority: apt.priority,
          data: apt,
        });
      });

    // Sort by time
    return tasks.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, appointments]);

  if (todaysTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Today's Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No tasks scheduled for today. Enjoy your day!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Today's Tasks
          </CardTitle>
          <Badge variant="secondary">
            {todaysTasks.filter(t => t.status === 'completed').length} / {todaysTasks.length} completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {todaysTasks.map(task => (
          <div
            key={`${task.type}-${task.id}`}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              task.status === 'completed'
                ? 'bg-green-50 border-green-200'
                : task.status === 'overdue'
                ? 'bg-red-50 border-red-200'
                : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                task.type === 'medication' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {task.type === 'medication' ? (
                  <Pill className="h-4 w-4 text-green-600" />
                ) : (
                  <Calendar className="h-4 w-4 text-purple-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${
                    task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </p>
                  {task.status === 'overdue' && (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{task.subtitle}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {task.time}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {task.status === 'pending' && task.type === 'medication' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTaskAction?.(task.type, task.id, 'take')}
                >
                  Mark Taken
                </Button>
              )}
              {task.status === 'overdue' && (
                <Badge variant="destructive">Overdue</Badge>
              )}
              {task.status === 'completed' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}