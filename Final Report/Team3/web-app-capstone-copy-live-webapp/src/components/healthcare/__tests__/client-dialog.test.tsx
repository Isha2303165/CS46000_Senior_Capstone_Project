import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientDialog } from '../client-dialog';
import { useCreateClient, useUpdateClient } from '@/hooks/use-clients';
import type { Client } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-clients', () => ({
  useCreateClient: vi.fn(),
  useUpdateClient: vi.fn(),
}));

const mockClient: Client = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-05-15',
  gender: 'male',
  medicalRecordNumber: 'MRN123',
  medicalConditions: ['Diabetes', 'Hypertension'],
  allergies: ['Penicillin'],
  currentMedications: ['Metformin'],
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0123',
  emergencyContactRelationship: 'Spouse',
  insuranceProvider: 'Blue Cross',
  insurancePolicyNumber: 'BC123456',
  insuranceGroupNumber: 'GRP789',
  primaryPhysician: 'Dr. Smith',
  preferredPharmacy: 'CVS Pharmacy',
  careNotes: 'Client prefers morning appointments',
  isActive: true,
  caregivers: [],
  medications: [],
  appointments: [],
  messages: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ClientDialog', () => {
  const mockCreateClient = {
    mutateAsync: vi.fn(),
    isPending: false,
  };
  
  const mockUpdateClient = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateClient).mockReturnValue(mockCreateClient as any);
    vi.mocked(useUpdateClient).mockReturnValue(mockUpdateClient as any);
  });

  it('renders create dialog correctly', () => {
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Add New Client')).toBeInTheDocument();
    expect(screen.getByText('Enter client information to create a new profile.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create client/i })).toBeInTheDocument();
  });

  it('renders edit dialog correctly', () => {
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        client={mockClient}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Edit Client')).toBeInTheDocument();
    expect(screen.getByText('Update client information and medical details.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update client/i })).toBeInTheDocument();
  });

  it('populates form fields in edit mode', () => {
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        client={mockClient}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1980-05-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-0123')).toBeInTheDocument();
  });

  it('displays medical conditions, allergies, and medications as badges', () => {
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        client={mockClient}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Diabetes')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Penicillin')).toBeInTheDocument();
    expect(screen.getByText('Metformin')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /create client/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Emergency contact name is required')).toBeInTheDocument();
      expect(screen.getByText('Emergency contact phone is required')).toBeInTheDocument();
    });
  });

  it('allows adding medical conditions', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Add a medical condition
    const conditionInput = screen.getByPlaceholderText('Add medical condition');
    await user.type(conditionInput, 'Diabetes');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Diabetes')).toBeInTheDocument();
  });

  it('allows adding allergies', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Add an allergy
    const allergyInput = screen.getByPlaceholderText('Add allergy');
    await user.type(allergyInput, 'Penicillin');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Penicillin')).toBeInTheDocument();
  });

  it('submits create form with correct data', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={onOpenChange}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Fill required fields using placeholder text since labels might not match exactly
    await user.type(screen.getByPlaceholderText('Enter first name'), 'John');
    await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '1980-05-15');
    await user.type(screen.getByPlaceholderText('Enter contact name'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('Enter phone number'), '555-0123');

    const submitButton = screen.getByRole('button', { name: /create client/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateClient.mutateAsync).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-05-15',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '555-0123',
        gender: '',
        medicalRecordNumber: '',
        emergencyContactRelationship: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceGroupNumber: '',
        primaryPhysician: '',
        preferredPharmacy: '',
        careNotes: '',
      });
    });
  });

  it('submits update form with correct data', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={onOpenChange}
        client={mockClient}
        mode="edit"
      />,
      { wrapper: createWrapper() }
    );

    // Update first name
    const firstNameInput = screen.getByDisplayValue('John');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    const submitButton = screen.getByRole('button', { name: /update client/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateClient.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          firstName: 'Jane',
        })
      );
    });
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={onOpenChange}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles form submission errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockCreateClient.mutateAsync.mockRejectedValue(new Error('Network error'));
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    // Fill required fields
    await user.type(screen.getByPlaceholderText('Enter first name'), 'John');
    await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '1980-05-15');
    await user.type(screen.getByPlaceholderText('Enter contact name'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('Enter phone number'), '555-0123');

    const submitButton = screen.getByRole('button', { name: /create client/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error saving client:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('adds medical condition on Enter key press', async () => {
    const user = userEvent.setup();
    
    render(
      <ClientDialog
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />,
      { wrapper: createWrapper() }
    );

    const conditionInput = screen.getByPlaceholderText('Add medical condition');
    await user.type(conditionInput, 'Diabetes');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Diabetes')).toBeInTheDocument();
  });
});