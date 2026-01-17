import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';
import { DashboardStats } from '../dashboard-stats';
import type { DashboardStats as DashboardStatsType } from '@/hooks/use-dashboard';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockPush = vi.fn();
const mockUseRouter = useRouter as any;

const mockStats: DashboardStatsType = {
  totalClients: 5,
  activeMedications: 12,
  upcomingAppointments: 3,
  unreadMessages: 2,
  overdueReminders: 1,
  todaysTasks: 4,
};

const mockOnStatClick = vi.fn();

describe('DashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any);
  });

  it('should render loading skeleton when stats are not provided', () => {
    render(<DashboardStats onStatClick={mockOnStatClick} />);

    // Should render skeleton cards
    const skeletonCards = screen.getAllByRole('generic');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('should render all stat cards correctly', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Live Data')).toBeInTheDocument();

    // Check all stat cards
    expect(screen.getByText('Total Clients')).toBeInTheDocument();
    expect(screen.getByText('Active Medications')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument();
    expect(screen.getByText('Unread Messages')).toBeInTheDocument();
    expect(screen.getByText('Overdue Items')).toBeInTheDocument();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();

    // Check stat values
    expect(screen.getByText('5')).toBeInTheDocument(); // totalClients
    expect(screen.getByText('12')).toBeInTheDocument(); // activeMedications
    expect(screen.getByText('3')).toBeInTheDocument(); // upcomingAppointments
    expect(screen.getByText('2')).toBeInTheDocument(); // unreadMessages
    expect(screen.getByText('1')).toBeInTheDocument(); // overdueReminders
    expect(screen.getByText('4')).toBeInTheDocument(); // todaysTasks
  });

  it('should handle stat card clicks correctly', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    const clientsCard = screen.getByText('Total Clients').closest('div')?.closest('div');
    expect(clientsCard).toBeInTheDocument();

    fireEvent.click(clientsCard!);

    expect(mockOnStatClick).toHaveBeenCalledWith('clients');
    expect(mockPush).toHaveBeenCalledWith('/clients');
  });

  it('should style overdue items correctly when count > 0', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    const overdueCard = screen.getByText('Overdue Items').closest('div')?.closest('div');
    const overdueIcon = overdueCard?.querySelector('.text-red-600');
    expect(overdueIcon).toBeInTheDocument();

    const overdueValue = screen.getByText('1');
    expect(overdueValue).toHaveClass('text-red-600');
  });

  it('should style overdue items correctly when count = 0', () => {
    const statsWithoutOverdue: DashboardStatsType = {
      ...mockStats,
      overdueReminders: 0,
    };

    render(<DashboardStats stats={statsWithoutOverdue} onStatClick={mockOnStatClick} />);

    const overdueCard = screen.getByText('Overdue Items').closest('div')?.closest('div');
    const overdueIcon = overdueCard?.querySelector('.text-green-600');
    expect(overdueIcon).toBeInTheDocument();

    const overdueDescription = screen.getByText('All caught up!');
    expect(overdueDescription).toBeInTheDocument();
  });

  it('should style unread messages correctly based on count', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    const messagesCard = screen.getByText('Unread Messages').closest('div')?.closest('div');
    const messagesIcon = messagesCard?.querySelector('.text-blue-600');
    expect(messagesIcon).toBeInTheDocument();
  });

  it('should style unread messages as inactive when count = 0', () => {
    const statsWithoutMessages: DashboardStatsType = {
      ...mockStats,
      unreadMessages: 0,
    };

    render(<DashboardStats stats={statsWithoutMessages} onStatClick={mockOnStatClick} />);

    const messagesCard = screen.getByText('Unread Messages').closest('div')?.closest('div');
    const messagesIcon = messagesCard?.querySelector('.text-gray-400');
    expect(messagesIcon).toBeInTheDocument();
  });

  it('should render care summary correctly when no overdue items', () => {
    const statsWithoutOverdue: DashboardStatsType = {
      ...mockStats,
      overdueReminders: 0,
    };

    render(<DashboardStats stats={statsWithoutOverdue} onStatClick={mockOnStatClick} />);

    expect(screen.getByText('Care Summary')).toBeInTheDocument();
    expect(screen.getByText('All medications are up to date. Great job staying on track!')).toBeInTheDocument();
    expect(screen.getByText('You have 4 tasks scheduled for today.')).toBeInTheDocument();
  });

  it('should render care summary correctly when there are overdue items', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    expect(screen.getByText('Care Summary')).toBeInTheDocument();
    expect(screen.getByText('1 medication needs attention.')).toBeInTheDocument();
    expect(screen.getByText('You have 4 tasks scheduled for today.')).toBeInTheDocument();
  });

  it('should handle plural forms correctly in care summary', () => {
    const multipleOverdueStats: DashboardStatsType = {
      ...mockStats,
      overdueReminders: 3,
      todaysTasks: 1,
    };

    render(<DashboardStats stats={multipleOverdueStats} onStatClick={mockOnStatClick} />);

    expect(screen.getByText('3 medications need attention.')).toBeInTheDocument();
    expect(screen.getByText('You have 1 task scheduled for today.')).toBeInTheDocument();
  });

  it('should show progress indicators for relevant stats', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    // Should show progress for overdue items (red because count > 0)
    const overdueCard = screen.getByText('Overdue Items').closest('div')?.closest('div');
    const overdueProgress = overdueCard?.querySelector('.bg-red-500');
    expect(overdueProgress).toBeInTheDocument();

    // Should show progress for today's tasks
    const todayCard = screen.getByText("Today's Tasks").closest('div')?.closest('div');
    const todayProgress = todayCard?.querySelector('.bg-orange-500');
    expect(todayProgress).toBeInTheDocument();
  });

  it('should show green progress for overdue when count = 0', () => {
    const statsWithoutOverdue: DashboardStatsType = {
      ...mockStats,
      overdueReminders: 0,
    };

    render(<DashboardStats stats={statsWithoutOverdue} onStatClick={mockOnStatClick} />);

    const overdueCard = screen.getByText('Overdue Items').closest('div')?.closest('div');
    const overdueProgress = overdueCard?.querySelector('.bg-green-500');
    expect(overdueProgress).toBeInTheDocument();
  });

  it('should navigate to correct paths when cards are clicked', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    // Test different card clicks
    const medicationsCard = screen.getByText('Active Medications').closest('div')?.closest('div');
    fireEvent.click(medicationsCard!);
    expect(mockPush).toHaveBeenCalledWith('/clients');

    const appointmentsCard = screen.getByText('Upcoming Appointments').closest('div')?.closest('div');
    fireEvent.click(appointmentsCard!);
    expect(mockPush).toHaveBeenCalledWith('/calendar');

    const messagesCard = screen.getByText('Unread Messages').closest('div')?.closest('div');
    fireEvent.click(messagesCard!);
    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('should have hover effects on cards', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    const clientsCard = screen.getByText('Total Clients').closest('div')?.closest('div');
    expect(clientsCard).toHaveClass('cursor-pointer', 'transition-all', 'hover:shadow-md', 'hover:scale-105');
  });

  it('should render descriptions correctly', () => {
    render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

    expect(screen.getByText('Active clients under your care')).toBeInTheDocument();
    expect(screen.getByText('Currently prescribed medications')).toBeInTheDocument();
    expect(screen.getByText('Scheduled appointments this week')).toBeInTheDocument();
    expect(screen.getByText('Messages requiring attention')).toBeInTheDocument();
    expect(screen.getByText('Items requiring immediate attention')).toBeInTheDocument();
    expect(screen.getByText('Medications and appointments for today')).toBeInTheDocument();
  });
});