import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DashboardHeader } from '../dashboard-header';
import type { UserProfile } from '@/types';
import type { DashboardStats } from '@/hooks/use-dashboard';

const mockUser: UserProfile = {
  id: 'user-1',
  userId: 'cognito-user-1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'primary',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockStats: DashboardStats = {
  totalClients: 5,
  activeMedications: 12,
  upcomingAppointments: 3,
  unreadMessages: 2,
  overdueReminders: 1,
  todaysTasks: 4,
};

import { vi } from 'vitest';

const mockOnActionClick = vi.fn();

describe('DashboardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T14:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render user greeting correctly', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    expect(screen.getByText('Good afternoon, John!')).toBeInTheDocument();
    expect(screen.getByText(/Monday, January 15, 2024/)).toBeInTheDocument();
  });

  it('should display correct greeting based on time of day', () => {
    // Test morning greeting
    vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));
    const { rerender } = render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    expect(screen.getByText('Good morning, John!')).toBeInTheDocument();

    // Test afternoon greeting
    vi.setSystemTime(new Date('2024-01-15T14:00:00Z'));
    rerender(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    expect(screen.getByText('Good afternoon, John!')).toBeInTheDocument();

    // Test evening greeting
    vi.setSystemTime(new Date('2024-01-15T19:00:00Z'));
    rerender(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    expect(screen.getByText('Good evening, John!')).toBeInTheDocument();
  });

  it('should render stats overview correctly', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // totalClients
    expect(screen.getByText('12')).toBeInTheDocument(); // activeMedications
    expect(screen.getByText('3')).toBeInTheDocument(); // upcomingAppointments
    expect(screen.getByText('2')).toBeInTheDocument(); // unreadMessages
    expect(screen.getByText('1')).toBeInTheDocument(); // overdueReminders
    expect(screen.getByText('4')).toBeInTheDocument(); // todaysTasks

    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
  });

  it('should show urgent alert when there are overdue items or unread messages', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    expect(screen.getByText('Urgent Attention Required')).toBeInTheDocument();
    expect(screen.getByText('1 overdue medication • 2 unread messages')).toBeInTheDocument();
  });

  it('should not show urgent alert when there are no urgent items', () => {
    const statsWithoutUrgent: DashboardStats = {
      ...mockStats,
      overdueReminders: 0,
      unreadMessages: 0,
    };

    render(<DashboardHeader user={mockUser} stats={statsWithoutUrgent} onActionClick={mockOnActionClick} />);
    
    expect(screen.queryByText('Urgent Attention Required')).not.toBeInTheDocument();
  });

  it('should handle notification button click', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    const notificationButton = screen.getByRole('button', { name: /bell/i });
    fireEvent.click(notificationButton);
    
    expect(mockOnActionClick).toHaveBeenCalledWith('notifications');
  });

  it('should handle quick add button click', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(quickAddButton);
    
    expect(mockOnActionClick).toHaveBeenCalledWith('quick_add');
  });

  it('should handle view urgent details button click', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewDetailsButton);
    
    expect(mockOnActionClick).toHaveBeenCalledWith('view_urgent');
  });

  it('should show notification badge when there are urgent items', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    const notificationBadge = screen.getByText('!');
    expect(notificationBadge).toBeInTheDocument();
    expect(notificationBadge).toHaveClass('bg-destructive');
  });

  it('should not show notification badge when there are no urgent items', () => {
    const statsWithoutUrgent: DashboardStats = {
      ...mockStats,
      overdueReminders: 0,
      unreadMessages: 0,
    };

    render(<DashboardHeader user={mockUser} stats={statsWithoutUrgent} onActionClick={mockOnActionClick} />);
    
    expect(screen.queryByText('!')).not.toBeInTheDocument();
  });

  it('should render without stats', () => {
    render(<DashboardHeader user={mockUser} onActionClick={mockOnActionClick} />);
    
    expect(screen.getByText('Good afternoon, John!')).toBeInTheDocument();
    expect(screen.queryByText('Clients')).not.toBeInTheDocument();
  });

  it('should style overdue reminders in red when count > 0', () => {
    render(<DashboardHeader user={mockUser} stats={mockStats} onActionClick={mockOnActionClick} />);
    
    const overdueCount = screen.getByText('1');
    const overdueContainer = overdueCount.closest('div');
    expect(overdueContainer).toHaveClass('text-red-600');
  });

  it('should style overdue reminders normally when count = 0', () => {
    const statsWithoutOverdue: DashboardStats = {
      ...mockStats,
      overdueReminders: 0,
    };

    render(<DashboardHeader user={mockUser} stats={statsWithoutOverdue} onActionClick={mockOnActionClick} />);
    
    // Find the overdue section by looking for the "Overdue" text
    const overdueLabel = screen.getByText('Overdue');
    const overdueSection = overdueLabel.closest('div')?.closest('div');
    const overdueCount = overdueSection?.querySelector('.text-2xl');
    
    expect(overdueCount).not.toHaveClass('text-red-600');
    expect(overdueCount).toHaveClass('text-gray-900');
  });

  it('should handle singular vs plural text correctly', () => {
    const singleItemStats: DashboardStats = {
      totalClients: 1,
      activeMedications: 1,
      upcomingAppointments: 1,
      unreadMessages: 1,
      overdueReminders: 1,
      todaysTasks: 1,
    };

    render(<DashboardHeader user={mockUser} stats={singleItemStats} onActionClick={mockOnActionClick} />);
    
    expect(screen.getByText('1 overdue medication • 1 unread message')).toBeInTheDocument();
  });
});