'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import { AddressAutocomplete } from '@/components/forms/AddressAutocomplete';
import { SelectField } from '@/components/forms/select-field';
import { DatePicker } from '@/components/forms/date-picker';
import { TimePicker } from '@/components/forms/time-picker';
import { TextareaField } from '@/components/forms/textarea-field';
import { Badge } from '@/components/ui/badge';
import { 
  Appointment, 
  CreateAppointmentInput, 
  UpdateAppointmentInput,
  Client,
  AppointmentStatus,
  ProviderType,
  LocationType,
  Priority
} from '@/types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Video, 
  User, 
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { format, addDays, isBefore, isAfter, parseISO } from 'date-fns';

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: CreateAppointmentInput | UpdateAppointmentInput) => Promise<void>;
  appointment?: Appointment;
  clients: Client[];
  currentUserId: string;
  existingAppointments?: Appointment[];
  isLoading?: boolean;
  initialDate?: Date;
}

const PROVIDER_TYPE_OPTIONS = [
  { value: 'primary_care', label: 'Primary Care' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'other', label: 'Other' },
];

const LOCATION_TYPE_OPTIONS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'telehealth', label: 'Telehealth' },
  { value: 'phone', label: 'Phone' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

const DEFAULT_REMINDER_TIMES = [24, 2]; // 24 hours and 2 hours before

export function AppointmentDialog({
  isOpen,
  onClose,
  onSave,
  appointment,
  clients,
  currentUserId,
  existingAppointments = [],
  isLoading = false,
  initialDate,
}: AppointmentDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateAppointmentInput | UpdateAppointmentInput>>({});
  const [documentsNeeded, setDocumentsNeeded] = useState<string[]>([]);
  const [newDocument, setNewDocument] = useState('');
  const [reminderTimes, setReminderTimes] = useState<number[]>(DEFAULT_REMINDER_TIMES);
  const [newReminderTime, setNewReminderTime] = useState<number>(24);
  const [conflicts, setConflicts] = useState<Appointment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!appointment;

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Editing existing appointment
        setFormData({
          id: appointment.id,
          clientId: appointment.clientId,
          title: appointment.title,
          description: appointment.description || '',
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          duration: appointment.duration,
          timeZone: appointment.timeZone || '',
          providerName: appointment.providerName,
          providerType: appointment.providerType || 'primary_care',
          providerPhone: appointment.providerPhone,
          locationType: appointment.locationType,
          address: appointment.address || '',
          roomNumber: appointment.roomNumber || '',
          teleHealthLink: appointment.teleHealthLink || '',
          status: appointment.status,
          appointmentType: appointment.appointmentType || '',
          priority: appointment.priority,
          preparationInstructions: appointment.preparationInstructions || '',
          followUpRequired: appointment.followUpRequired,
          notes: appointment.notes || '',
        });
        setDocumentsNeeded(appointment.documentsNeeded || []);
        setReminderTimes(appointment.reminderTimes || DEFAULT_REMINDER_TIMES);
      } else {
        // Creating new appointment
        const baseDate = initialDate ?? addDays(new Date(), 1);
        const defaultTime = initialDate
          ? `${String(baseDate.getHours()).padStart(2, '0')}:${String(baseDate.getMinutes()).padStart(2, '0')}`
          : '09:00';
        setFormData({
          clientId: clients[0]?.id || '',
          title: '',
          description: '',
          appointmentDate: format(baseDate, 'yyyy-MM-dd'),
          appointmentTime: defaultTime,
          duration: 30,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          providerName: '',
          providerType: 'primary_care',
          locationType: 'in_person',
          address: '',
          roomNumber: '',
          teleHealthLink: '',
          status: 'scheduled',
          createdBy: currentUserId,
          appointmentType: '',
          priority: 'normal',
          preparationInstructions: '',
          followUpRequired: false,
          createdBy: currentUserId,
          notes: '',
        });
        setDocumentsNeeded([]);
        setReminderTimes(DEFAULT_REMINDER_TIMES);
      }
      setErrors({});
      setConflicts([]);
    }
  }, [isOpen, appointment, clients, currentUserId, initialDate]);

  // Check for appointment conflicts
  useEffect(() => {
    if (formData.clientId && formData.appointmentDate && formData.appointmentTime && formData.duration) {
      checkForConflicts();
    }
  }, [formData.clientId, formData.appointmentDate, formData.appointmentTime, formData.duration]);

  const checkForConflicts = () => {
    if (!formData.clientId || !formData.appointmentDate || !formData.appointmentTime || !formData.duration) {
      return;
    }

    const appointmentStart = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
    const appointmentEnd = new Date(appointmentStart.getTime() + (formData.duration * 60000));

    const conflictingAppointments = existingAppointments.filter(existing => {
      // Skip the current appointment if editing
      if (isEditing && existing.id === appointment?.id) {
        return false;
      }

      // Only check appointments for the same client
      if (existing.clientId !== formData.clientId) {
        return false;
      }

      // Skip cancelled appointments
      if (existing.status === 'cancelled') {
        return false;
      }

      const existingStart = new Date(`${existing.appointmentDate}T${existing.appointmentTime}`);
      const existingEnd = new Date(existingStart.getTime() + (existing.duration * 60000));

      // Check for overlap
      return (
        (appointmentStart < existingEnd && appointmentEnd > existingStart)
      );
    });

    setConflicts(conflictingAppointments);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Date is required';
    }

    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Time is required';
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    if (!formData.providerName?.trim()) {
      newErrors.providerName = 'Provider name is required';
    }

    if (formData.locationType === 'in_person' && !formData.address?.trim()) {
      newErrors.address = 'Address is required for in-person appointments';
    }

    if (formData.locationType === 'telehealth' && !formData.teleHealthLink?.trim()) {
      newErrors.teleHealthLink = 'Video link is required for telehealth appointments';
    }

    // Check if appointment is in the past (only for new appointments)
    if (!isEditing && formData.appointmentDate && formData.appointmentTime) {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      if (isBefore(appointmentDateTime, new Date())) {
        newErrors.appointmentDate = 'Appointment cannot be scheduled in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const appointmentData = {
        ...formData,
        documentsNeeded: documentsNeeded.length > 0 ? documentsNeeded : undefined,
        reminderTimes: reminderTimes.length > 0 ? reminderTimes : undefined,
        createdBy: isEditing ? formData.createdBy : currentUserId,
        duration: formData.duration || 30,
      } as CreateAppointmentInput | UpdateAppointmentInput;

      await onSave(appointmentData);
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
      setErrors({ general: 'Failed to save appointment. Please try again.' });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addDocument = () => {
    if (newDocument.trim() && !documentsNeeded.includes(newDocument.trim())) {
      setDocumentsNeeded(prev => [...prev, newDocument.trim()]);
      setNewDocument('');
    }
  };

  const removeDocument = (index: number) => {
    setDocumentsNeeded(prev => prev.filter((_, i) => i !== index));
  };

  const addReminderTime = () => {
    if (newReminderTime > 0 && !reminderTimes.includes(newReminderTime)) {
      setReminderTimes(prev => [...prev, newReminderTime].sort((a, b) => b - a));
      setNewReminderTime(24);
    }
  };

  const removeReminderTime = (time: number) => {
    setReminderTimes(prev => prev.filter(t => t !== time));
  };

  const getLocationIcon = () => {
    switch (formData.locationType) {
      case 'telehealth':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'in_person':
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const selectedClient = Array.isArray(clients) ? clients.find(p => p.id === formData.clientId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isEditing ? 'Edit Appointment' : 'New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  Scheduling Conflicts Detected
                </p>
              </div>
              <div className="space-y-1">
                {conflicts.map(conflict => (
                  <p key={conflict.id} className="text-sm text-yellow-700">
                    • {conflict.title} at {format(new Date(`${conflict.appointmentDate}T${conflict.appointmentTime}`), 'MMM dd, h:mm a')}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Appointment Title"
                value={formData.title || ''}
                onChange={(value) => handleInputChange('title', value)}
                placeholder="e.g., Annual Physical, Follow-up Visit"
                error={errors.title}
                required
              />
            </div>

              <SelectField
                label="Client"
              value={formData.clientId || ''}
              onChange={(value) => handleInputChange('clientId', value)}
              options={Array.isArray(clients) ? clients.map(client => ({
                value: client.id,
                label: `${client.firstName} ${client.lastName}`,
              })) : []}
                error={errors.clientId}
              required
            />

            {isEditing && (
              <SelectField
                label="Status"
                value={formData.status || 'scheduled'}
                onChange={(value) => handleInputChange('status', value)}
                options={STATUS_OPTIONS}
              />
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DatePicker
              label="Date"
              value={formData.appointmentDate || ''}
              onChange={(value) => handleInputChange('appointmentDate', value)}
              error={errors.appointmentDate}
              required
            />

            <TimePicker
              label="Time"
              value={formData.appointmentTime || ''}
              onChange={(value) => handleInputChange('appointmentTime', value)}
              error={errors.appointmentTime}
              required
            />

            <FormField
              label="Duration (minutes)"
              type="number"
              value={formData.duration?.toString() || ''}
              onChange={(value) => handleInputChange('duration', parseInt(value) || 0)}
              placeholder="30"
              error={errors.duration}
              required
            />
          </div>

          {/* Provider Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Provider Name"
              value={formData.providerName || ''}
              onChange={(value) => handleInputChange('providerName', value)}
              placeholder="Dr. Smith"
              error={errors.providerName}
              required
            />

            <SelectField
              label="Provider Type"
              value={formData.providerType || 'primary_care'}
              onChange={(value) => handleInputChange('providerType', value)}
              options={PROVIDER_TYPE_OPTIONS}
            />

            <FormField
              label="Provider Phone"
              type="tel"
              value={formData.providerPhone || ''}
              onChange={(value) => handleInputChange('providerPhone', value)}
              placeholder="(555) 123-4567"
            />

            <FormField
              label="Appointment Type"
              value={formData.appointmentType || ''}
              onChange={(value) => handleInputChange('appointmentType', value)}
              placeholder="e.g., Physical Exam, Consultation"
            />
          </div>

          {/* Location */}
          <div className="space-y-4">
            <SelectField
              label="Location Type"
              value={formData.locationType || 'in_person'}
              onChange={(value) => handleInputChange('locationType', value)}
              options={LOCATION_TYPE_OPTIONS}
            />

            {formData.locationType === 'in_person' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AddressAutocomplete
                  label="Address"
                  value={formData.address || ''}
                  onChange={(value) => handleInputChange('address', value)}
                  placeholder="123 Medical Center Dr, Suite 100"
                  error={errors.address}
                  required
                />

                <FormField
                  label="Room Number"
                  value={formData.roomNumber || ''}
                  onChange={(value) => handleInputChange('roomNumber', value)}
                  placeholder="Room 205"
                />
              </div>
            )}

            {formData.locationType === 'telehealth' && (
              <FormField
                label="Video Call Link"
                value={formData.teleHealthLink || ''}
                onChange={(value) => handleInputChange('teleHealthLink', value)}
                placeholder="https://example.com/video-call"
                error={errors.teleHealthLink}
                required
              />
            )}
          </div>

          {/* Priority and Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Priority"
              value={formData.priority || 'normal'}
              onChange={(value) => handleInputChange('priority', value)}
              options={PRIORITY_OPTIONS}
            />

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired || false}
                onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium">
                Follow-up appointment required
              </label>
            </div>
          </div>

          {/* Description */}
          <TextareaField
            label="Description"
            value={formData.description || ''}
            onChange={(value) => handleInputChange('description', value)}
            placeholder="Additional details about the appointment..."
            rows={3}
          />

          {/* Preparation Instructions */}
          <TextareaField
            label="Preparation Instructions"
            value={formData.preparationInstructions || ''}
            onChange={(value) => handleInputChange('preparationInstructions', value)}
            placeholder="Instructions for the client to prepare for the appointment..."
            rows={3}
          />

          {/* Documents Needed */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Documents Needed</label>
            
            <div className="flex gap-2">
              <FormField
                value={newDocument}
                onChange={setNewDocument}
                placeholder="e.g., Insurance Card, Photo ID"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDocument}
                disabled={!newDocument.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {documentsNeeded.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {documentsNeeded.map((doc, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {doc}
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Times */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Reminder Times (hours before)</label>
            
            <div className="flex gap-2">
              <FormField
                type="number"
                value={newReminderTime.toString()}
                onChange={(value) => setNewReminderTime(parseInt(value) || 0)}
                placeholder="24"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReminderTime}
                disabled={newReminderTime <= 0}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {reminderTimes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reminderTimes.map((time) => (
                  <Badge key={time} variant="secondary" className="flex items-center gap-1">
                    {time}h before
                    <button
                      type="button"
                      onClick={() => removeReminderTime(time)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <TextareaField
            label="Notes"
            value={formData.notes || ''}
            onChange={(value) => handleInputChange('notes', value)}
            placeholder="Additional notes about the appointment..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || conflicts.length > 0}
            className="min-w-[100px]"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}