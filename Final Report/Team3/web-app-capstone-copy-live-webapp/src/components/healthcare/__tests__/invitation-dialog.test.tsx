import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InvitationDialog } from '../invitation-dialog';
import { useInvitations } from '../../../hooks/use-invitations';
import type { Client } from '../../../types';

// Mock the useInvitations hook
vi.mock('../../../hooks/use-invitations');
const mockUseInvitations = useInvitations as any;

// Mock the UI components
vi.mock('../../ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('../../ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      data-variant={variant}
      data-testid={variant === 'outline' ? 'cancel-button' : 'submit-button'}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../forms/form-field', () => ({
  FormField: ({ label, value, onChange, error, placeholder, required, type }: any) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {error && <span data-testid="error-message">{error}</span>}
    </div>
  ),
}));

vi.mock('../../forms/select-field', () => ({
  SelectField: ({ label, value, onChange, options, error, required }: any) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`select-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span data-testid="error-message">{error}</span>}
    </div>
  ),
}));

vi.mock('../../forms/textarea-field', () => ({
  TextareaField: ({ label, value, onChange, placeholder, rows }: any) => (
    <div>
      <label>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        data-testid={`textarea-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
    </div>
  ),
}));

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+1234567890',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockInvitationsHook = {
  invitations: [],
  loading: false,
  error: null,
  sendInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  cancelInvitation: vi.fn(),
  resendInvitation: vi.fn(),
  getInvitationsByClient: vi.fn(),
  getInvitationsByEmail: vi.fn(),
  validateInvitationToken: vi.fn(),
  refreshInvitations: vi.fn(),
};

describe('InvitationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    client: mockClient,
    onInvitationSent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInvitations.mockReturnValue(mockInvitationsHook);
  });

  it('should render dialog when open', () => {
    render(<InvitationDialog {...defaultProps} />);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent(
      'Invite Caregiver for John Doe'
    );
  });

  it('should not render dialog when closed', () => {
    render(<InvitationDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<InvitationDialog {...defaultProps} />);

    expect(screen.getByTestId('input-email-address')).toBeInTheDocument();
    expect(screen.getByTestId('select-role')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-personal-message-(optional)')).toBeInTheDocument();
    
    // Check permissions checkboxes
    expect(screen.getByText('View client information')).toBeInTheDocument();
    expect(screen.getByText('Edit client information')).toBeInTheDocument();
    expect(screen.getByText('Manage medications')).toBeInTheDocument();
    expect(screen.getByText('Manage appointments')).toBeInTheDocument();
    expect(screen.getByText('Send messages')).toBeInTheDocument();
    expect(screen.getByText('Invite other caregivers')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<InvitationDialog {...defaultProps} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    expect(mockInvitationsHook.sendInvitation).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<InvitationDialog {...defaultProps} />);

    const emailInput = screen.getByTestId('input-email-address');
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(mockInvitationsHook.sendInvitation).not.toHaveBeenCalled();
  });

  it('should require at least one permission', async () => {
    const user = userEvent.setup();
    render(<InvitationDialog {...defaultProps} />);

    // Uncheck the default 'view' permission
    const viewCheckbox = screen.getByRole('checkbox', { name: /view client information/i });
    await user.click(viewCheckbox);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select at least one permission')).toBeInTheDocument();
    });

    expect(mockInvitationsHook.sendInvitation).not.toHaveBeenCalled();
  });

  it('should send invitation with valid data', async () => {
    const user = userEvent.setup();
    const mockSendInvitation = vi.fn().mockResolvedValue({ id: 'inv-1' });
    mockUseInvitations.mockReturnValue({
      ...mockInvitationsHook,
      sendInvitation: mockSendInvitation,
    });

    render(<InvitationDialog {...defaultProps} />);

    // Fill in the form
    const emailInput = screen.getByTestId('input-email-address');
    await user.type(emailInput, 'test@example.com');

    const roleSelect = screen.getByTestId('select-role');
    await user.selectOptions(roleSelect, 'secondary');

    const messageTextarea = screen.getByTestId('textarea-personal-message-(optional)');
    await user.type(messageTextarea, 'Welcome to our caregiver!');

    // Check additional permissions
    const editCheckbox = screen.getByRole('checkbox', { name: /edit client information/i });
    await user.click(editCheckbox);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSendInvitation).toHaveBeenCalledWith({
        clientId: 'client-1',
        invitedEmail: 'test@example.com',
        role: 'secondary',
        permissions: ['view', 'edit'],
        personalMessage: 'Welcome to our caregiver!',
      });
    });

    expect(defaultProps.onInvitationSent).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should handle permission changes correctly', async () => {
    const user = userEvent.setup();
    render(<InvitationDialog {...defaultProps} />);

    // Initially, 'view' should be checked
    const viewCheckbox = screen.getByRole('checkbox', { name: /view client information/i });
    expect(viewCheckbox).toBeChecked();

    // Check 'edit' permission
    const editCheckbox = screen.getByRole('checkbox', { name: /edit client information/i });
    await user.click(editCheckbox);
    expect(editCheckbox).toBeChecked();

    // Uncheck 'view' permission
    await user.click(viewCheckbox);
    expect(viewCheckbox).not.toBeChecked();

    // Check 'medications' permission
    const medicationsCheckbox = screen.getByRole('checkbox', { name: /manage medications/i });
    await user.click(medicationsCheckbox);
    expect(medicationsCheckbox).toBeChecked();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const mockSendInvitation = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    mockUseInvitations.mockReturnValue({
      ...mockInvitationsHook,
      sendInvitation: mockSendInvitation,
      loading: true,
    });

    render(<InvitationDialog {...defaultProps} />);

    const emailInput = screen.getByTestId('input-email-address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should display error message', () => {
    mockUseInvitations.mockReturnValue({
      ...mockInvitationsHook,
      error: 'Failed to send invitation',
    });

    render(<InvitationDialog {...defaultProps} />);

    expect(screen.getByText('Failed to send invitation')).toBeInTheDocument();
  });

  it('should reset form when closed', async () => {
    const user = userEvent.setup();
    render(<InvitationDialog {...defaultProps} />);

    // Fill in some data
    const emailInput = screen.getByTestId('input-email-address');
    await user.type(emailInput, 'test@example.com');

    const messageTextarea = screen.getByTestId('textarea-personal-message-(optional)');
    await user.type(messageTextarea, 'Test message');

    // Close dialog
    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should handle form submission failure', async () => {
    const user = userEvent.setup();
    const mockSendInvitation = vi.fn().mockResolvedValue(null);
    mockUseInvitations.mockReturnValue({
      ...mockInvitationsHook,
      sendInvitation: mockSendInvitation,
    });

    render(<InvitationDialog {...defaultProps} />);

    const emailInput = screen.getByTestId('input-email-address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSendInvitation).toHaveBeenCalled();
    });

    // Should not call success callbacks if invitation failed
    expect(defaultProps.onInvitationSent).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});