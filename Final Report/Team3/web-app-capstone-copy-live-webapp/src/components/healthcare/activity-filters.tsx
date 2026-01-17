import { Filter, X } from 'lucide-react';
import type { ActivityFiltersType } from '@/app/activity/page';
import type { Client } from '@/types';

interface ActivityFiltersProps {
	clients: Client[];
	filters: ActivityFiltersType;
	onFiltersChange: (filters: ActivityFiltersType) => void;
}

export function ActivityFilters({ filters, onFiltersChange, clients }: ActivityFiltersProps) {
	const handleFilterChange = (key: keyof ActivityFiltersType, value: string) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	const clearFilters = () => {
		onFiltersChange({
			clientId: 'all',
			type: 'all',
			priority: 'all',
			dateRange: 'all',
		});
	};

	const hasActiveFilters =
		filters.clientId !== 'all' ||
		filters.type !== 'all' ||
		filters.priority !== 'all' ||
		filters.dateRange !== 'all';


	return (
		<div className="bg-white rounded-lg shadow p-6">
			<div className="flex items-center gap-2 mb-6">
				<Filter className="h-5 w-5 text-gray-600" />
				<h3 className="text-lg font-semibold text-gray-900">Filters</h3>
				{hasActiveFilters && (
					<button
						onClick={clearFilters}
						className="ml-auto text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
					>
						<X className="h-4 w-4" />
						Clear
					</button>
				)}
			</div>

			<div className="space-y-6">

				{/* Client Filter */}
				<div className="space-y-2">
					<label htmlFor="client-filter" className="block text-sm font-medium text-gray-700">
						Client
					</label>
					<select
						id="client-filter"
						value={filters.clientId}
						onChange={(e) => handleFilterChange('clientId', e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All Clients</option>
						{clients.map((client) => (
							<option key={client.id} value={client.id}>
								{client.firstName}
							</option>
						))}
					</select>
				</div>

				{/* Activity Type Filter */}
				<div className="space-y-2">
					<label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
						Activity Type
					</label>
					<select
						id="type-filter"
						value={filters.type}
						onChange={(e) => handleFilterChange('type', e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="client_updated">Client Update</option>
						<option value="all">All Types</option>
						<option value="medication_taken">Medication</option>
						<option value="appointment_scheduled">Appointment</option>
						<option value="message_sent">Message</option>
					</select>
				</div>

				{/* Priority Filter */}
				<div className="space-y-2">
					<label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700">
						Priority
					</label>
					<select
						id="priority-filter"
						value={filters.priority}
						onChange={(e) => handleFilterChange('priority', e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All Priorities</option>
						<option value="urgent">Urgent</option>
						<option value="high">High</option>
						<option value="normal">Normal</option>
						<option value="low">Low</option>
					</select>
				</div>

				{/* Date Range Filter */}
				<div className="space-y-2">
					<label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">
						Date Range
					</label>
					<select
						id="date-filter"
						value={filters.dateRange}
						onChange={(e) => handleFilterChange('dateRange', e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All Time</option>
						<option value="today">Today</option>
						<option value="week">Past Week</option>
						<option value="month">Past Month</option>
					</select>
				</div>

				{/* Active Filters Display */}
				{hasActiveFilters && (
					<div className="pt-4 border-t">
						<h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters</h4>
						<div className="space-y-2">
							{filters.clientId !== 'all' && (
								<div className="text-xs text-gray-600">
									Client: <span className="font-medium">
										{clients.find(c => c.id === filters.clientId)?.firstName || filters.clientId}
									</span>
								</div>
							)}
							{filters.type !== 'all' && (
								<div className="text-xs text-gray-600">
									Type: <span className="font-medium">{filters.type.replace('_', ' ')}</span>
								</div>
							)}
							{filters.priority !== 'all' && (
								<div className="text-xs text-gray-600">
									Priority: <span className="font-medium">{filters.priority}</span>
								</div>
							)}
							{filters.dateRange !== 'all' && (
								<div className="text-xs text-gray-600">
									Date Range: <span className="font-medium">{filters.dateRange}</span>
								</div>
							)}

						</div>
					</div>
				)}
			</div>
		</div>
	);
}