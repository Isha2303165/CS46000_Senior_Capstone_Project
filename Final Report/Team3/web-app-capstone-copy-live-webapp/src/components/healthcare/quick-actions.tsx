import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  UserPlus, 
  Pill, 
  Calendar, 
  MessageSquare, 
  Phone,
  FileText,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QuickActionsProps {
  onActionClick?: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const router = useRouter();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const handleActionClick = (action: string, path?: string) => {
    onActionClick?.(action);
    
    if (path) {
      router.push(path);
    }
    
    if (action === 'quick_add') {
      setIsQuickAddOpen(true);
    }
  };

  const quickActions = [
    {
      id: 'add_client',
      label: 'Add Client',
      icon: <UserPlus className="h-4 w-4" />,
      description: 'Add a new client to your care list',
      path: '/clients?new=true',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    },
    {
      id: 'add_medication',
      label: 'Add Medication',
      icon: <Pill className="h-4 w-4" />,
      description: 'Schedule a new medication',
      path: '/clients',
      color: 'bg-green-50 text-green-700 hover:bg-green-100',
    },
    {
      id: 'schedule_appointment',
      label: 'Schedule Appointment',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Book a new appointment',
      path: '/calendar?new=true',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    },
    {
      id: 'send_message',
      label: 'Send Message',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Send a message to your caregiver',
      path: '/chat?new=true',
      color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    },
  ];

  const utilityActions = [
    {
      id: 'emergency_contacts',
      label: 'Emergency Contacts',
      icon: <Phone className="h-4 w-4" />,
      description: 'View emergency contact information',
      path: '/emergency-contacts',
      color: 'bg-red-50 text-red-700 hover:bg-red-100',
    },
    {
      id: 'reports',
      label: 'Generate Report',
      icon: <FileText className="h-4 w-4" />,
      description: 'Create care summary reports',
      path: '/reports',
      color: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      description: 'Manage your preferences',
      path: '/settings',
      color: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className={`h-auto p-3 flex flex-col items-center gap-2 ${action.color}`}
                onClick={() => handleActionClick(action.id, action.path)}
              >
                {action.icon}
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Utility actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Utilities</h4>
          <div className="space-y-2">
            {utilityActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className={`w-full justify-start gap-3 h-auto p-3 ${action.color}`}
                onClick={() => handleActionClick(action.id, action.path)}
              >
                {action.icon}
                <div className="text-left">
                  <div className="text-sm font-medium">{action.label}</div>
                  <div className="text-xs opacity-75">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Add Dialog */}
        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Add</DialogTitle>
              <DialogDescription>
                What would you like to add?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className={`justify-start gap-3 h-auto p-4 ${action.color}`}
                  onClick={() => {
                    handleActionClick(action.id, action.path);
                    setIsQuickAddOpen(false);
                  }}
                >
                  {action.icon}
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm opacity-75">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => handleActionClick('quick_add')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}