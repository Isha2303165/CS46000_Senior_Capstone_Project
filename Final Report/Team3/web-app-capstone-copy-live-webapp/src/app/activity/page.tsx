'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AllActivities } from '@/components/healthcare/all-activities';
import { ActivityFilters } from '@/components/healthcare/activity-filters';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDashboard } from '@/hooks/use-dashboard';
import { LoadingSkeleton } from '@/components/ui/loading-skeletons';
import { PageErrorBoundary } from '@/components/error/page-error-boundary';

// Define filter types
export interface ActivityFiltersType {
	type: string;
	priority: string;
	dateRange: string;
	clientId: string;
}

function AllActivitiesContent() {
	const { user } = useAuthStore();
	const router = useRouter();
	const { data: dashboardData, isLoading, error } = useDashboard();
	const [filters, setFilters] = useState<ActivityFiltersType>({
		type: 'all',
		priority: 'all',
		dateRange: 'all',
		clientId: 'all',
	});

	if (!user) {
		router.push('/login');
		return null;
	}

	if (isLoading) {
		return <LoadingSkeleton variant="dashboard" />;
	}

	if (error) {
		return (
			<div className="max-w-7xl mx-auto p-4">
				<div className="text-center py-12">
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Unable to load activities
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

	// Apply filters to activities
	const filterActivities = () => {
		if (!dashboardData?.recentActivity) return [];

		return dashboardData.recentActivity.filter(activity => {
			// Filter by type
			if (filters.type !== 'all' && activity.type !== filters.type) {
				return false;
			}

			// Filter by priority
			if (filters.priority !== 'all' && activity.priority !== filters.priority) {
				return false;
			}

			// Filter by client
			if (filters.clientId !== 'all' && activity.clientId !== filters.clientId) {
				return false;
			}

			// Filter by date range
			const activityDate = new Date(activity.timestamp);
			const now = new Date();

			if (filters.dateRange === 'today') {
				const startOfDay = new Date(now);
				startOfDay.setHours(0, 0, 0, 0);
				return activityDate >= startOfDay;
			} else if (filters.dateRange === 'week') {
				const weekAgo = new Date(now);
				weekAgo.setDate(weekAgo.getDate() - 7);
				return activityDate >= weekAgo;
			} else if (filters.dateRange === 'month') {
				const monthAgo = new Date(now);
				monthAgo.setMonth(monthAgo.getMonth() - 1);
				return activityDate >= monthAgo;
			}

			return true;
		});
	};

	const filteredActivities = filterActivities();

	return (
		<div className="max-w-7xl mx-auto p-4">

			<div className="grid gap-6 lg:grid-cols-4">
				{/* Filters sidebar */}
				<div className="lg:col-span-1">
					<ActivityFilters
						filters={filters}
						onFiltersChange={setFilters}
						clients={dashboardData?.clients || []}
					/>
				</div>

				{/* Activities list */}
				<div className="lg:col-span-3">
					<AllActivities
						activities={filteredActivities}
						totalCount={dashboardData?.recentActivity?.length || 0}
						filteredCount={filteredActivities.length}
					/>
				</div>
			</div>
		</div>
	);
}

export default function AllActivitiesPage() {
	return (
		<PageErrorBoundary pageName="All Activities">
			<AllActivitiesContent />
		</PageErrorBoundary>
	);
}