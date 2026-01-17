import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import Home from '../app/page';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Landing Page Responsive Design', () => {
  const mockPush = vi.fn();
  const mockUseRouter = useRouter as vi.MockedFunction<typeof useRouter>;
  const mockUseAuthStore = useAuthStore as vi.MockedFunction<typeof useAuthStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });
  });

  it('renders mobile navigation correctly', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Home />);

    // On mobile, only "Get Started" button should be visible in header
    const headerButtons = screen.getAllByText('Get Started');
    expect(headerButtons.length).toBeGreaterThan(0);

    // Desktop navigation links should be hidden on mobile (using CSS classes)
    const featuresLinks = screen.getAllByText('Features');
    const headerFeaturesLink = featuresLinks.find(link => 
      link.closest('nav')?.classList.contains('hidden')
    );
    expect(headerFeaturesLink?.closest('nav')).toHaveClass('hidden', 'md:flex');
  });

  it('renders desktop navigation correctly', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(<Home />);

    // Desktop should show full navigation
    expect(screen.getAllByText('Features').length).toBeGreaterThan(0);
    expect(screen.getAllByText('How It Works').length).toBeGreaterThan(0);
    // Testimonials link is not present in the header nav
    expect(screen.queryByText('Testimonials')).not.toBeInTheDocument();
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Get Started').length).toBeGreaterThan(0);
  });

  it('hero section adapts to different screen sizes', () => {
    render(<Home />);

    const heroTitle = screen.getByText('Coordinate Care with');
    const heroSubtitle = screen.getByText('Confidence & Clarity');

    // Check responsive text classes
    expect(heroTitle).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
    expect(heroSubtitle).toHaveClass('text-primary', 'block');

    // Check responsive button layout
    const buttonContainer = screen.getByText('Start Free Today').closest('div');
    expect(buttonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
  });

  it('feature cards use responsive grid layout', () => {
    render(<Home />);

    // Find the features grid container
    const featuresSection = screen.getByText('Everything You Need for Better Care Coordination').closest('section');
    const gridContainer = featuresSection?.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('grid', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('how it works section uses responsive grid', () => {
    render(<Home />);

    const howItWorksSection = screen.getByText('Simple Steps to Better Care Coordination').closest('section');
    const gridContainer = howItWorksSection?.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('grid', 'md:grid-cols-3');
  });

  // Testimonials removed from landing page
  it('does not render testimonials section after removal', () => {
    render(<Home />);
    expect(screen.queryByText('Trusted by Caregivers Everywhere')).not.toBeInTheDocument();
  });

  it('footer uses responsive grid layout', () => {
    render(<Home />);

    const footer = screen.getByRole('contentinfo');
    const gridContainer = footer.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('grid', 'md:grid-cols-4');
  });

  it('buttons adapt to mobile layout', () => {
    render(<Home />);

    // Hero CTA buttons should stack on mobile
    const ctaContainer = screen.getByText('Start Free Today').closest('div');
    expect(ctaContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');

    // Buttons should be full width on mobile
    const startButton = screen.getByText('Start Free Today');
    expect(startButton).toHaveClass('w-full', 'sm:w-auto');
  });

  it('maintains proper spacing on different screen sizes', () => {
    render(<Home />);

    // Check section padding
    const heroSection = screen.getByText('Coordinate Care with').closest('section');
    expect(heroSection).toHaveClass('py-20', 'lg:py-32');

    // Check container padding
    const containers = document.querySelectorAll('.max-w-7xl');
    containers.forEach(container => {
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  // Trust indicators removed from hero
  it('does not render removed trust indicators', () => {
    render(<Home />);
    expect(screen.queryByText('HIPAA Compliant')).not.toBeInTheDocument();
    expect(screen.queryByText('Bank-Level Security')).not.toBeInTheDocument();
    expect(screen.queryByText('24/7 Support')).not.toBeInTheDocument();
  });

  it('navigation header is sticky and responsive', () => {
    render(<Home />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0');

    const headerContainer = header.querySelector('.max-w-7xl');
    expect(headerContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
  });

  it('card components maintain consistent spacing', () => {
    render(<Home />);

    // Check feature cards
    const featureCards = document.querySelectorAll('[data-slot="card"]');
    featureCards.forEach(card => {
      expect(card).toHaveClass('border-blue-100');
    });
  });

  it('text content maintains readability across screen sizes', () => {
    render(<Home />);

    // Hero description should have max width for readability
    const heroDescription = screen.getByText(/comprehensive healthcare tracking app/i);
    expect(heroDescription).toHaveClass('max-w-3xl', 'mx-auto');

    // Section descriptions should also have max width
    const sectionDescriptions = document.querySelectorAll('.max-w-3xl');
    expect(sectionDescriptions.length).toBeGreaterThan(1);
  });

  it('maintains accessibility on all screen sizes', () => {
    render(<Home />);

    // Check that touch targets are properly sized
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      // Should have touch-target class or proper sizing
      const hasProperSize = button.classList.contains('touch-target') || 
                           button.classList.contains('h-9') || 
                           button.classList.contains('h-10');
      expect(hasProperSize).toBe(true);
    });
  });

  it('images and icons scale properly', () => {
    render(<Home />);

    // Check avatar sizing
    const avatars = document.querySelectorAll('[data-slot="avatar"]');
    avatars.forEach(avatar => {
      expect(avatar).toHaveClass('w-12', 'h-12');
    });

    // Check icon containers
    const iconContainers = document.querySelectorAll('.w-12.h-12');
    expect(iconContainers.length).toBeGreaterThan(0);
  });

  it('maintains proper contrast and colors across themes', () => {
    render(<Home />);

    // Check that primary colors are used consistently
    const primaryButtons = screen.getAllByRole('button').filter(button => 
      button.classList.contains('bg-primary')
    );

    expect(primaryButtons.length).toBeGreaterThan(0);
    primaryButtons.forEach(button => {
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });
});