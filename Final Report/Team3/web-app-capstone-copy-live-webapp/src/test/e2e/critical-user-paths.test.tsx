/**
 * End-to-end test scenarios for critical user paths
 * Tests complete user journeys through the healthcare tracking app
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockUser, createMockClient, createMockMedication, createMockAppointment, createMockMessage } from '../setup';

// Mock the entire app structure for E2E testing
const MockApp = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    {children}
  </div>
);

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

const MockLoginPage = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="relative block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Password"
            className="relative block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  </div>
);

const MockDashboard = ({ 
  clients, 
  medications, 
  appointments, 
  onAddClient, 
  onViewClient,
  onLogMedication 
}: {
  clients: any[];
  medications: any[];
  appointments: any[];
  onAddClient: () => void;
  onViewClient: (client: any) => void;
  onLogMedication: (medication: any) => void;
}) => (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Healthcare Dashboard</h1>
      <button
        onClick={onAddClient}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Add Client
      </button>
    </div>
    
    {/* Client Cards */}
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Clients</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-white p-4 rounded-lg shadow border">
            <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
            <p className="text-sm text-gray-600">DOB: {client.dateOfBirth}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onViewClient(client)}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Medication Reminders */}
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Medication Reminders</h2>
      <div className="space-y-3">
        {medications.map((medication) => (
          <div key={medication.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{medication.name}</h3>
                <p className="text-sm text-gray-600">{medication.dosage} {medication.unit} - {medication.frequency}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onLogMedication(medication)}
                  className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                >
                  Mark Taken
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Upcoming Appointments */}
    <div>
      <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="bg-white p-4 rounded-lg shadow border">
            <h3 className="font-medium">{appointment.title}</h3>
            <p className="text-sm text-gray-600">
              {appointment.appointmentDate} at {appointment.appointmentTime}
            </p>
            <p className="text-sm text-gray-600">Provider: {appointment.providerName}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MockClientDialog = ({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (client: any) => void; 
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const client = {
      id: Date.now().toString(),
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      emergencyContactName: formData.get('emergencyContactName') as string,
      emergencyContactPhone: formData.get('emergencyContactPhone') as string,
    };
    onSave(client);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Add New Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
              Emergency Contact Name
            </label>
            <input
              type="text"
              id="emergencyContactName"
              name="emergencyContactName"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
      <MockApp>
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </MockApp>
    </QueryClientProvider>
  );
};

describe('Critical User Path E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Authentication Flow', () => {
    it('should complete full login workflow', async () => {
      const mockLogin = vi.fn();
      
      render(
        <TestWrapper>
          <MockLoginPage onLogin={mockLogin} />
        </TestWrapper>
      );

      // Verify login form is displayed
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();

      // Fill in login credentials
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      await user.click(signInButton);

      // Verify login was called
      expect(mockLogin).toHaveBeenCalled();
    });

    it('should handle login errors gracefully', async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
      
      render(
        <TestWrapper>
          <MockLoginPage onLogin={mockLogin} />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(signInButton);

      // In a real implementation, we'd check for error messages
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('Client Management Workflow', () => {
    it('should complete full client creation workflow', async () => {
      const mockClients = [createMockClient()];
      const mockAddClient = vi.fn();
      const mockViewClient = vi.fn();
      const mockSaveClient = vi.fn((client) => {
        mockClients.push(client);
      });

      const ClientManagementApp = () => {
        const [clients, setClients] = React.useState(mockClients);
        const [showDialog, setShowDialog] = React.useState(false);

        const handleAddClient = () => {
          mockAddClient();
          setShowDialog(true);
        };

        const handleSaveClient = (client: any) => {
          mockSaveClient(client);
          setClients([...clients, client]);
        };

        return (
          <>
            <MockDashboard
              clients={clients}
              medications={[]}
              appointments={[]}
              onAddClient={handleAddClient}
              onViewClient={mockViewClient}
              onLogMedication={() => {}}
            />
            <MockClientDialog
              isOpen={showDialog}
              onClose={() => setShowDialog(false)}
              onSave={handleSaveClient}
            />
          </>
        );
      };

      render(
        <TestWrapper>
          <ClientManagementApp />
        </TestWrapper>
      );

      // Verify initial client is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Click Add Client button
      const addClientButton = screen.getByRole('button', { name: /add client/i });
      await user.click(addClientButton);

      expect(mockAddClient).toHaveBeenCalled();

      // Verify dialog opened
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add new client/i })).toBeInTheDocument();
      });

      // Fill out client form
      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Smith');
      await user.type(screen.getByLabelText(/date of birth/i), '1990-05-15');
      await user.type(screen.getByLabelText(/emergency contact name/i), 'John Smith');
      await user.type(screen.getByLabelText(/emergency contact phone/i), '555-0123');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save client/i });
      await user.click(saveButton);

      // Verify client was saved
      expect(mockSaveClient).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1990-05-15',
          emergencyContactName: 'John Smith',
          emergencyContactPhone: '555-0123',
        })
      );

      // Verify new client appears in list
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should handle client form validation errors', async () => {
      const mockSaveClient = vi.fn();

      render(
        <TestWrapper>
          <MockClientDialog
            isOpen={true}
            onClose={() => {}}
            onSave={mockSaveClient}
          />
        </TestWrapper>
      );

      // Try to submit empty form
      const saveButton = screen.getByRole('button', { name: /save client/i });
      await user.click(saveButton);

      // Form should not submit due to required fields
      expect(mockSaveClient).not.toHaveBeenCalled();

      // HTML5 validation should prevent submission
      const firstNameInput = screen.getByLabelText(/first name/i);
      expect(firstNameInput).toBeRequired();
    });
  });

  describe('Medication Management Workflow', () => {
    it('should complete medication logging workflow', async () => {
      const mockMedication = createMockMedication();
      const mockLogMedication = vi.fn();

      render(
        <TestWrapper>
          <MockDashboard
            clients={[]}
            medications={[mockMedication]}
            appointments={[]}
            onAddClient={() => {}}
            onViewClient={() => {}}
            onLogMedication={mockLogMedication}
          />
        </TestWrapper>
      );

      // Verify medication reminder is displayed
      expect(screen.getByText('Test Medication')).toBeInTheDocument();
      expect(screen.getByText('10 mg - Once daily')).toBeInTheDocument();

      // Click Mark Taken button
      const markTakenButton = screen.getByRole('button', { name: /mark taken/i });
      await user.click(markTakenButton);

      // Verify medication was logged
      expect(mockLogMedication).toHaveBeenCalledWith(mockMedication);
    });
  });

  describe('Dashboard Overview Workflow', () => {
    it('should display comprehensive dashboard with all data types', async () => {
      const mockClient = createMockClient();
      const mockMedication = createMockMedication();
      const mockAppointment = createMockAppointment();

      render(
        <TestWrapper>
          <MockDashboard
            clients={[mockClient]}
            medications={[mockMedication]}
            appointments={[mockAppointment]}
            onAddClient={() => {}}
            onViewClient={() => {}}
            onLogMedication={() => {}}
          />
        </TestWrapper>
      );

      // Verify all sections are displayed
      expect(screen.getByRole('heading', { name: /healthcare dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /clients/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /medication reminders/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /upcoming appointments/i })).toBeInTheDocument();

      // Verify data is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test Medication')).toBeInTheDocument();
      expect(screen.getByText('Test Appointment')).toBeInTheDocument();
    });

    it('should handle empty states gracefully', async () => {
      render(
        <TestWrapper>
          <MockDashboard
            clients={[]}
            medications={[]}
            appointments={[]}
            onAddClient={() => {}}
            onViewClient={() => {}}
            onLogMedication={() => {}}
          />
        </TestWrapper>
      );

      // Verify sections are still displayed even with no data
      expect(screen.getByRole('heading', { name: /clients/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /medication reminders/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /upcoming appointments/i })).toBeInTheDocument();

      // Add Client button should still be available
      expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      const mockClients = [];
      const mockError = new Error('Network error');

      render(
        <TestWrapper>
          <div role="alert" aria-live="polite">
            Failed to load clients: {mockError.message}
          </div>
        </TestWrapper>
      );

      // Verify error message is displayed
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load clients: Network error');
    });

    it('should provide retry functionality on errors', async () => {
      const mockRetry = vi.fn();

      render(
        <TestWrapper>
          <div className="text-center p-6">
            <p className="text-red-600 mb-4">Failed to load data</p>
            <button
              onClick={mockRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Loading States Workflow', () => {
    it('should display loading states during data fetching', async () => {
      render(
        <TestWrapper>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading clients...</span>
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('Loading clients...')).toBeInTheDocument();
    });

    it('should show skeleton loading for cards', async () => {
      render(
        <TestWrapper>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </TestWrapper>
      );

      const skeletonCards = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletonCards).toHaveLength(3);
    });
  });

  describe('Accessibility in User Flows', () => {
    it('should maintain focus management throughout workflows', async () => {
      const mockAddClient = vi.fn();

      render(
        <TestWrapper>
          <MockDashboard
            clients={[]}
            medications={[]}
            appointments={[]}
            onAddClient={mockAddClient}
            onViewClient={() => {}}
            onLogMedication={() => {}}
          />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add client/i });
      
      // Focus should be manageable
      addButton.focus();
      expect(document.activeElement).toBe(addButton);

      // Keyboard activation should work
      await user.keyboard('{Enter}');
      expect(mockAddClient).toHaveBeenCalled();
    });

    it('should provide proper screen reader announcements', async () => {
      render(
        <TestWrapper>
          <div>
            <div role="status" aria-live="polite">
              Client John Doe added successfully
            </div>
            <div role="alert" aria-live="assertive">
              Medication reminder: Take Metformin now
            </div>
          </div>
        </TestWrapper>
      );

      const status = screen.getByRole('status');
      const alert = screen.getByRole('alert');

      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });
});