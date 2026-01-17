import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentDialog } from '../appointment-dialog';
import { Appointment, Client, CreateAppointmentInput } from '@/types';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-16';
    return '2024-01-16';
  }),
  addDays: vi.fn(() => new Date('2024-01-16')),
  isBefore: vi.fn(() => false),
  isAfter: vi.fn(() => true),
  parseISO: vi.fn((dateStr) => new Date(dateStr)),
}));

const mockClients: Client[] = [
  {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '555-0456',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'client-2',
    firstName: 'Alice',
    lastName: 'Smith',
    dateOfBirth: '1975-05-15',
    emergencyContactName: 'Bob Smith',
    emergencyContactPhone: '555-0789',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockAppointment: Appointment = {
  id: '1',
  clientId: 'client-1',
  title: 'Annual Checkup',
  description: 'Routine annual physical examination',
  appointmentDate: '2024-01-15',
  appointmentTime: '14:30',
  duration: 60,
  timeZone: 'America/New_York',
  providerName: 'Dr. Johnson',
  providerType: 'primary_care',
  providerPhone: '555-0123',
  locationType: 'in_person',
  address: '123 Medical Center Dr, Suite 100',
  roomNumber: 'Room 205',
  status: 'scheduled',
  appointmentType: 'Physical Exam',
  priority: 'normal',
  preparationInstructions: 'Please bring your insurance card and medication list',
  documentsNeeded: ['Insurance Card', 'Photo ID', 'Medication List'],
  followUpRequired: true,
  reminderSent: false,
  reminderTimes: [24, 2],
  createdBy: 'caregiver-1',
  notes: 'Client has been experiencing fatigue',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockExistingAppointments: Appointment[] = [
  {
    ...mockAppointment,
    id: 'existing-1',
    title: 'Existing Appointment',
    appointmentDate: '2024-01-15',
    appointmentTime: '15:00',
    duration: 30,
  }
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  clients: mockClients,
  currentUserId: 'caregiver-1',
  existingAppointments: [],
  isLoading: false,
};

describe('AppointmentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders create appointment dialog', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      expect(screen.getByText('New Appointment')).toBeInTheDocument();
      expect(screen.getByLabelText(/appointment title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/provider name/i)).toBeInTheDocument();
    });

    it('renders edit appointment dialog with existing data', () => {
      render(
        <AppointmentDialog 
          {...defaultProps} 
          appointment={mockAppointment}
        />
      );
      
      expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Annual Checkup')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByDisplayValue('555-0123')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<AppointmentDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('New Appointment')).not.toBeInTheDocument();
    });

    it('renders client options', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      // Open client select dropdown
      const clientSelect = screen.getByLabelText(/client/i);
      fireEvent.click(clientSelect);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    it('renders provider type options', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      const providerTypeSelect = screen.getByLabelText(/provider type/i);
      expect(providerTypeSelect).toBeInTheDocument();
    });

    it('renders location type options', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      const locationTypeSelect = screen.getByLabelText(/location type/i);
      expect(locationTypeSelect).toBeInTheDocument();
    });

    it('renders priority options', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      const prioritySelect = screen.getByLabelText(/priority/i);
      expect(prioritySelect).toBeInTheDocument();
    });

    it('renders status options when editing', () => {
      render(
        <AppointmentDialog 
          {...defaultProps} 
          appointment={mockAppointment}
        />
      );
      
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows required field errors', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      // Clear required fields
      const titleInput = screen.getByLabelText(/appointment title/i);
      await user.clear(titleInput);
      
      const providerInput = screen.getByLabelText(/provider name/i);
      await user.clear(providerInput);
      
      // Try to save
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
        expect(screen.getByText('Provider name is required')).toBeInTheDocument();
      });
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('validates duration is greater than 0', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      const durationInput = screen.getByLabelText(/duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '0');
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Duration must be greater than 0')).toBeInTheDocument();
      });
    });

    it('validates address for in-person appointments', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/appointment title/i), 'Test Appointment');
      await user.type(screen.getByLabelText(/provider name/i), 'Dr. Test');
      
      // Select in-person location but don't provide address
      const locationSelect = screen.getByLabelText(/location type/i);
      await user.selectOptions(locationSelect, 'in_person');
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Address is required for in-person appointments')).toBeInTheDocument();
      });
    });

    it('validates telehealth link for telehealth appointments', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/appointment title/i), 'Test Appointment');
      await user.type(screen.getByLabelText(/provider name/i), 'Dr. Test');
      
      // Select telehealth location but don't provide link
      const locationSelect = screen.getByLabelText(/location type/i);
      await user.selectOptions(locationSelect, 'telehealth');
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Video link is required for telehealth appointments')).toBeInTheDocument();
      });
    });

    it('clears field errors when corrected', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      // Clear title to trigger error
      const titleInput = screen.getByLabelText(/appointment title/i);
      await user.clear(titleInput);
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
      
      // Fix the error
      await user.type(titleInput, 'Fixed Title');
      
      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('conflict detection', () => {
    it('shows conflict warning', async () => {
      render(
        <AppointmentDialog 
          {...defaultProps} 
          existingAppointments={mockExistingAppointments}
        />
      );
      
      // Fill form with conflicting time
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/appointment title/i), 'Conflicting Appointment');
      await user.type(screen.getByLabelText(/provider name/i), 'Dr. Test');
      
      // Set date and time that conflicts
      const dateInput = screen.getByLabelText(/date/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');
      
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '15:00');
      
      await waitFor(() => {
        expect(screen.getByText(/scheduling conflicts detected/i)).toBeInTheDocument();
        expect(screen.getByText(/existing appointment/i)).toBeInTheDocument();
      });
      
      // Save button should be disabled
      const saveButton = screen.getByRole('button', { name: /create/i });
      expect(saveButton).toBeDisabled();
    });

    it('does not show conflicts for cancelled appointments', async () => {
      const cancelledAppointments = [
        {
          ...mockExistingAppointments[0],
          status: 'cancelled' as const,
        }
      ];
      
      render(
        <AppointmentDialog 
          {...defaultProps} 
          existingAppointments={cancelledAppointments}
        />
      );
      
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/appointment title/i), 'Test Appointment');
      await user.type(screen.getByLabelText(/provider name/i), 'Dr. Test');
      
      // Set same time as cancelled appointment
      const dateInput = screen.getByLabelText(/date/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');
      
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '15:00');
      
      await waitFor(() => {
        expect(screen.queryByText(/scheduling conflicts detected/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('location type handling', () => {
    it('shows address fields for in-person appointments', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      const locationSelect = screen.getByLabelText(/location type/i);
      await user.selectOptions(locationSelect, 'in_person');
      
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/room number/i)).toBeInTheDocument();
    });

    it('shows telehealth link field for telehealth appointments', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      const locationSelect = screen.getByLabelText(/location type/i);
      await user.selectOptions(locationSelect, 'telehealth');
      
      expect(screen.getByLabelText(/video call link/i)).toBeInTheDocument();
    });

    it('hides location-specific fields for phone appointments', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      const locationSelect = screen.getByLabelText(/location type/i);
      await user.selectOptions(locationSelect, 'phone');
      
      expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/video call link/i)).not.toBeInTheDocument();
    });
  });

  describe('documents needed management', () => {
    it('adds documents to the list', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      const documentInput = screen.getByPlaceholderText(/insurance card/i);
      const addButton = screen.getByRole('button', { name: '' }); // Plus button
      
      await user.type(documentInput, 'Driver License');
      await user.click(addButton);
      
      expect(screen.getByText('Driver License')).toBeInTheDocument();
      expect(documentInput).toHaveValue('');
    });

    it('removes documents from the list', async () => {
      const user = userEvent.setup();
      render(
        <AppointmentDialog 
          {...defaultProps} 
          appointment={mockAppointment}
        />
      );
      
      // Should show existing documents
      expect(screen.getByText('Insurance Card')).toBeInTheDocument();
      
      // Find and click remove button for Insurance Card
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(button => 
        button.closest('.flex')?.textContent?.includes('Insurance Card')
      );
      
      if (removeButton) {
        await user.click(removeButton);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Insurance Card')).not.toBeInTheDocument();
      });
    });

    it('prevents duplicate documents', async () => {
      const user = userEvent.setup();
      render(
        <AppointmentDialog 
          {...defaultProps} 
          appointment={mockAppointment}
        />
      );
      
      const documentInput = screen.getByPlaceholderText(/insurance card/i);
      const addButton = screen.getByRole('button', { name: '' }); // Plus button
      
      // Try to add existing document
      await user.type(documentInput, 'Insurance Card');
      await user.click(addButton);
      
      // Should still only have one instance
      const insuranceCards = screen.getAllByText('Insurance Card');
      expect(insuranceCards).toHaveLength(1);
    });
  });

  describe('reminder times management', () => {
    it('adds reminder times to the list', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      const reminderInput = screen.getByDisplayValue('24'); // Default reminder time input
      const addButton = screen.getAllByRole('button', { name: '' })[1]; // Second plus button
      
      await user.clear(reminderInput);
      await user.type(reminderInput, '48');
      await user.click(addButton);
      
      expect(screen.getByText('48h before')).toBeInTheDocument();
    });

    it('removes reminder times from the list', async () => {
      const user = userEvent.setup();
      render(
        <AppointmentDialog 
          {...defaultProps} 
          appointment={mockAppointment}
        />
      );
      
      // Should show existing reminder times
      expect(screen.getByText('24h before')).toBeInTheDocument();
      expect(screen.getByText('2h before')).toBeInTheDocument();
      
      // Find and click remove button for 24h reminder
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(button => 
        button.closest('.flex')?.textContent?.includes('24h before')
      );
      
      if (removeButton) {
        await user.click(removeButton);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('24h before')).not.toBeInTheDocument();
      });
    });

    it('prevents duplicate reminder times', async () => {
      const user = userEvent.setup();
      render(
        <AppointmentDialog 
          {...defaultProps} 
          appointment={mockAppointment}
        />
      );
      
      const reminderInput = screen.getByDisplayValue('24'); // Default reminder time input
      const addButton = screen.getAllByRole('button', { name: '' })[1]; // Second plus button
      
      // Try to add existing reminder time
      await user.clear(reminderInput);
      await user.type(reminderInput, '24');
      await user.click(addButton);
      
      // Should still only have one instance
      const reminderTimes = screen.getAllByText('24h before');
      expect(reminderTimes).toHaveLength(1);
    });
  });

  describe('form submission', () => {
    it('calls onSave with correct data for new appointment', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/appointment title/i), 'New Appointment');
      await user.type(screen.getByLabelText(/provider name/i), 'Dr. New');
      await user.type(screen.getByLabelText(/address/i), '456 New St');
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Appointment',
            providerName: 'Dr. New',
            address: '456 New St',
            createdBy: 'caregiver-1',
          })
        );
      });
    });

    it('calls onSave with correct data for updated appointment', async () => {
      const user = userEvent.setup();
      render(
        <AppointmentDialog 
          {...defaultProps} 
          appointment={mockAppointment}
        />
      );
      
      // Update title
      const titleInput = screen.getByDisplayValue('Annual Checkup');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Checkup');
      
      const saveButton = screen.getByRole('button', { name: /update/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            title: 'Updated Checkup',
          })
        );
      });
    });

    it('shows loading state during save', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} isLoading={true} />);
      
      const saveButton = screen.getByRole('button', { name: /saving/i });
      expect(saveButton).toBeDisabled();
    });

    it('handles save errors', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      
      render(
        <AppointmentDialog 
          {...defaultProps} 
          onSave={mockOnSave}
        />
      );
      
      // Fill required fields
      await user.type(screen.getByLabelText(/appointment title/i), 'Test Appointment');
      await user.type(screen.getByLabelText(/provider name/i), 'Dr. Test');
      await user.type(screen.getByLabelText(/address/i), '123 Test St');
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to save appointment/i)).toBeInTheDocument();
      });
    });
  });

  describe('dialog controls', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AppointmentDialog {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when dialog is closed', () => {
      const { rerender } = render(<AppointmentDialog {...defaultProps} />);
      
      // Simulate dialog close
      rerender(<AppointmentDialog {...defaultProps} isOpen={false} />);
      
      // The dialog should handle the close event
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      expect(screen.getByLabelText(/appointment title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/provider name/i)).toBeInTheDocument();
    });

    it('has proper dialog title', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toHaveAccessibleName('New Appointment');
    });

    it('has proper form structure', () => {
      render(<AppointmentDialog {...defaultProps} />);
      
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);
    });
  });
});