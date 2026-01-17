import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
	Calendar,
	MessageSquare,
	Pill,
	User,
	Clock,
	AlertTriangle,
	CheckCircle,
	Info,
	Filter,
	Download,
	Printer
} from 'lucide-react';
import type { DashboardActivity } from '@/hooks/use-dashboard';

interface AllActivitiesProps {
	activities: DashboardActivity[];
	totalCount: number;
	filteredCount: number;
}

export function AllActivities({ activities, totalCount, filteredCount }: AllActivitiesProps) {
	const router = useRouter();

	const getActivityIcon = (type: DashboardActivity['type']) => {
		switch (type) {
			case 'medication_taken':
				return <Pill className="h-5 w-5 text-green-600" />;
			case 'appointment_scheduled':
				return <Calendar className="h-5 w-5 text-purple-600" />;
			case 'message_sent':
				return <MessageSquare className="h-5 w-5 text-blue-600" />;
			case 'client_updated':
				return <User className="h-5 w-5 text-orange-600" />;
			default:
				return <Info className="h-5 w-5 text-gray-600" />;
		}
	};

	const getTypeLabel = (type: DashboardActivity['type']) => {
		switch (type) {
			case 'medication_taken':
				return 'Medication';
			case 'appointment_scheduled':
				return 'Appointment';
			case 'message_sent':
				return 'Message';
			case 'client_updated':
				return 'Client Update';
			default:
				return 'Activity';
		}
	};

	const formatDateTime = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const groupedActivities = useMemo(() => {
		const groups: { [key: string]: DashboardActivity[] } = {};

		activities.forEach(activity => {
			const activityDate = new Date(activity.timestamp);
			const dateKey = activityDate.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});

			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(activity);
		});

		return groups;
	}, [activities]);

	const handleExport = () => {
		// Implement export functionality
		console.log('Export activities', activities);
	};

	if (activities.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-gray-900">All Activities</h2>
					<span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
						{totalCount} total
					</span>
				</div>

				<div className="text-center py-12">
					<Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
					<p className="text-gray-600 mb-6">
						No activities match your current filters. Try adjusting your filter settings.
					</p>
					<button
						onClick={() => router.push('/dashboard')}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Return to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow">
			<div className="p-6 border-b">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">All Activities</h2>
						<p className="text-sm text-gray-600 mt-1">
							Showing {filteredCount} of {totalCount} activities
						</p>
					</div>

					<div className="flex gap-2">
						<button
							onClick={handleExport}
							className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
						>
							<Download className="h-4 w-4" />
							Export
						</button>
						<button
							onClick={() => window.print()}
							className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
						>
							<Printer className="h-4 w-4" />
							Print
						</button>
					</div>
				</div>
			</div>

			<div className="overflow-auto max-h-[calc(100vh-250px)]">
				<div className="p-6">
					{Object.entries(groupedActivities).map(([date, dateActivities]) => (
						<div key={date} className="mb-8 last:mb-0">
							<div className="flex items-center mb-4">
								<div className="flex-1">
									<h3 className="text-lg font-semibold text-gray-900">{date}</h3>
									<p className="text-sm text-gray-600">
										{dateActivities.length} activities
									</p>
								</div>
								<div className="flex-1 ml-4 h-px bg-gray-300"></div>
							</div>

							<div className="space-y-4">
								{dateActivities.map((activity) => (
									<div
										key={activity.id}
										className={`p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${activity.priority === 'urgent'
											? 'border-red-300 bg-red-50 hover:bg-red-100'
											: activity.priority === 'high'
												? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
												: 'border-gray-200 bg-white hover:bg-gray-50'
											}`}
										onClick={() => activity.actionUrl && router.push(activity.actionUrl)}
									>
										<div className="flex items-start gap-4">
											<div className="flex-shrink-0 mt-1">
												{getActivityIcon(activity.type)}
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex flex-wrap items-center gap-2 mb-2">
													<h4 className="text-base font-semibold text-gray-900">
														{activity.title}
													</h4>

													{/* Priority Badge */}
													<span className={`px-2 py-1 text-xs rounded-full ${activity.priority === 'urgent'
														? 'bg-red-100 text-red-800'
														: activity.priority === 'high'
															? 'bg-orange-100 text-orange-800'
															: activity.priority === 'normal'
																? 'bg-green-100 text-green-800'
																: 'bg-gray-100 text-gray-800'
														}`}>
														{activity.priority.charAt(0).toUpperCase() + activity.priority.slice(1)}
													</span>

													{/* Type Badge */}
													<span className="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded-full">
														{getTypeLabel(activity.type)}
													</span>
												</div>

												<p className="text-gray-700 mb-3">
													{activity.description}
												</p>

												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="flex items-center gap-4 text-sm text-gray-600">
														<span className="flex items-center gap-1">
															<User className="h-4 w-4" />
															{activity.clientName}
														</span>
														<span className="flex items-center gap-1">
															<Clock className="h-4 w-4" />
															{formatDateTime(activity.timestamp)}
														</span>
													</div>

													{activity.actionUrl && (
														<button
															onClick={(e) => {
																e.stopPropagation();
																router.push(activity.actionUrl!);
															}}
															className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
														>
															View Details
														</button>
													)}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}