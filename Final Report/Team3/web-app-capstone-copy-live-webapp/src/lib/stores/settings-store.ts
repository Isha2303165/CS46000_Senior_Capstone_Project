import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uploadData, downloadData, remove, getUrl } from 'aws-amplify/storage';
import { updatePassword, updateUserAttributes, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export interface NotificationPreferences {
  medicationReminders: boolean;
  appointmentReminders: boolean;
  urgentMessages: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  reminderTiming: {
    medication: number[]; // hours before
    appointment: number[]; // hours before
  };
}

export interface PrivacySettings {
  profileVisibility: 'all_caregivers' | 'primary_only' | 'custom';
  shareContactInfo: boolean;
  allowInvitations: boolean;
  dataRetention: number; // days
  analyticsOptOut: boolean;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  sessionTimeout: number; // minutes
  loginNotifications: boolean;
  deviceTrust: boolean;
}

interface SettingsState {
  // Profile
  profilePicture: string | null;
  profilePictureKey: string | null; // Storage key for the profile picture
  isUploadingAvatar: boolean;
  
  // Notifications
  notificationPreferences: NotificationPreferences;
  isUpdatingNotifications: boolean;
  
  // Privacy
  privacySettings: PrivacySettings;
  isUpdatingPrivacy: boolean;
  
  // Security
  securitySettings: SecuritySettings;
  isUpdatingSecurity: boolean;
  
  // Data Export
  isExportingData: boolean;
  lastExportDate: string | null;
  
  // General
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Profile actions
  uploadProfilePicture: (file: File) => Promise<string>;
  removeProfilePicture: () => Promise<void>;
  refreshProfilePictureUrl: () => Promise<void>;
  
  // Notification actions
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  subscribeToNotifications: (type: string) => Promise<void>;
  unsubscribeFromNotifications: (type: string) => Promise<void>;
  
  // Privacy actions
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  
  // Security actions
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  enableMFA: () => Promise<void>;
  disableMFA: () => Promise<void>;
  
  // Data export actions
  exportUserData: () => Promise<string>;
  
  // Initialize
  initializeSettings: () => Promise<void>;
}

const defaultNotificationPreferences: NotificationPreferences = {
  medicationReminders: true,
  appointmentReminders: true,
  urgentMessages: true,
  systemAlerts: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  reminderTiming: {
    medication: [1, 0.25], // 1 hour and 15 minutes before
    appointment: [24, 2], // 24 hours and 2 hours before
  },
};

const defaultPrivacySettings: PrivacySettings = {
  profileVisibility: 'all_caregivers',
  shareContactInfo: true,
  allowInvitations: true,
  dataRetention: 365, // 1 year
  analyticsOptOut: false,
};

const defaultSecuritySettings: SecuritySettings = {
  mfaEnabled: false,
  sessionTimeout: 480, // 8 hours
  loginNotifications: true,
  deviceTrust: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      profilePicture: null,
      profilePictureKey: null,
      isUploadingAvatar: false,
      notificationPreferences: defaultNotificationPreferences,
      isUpdatingNotifications: false,
      privacySettings: defaultPrivacySettings,
      isUpdatingPrivacy: false,
      securitySettings: defaultSecuritySettings,
      isUpdatingSecurity: false,
      isExportingData: false,
      lastExportDate: null,
      isLoading: false,
      error: null,

      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),

      // Profile picture management
      uploadProfilePicture: async (file: File) => {
        try {
          set({ isUploadingAvatar: true, error: null });
          
          // Validate file
          if (!file.type.startsWith('image/')) {
            throw new Error('Please select a valid image file');
          }
          
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error('Image size must be less than 5MB');
          }
          
          // Generate unique filename
          const timestamp = Date.now();
          const extension = file.name.split('.').pop();
          const filename = `profile-pictures/${timestamp}.${extension}`;
          
          // Upload to S3
          const result = await uploadData({
            key: filename,
            data: file,
            options: {
              contentType: file.type,
              accessLevel: 'private',
            },
          }).result;
          
          // Get the actual URL from Amplify Storage
          const urlResult = await getUrl({
            key: result.key,
            options: {
              accessLevel: 'private',
              expiresIn: 604800 // 7 days in seconds
            }
          });
          
          const profilePictureUrl = urlResult.url.toString();
          
          // Store the key in Cognito user attributes (not the URL)
          await updateUserAttributes({
            userAttributes: {
              picture: result.key, // Store the key, not the URL
            },
          });
          
          set({ 
            profilePicture: profilePictureUrl,
            profilePictureKey: result.key,
            isUploadingAvatar: false 
          });
          
          return profilePictureUrl;
        } catch (error) {
          console.error('Upload profile picture error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to upload profile picture',
            isUploadingAvatar: false 
          });
          throw error;
        }
      },

      removeProfilePicture: async () => {
        try {
          set({ isUploadingAvatar: true, error: null });
          
          const currentPictureKey = get().profilePictureKey;
          if (currentPictureKey) {
            // Remove from S3 using the stored key
            await remove({ key: currentPictureKey });
          }
          
          // Update Cognito user attributes
          await updateUserAttributes({
            userAttributes: {
              picture: '',
            },
          });
          
          set({ 
            profilePicture: null,
            profilePictureKey: null,
            isUploadingAvatar: false 
          });
        } catch (error) {
          console.error('Remove profile picture error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove profile picture',
            isUploadingAvatar: false 
          });
          throw error;
        }
      },

      refreshProfilePictureUrl: async () => {
        try {
          const pictureKey = get().profilePictureKey;
          if (pictureKey) {
            const urlResult = await getUrl({
              key: pictureKey,
              options: {
                accessLevel: 'private',
                expiresIn: 604800 // 7 days
              }
            });
            set({ profilePicture: urlResult.url.toString() });
          }
        } catch (error) {
          console.error('Failed to refresh profile picture URL:', error);
        }
      },

      // Notification preferences
      updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>) => {
        try {
          set({ isUpdatingNotifications: true, error: null });
          
          const currentPrefs = get().notificationPreferences;
          const updatedPrefs = { ...currentPrefs, ...preferences };
          
          // Update Cognito user attributes
          await updateUserAttributes({
            userAttributes: {
              'custom:notif_prefs': JSON.stringify(updatedPrefs),
            },
          });
          
          set({ 
            notificationPreferences: updatedPrefs,
            isUpdatingNotifications: false 
          });
        } catch (error) {
          console.error('Update notification preferences error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update notification preferences',
            isUpdatingNotifications: false 
          });
          throw error;
        }
      },

      subscribeToNotifications: async (type: string) => {
        try {
          // This would integrate with SNS topics for real notifications
          // Mock implementation - in production, this would integrate with SNS
          // Implementation would depend on specific SNS setup
        } catch (error) {
          console.error('Subscribe to notifications error:', error);
          throw error;
        }
      },

      unsubscribeFromNotifications: async (type: string) => {
        try {
          // This would integrate with SNS topics for real notifications
          // Mock implementation - in production, this would integrate with SNS
          // Implementation would depend on specific SNS setup
        } catch (error) {
          console.error('Unsubscribe from notifications error:', error);
          throw error;
        }
      },

      // Privacy settings
      updatePrivacySettings: async (settings: Partial<PrivacySettings>) => {
        try {
          set({ isUpdatingPrivacy: true, error: null });
          
          const currentSettings = get().privacySettings;
          const updatedSettings = { ...currentSettings, ...settings };
          
          // Update Cognito user attributes
          await updateUserAttributes({
            userAttributes: {
              'custom:privacy_settings': JSON.stringify(updatedSettings),
            },
          });
          
          set({ 
            privacySettings: updatedSettings,
            isUpdatingPrivacy: false 
          });
        } catch (error) {
          console.error('Update privacy settings error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update privacy settings',
            isUpdatingPrivacy: false 
          });
          throw error;
        }
      },

      // Security settings
      updateSecuritySettings: async (settings: Partial<SecuritySettings>) => {
        try {
          set({ isUpdatingSecurity: true, error: null });
          
          const currentSettings = get().securitySettings;
          const updatedSettings = { ...currentSettings, ...settings };
          
          // Update Cognito user attributes
          await updateUserAttributes({
            userAttributes: {
              'custom:security_settings': JSON.stringify(updatedSettings),
            },
          });
          
          set({ 
            securitySettings: updatedSettings,
            isUpdatingSecurity: false 
          });
        } catch (error) {
          console.error('Update security settings error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update security settings',
            isUpdatingSecurity: false 
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isUpdatingSecurity: true, error: null });
          
          await changePassword({
            oldPassword: currentPassword,
            newPassword: newPassword,
          });
          
          set({ isUpdatingSecurity: false });
        } catch (error) {
          console.error('Change password error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to change password',
            isUpdatingSecurity: false 
          });
          throw error;
        }
      },

      enableMFA: async () => {
        try {
          set({ isUpdatingSecurity: true, error: null });
          
          // This would integrate with Cognito MFA setup
          // Mock implementation - in production, this would enable actual MFA
          // Implementation would depend on specific MFA setup
          
          const currentSettings = get().securitySettings;
          const updatedSettings = { ...currentSettings, mfaEnabled: true };
          
          await updateUserAttributes({
            userAttributes: {
              'custom:security_settings': JSON.stringify(updatedSettings),
            },
          });
          
          set({ 
            securitySettings: updatedSettings,
            isUpdatingSecurity: false 
          });
        } catch (error) {
          console.error('Enable MFA error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to enable MFA',
            isUpdatingSecurity: false 
          });
          throw error;
        }
      },

      disableMFA: async () => {
        try {
          set({ isUpdatingSecurity: true, error: null });
          
          // This would integrate with Cognito MFA setup
          // Mock implementation - in production, this would disable actual MFA
          // Implementation would depend on specific MFA setup
          
          const currentSettings = get().securitySettings;
          const updatedSettings = { ...currentSettings, mfaEnabled: false };
          
          await updateUserAttributes({
            userAttributes: {
              'custom:security_settings': JSON.stringify(updatedSettings),
            },
          });
          
          set({ 
            securitySettings: updatedSettings,
            isUpdatingSecurity: false 
          });
        } catch (error) {
          console.error('Disable MFA error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to disable MFA',
            isUpdatingSecurity: false 
          });
          throw error;
        }
      },

      // Data export
      exportUserData: async () => {
        try {
          set({ isExportingData: true, error: null });
          
          // This would trigger a Lambda function to generate the export
          // Mock implementation - in production, this would export actual user data
          
          // Simulate export process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const exportUrl = `https://exports.example.com/user-data-${Date.now()}.json`;
          
          set({ 
            isExportingData: false,
            lastExportDate: new Date().toISOString()
          });
          
          return exportUrl;
        } catch (error) {
          console.error('Export user data error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export user data',
            isExportingData: false 
          });
          throw error;
        }
      },

      // Initialize settings from Cognito attributes
      initializeSettings: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const attributes = await fetchUserAttributes();
          
          // Load profile picture
          if (attributes.picture) {
            try {
              // If it's a storage key (not a URL), generate a fresh URL
              if (!attributes.picture.startsWith('http')) {
                const urlResult = await getUrl({
                  key: attributes.picture,
                  options: {
                    accessLevel: 'private',
                    expiresIn: 604800 // 7 days
                  }
                });
                set({ 
                  profilePicture: urlResult.url.toString(),
                  profilePictureKey: attributes.picture 
                });
              } else {
                // Legacy: if it's already a URL, use it as is
                set({ profilePicture: attributes.picture });
              }
            } catch (error) {
              console.warn('Failed to load profile picture:', error);
            }
          }
          
          // Load notification preferences
          if (attributes['custom:notif_prefs']) {
            try {
              const notificationPreferences = JSON.parse(attributes['custom:notif_prefs']);
              set({ notificationPreferences });
            } catch (e) {
              console.warn('Failed to parse notification preferences');
            }
          }
          
          // Load privacy settings
          if (attributes['custom:privacy_settings']) {
            try {
              const privacySettings = JSON.parse(attributes['custom:privacy_settings']);
              set({ privacySettings });
            } catch (e) {
              console.warn('Failed to parse privacy settings');
            }
          }
          
          // Load security settings
          if (attributes['custom:security_settings']) {
            try {
              const securitySettings = JSON.parse(attributes['custom:security_settings']);
              set({ securitySettings });
            } catch (e) {
              console.warn('Failed to parse security settings');
            }
          }
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Initialize settings error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load settings',
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'healthcare-settings-storage',
      partialize: (state) => ({
        notificationPreferences: state.notificationPreferences,
        privacySettings: state.privacySettings,
        securitySettings: state.securitySettings,
        lastExportDate: state.lastExportDate,
      }),
    }
  )
);