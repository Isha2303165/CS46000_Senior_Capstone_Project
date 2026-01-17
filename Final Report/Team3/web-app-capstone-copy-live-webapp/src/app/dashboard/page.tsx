'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDashboard } from '@/hooks/use-dashboard';
import { useMedications } from '@/hooks/use-medications';
import { useAppointments } from '@/hooks/use-appointments';
import { DashboardHeader } from '@/components/healthcare/dashboard-header';
import { ClientCards } from '@/components/healthcare/client-cards';
import { ActivityFeed } from '@/components/healthcare/activity-feed';
import { QuickActions } from '@/components/healthcare/quick-actions';
import { DashboardStats } from '@/components/healthcare/dashboard-stats';
import { TodaysTasks } from '@/components/healthcare/todays-tasks';
import { LoadingSkeleton } from '@/components/ui/loading-skeletons';
import { InvitationsModal } from '@/components/healthcare/invitations-modal';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/error/page-error-boundary';

function DashboardContent() {
  const { user } = useAuthStore();
  const { 
    data: dashboardData, 
    isLoading, 
    error,
    trackPageView,
    trackAction 
  } = useDashboard();
  const { data: medications = [] } = useMedications();
  const { data: appointments = [] } = useAppointments();
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Track dashboard page view for analytics
    trackPageView('dashboard');
  }, [trackPageView]);

  if (!user) {
    return null; // AppLayout will handle redirect
  }

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load dashboard
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Something went wrong. Please try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardHeader 
        user={user} 
        stats={dashboardData?.stats}
        onActionClick={(action) => {
          trackAction('quick_action', { action });
          if (action === 'notifications') {
            setShowNotifications(true);
          } else if (action === 'quick_add') {
            router.push('/clients');
          }
        }}
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardStats 
            stats={dashboardData?.stats}
            onStatClick={(stat) => trackAction('stat_click', { stat })}
          />
          
          <TodaysTasks 
            medications={medications}
            appointments={appointments}
            onTaskAction={(type, id, action) => trackAction('task_action', { type, id, action })}
          />
          
          <ClientCards 
            clients={dashboardData?.clients || []}
            onClientClick={(clientId) => trackAction('client_click', { clientId })}
            onActionClick={(action, clientId) => trackAction('client_action', { action, clientId })}
          />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions 
            onActionClick={(action) => trackAction('quick_action', { action })}
          />
          
          <ActivityFeed 
            activities={dashboardData?.recentActivity || []}
            onActivityClick={(activityId) => trackAction('activity_click', { activityId })}
          />
        </div>
      </div>
      
      {/* Notifications Modal */}
      <InvitationsModal 
        open={showNotifications} 
        onOpenChange={setShowNotifications} 
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PageErrorBoundary pageName="Dashboard">
      <DashboardContent />
    </PageErrorBoundary>
  );
}