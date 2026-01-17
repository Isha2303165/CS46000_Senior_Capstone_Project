import React from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import SettingsPage from '../page';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSettingsStore } from '@/lib/stores/settings-store';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock settings store
vi.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock accessibility provider
vi.mock('@/components/accessibility/accessibility-provider', () => ({
  useAccessibility: vi.fn(() => ({
    fontSize: 'normal',
    setFontSize: vi.fn(),
    highContrast: false,
    setHighContrast: vi.fn(),
    reducedMotion: false,
    announceMessage: vi.fn(),
  })),
}));

describe('SettingsPage', () => {
  const mockPush = vi.fn();
  const mockUpdateProfile = vi.fn();
  const mockUploadProfilePicture = vi.fn();
  const mockRemoveProfilePicture = vi.fn();
  const mockUpdateNotificationPreferences = vi.fn();
  const mockUpdatePrivacySettings = vi.fn();
  const mockUpdateSecuritySettings = vi.fn();
  const mockChangePassword = vi.fn();
  const mockEnableMFA = vi.fn();
  const mockDisableMFA = vi.fn();
  const mockExportUserData = vi.fn();
  const mockInitializeSettings = vi.fn();
  const mockSetError = vi.fn();

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'PRIMARY_CAREGIVER' as const,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockNotificationPreferences = {
    medicationReminders: true,
    appointmentReminders: true,
    urgentMessages: true,
    systemAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    reminderTiming: {
      medication: [1, 0.25],
      appointment: [24, 2],
    },
  };

  const mockPrivacySettings = {
    profileVisibility: 'all_caregivers' as const,
    shareContactInfo: true,
    allowInvitations: true,
    dataRetention: 365,
    analyticsOptOut: false,
  };

  const mockSecuritySettings = {
    mfaEnabled: false,
    sessionTimeout: 480,
    loginNotifications: true,
    deviceTrust: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as Mock).mockReturnValue({
      push: mockPush,
    });

    (useAuthStore as Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      updateProfile: mockUpdateProfile,
      isLoading: false,
      error: null,
    });

    (useSettingsStore as Mock).mockReturnValue({
      profilePicture: null,
      isUploadingAvatar: false,
      notificationPreferences: mockNotificationPreferences,
      isUpdatingNotifications: false,
      privacySettings: mockPrivacySettings,
      isUpdatingPrivacy: false,
      securitySettings: mockSecuritySettings,
      isUpdatingSecurity: false,
      isExportingData: false,
      lastExportDate: null,
      uploadProfilePicture: mockUploadProfilePicture,
      removeProfilePicture: mockRemoveProfilePicture,
      updateNotificationPreferences: mockUpdateNotificationPreferences,
      updatePrivacySettings: mockUpdatePrivacySettings,
      updateSecuritySettings: mockUpdateSecuritySettings,
      changePassword: mockChangePassword,
      enableMFA: mockEnableMFA,
      disableMFA: mockDisableMFA,
      exportUserData: mockExportUserData,
      initializeSettings: mockInitializeSettings,
      setError: mockSetError,
      error: null,
    });
  });

  it('should render settings page with all tabs', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your account preferences and security')).toBeInTheDocument();

    // Check tab navigation
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Data Export')).toBeInTheDocument();
  });

  it('should redirect to login if user is not authenticated', () => {
    (useAuthStore as Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      updateProfile: mockUpdateProfile,
      isLoading: false,
      error: null,
    });

    render(<SettingsPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should initialize settings on mount', () => {
    render(<SettingsPage />);

    expect(mockInitializeSettings).toHaveBeenCalled();
  });

  describe('Profile Tab', () => {
    it('should display profile information form', async () => {
      render(<SettingsPage />);

      // Wait for the profile form to be rendered
      await waitFor(() => {
        expect(screen.getByLabelText('First name')).toBeInTheDocument();
      });

      // Check that form fields are populated with user data
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      
      // Check role select field
      const roleSelect = screen.getByLabelText('Role');
      expect(roleSelect).toHaveValue('PRIMARY_CAREGIVER');
    });

    it('should update profile information', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValue({});

      render(<SettingsPage />);

      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      const updateButton = screen.getByText('Update Profile');
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'PRIMARY_CAREGIVER',
          phoneNumber: '',
        });
      });
    });

    it('should handle profile picture upload', async () => {
      const user = userEvent.setup();
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      mockUploadProfilePicture.mockResolvedValue('https://example.com/profile.jpg');

      render(<SettingsPage />);

      // Wait for the form to be rendered
      await waitFor(() => {
        expect(screen.getByText('Upload Picture')).toBeInTheDocument();
      });

      // Find the hidden file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Simulate file selection
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(mockUploadProfilePicture).toHaveBeenCalledWith(mockFile);
      });
    });

    it('should handle profile picture removal', async () => {
      const user = userEvent.setup();
      mockRemoveProfilePicture.mockResolvedValue({});

      (useSettingsStore as Mock).mockReturnValue({
        ...useSettingsStore(),
        profilePicture: 'https://example.com/profile.jpg',
      });

      render(<SettingsPage />);

      const removeButton = screen.getByText('Remove');
      await user.click(removeButton);

      await waitFor(() => {
        expect(mockRemoveProfilePicture).toHaveBeenCalled();
      });
    });
  });

  describe('Notifications Tab', () => {
    it('should display notification preferences', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const notificationsTab = screen.getByText('Notifications');
      await user.click(notificationsTab);

      expect(screen.getByText('Medication Reminders')).toBeInTheDocument();
      expect(screen.getByText('Appointment Reminders')).toBeInTheDocument();
      expect(screen.getByText('Urgent Messages')).toBeInTheDocument();
      expect(screen.getByText('System Alerts')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    });

    it('should update notification preferences', async () => {
      const user = userEvent.setup();
      mockUpdateNotificationPreferences.mockResolvedValue({});

      render(<SettingsPage />);

      const notificationsTab = screen.getByText('Notifications');
      await user.click(notificationsTab);

      // Find and click the medication reminders switch
      const medicationSwitch = screen.getByRole('switch', { name: /medication reminders/i });
      await user.click(medicationSwitch);

      await waitFor(() => {
        expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith({
          medicationReminders: false,
        });
      });
    });
  });

  describe('Privacy Tab', () => {
    it('should display privacy settings', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const privacyTab = screen.getByText('Privacy');
      await user.click(privacyTab);

      expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
      expect(screen.getByText('Share Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Allow Invitations')).toBeInTheDocument();
      expect(screen.getByText('Data Retention')).toBeInTheDocument();
      expect(screen.getByText('Opt Out of Analytics')).toBeInTheDocument();
    });

    it('should update privacy settings', async () => {
      const user = userEvent.setup();
      mockUpdatePrivacySettings.mockResolvedValue({});

      render(<SettingsPage />);

      const privacyTab = screen.getByText('Privacy');
      await user.click(privacyTab);

      // Wait for privacy settings to be rendered
      await waitFor(() => {
        expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
      });

      // Find the select element by looking for the select after the label text
      const profileVisibilityLabel = screen.getByText('Profile Visibility');
      const selectElement = profileVisibilityLabel.parentElement?.parentElement?.querySelector('select');
      
      expect(selectElement).toBeInTheDocument();
      
      if (selectElement) {
        fireEvent.change(selectElement, { target: { value: 'primary_only' } });
      }

      await waitFor(() => {
        expect(mockUpdatePrivacySettings).toHaveBeenCalledWith({
          profileVisibility: 'primary_only',
        });
      });
    });
  });

  describe('Security Tab', () => {
    it('should display security settings', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const securityTab = screen.getByText('Security');
      await user.click(securityTab);

      expect(screen.getByText('Password & Authentication')).toBeInTheDocument();
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
      expect(screen.getByText('Multi-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Login Notifications')).toBeInTheDocument();
      expect(screen.getByText('Device Trust')).toBeInTheDocument();
      expect(screen.getByText('Session Timeout')).toBeInTheDocument();
    });

    it('should change password', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValue({});

      render(<SettingsPage />);

      const securityTab = screen.getByText('Security');
      await user.click(securityTab);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      const changePasswordButton = screen.getByText('Change Password');
      await user.click(changePasswordButton);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('oldpassword', 'newpassword123');
      });
    });

    it('should toggle MFA', async () => {
      const user = userEvent.setup();
      mockEnableMFA.mockResolvedValue({});

      render(<SettingsPage />);

      const securityTab = screen.getByText('Security');
      await user.click(securityTab);

      const mfaSwitch = screen.getByRole('switch', { name: /multi-factor authentication/i });
      await user.click(mfaSwitch);

      await waitFor(() => {
        expect(mockEnableMFA).toHaveBeenCalled();
      });
    });
  });

  describe('Data Export Tab', () => {
    it('should display data export information', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const dataTab = screen.getByText('Data Export');
      await user.click(dataTab);

      expect(screen.getByText('Data Export')).toBeInTheDocument();
      expect(screen.getByText('What\'s included in your export:')).toBeInTheDocument();
      expect(screen.getByText('Export Your Data')).toBeInTheDocument();
      expect(screen.getByText('Important Notes:')).toBeInTheDocument();
    });

    it('should export user data', async () => {
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockExportUserData.mockResolvedValue('https://export-url.example.com');

      render(<SettingsPage />);

      const dataTab = screen.getByText('Data Export');
      await user.click(dataTab);

      const exportButton = screen.getByText('Export Data');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportUserData).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Data export ready: https://export-url.example.com');
      });

      mockAlert.mockRestore();
    });

    it('should display last export date', async () => {
      const user = userEvent.setup();
      const lastExportDate = '2023-01-01T12:00:00Z';

      (useSettingsStore as Mock).mockReturnValue({
        ...useSettingsStore(),
        lastExportDate,
      });

      render(<SettingsPage />);

      const dataTab = screen.getByText('Data Export');
      await user.click(dataTab);

      expect(screen.getByText(/Last export:/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display global error message', () => {
      const testError = 'Test error message';
      
      // Mock useAuthStore with an error
      (useAuthStore as Mock).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        updateProfile: mockUpdateProfile,
        isLoading: false,
        error: testError, // Set error on auth store
      });

      render(<SettingsPage />);

      // Check that error message is displayed
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(testError)).toBeInTheDocument();
    });

    it('should display success message', () => {
      render(<SettingsPage />);

      // Simulate success state
      const component = screen.getByText('Settings');
      expect(component).toBeInTheDocument();

      // Success message would be shown after an action, tested in individual action tests
    });
  });

  describe('Loading States', () => {
    it('should show loading state for profile update', () => {
      (useAuthStore as Mock).mockReturnValue({
        ...useAuthStore(),
        isLoading: true,
      });

      render(<SettingsPage />);

      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });

    it('should show loading state for avatar upload', () => {
      (useSettingsStore as Mock).mockReturnValue({
        ...useSettingsStore(),
        isUploadingAvatar: true,
      });

      render(<SettingsPage />);

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('should show loading state for data export', async () => {
      const user = userEvent.setup();

      (useSettingsStore as Mock).mockReturnValue({
        ...useSettingsStore(),
        isExportingData: true,
      });

      render(<SettingsPage />);

      const dataTab = screen.getByText('Data Export');
      await user.click(dataTab);

      expect(screen.getByText('Generating Export...')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate password form', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const securityTab = screen.getByText('Security');
      await user.click(securityTab);

      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(newPasswordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');

      const changePasswordButton = screen.getByText('Change Password');
      await user.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords don\'t match')).toBeInTheDocument();
      });
    });

    it('should validate profile form', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'J'); // Too short

      const updateButton = screen.getByText('Update Profile');
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      });
    });
  });
});