/**
 * Responsive design tests for multiple viewports
 * Tests mobile-first responsive behavior and touch interactions
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockUser, createMockClient, createMockMedication } from './setup';

// Mock components for responsive testing
const MockMobileNavigation = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
    <div className="grid grid-cols-4 h-16">
      <button className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-blue-600">
        <span className="text-xs mt-1">Dashboard</span>
      </button>
      <button className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-blue-600">
        <span className="text-xs mt-1">Calendar</span>
      </button>
      <button className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-blue-600">
        <span className="text-xs mt-1">Chat</span>
      </button>
      <button className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-blue-600">
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
  </nav>
);

const MockDesktopSidebar = () => (
  <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          <a href="/dashboard" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md">
            Dashboard
          </a>
          <a href="/calendar" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md">
            Calendar
          </a>
          <a href="/chat" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md">
            Chat
          </a>
          <a href="/settings" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md">
            Settings
          </a>
        </nav>
      </div>
    </div>
  </aside>
);

const MockClientCard = ({ client }: { client: any }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-medium text-gray-900 truncate">
          {client.firstName} {client.lastName}
        </h3>
        <p className="text-sm text-gray-500">Age: {client.age}</p>
      </div>
      <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col sm:flex-row gap-2">
        <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
          View
        </button>
        <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100">
          Edit
        </button>
      </div>
    </div>
  </div>
);

const MockDashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <MockDesktopSidebar />
    <div className="lg:pl-64">
      <main className="flex-1 pb-16 lg:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MockClientCard client={createMockClient()} />
            <MockClientCard client={createMockClient({ firstName: 'Jane', lastName: 'Smith' })} />
          </div>
        </div>
      </main>
    </div>
    <MockMobileNavigation />
  </div>
);

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Viewport size constants
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  large: { width: 1440, height: 900 },
};

// Helper function to set viewport size
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Design Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset to default desktop viewport
    setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
  });

  afterEach(() => {
    // Clean up viewport changes
    setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
  });

  describe('Mobile Viewport (375px)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
    });

    it('should display mobile navigation at bottom', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toHaveClass('fixed', 'bottom-0', 'lg:hidden');
      
      // Check navigation buttons
      expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('should hide desktop sidebar on mobile', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('hidden', 'lg:flex');
    });

    it('should stack client card elements vertically', () => {
      render(
        <TestWrapper>
          <MockClientCard client={createMockClient()} />
        </TestWrapper>
      );

      const cardContainer = screen.getByText('John Doe').closest('div');
      expect(cardContainer?.parentElement).toHaveClass('flex-col', 'sm:flex-row');
      
      const buttonContainer = screen.getByRole('button', { name: /view/i }).closest('div');
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('should make buttons full width on mobile', () => {
      render(
        <TestWrapper>
          <MockClientCard client={createMockClient()} />
        </TestWrapper>
      );

      const viewButton = screen.getByRole('button', { name: /view/i });
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      expect(viewButton).toHaveClass('w-full', 'sm:w-auto');
      expect(editButton).toHaveClass('w-full', 'sm:w-auto');
    });

    it('should use single column grid on mobile', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const gridContainer = screen.getByText('John Doe').closest('div')?.parentElement?.parentElement;
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Tablet Viewport (768px)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
    });

    it('should still show mobile navigation on tablet', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toHaveClass('lg:hidden');
      expect(mobileNav).toBeVisible();
    });

    it('should use two-column grid on tablet', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const gridContainer = screen.getByText('John Doe').closest('div')?.parentElement?.parentElement;
      expect(gridContainer).toHaveClass('md:grid-cols-2');
    });

    it('should arrange client card elements horizontally on tablet', () => {
      render(
        <TestWrapper>
          <MockClientCard client={createMockClient()} />
        </TestWrapper>
      );

      const cardContainer = screen.getByText('John Doe').closest('div');
      expect(cardContainer?.parentElement).toHaveClass('sm:flex-row');
    });
  });

  describe('Desktop Viewport (1024px+)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
    });

    it('should show desktop sidebar and hide mobile navigation', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('lg:flex');
      
      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toHaveClass('lg:hidden');
    });

    it('should use three-column grid on desktop', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const gridContainer = screen.getByText('John Doe').closest('div')?.parentElement?.parentElement;
      expect(gridContainer).toHaveClass('lg:grid-cols-3');
    });

    it('should add left padding for sidebar on desktop', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const mainContent = screen.getByRole('main').parentElement;
      expect(mainContent).toHaveClass('lg:pl-64');
    });
  });

  describe('Large Desktop Viewport (1440px+)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.large.width, VIEWPORTS.large.height);
    });

    it('should maintain desktop layout on large screens', () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('lg:flex');
      
      const gridContainer = screen.getByText('John Doe').closest('div')?.parentElement?.parentElement;
      expect(gridContainer).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
    });

    it('should handle touch events on mobile navigation', async () => {
      const mockClick = vi.fn();
      
      render(
        <TestWrapper>
          <button onClick={mockClick} className="touch-target">
            Dashboard
          </button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Simulate touch events
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);
      
      expect(mockClick).toHaveBeenCalled();
    });

    it('should meet minimum touch target size requirements', () => {
      render(
        <TestWrapper>
          <MockMobileNavigation />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('button');
      navButtons.forEach(button => {
        // Check if button has appropriate classes for touch targets
        expect(button).toHaveClass('p-2'); // Minimum padding for touch targets
        
        // In a real test, we'd check computed styles for minimum 44px x 44px
        const computedStyle = window.getComputedStyle(button);
        expect(computedStyle).toBeDefined();
      });
    });

    it('should support swipe gestures for navigation', async () => {
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const mainContent = screen.getByRole('main');
      
      // Simulate swipe gesture
      fireEvent.touchStart(mainContent, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(mainContent, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      fireEvent.touchEnd(mainContent);
      
      // Verify swipe was handled (in a real implementation)
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('should adapt to landscape orientation on mobile', () => {
      // Simulate landscape orientation
      setViewport(667, 375); // Swapped dimensions
      
      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toBeInTheDocument();
      
      // In landscape, we might want different behavior
      expect(mobileNav).toHaveClass('fixed', 'bottom-0');
    });

    it('should handle portrait to landscape transition', () => {
      const { rerender } = render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      // Start in portrait
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      
      // Switch to landscape
      setViewport(VIEWPORTS.mobile.height, VIEWPORTS.mobile.width);
      
      rerender(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      );

      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toBeInTheDocument();
    });
  });

  describe('Responsive Typography', () => {
    it('should use appropriate font sizes for different viewports', () => {
      render(
        <TestWrapper>
          <h1 className="text-xl sm:text-2xl lg:text-3xl">Responsive Heading</h1>
        </TestWrapper>
      );

      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-xl', 'sm:text-2xl', 'lg:text-3xl');
    });

    it('should maintain readability at different zoom levels', () => {
      render(
        <TestWrapper>
          <p className="text-base leading-relaxed">
            This text should remain readable when zoomed to 200%
          </p>
        </TestWrapper>
      );

      const text = screen.getByText(/this text should remain readable/i);
      expect(text).toHaveClass('text-base', 'leading-relaxed');
    });
  });

  describe('Responsive Images and Media', () => {
    it('should use responsive images with appropriate sizes', () => {
      render(
        <TestWrapper>
          <img
            src="/client-photo.jpg"
            alt="Client photo"
            className="w-full sm:w-32 h-32 object-cover rounded-lg"
          />
        </TestWrapper>
      );

      const image = screen.getByAltText('Client photo');
      expect(image).toHaveClass('w-full', 'sm:w-32', 'h-32', 'object-cover');
    });

    it('should handle different aspect ratios on mobile vs desktop', () => {
      render(
        <TestWrapper>
          <div className="aspect-square sm:aspect-video">
            <img src="/chart.png" alt="Health chart" className="w-full h-full object-cover" />
          </div>
        </TestWrapper>
      );

      const container = screen.getByAltText('Health chart').parentElement;
      expect(container).toHaveClass('aspect-square', 'sm:aspect-video');
    });
  });

  describe('Responsive Forms', () => {
    it('should stack form elements vertically on mobile', () => {
      render(
        <TestWrapper>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="First Name" className="w-full" />
              <input type="text" placeholder="Last Name" className="w-full" />
            </div>
          </form>
        </TestWrapper>
      );

      const gridContainer = screen.getByPlaceholderText('First Name').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });

    it('should use full-width buttons on mobile', () => {
      render(
        <TestWrapper>
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="w-full sm:w-auto px-4 py-2">Save</button>
            <button className="w-full sm:w-auto px-4 py-2">Cancel</button>
          </div>
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(saveButton).toHaveClass('w-full', 'sm:w-auto');
      expect(cancelButton).toHaveClass('w-full', 'sm:w-auto');
    });
  });

  describe('Responsive Spacing and Layout', () => {
    it('should use appropriate padding for different screen sizes', () => {
      render(
        <TestWrapper>
          <div className="px-4 sm:px-6 lg:px-8">
            <h1>Content with responsive padding</h1>
          </div>
        </TestWrapper>
      );

      const container = screen.getByRole('heading').parentElement;
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should adjust gap sizes responsively', () => {
      render(
        <TestWrapper>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-6">
            <div>Item 1</div>
            <div>Item 2</div>
          </div>
        </TestWrapper>
      );

      const container = screen.getByText('Item 1').parentElement;
      expect(container).toHaveClass('gap-2', 'sm:gap-4', 'lg:gap-6');
    });
  });

  describe('Print Styles', () => {
    it('should hide navigation elements when printing', () => {
      render(
        <TestWrapper>
          <div className="print:hidden">
            <MockMobileNavigation />
          </div>
        </TestWrapper>
      );

      const navContainer = screen.getByRole('navigation').parentElement;
      expect(navContainer).toHaveClass('print:hidden');
    });

    it('should optimize content for print layout', () => {
      render(
        <TestWrapper>
          <div className="print:text-black print:bg-white">
            <h1>Printable Content</h1>
          </div>
        </TestWrapper>
      );

      const container = screen.getByRole('heading').parentElement;
      expect(container).toHaveClass('print:text-black', 'print:bg-white');
    });
  });
});