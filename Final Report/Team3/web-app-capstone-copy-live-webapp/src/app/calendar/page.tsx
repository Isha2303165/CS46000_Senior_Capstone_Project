'use client';

import { CalendarView } from '@/components/healthcare/calendar-view';
import { PageErrorBoundary } from '@/components/error/page-error-boundary';

function CalendarContent() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Calendar
        </h1>
        <p className="text-gray-600 mt-1">
          View appointments and medication schedules
        </p>
      </div>

      <CalendarView />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <PageErrorBoundary pageName="Calendar">
      <CalendarContent />
    </PageErrorBoundary>
  );
}