'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { useInvitations, type SendInvitationData } from '../../hooks/use-invitations';
import type { CaregiverRole, Client } from '../../types';
import { 
  Mail, 
  User, 
  Shield, 
  Eye, 
  Edit3, 
  Calendar,
  Pill,
  MessageSquare,
  UserPlus,
  AlertCircle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface InvitationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onInvitationSent?: () => void;
}

interface PermissionOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  roleRequired?: CaregiverRole;
}

const roleOptions: { value: CaregiverRole; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'primary', 
    label: 'Primary Caregiver',
    description: 'Full access to manage all aspects of client care',
    icon: <Shield className="w-4 h-4" />
  },
  { 
    value: 'secondary', 
    label: 'Secondary Caregiver',
    description: 'Can view and update client information with some restrictions',
    icon: <User className="w-4 h-4" />
  },
  { 
    value: 'emergency', 
    label: 'Emergency Contact',
    description: 'Limited access, primarily for emergency situations',
    icon: <AlertCircle className="w-4 h-4" />
  },
];

const permissionOptions: PermissionOption[] = [
  { 
    value: 'view', 
    label: 'View Information',
    description: 'View client details, medications, and appointments',
    icon: <Eye className="w-4 h-4" />
  },
  { 
    value: 'edit', 
    label: 'Edit Information',
    description: 'Update client profile and medical information',
    icon: <Edit3 className="w-4 h-4" />,
    roleRequired: 'secondary'
  },
  { 
    value: 'medications', 
    label: 'Manage Medications',
    description: 'Add, edit, and log medication administration',
    icon: <Pill className="w-4 h-4" />,
    roleRequired: 'secondary'
  },
  { 
    value: 'appointments', 
    label: 'Manage Appointments',
    description: 'Schedule, modify, and cancel appointments',
    icon: <Calendar className="w-4 h-4" />,
    roleRequired: 'secondary'
  },
  { 
    value: 'messages', 
    label: 'Send Messages',
    description: 'Communicate with other caregivers and providers',
    icon: <MessageSquare className="w-4 h-4" />
  },
  { 
    value: 'invite', 
    label: 'Invite Caregivers',
    description: 'Invite additional caregivers to the care team',
    icon: <UserPlus className="w-4 h-4" />,
    roleRequired: 'primary'
  },
  {
    value: 'admin',
    label: 'Administrative Access',
    description: 'Full administrative control including removing caregivers',
    icon: <Shield className="w-4 h-4" />,
    roleRequired: 'primary'
  }
];

export function InvitationDialog({ 
  isOpen, 
  onClose, 
  client, 
  onInvitationSent 
}: InvitationDialogProps) {
  const { sendInvitation, loading, error } = useInvitations();
  
  const [formData, setFormData] = useState({
    invitedEmail: '',
    role: 'secondary' as CaregiverRole,
    personalMessage: '',
    permissions: ['view'] as string[],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleRoleChange = (role: CaregiverRole) => {
    setFormData(prev => {
      // Auto-select permissions based on role
      let defaultPermissions = ['view'];
      
      if (role === 'primary') {
        defaultPermissions = ['view', 'edit', 'medications', 'appointments', 'messages', 'invite', 'admin'];
      } else if (role === 'secondary') {
        defaultPermissions = ['view', 'edit', 'medications', 'appointments', 'messages'];
      } else if (role === 'emergency') {
        defaultPermissions = ['view', 'messages'];
      }
      
      return {
        ...prev,
        role,
        permissions: defaultPermissions
      };
    });
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.invitedEmail.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.invitedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.permissions.length === 0) {
      errors.permissions = 'At least one permission must be selected';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const invitationData: SendInvitationData = {
        clientId: client.id,
        invitedEmail: formData.invitedEmail.trim(),
        role: formData.role,
        permissions: formData.permissions,
        personalMessage: formData.personalMessage.trim() || undefined,
      };

      const result = await sendInvitation(invitationData);

      if (result) {
        // Reset form
        setFormData({
          invitedEmail: '',
          role: 'secondary',
          personalMessage: '',
          permissions: ['view'],
        });
        setValidationErrors({});
        
        onInvitationSent?.();
        onClose();
      }
    } catch (err) {
      console.error('Failed to send invitation:', err);
    }
  };

  const handleClose = () => {
    setFormData({
      invitedEmail: '',
      role: 'secondary',
      personalMessage: '',
      permissions: ['view'],
    });
    setValidationErrors({});
    onClose();
  };

  // Filter permissions based on selected role
  const availablePermissions = permissionOptions.filter(permission => {
    if (!permission.roleRequired) return true;
    
    if (formData.role === 'primary') return true;
    if (formData.role === 'secondary' && permission.roleRequired !== 'primary') return true;
    if (formData.role === 'emergency' && !permission.roleRequired) return true;
    
    return false;
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Caregiver</DialogTitle>
          <DialogDescription>
            Invite someone to help care for {client.firstName} {client.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="caregiver@example.com"
              value={formData.invitedEmail}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, invitedEmail: e.target.value }));
                if (validationErrors.email) {
                  setValidationErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Caregiver Role
            </Label>
            <RadioGroup value={formData.role} onValueChange={handleRoleChange}>
              {roleOptions.map((option) => (
                <div 
                  key={option.value} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    formData.role === option.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <label 
                    htmlFor={option.value} 
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </Label>
            <div className="space-y-2">
              {availablePermissions.map((permission) => (
                <div 
                  key={permission.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    formData.permissions.includes(permission.value)
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    id={permission.value}
                    checked={formData.permissions.includes(permission.value)}
                    onCheckedChange={() => handlePermissionToggle(permission.value)}
                    className="mt-1"
                  />
                  <label 
                    htmlFor={permission.value} 
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      {permission.icon}
                      <span className="font-medium text-sm">{permission.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{permission.description}</p>
                  </label>
                </div>
              ))}
            </div>
            {validationErrors.permissions && (
              <p className="text-sm text-red-500">{validationErrors.permissions}</p>
            )}
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to include with the invitation..."
              value={formData.personalMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, personalMessage: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The invited caregiver will receive an email with instructions to create an account 
              and access {client.firstName}'s care information based on the permissions you've selected.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}