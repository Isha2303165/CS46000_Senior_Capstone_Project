import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { useSettingsStore } from '../settings-store';
import { uploadData, downloadData, remove } from 'aws-amplify/storage';
import { changePassword, updateUserAttributes, fetchUserAttributes } from 'aws-amplify/auth';

// Mock AWS Amplify modules
vi.mock('aws-amplify/storage', () => ({
  uploadData: vi.fn(),
  downloadData: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('aws-amplify/auth', () => ({
  changePassword: vi.fn(),
  updateUserAttributes: vi.fn(),
  fetchUserAttributes: vi.fn(),
}));

vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn(() => ({})),
}));

describe('SettingsStore', () => {
  beforeEach(() => {
    // Reset the store state
    useSettingsStore.setState({
      profilePicture: null,
      isUploadingAvatar: false,
      notificationPreferences: {
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
      },
      isUpdatingNotifications: false,
      privacySettings: {
        profileVisibility: 'all_caregivers',
        shareContactInfo: true,
        allowInvitations: true,
        dataRetention: 365,
        analyticsOptOut: false,
      },
      isUpdatingPrivacy: false,
      securitySettings: {
        mfaEnabled: false,
        sessionTimeout: 480,
        loginNotifications: true,
        deviceTrust: false,
      },
      isUpdatingSecurity: false,
      isExportingData: false,
      lastExportDate: null,
      isLoading: false,
      error: null,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Profile Picture Management', () => {
    it('should upload profile picture successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResult = { key: 'profile-pictures/123456.jpg' };
      
      (uploadData as Mock).mockReturnValue({
        result: Promise.resolve(mockResult),
      });
      (updateUserAttributes as Mock).mockResolvedValue({});

      const { uploadProfilePicture } = useSettingsStore.getState();
      
      const result = await uploadProfilePicture(mockFile);
      
      expect(uploadData).toHaveBeenCalledWith({
        key: expect.stringContaining('profile-pictures/'),
        data: mockFile,
        options: {
          contentType: 'image/jpeg',
          accessLevel: 'private',
        },
      });
      
      expect(updateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          picture: expect.stringContaining('https://amplify-storage-url/'),
        },
      });
      
      expect(result).toContain('https://amplify-storage-url/');
      expect(useSettingsStore.getState().profilePicture).toContain('https://amplify-storage-url/');
      expect(useSettingsStore.getState().isUploadingAvatar).toBe(false);
    });

    it('should reject invalid file types', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const { uploadProfilePicture } = useSettingsStore.getState();
      
      await expect(uploadProfilePicture(mockFile)).rejects.toThrow('Please select a valid image file');
      expect(useSettingsStore.getState().error).toBe('Please select a valid image file');
    });

    it('should reject files that are too large', async () => {
      const mockFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      
      const { uploadProfilePicture } = useSettingsStore.getState();
      
      await expect(uploadProfilePicture(mockFile)).rejects.toThrow('Image size must be less than 5MB');
      expect(useSettingsStore.getState().error).toBe('Image size must be less than 5MB');
    });

    it('should remove profile picture successfully', async () => {
      // Set initial state with profile picture
      useSettingsStore.setState({
        profilePicture: 'https://amplify-storage-url/profile-pictures/123456.jpg',
      });

      (remove as Mock).mockResolvedValue({});
      (updateUserAttributes as Mock).mockResolvedValue({});

      const { removeProfilePicture } = useSettingsStore.getState();
      
      await removeProfilePicture();
      
      expect(remove).toHaveBeenCalledWith({
        key: 'profile-pictures/123456.jpg',
      });
      
      expect(updateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          picture: '',
        },
      });
      
      expect(useSettingsStore.getState().profilePicture).toBe(null);
      expect(useSettingsStore.getState().isUploadingAvatar).toBe(false);
    });
  });

  describe('Notification Preferences', () => {
    it('should update notification preferences successfully', async () => {
      (updateUserAttributes as Mock).mockResolvedValue({});

      const { updateNotificationPreferences } = useSettingsStore.getState();
      
      await updateNotificationPreferences({
        medicationReminders: false,
        emailNotifications: false,
      });
      
      expect(updateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          'custom:notif_prefs': JSON.stringify({
            medicationReminders: false,
            appointmentReminders: true,
            urgentMessages: true,
            systemAlerts: true,
            emailNotifications: false,
            smsNotifications: false,
            pushNotifications: true,
            reminderTiming: {
              medication: [1, 0.25],
              appointment: [24, 2],
            },
          }),
        },
      });
      
      const state = useSettingsStore.getState();
      expect(state.notificationPreferences.medicationReminders).toBe(false);
      expect(state.notificationPreferences.emailNotifications).toBe(false);
      expect(state.isUpdatingNotifications).toBe(false);
    });

    it('should handle notification update errors', async () => {
      const error = new Error('Update failed');
      (updateUserAttributes as Mock).mockRejectedValue(error);

      const { updateNotificationPreferences } = useSettingsStore.getState();
      
      await expect(updateNotificationPreferences({ medicationReminders: false }))
        .rejects.toThrow('Update failed');
      
      expect(useSettingsStore.getState().error).toBe('Update failed');
      expect(useSettingsStore.getState().isUpdatingNotifications).toBe(false);
    });
  });

  describe('Privacy Settings', () => {
    it('should update privacy settings successfully', async () => {
      (updateUserAttributes as Mock).mockResolvedValue({});

      const { updatePrivacySettings } = useSettingsStore.getState();
      
      await updatePrivacySettings({
        profileVisibility: 'primary_only',
        shareContactInfo: false,
      });
      
      expect(updateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          'custom:privacy_settings': JSON.stringify({
            profileVisibility: 'primary_only',
            shareContactInfo: false,
            allowInvitations: true,
            dataRetention: 365,
            analyticsOptOut: false,
          }),
        },
      });
      
      const state = useSettingsStore.getState();
      expect(state.privacySettings.profileVisibility).toBe('primary_only');
      expect(state.privacySettings.shareContactInfo).toBe(false);
      expect(state.isUpdatingPrivacy).toBe(false);
    });

    it('should handle privacy update errors', async () => {
      const error = new Error('Privacy update failed');
      (updateUserAttributes as Mock).mockRejectedValue(error);

      const { updatePrivacySettings } = useSettingsStore.getState();
      
      await expect(updatePrivacySettings({ profileVisibility: 'primary_only' }))
        .rejects.toThrow('Privacy update failed');
      
      expect(useSettingsStore.getState().error).toBe('Privacy update failed');
      expect(useSettingsStore.getState().isUpdatingPrivacy).toBe(false);
    });
  });

  describe('Security Settings', () => {
    it('should update security settings successfully', async () => {
      (updateUserAttributes as Mock).mockResolvedValue({});

      const { updateSecuritySettings } = useSettingsStore.getState();
      
      await updateSecuritySettings({
        sessionTimeout: 240,
        loginNotifications: false,
      });
      
      expect(updateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          'custom:security_settings': JSON.stringify({
            mfaEnabled: false,
            sessionTimeout: 240,
            loginNotifications: false,
            deviceTrust: false,
          }),
        },
      });
      
      const state = useSettingsStore.getState();
      expect(state.securitySettings.sessionTimeout).toBe(240);
      expect(state.securitySettings.loginNotifications).toBe(false);
      expect(state.isUpdatingSecurity).toBe(false);
    });

    it('should change password successfully', async () => {
      (changePassword as Mock).mockResolvedValue({});

      const { changePassword: changeUserPassword } = useSettingsStore.getState();
      
      await changeUserPassword('oldPassword', 'newPassword');
      
      expect(changePassword).toHaveBeenCalledWith({
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      });
      
      expect(useSettingsStore.getState().isUpdatingSecurity).toBe(false);
    });

    it('should handle password change errors', async () => {
      const error = new Error('Password change failed');
      (changePassword as Mock).mockRejectedValue(error);

      const { changePassword: changeUserPassword } = useSettingsStore.getState();
      
      await expect(changeUserPassword('oldPassword', 'newPassword'))
        .rejects.toThrow('Password change failed');
      
      expect(useSettingsStore.getState().error).toBe('Password change failed');
      expect(useSettingsStore.getState().isUpdatingSecurity).toBe(false);
    });

    it('should enable MFA successfully', async () => {
      (updateUserAttributes as Mock).mockResolvedValue({});

      const { enableMFA } = useSettingsStore.getState();
      
      await enableMFA();
      
      expect(updateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          'custom:security_settings': JSON.stringify({
            mfaEnabled: true,
            sessionTimeout: 480,
            loginNotifications: true,
            deviceTrust: false,
          }),
        },
      });
      
      expect(useSettingsStore.getState().securitySettings.mfaEnabled).toBe(true);
      expect(useSettingsStore.getState().isUpdatingSecurity).toBe(false);
    });

    it('should disable MFA successfully', async () => {
      // Set initial state with MFA enabled
      useSettingsStore.setState({
        securitySettings: {
          mfaEnabled: true,
          sessionTimeout: 480,
          loginNotifications: true,
          deviceTrust: false,
        },
      });

      (updateUserAttributes as Mock).mockResolvedValue({});

      const { disableMFA } = useSettingsStore.getState();
      
      await disableMFA();
      
      expect(updateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          'custom:security_settings': JSON.stringify({
            mfaEnabled: false,
            sessionTimeout: 480,
            loginNotifications: true,
            deviceTrust: false,
          }),
        },
      });
      
      expect(useSettingsStore.getState().securitySettings.mfaEnabled).toBe(false);
      expect(useSettingsStore.getState().isUpdatingSecurity).toBe(false);
    });
  });

  describe('Data Export', () => {
    it('should export user data successfully', async () => {
      const { exportUserData } = useSettingsStore.getState();
      
      const result = await exportUserData();
      
      expect(result).toContain('https://exports.example.com/user-data-');
      expect(useSettingsStore.getState().lastExportDate).toBeTruthy();
      expect(useSettingsStore.getState().isExportingData).toBe(false);
    });

    it('should handle export errors', async () => {
      // Mock console.log to avoid test output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Force an error by mocking setTimeout to throw
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn(() => {
        throw new Error('Export failed');
      }) as any;

      const { exportUserData } = useSettingsStore.getState();
      
      await expect(exportUserData()).rejects.toThrow('Export failed');
      
      expect(useSettingsStore.getState().error).toBe('Export failed');
      expect(useSettingsStore.getState().isExportingData).toBe(false);
      
      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
      consoleSpy.mockRestore();
    });
  });

  describe('Settings Initialization', () => {
    it('should initialize settings from Cognito attributes', async () => {
      const mockAttributes = {
        picture: 'https://example.com/profile.jpg',
        'custom:notif_prefs': JSON.stringify({
          medicationReminders: false,
          emailNotifications: false,
        }),
        'custom:privacy_settings': JSON.stringify({
          profileVisibility: 'primary_only',
          shareContactInfo: false,
        }),
        'custom:security_settings': JSON.stringify({
          mfaEnabled: true,
          sessionTimeout: 240,
        }),
      };

      (fetchUserAttributes as Mock).mockResolvedValue(mockAttributes);

      const { initializeSettings } = useSettingsStore.getState();
      
      await initializeSettings();
      
      const state = useSettingsStore.getState();
      expect(state.profilePicture).toBe('https://example.com/profile.jpg');
      expect(state.notificationPreferences.medicationReminders).toBe(false);
      expect(state.notificationPreferences.emailNotifications).toBe(false);
      expect(state.privacySettings.profileVisibility).toBe('primary_only');
      expect(state.privacySettings.shareContactInfo).toBe(false);
      expect(state.securitySettings.mfaEnabled).toBe(true);
      expect(state.securitySettings.sessionTimeout).toBe(240);
      expect(state.isLoading).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Failed to fetch attributes');
      (fetchUserAttributes as Mock).mockRejectedValue(error);

      const { initializeSettings } = useSettingsStore.getState();
      
      await initializeSettings();
      
      expect(useSettingsStore.getState().error).toBe('Failed to fetch attributes');
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('should handle malformed JSON in custom attributes', async () => {
      const mockAttributes = {
        'custom:notif_prefs': 'invalid json',
        'custom:privacy_settings': '{"valid": true}',
      };

      (fetchUserAttributes as Mock).mockResolvedValue(mockAttributes);
      
      // Mock console.warn to avoid test output
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { initializeSettings } = useSettingsStore.getState();
      
      await initializeSettings();
      
      const state = useSettingsStore.getState();
      // Should keep default notification preferences due to invalid JSON
      expect(state.notificationPreferences.medicationReminders).toBe(true);
      // Should parse valid privacy settings
      expect(state.privacySettings).toEqual(expect.objectContaining({ valid: true }));
      expect(state.isLoading).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors correctly', () => {
      const { setError } = useSettingsStore.getState();
      
      setError('Test error');
      expect(useSettingsStore.getState().error).toBe('Test error');
      
      setError(null);
      expect(useSettingsStore.getState().error).toBe(null);
    });

    it('should set and clear loading state correctly', () => {
      const { setLoading } = useSettingsStore.getState();
      
      setLoading(true);
      expect(useSettingsStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });
  });
});