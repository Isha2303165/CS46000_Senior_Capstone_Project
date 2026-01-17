import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { MobileNavigation } from '../mobile-navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('MobileNavigation', () => {
  it('renders all navigation items', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(<MobileNavigation />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    vi.mocked(usePathname).mockReturnValue('/calendar');

    render(<MobileNavigation />);

    const calendarLink = screen.getByText('Calendar').closest('a');
    const dashboardLink = screen.getByText('Dashboard').closest('a');

    expect(calendarLink).toHaveClass('text-primary', 'bg-accent');
    expect(dashboardLink).toHaveClass('text-gray-600');
  });

  it('has proper accessibility attributes', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(<MobileNavigation />);

    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    
    // Check that all links have proper href attributes
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Calendar').closest('a')).toHaveAttribute('href', '/calendar');
    expect(screen.getByText('Chat').closest('a')).toHaveAttribute('href', '/chat');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings');
  });

  it('meets minimum touch target requirements', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(<MobileNavigation />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });
  });
});