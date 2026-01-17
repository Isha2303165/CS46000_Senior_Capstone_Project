'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  urgentCount?: number;
  disabled?: boolean;
}

export interface ClientDetailTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  stickyOffset?: number;
}

export function ClientDetailTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  stickyOffset = 0,
}: ClientDetailTabsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement>>({});

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const rect = tabsRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= stickyOffset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stickyOffset]);

  // Smooth scroll to section when tab is clicked on mobile
  const handleTabClick = useCallback((tabId: string) => {
    onTabChange(tabId);
    
    if (isMobile) {
      // Find the corresponding section and scroll to it
      const sectionElement = document.getElementById(`section-${tabId}`);
      if (sectionElement) {
        const headerOffset = 80; // Account for sticky header
        const elementPosition = sectionElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [onTabChange, isMobile]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === tabId);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        // Find previous non-disabled tab
        nextIndex = currentIndex - 1;
        while (nextIndex >= 0 && tabs[nextIndex]?.disabled) {
          nextIndex--;
        }
        if (nextIndex < 0) {
          // Wrap to last non-disabled tab
          nextIndex = tabs.length - 1;
          while (nextIndex >= 0 && tabs[nextIndex]?.disabled) {
            nextIndex--;
          }
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        // Find next non-disabled tab
        nextIndex = currentIndex + 1;
        while (nextIndex < tabs.length && tabs[nextIndex]?.disabled) {
          nextIndex++;
        }
        if (nextIndex >= tabs.length) {
          // Wrap to first non-disabled tab
          nextIndex = 0;
          while (nextIndex < tabs.length && tabs[nextIndex]?.disabled) {
            nextIndex++;
          }
        }
        break;
      case 'Home':
        event.preventDefault();
        // Find first non-disabled tab
        nextIndex = 0;
        while (nextIndex < tabs.length && tabs[nextIndex]?.disabled) {
          nextIndex++;
        }
        break;
      case 'End':
        event.preventDefault();
        // Find last non-disabled tab
        nextIndex = tabs.length - 1;
        while (nextIndex >= 0 && tabs[nextIndex]?.disabled) {
          nextIndex--;
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(tabId);
        return;
      default:
        return;
    }

    // Focus the next tab
    const nextTab = tabs[nextIndex];
    if (nextTab && !nextTab.disabled && nextIndex >= 0) {
      const nextTabElement = tabRefs.current[nextTab.id];
      if (nextTabElement) {
        nextTabElement.focus();
        onTabChange(nextTab.id);
      }
    }
  }, [tabs, onTabChange, handleTabClick]);

  // Get active tab for mobile dropdown
  const activeTabItem = tabs.find(tab => tab.id === activeTab);

  // Render badge with urgent count
  const renderBadge = (urgentCount?: number) => {
    if (!urgentCount || urgentCount === 0) return null;
    
    return (
      <Badge 
        variant="destructive" 
        className="ml-2 min-w-[1.25rem] h-5 text-xs px-1.5"
        aria-label={`${urgentCount} urgent items`}
      >
        {urgentCount > 99 ? '99+' : urgentCount}
      </Badge>
    );
  };

  // Mobile dropdown view
  if (isMobile) {
    return (
      <div
        ref={tabsRef}
        className={cn(
          'bg-white border-b border-gray-200 transition-all duration-200',
          isSticky && 'sticky top-0 z-40 shadow-sm',
          className
        )}
        style={{ top: isSticky ? `${stickyOffset}px` : undefined }}
      >
        <div className="px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                aria-label="Select section"
                aria-expanded="false"
              >
                <div className="flex items-center">
                  <Menu className="w-4 h-4 mr-2" />
                  <span>{activeTabItem?.label || 'Select Section'}</span>
                  {activeTabItem && renderBadge(activeTabItem.urgentCount)}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[200px]" align="start">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={tab.disabled}
                  className={cn(
                    'flex items-center justify-between cursor-pointer',
                    activeTab === tab.id && 'bg-accent'
                  )}
                >
                  <span>{tab.label}</span>
                  {renderBadge(tab.urgentCount)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Desktop horizontal tabs view
  return (
    <div
      ref={tabsRef}
      className={cn(
        'bg-white border-b border-gray-200 transition-all duration-200',
        isSticky && 'sticky top-0 z-40 shadow-sm',
        className
      )}
      style={{ top: isSticky ? `${stickyOffset}px` : undefined }}
    >
      <div className="px-4">
        <nav
          className="flex space-x-8 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Client information sections"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current[tab.id] = el;
              }}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
              aria-selected={activeTab === tab.id}
              aria-controls={`section-${tab.id}`}
              disabled={tab.disabled}
              className={cn(
                'flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
              onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab.id)}
            >
              <span>{tab.label}</span>
              {renderBadge(tab.urgentCount)}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// Hook for managing tab state and urgent counts
export function useClientDetailTabs(clientId: string) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real urgent counts would come from data fetching hooks
  // For now, return zeros to avoid showing fake data
  const urgentCounts = {
    medications: 0,
    appointments: 0,
    communications: 0,
  };

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'medications', label: 'Medications', urgentCount: urgentCounts.medications },
    { id: 'appointments', label: 'Appointments', urgentCount: urgentCounts.appointments },
    { id: 'medical-history', label: 'Medical History' },
    { id: 'contacts', label: 'Emergency Contacts' },
    { id: 'communications', label: 'Communications', urgentCount: urgentCounts.communications },
    { id: 'activity', label: 'Activity Feed' },
  ];

  return {
    tabs,
    activeTab,
    setActiveTab,
    urgentCounts,
  };
}