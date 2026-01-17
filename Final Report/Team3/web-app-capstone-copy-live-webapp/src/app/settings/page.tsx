'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PageErrorBoundary } from '@/components/error/page-error-boundary';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar } from '@/components/ui/avatar';
import {
  Loader2,
  CheckCircle,
  Upload,
  Download,
  Shield,
  Bell,
  User,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useAccessibility } from '@/components/accessibility/accessibility-provider';
import { useTranslation } from '@/components/language/translation-context';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['PRIMARY_CAREGIVER', 'FAMILY_CAREGIVER', 'PROFESSIONAL_CAREGIVER']),
  phoneNumber: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();

  const onChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const nextLocale = (e.target.value as 'en' | 'es') || 'en';
    setLocale(nextLocale);
  };

  return (
    <div className="max-w-sm">
      <Label htmlFor="language" className="block text-sm font-medium mb-2">
        {t('settings.language.cardTitle')}
      </Label>
      <select
        id="language"
        className="w-full border rounded-md p-2"
        value={locale}
        onChange={onChange}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
      {/* Helper text removed per requirements */}
    </div>
  );
}

function SettingsContent() {
  const { t } = useTranslation();

  const router = useRouter();
  const { user, isAuthenticated, updateProfile, isLoading, error } = useAuthStore();
  const {
    profilePicture,
    isUploadingAvatar,
    notificationPreferences,
    isUpdatingNotifications,
    privacySettings,
    isUpdatingPrivacy,
    securitySettings,
    isUpdatingSecurity,
    isExportingData,
    lastExportDate,
    uploadProfilePicture,
    removeProfilePicture,
    updateNotificationPreferences,
    updatePrivacySettings,
    updateSecuritySettings,
    changePassword: changeUserPassword,
    enableMFA,
    disableMFA,
    exportUserData,
    initializeSettings,
  } = useSettingsStore();

  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    announceMessage,
  } = useAccessibility();

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'accessibility' | 'notifications' | 'privacy' | 'security' | 'data'
  >('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty: profileIsDirty },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      role: user?.role || 'PRIMARY_CAREGIVER',
      phoneNumber: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: '',
      });
      initializeSettings();
    }
  }, [user, resetProfile, initializeSettings]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      await changeUserPassword(data.currentPassword, data.newPassword);
      resetPassword();
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Password change error:', err);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadProfilePicture(file);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } catch (err) {
        console.error('Avatar upload error:', err);
      }
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await removeProfilePicture();
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Avatar remove error:', err);
    }
  };

  const handleNotificationChange = async (
    key: keyof typeof notificationPreferences,
    value: boolean | number[],
  ) => {
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (err) {
      console.error('Notification update error:', err);
    }
  };

  const handlePrivacyChange = async (key: keyof typeof privacySettings, value: any) => {
    try {
      await updatePrivacySettings({ [key]: value });
    } catch (err) {
      console.error('Privacy update error:', err);
    }
  };

  const handleSecurityChange = async (key: keyof typeof securitySettings, value: any) => {
    try {
      await updateSecuritySettings({ [key]: value });
    } catch (err) {
      console.error('Security update error:', err);
    }
  };

  const handleMFAToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await enableMFA();
      } else {
        await disableMFA();
      }
    } catch (err) {
      console.error('MFA toggle error:', err);
    }
  };

  const handleDataExport = async () => {
    try {
      const exportUrl = await exportUserData();
      alert(`Data export ready: ${exportUrl}`);
    } catch (err) {
      console.error('Data export error:', err);
    }
  };

  if (!user) {
    return null; // AppLayout will handle redirect
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t('settings.title')}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Selector Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('settings.language.cardTitle')}</CardTitle>
          <CardDescription>
            {t('settings.language.cardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSelector />
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'profile',       labelKey: 'settings.tab.profile',       icon: User },
            { id: 'accessibility', labelKey: 'settings.tab.accessibility', icon: Eye },
            { id: 'notifications', labelKey: 'settings.tab.notifications', icon: Bell },
            { id: 'privacy',       labelKey: 'settings.tab.privacy',       icon: Eye },
            { id: 'security',      labelKey: 'settings.tab.security',      icon: Shield },
            { id: 'data',          labelKey: 'settings.tab.data',          icon: Download },
          ].map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Global Success Message */}
      {updateSuccess && (
        <div
          className="mb-6 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center"
          role="alert"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {t('settings.alerts.updateSuccess')}
        </div>
      )}

      {/* Global Error Message */}
      {error && (
        <div
          className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profilePicture.title')}</CardTitle>
                <CardDescription>
                  {t('settings.profilePicture.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('settings.profilePicture.uploading')}
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('settings.profilePicture.upload')}
                          </>
                        )}
                      </Button>
                      {profilePicture && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAvatarRemove}
                          disabled={isUploadingAvatar}
                        >
                          {t('settings.profilePicture.remove')}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {t('settings.profilePicture.hint')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profileInfo.title')}</CardTitle>
                <CardDescription>
                  {t('settings.profileInfo.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitProfile(onSubmitProfile)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        {t('settings.profileInfo.firstName')}
                      </Label>
                      <Input
                        id="firstName"
                        {...registerProfile('firstName')}
                        aria-invalid={profileErrors.firstName ? 'true' : 'false'}
                      />
                      {profileErrors.firstName && (
                        <p className="text-sm text-red-600" role="alert">
                          {profileErrors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {t('settings.profileInfo.lastName')}
                      </Label>
                      <Input
                        id="lastName"
                        {...registerProfile('lastName')}
                        aria-invalid={profileErrors.lastName ? 'true' : 'false'}
                      />
                      {profileErrors.lastName && (
                        <p className="text-sm text-red-600" role="alert">
                          {profileErrors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">
                      {t('settings.profileInfo.role')}
                    </Label>
                    <select
                      id="role"
                      {...registerProfile('role')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-invalid={profileErrors.role ? 'true' : 'false'}
                    >
                      <option value="PRIMARY_CAREGIVER">
                        {t('settings.profileInfo.role.primary')}
                      </option>
                      <option value="FAMILY_CAREGIVER">
                        {t('settings.profileInfo.role.family')}
                      </option>
                      <option value="PROFESSIONAL_CAREGIVER">
                        {t('settings.profileInfo.role.professional')}
                      </option>
                    </select>
                    {profileErrors.role && (
                      <p className="text-sm text-red-600" role="alert">
                        {profileErrors.role.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      {t('settings.profileInfo.phone')}
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...registerProfile('phoneNumber')}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('settings.profileInfo.email')}</Label>
                    <Input value={user.email} disabled className="bg-gray-50" />
                    <p className="text-sm text-gray-500">
                      {t('settings.profileInfo.emailNote')}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetProfile()}
                      disabled={!profileIsDirty || isLoading}
                    >
                      {t('settings.profileInfo.reset')}
                    </Button>
                    <Button type="submit" disabled={!profileIsDirty || isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('settings.profileInfo.updating')}
                        </>
                      ) : (
                        t('settings.profileInfo.update')
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.accountInfo.title')}</CardTitle>
                <CardDescription>
                  {t('settings.accountInfo.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t('settings.accountInfo.userId')}
                      </Label>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded border">
                        {user.id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t('settings.accountInfo.created')}
                      </Label>
                      <p className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.access.title')}</CardTitle>
                <CardDescription>
                  {t('settings.access.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">
                      {t('settings.access.fontSize')}
                    </Label>
                    <p className="text-sm text-gray-500 mb-3">
                      {t('settings.access.fontSize.desc')}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          value: 'normal',
                          label: t('settings.access.font.normal'),
                          description: t('settings.access.font.normalDesc'),
                        },
                        {
                          value: 'large',
                          label: t('settings.access.font.large'),
                          description: t('settings.access.font.largeDesc'),
                        },
                        {
                          value: 'extra-large',
                          label: t('settings.access.font.xlarge'),
                          description: t('settings.access.font.xlargeDesc'),
                        },
                      ].map(({ value, label, description }) => (
                        <button
                          key={value}
                          onClick={() => {
                            setFontSize(value as 'normal' | 'large' | 'extra-large');
                            announceMessage(`Font size changed to ${label}`);
                          }}
                          className={`p-4 border rounded-lg text-left transition-colors ${
                            fontSize === value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          aria-pressed={fontSize === value}
                          aria-describedby={`font-${value}-desc`}
                        >
                          <div className="font-medium">{label}</div>
                          <div
                            id={`font-${value}-desc`}
                            className="text-sm text-gray-500 mt-1"
                          >
                            {description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.access.contrast')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.access.contrastDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={highContrast}
                      onCheckedChange={(checked) => {
                        setHighContrast(checked);
                        announceMessage(
                          `High contrast mode ${checked ? 'enabled' : 'disabled'}`,
                        );
                      }}
                      aria-label="Toggle high contrast mode"
                    />
                  </div>

                  {/* Any additional accessibility descriptive content can be i18n'd similarly */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('settings.access.resourcesTitle')}</CardTitle>
                <CardDescription>
                  {t('settings.access.resourcesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">
                      {t('settings.access.resources.keyboardTitle')}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('settings.access.resources.keyboardDesc')}
                    </p>
                    <Button variant="outline" size="sm">
                      {t('settings.access.resources.keyboardCta')}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">
                      {t('settings.access.resources.screenReaderTitle')}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('settings.access.resources.screenReaderDesc')}
                    </p>
                    <Button variant="outline" size="sm">
                      {t('settings.access.resources.screenReaderCta')}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">
                      {t('settings.access.resources.feedbackTitle')}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('settings.access.resources.feedbackDesc')}
                    </p>
                    <Button variant="outline" size="sm">
                      {t('settings.access.resources.feedbackCta')}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">
                      {t('settings.access.resources.assistiveTitle')}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('settings.access.resources.assistiveDesc')}
                    </p>
                    <Button variant="outline" size="sm">
                      {t('settings.access.resources.assistiveCta')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
                <CardDescription>
                  {t('settings.notifications.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Medication reminders */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.notifications.medication.title')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.notifications.medication.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.medicationReminders}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('medicationReminders', checked)
                      }
                      disabled={isUpdatingNotifications}
                      aria-label={t('settings.notifications.medication.title')}
                    />
                  </div>

                  {/* Appointment reminders */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.notifications.appointment.title')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.notifications.appointment.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.appointmentReminders}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('appointmentReminders', checked)
                      }
                      disabled={isUpdatingNotifications}
                      aria-label={t('settings.notifications.appointment.title')}
                    />
                  </div>

                  {/* Urgent messages */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.notifications.urgent.title')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.notifications.urgent.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.urgentMessages}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('urgentMessages', checked)
                      }
                      disabled={isUpdatingNotifications}
                      aria-label={t('settings.notifications.urgent.title')}
                    />
                  </div>

                  {/* System alerts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.notifications.system.title')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.notifications.system.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.systemAlerts}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('systemAlerts', checked)
                      }
                      disabled={isUpdatingNotifications}
                      aria-label={t('settings.notifications.system.title')}
                    />
                  </div>
                </div>

                <hr />

                <div className="space-y-4">
                  <h4 className="text-lg font-medium">
                    {t('settings.notifications.delivery.title')}
                  </h4>

                  {/* Email notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.notifications.email.title')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.notifications.email.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', checked)
                      }
                      disabled={isUpdatingNotifications}
                      aria-label={t('settings.notifications.email.title')}
                    />
                  </div>

                  {/* SMS notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.notifications.sms.title')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.notifications.sms.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.smsNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('smsNotifications', checked)
                      }
                      disabled={isUpdatingNotifications}
                      aria-label={t('settings.notifications.sms.title')}
                    />
                  </div>

                  {/* Push notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.notifications.push.title')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.notifications.push.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.pushNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('pushNotifications', checked)
                      }
                      disabled={isUpdatingNotifications}
                      aria-label={t('settings.notifications.push.title')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.privacy.title')}</CardTitle>
                <CardDescription>
                  {t('settings.privacy.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">
                      {t('settings.privacy.profileVisibility.label')}
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      {t('settings.privacy.profileVisibility.desc')}
                    </p>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) =>
                        handlePrivacyChange('profileVisibility', e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={isUpdatingPrivacy}
                    >
                      <option value="all_caregivers">
                        {t('settings.privacy.profileVisibility.all')}
                      </option>
                      <option value="primary_only">
                        {t('settings.privacy.profileVisibility.primary')}
                      </option>
                      <option value="custom">
                        {t('settings.privacy.profileVisibility.custom')}
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.privacy.shareContact.label')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.privacy.shareContact.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.shareContactInfo}
                      onCheckedChange={(checked) =>
                        handlePrivacyChange('shareContactInfo', checked)
                      }
                      disabled={isUpdatingPrivacy}
                      aria-label={t('settings.privacy.shareContact.label')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.privacy.invitations.label')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.privacy.invitations.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.allowInvitations}
                      onCheckedChange={(checked) =>
                        handlePrivacyChange('allowInvitations', checked)
                      }
                      disabled={isUpdatingPrivacy}
                      aria-label={t('settings.privacy.invitations.label')}
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      {t('settings.privacy.dataRetention.label')}
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      {t('settings.privacy.dataRetention.desc')}
                    </p>
                    <Input
                      type="number"
                      value={privacySettings.dataRetention}
                      onChange={(e) =>
                        handlePrivacyChange(
                          'dataRetention',
                          parseInt(e.target.value, 10),
                        )
                      }
                      min="30"
                      max="3650"
                      disabled={isUpdatingPrivacy}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {t('settings.privacy.analytics.label')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('settings.privacy.analytics.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.analyticsOptOut}
                      onCheckedChange={(checked) =>
                        handlePrivacyChange('analyticsOptOut', checked)
                      }
                      disabled={isUpdatingPrivacy}
                      aria-label={t('settings.privacy.analytics.label')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.security.title')}</CardTitle>
                <CardDescription>
                  {t('settings.security.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitPassword(onSubmitPassword)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      {t('settings.security.current')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...registerPassword('currentPassword')}
                        aria-invalid={
                          passwordErrors.currentPassword ? 'true' : 'false'
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-red-600" role="alert">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {t('settings.security.new')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        {...registerPassword('newPassword')}
                        aria-invalid={
                          passwordErrors.newPassword ? 'true' : 'false'
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-red-600" role="alert">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t('settings.security.confirm')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerPassword('confirmPassword')}
                        aria-invalid={
                          passwordErrors.confirmPassword ? 'true' : 'false'
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-red-600" role="alert">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdatingSecurity}>
                      {isUpdatingSecurity ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('settings.security.changing')}
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          {t('settings.security.change')}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('settings.security.extra.title')}</CardTitle>
                <CardDescription>
                  {t('settings.security.extra.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      {t('settings.security.mfa.label')}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {t('settings.security.mfa.desc')}
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.mfaEnabled}
                    onCheckedChange={handleMFAToggle}
                    disabled={isUpdatingSecurity}
                    aria-label={t('settings.security.mfa.label')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      {t('settings.security.login.label')}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {t('settings.security.login.desc')}
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) =>
                      handleSecurityChange('loginNotifications', checked)
                    }
                    disabled={isUpdatingSecurity}
                    aria-label={t('settings.security.login.label')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      {t('settings.security.deviceTrust.label')}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {t('settings.security.deviceTrust.desc')}
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.deviceTrust}
                    onCheckedChange={(checked) =>
                      handleSecurityChange('deviceTrust', checked)
                    }
                    disabled={isUpdatingSecurity}
                    aria-label={t('settings.security.deviceTrust.label')}
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">
                    {t('settings.security.sessionTimeout.label')}
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    {t('settings.security.sessionTimeout.desc')}
                  </p>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      handleSecurityChange(
                        'sessionTimeout',
                        parseInt(e.target.value, 10),
                      )
                    }
                    min="15"
                    max="1440"
                    disabled={isUpdatingSecurity}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Data Export Tab */}
        {activeTab === 'data' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.data.title')}</CardTitle>
                <CardDescription>
                  {t('settings.data.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    {t('settings.data.includes.title')}
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t('settings.data.includes.profile')}</li>
                    <li>• {t('settings.data.includes.clients')}</li>
                    <li>• {t('settings.data.includes.medications')}</li>
                    <li>• {t('settings.data.includes.appointments')}</li>
                    <li>• {t('settings.data.includes.messages')}</li>
                    <li>• {t('settings.data.includes.notifications')}</li>
                  </ul>
                </div>

                {lastExportDate && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <p className="text-sm text-gray-600">
                      {t('settings.data.lastExport.label')}{' '}
                      {new Date(lastExportDate).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-medium">
                      {t('settings.data.generate')}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {t('settings.data.generate.desc')}
                    </p>
                  </div>
                  <Button onClick={handleDataExport} disabled={isExportingData}>
                    {isExportingData ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('settings.data.generating')}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {t('settings.data.export')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">
                    {t('settings.data.notes.title')}
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• {t('settings.data.notes.mayTakeTime')}</li>
                    <li>• {t('settings.data.notes.encrypted')}</li>
                    <li>• {t('settings.data.notes.expire')}</li>
                    <li>• {t('settings.data.notes.permissions')}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <PageErrorBoundary pageName="Settings">
      <SettingsContent />
    </PageErrorBoundary>
  );
}
