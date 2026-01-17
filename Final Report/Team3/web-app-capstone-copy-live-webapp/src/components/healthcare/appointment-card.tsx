'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Video, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock3
} from 'lucide-react';
import { format, isToday, isTomorrow, isAfter, isBefore, addHours } from 'date-fns';

interface AppointmentCardProps {
  appointment: Appointment;
  clientName?: string;
  onEdit?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  className?: string;
}

export function AppointmentCard({ 
  appointment, 
  clientName,
  onEdit, 
  onCancel, 
  onComplete,
  onView, 
  className 
}: AppointmentCardProps) {
  const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
  const now = new Date();
  
  const isUpcoming = isAfter(appointmentDateTime, now);
  const isInProgress = isAfter(now, appointmentDateTime) && isBefore(now, addHours(appointmentDateTime, appointment.duration / 60));
  const isPast = isBefore(appointmentDateTime, now) && !isInProgress;
  
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        );
      case 'no_show':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            No Show
          </Badge>
        );
      case 'confirmed':
        if (isInProgress) {
          return (
            <Badge variant="default" className="bg-blue-500 flex items-center gap-1">
              <Clock3 className="w-3 h-3" />
              In Progress
            </Badge>
          );
        }
        return (
          <Badge variant="default" className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </Badge>
        );
      case 'scheduled':
      default:
        if (isPast && appointment.status === 'scheduled') {
          return (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Needs Update
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Scheduled
          </Badge>
        );
    }
  };

  const getPriorityBadge = () => {
    if (appointment.priority === 'urgent') {
      return <Badge variant="destructive">Urgent</Badge>;
    }
    if (appointment.priority === 'high') {
      return <Badge variant="default" className="bg-orange-500">High Priority</Badge>;
    }
    return null;
  };

  const getLocationIcon = () => {
    switch (appointment.locationType) {
      case 'telehealth':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'in_person':
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = () => {
    if (isToday(appointmentDateTime)) {
      return 'Today';
    }
    if (isTomorrow(appointmentDateTime)) {
      return 'Tomorrow';
    }
    return format(appointmentDateTime, 'MMM dd, yyyy');
  };

  const formatTime = () => {
    return format(appointmentDateTime, 'h:mm a');
  };

  const getDuration = () => {
    const hours = Math.floor(appointment.duration / 60);
    const minutes = appointment.duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      appointment.priority === 'urgent' ? 'border-red-200 bg-red-50' : 
      appointment.priority === 'high' ? 'border-orange-200 bg-orange-50' : ''
    } ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              appointment.status === 'completed' ? 'bg-green-100' :
              appointment.status === 'cancelled' ? 'bg-red-100' :
              isInProgress ? 'bg-blue-100' :
              'bg-gray-100'
            }`}>
              <User className={`w-6 h-6 ${
                appointment.status === 'completed' ? 'text-green-600' :
                appointment.status === 'cancelled' ? 'text-red-600' :
                isInProgress ? 'text-blue-600' :
                'text-gray-600'
              }`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{appointment.title}</CardTitle>
              {clientName && (
                <p className="text-sm text-muted-foreground">Client: {clientName}</p>
              )}
              <p className="text-sm font-medium text-muted-foreground">
                {appointment.providerName}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadge()}
            {getPriorityBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{formatDate()}</p>
              <p className="text-xs text-muted-foreground">{format(appointmentDateTime, 'EEEE')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{formatTime()}</p>
              <p className="text-xs text-muted-foreground">{getDuration()}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          {getLocationIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium capitalize">
              {appointment.locationType.replace('_', ' ')}
            </p>
            {appointment.locationType === 'in_person' && appointment.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                {appointment.address}
              </a>
            )}
            {appointment.locationType === 'in_person' && appointment.roomNumber && (
              <p className="text-xs text-muted-foreground">Room: {appointment.roomNumber}</p>
            )}
            {appointment.locationType === 'telehealth' && appointment.teleHealthLink && (
              <p className="text-xs text-blue-600">Video link available</p>
            )}
            {appointment.providerPhone && (
              <p className="text-xs text-muted-foreground">📞 {appointment.providerPhone}</p>
            )}
          </div>
        </div>

        {/* Provider Type */}
        {appointment.providerType && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {appointment.providerType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            {appointment.appointmentType && (
              <Badge variant="secondary" className="text-xs">
                {appointment.appointmentType}
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {appointment.description && (
          <div className="text-sm">
            <p className="text-muted-foreground">Description:</p>
            <p className="mt-1 p-2 bg-gray-50 rounded border text-sm">
              {appointment.description}
            </p>
          </div>
        )}

        {/* Preparation Instructions */}
        {appointment.preparationInstructions && (
          <div className="text-sm">
            <p className="text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Preparation needed:
            </p>
            <p className="mt-1 p-2 bg-blue-50 rounded border text-sm">
              {appointment.preparationInstructions}
            </p>
          </div>
        )}

        {/* Documents Needed */}
        {appointment.documentsNeeded && appointment.documentsNeeded.length > 0 && (
          <div className="text-sm">
            <p className="text-muted-foreground">Documents to bring:</p>
            <ul className="mt-1 text-sm list-disc list-inside space-y-1">
              {appointment.documentsNeeded.map((doc, index) => (
                <li key={index} className="text-gray-700">{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Required */}
        {appointment.followUpRequired && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Follow-up appointment required</span>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <div className="text-sm">
            <p className="text-muted-foreground">Notes:</p>
            <p className="mt-1 p-2 bg-gray-50 rounded border text-sm">
              {appointment.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {appointment.locationType === 'telehealth' && appointment.teleHealthLink && isInProgress && (
            <Button variant="default" size="sm" className="flex-1 bg-blue-600">
              Join Video Call
            </Button>
          )}
          {onComplete && appointment.status === 'scheduled' && isPast && (
            <Button variant="default" size="sm" onClick={() => onComplete(appointment)} className="bg-green-600">
              Mark Complete
            </Button>
          )}
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(appointment)}>
              View
            </Button>
          )}
          {onEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <Button variant="outline" size="sm" onClick={() => onEdit(appointment)}>
              Edit
            </Button>
          )}
          {onCancel && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <Button variant="outline" size="sm" onClick={() => onCancel(appointment)} className="text-red-600 hover:text-red-700">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}