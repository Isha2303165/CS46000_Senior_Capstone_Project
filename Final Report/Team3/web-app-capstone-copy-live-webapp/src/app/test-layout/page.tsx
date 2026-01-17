'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestLayoutPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Layout Test Page
        </h1>
        <p className="text-gray-600 mt-1">
          Testing responsive layout and navigation system
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Navigation</CardTitle>
            <CardDescription>Bottom tab bar on mobile devices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              The mobile navigation should appear as a fixed bottom tab bar on screens smaller than 1024px (lg breakpoint).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desktop Sidebar</CardTitle>
            <CardDescription>Collapsible sidebar on desktop</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              The desktop sidebar should appear on screens 1024px and larger, with a collapsible toggle button.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Header Component</CardTitle>
            <CardDescription>Responsive header with user menu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              The header adapts to show a hamburger menu on mobile and user actions on all screen sizes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Touch Targets</CardTitle>
            <CardDescription>Minimum 44px touch targets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              All interactive elements meet the minimum 44px × 44px touch target requirement for accessibility.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsive Grid</CardTitle>
            <CardDescription>Mobile-first responsive design</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              This grid adapts from 1 column on mobile to 2 on tablet and 3 on desktop using Tailwind&apos;s responsive classes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Routes</CardTitle>
            <CardDescription>All routes are accessible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✓ Dashboard</p>
              <p>✓ Clients</p>
              <p>✓ Medications</p>
              <p>✓ Calendar</p>
              <p>✓ Chat</p>
              <p>✓ Settings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Responsive Breakpoints
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <strong>Mobile:</strong> &lt; 640px
            <br />
            <span className="text-gray-600">Single column, bottom nav</span>
          </div>
          <div>
            <strong>Tablet:</strong> 640px - 1023px
            <br />
            <span className="text-gray-600">2 columns, bottom nav</span>
          </div>
          <div>
            <strong>Desktop:</strong> ≥ 1024px
            <br />
            <span className="text-gray-600">3 columns, sidebar nav</span>
          </div>
          <div>
            <strong>Large:</strong> ≥ 1280px
            <br />
            <span className="text-gray-600">Expanded layout</span>
          </div>
        </div>
      </div>
    </div>
  );
}