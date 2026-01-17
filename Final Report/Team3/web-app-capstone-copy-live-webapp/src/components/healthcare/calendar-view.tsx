'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { format, parseISO, addHours, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Pill } from 'lucide-react';
import { useAppointments } from '@/hooks/use-appointments';
import { useMedications, useClientMedications } from '@/hooks/use-medications';
import { useClients } from '@/hooks/use-clients';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSearchParams } from 'next/navigation';
import { AppointmentDialog } from './appointment-dialog';
import { Appointment, Medication, Client } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-view.css';

// Install moment for react-big-calendar
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'appointment' | 'medication';
  clientId: string;
  clientName: string;
  data: Appointment | Medication;
  color: string;
  resource?: Record<string, unknown>;
}

interface CalendarViewProps {
  className?: string;
  clientId?: string;
}

// Client color mapping for consistent color coding
const CLIENT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function CalendarView({ className, clientId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [showMedications, setShowMedications] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const { appointments, createAppointment, loading: appointmentsLoading } = useAppointments(
    clientId ? { clientId } : {}
  );
  const { data: allMedications = [] } = useMedications();
  const { data: clientMedications = [] } = useClientMedications(clientId || '');
  const { data: clients = [] } = useClients();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  // Open dialog if navigated with ?new=true
  useEffect(() => {
    if (searchParams?.get('new') === 'true') {
      setShowAppointmentDialog(true);
    }
  }, [searchParams]);

  // Create client color mapping
  const clientColorMap = useMemo(() => {
    const colorMap: Record<string, string> = {};
    if (Array.isArray(clients)) {
      clients.forEach((client, index) => {
        colorMap[client.id] = CLIENT_COLORS[index % CLIENT_COLORS.length];
      });
    }
    return colorMap;
  }, [clients]);

  // Convert appointments to calendar events
  const appointmentEvents = useMemo((): CalendarEvent[] => {
    if (!Array.isArray(appointments)) return [];
    
    return appointments.map((appointment) => {
      const client = Array.isArray(clients) ? clients.find(p => p.id === appointment.clientId) : null;
      const appointmentDateTime = parseISO(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      
      return {
        id: appointment.id,
        title: `${appointment.title} - ${client?.firstName} ${client?.lastName}`,
        start: appointmentDateTime,
        end: addHours(appointmentDateTime, appointment.duration / 60),
        type: 'appointment' as const,
        clientId: appointment.clientId,
        clientName: `${client?.firstName} ${client?.lastName}` || 'Unknown Client',
        data: appointment,
        color: clientColorMap[appointment.clientId] || CLIENT_COLORS[0],
        resource: {
          type: 'appointment',
          status: appointment.status,
          priority: appointment.priority,
        }
      } as CalendarEvent;
    });
  }, [appointments, clients, clientColorMap]);

  // Convert medications to calendar events (for scheduled medications)
  const medicationEvents = useMemo((): CalendarEvent[] => {
    if (!showMedications) return [];
    const medsSource = clientId ? clientMedications : allMedications;
    if (!Array.isArray(medsSource)) return [];

    const events: CalendarEvent[] = [];
    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)); // Next 30 days

    medsSource.forEach((medication) => {
      if (!medication.isActive || medication.scheduleType !== 'fixed_times' || !Array.isArray(medication.scheduledTimes)) {
        return;
      }

      const client = Array.isArray(clients) ? clients.find(p => p.id === medication.clientId) : null;
      
      // Generate events for each scheduled time over the next 30 days
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        medication.scheduledTimes.forEach((time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          const eventDate = new Date(date);
          eventDate.setHours(hours, minutes, 0, 0);

          events.push({
            id: `${medication.id}-${format(eventDate, 'yyyy-MM-dd-HH-mm')}`,
            title: `💊 ${medication.name} - ${client?.firstName} ${client?.lastName}`,
            start: eventDate,
            end: new Date(eventDate.getTime() + 30 * 60 * 1000), // 30 minutes duration
            type: 'medication' as const,
            clientId: medication.clientId,
            clientName: `${client?.firstName} ${client?.lastName}` || 'Unknown Client',
            data: medication,
            color: clientColorMap[medication.clientId] || CLIENT_COLORS[0],
            resource: {
              type: 'medication',
              dosage: medication.dosage,
              frequency: medication.frequency,
            }
          } as CalendarEvent);
        });
      }
    });

    return events;
  }, [clientId, clientMedications, allMedications, clients, clientColorMap, showMedications]);

  // Combine all events
  const allEvents = useMemo(() => {
    return [...appointmentEvents, ...medicationEvents];
  }, [appointmentEvents, medicationEvents]);

  // Handle slot selection (click to add appointment)
  const handleSelectSlot = useCallback((args: { start: Date; end: Date }) => {
    const { start, end } = args;
    setSelectedSlot({ start, end });
    setShowAppointmentDialog(true);
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const baseStyle = {
      backgroundColor: event.color,
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '12px',
      padding: '2px 4px',
    };

    if (event.type === 'medication') {
      return {
        style: {
          ...baseStyle,
          backgroundColor: `${event.color}40`, // More transparent for medications
          color: event.color,
          border: `1px solid ${event.color}`,
        }
      };
    }

    return { style: baseStyle };
  }, []);

  // Navigation handlers
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((view: 'month' | 'week' | 'day') => {
    setCurrentView(view);
  }, []);

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className={className}>
      {/* Calendar Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl font-semibold">
              Healthcare Calendar
            </CardTitle>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Medication Toggle */}
              <div className="flex items-center gap-2">
                <Toggle
                  pressed={showMedications}
                  onPressedChange={setShowMedications}
                  aria-label="Show medications"
                  className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                >
                  <Pill className="h-4 w-4 mr-1" />
                  Medications
                </Toggle>
              </div>

              {/* Add Appointment Button */}
              <Button className="flex items-center gap-2" onClick={() => setShowAppointmentDialog(true)}>
                <Plus className="h-4 w-4" />
                Add Appointment
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-medium text-lg ml-4">
                {format(currentDate, 'MMMM yyyy')}
              </span>
            </div>

            {/* View Buttons */}
            <div className="flex gap-1">
              {(['month', 'week', 'day'] as Array<'month' | 'week' | 'day'>).map((view) => (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView(view)}
                  className="capitalize"
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <div className="calendar-container" style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={allEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={currentView}
              onView={handleViewChange}
              date={currentDate}
              onNavigate={handleNavigate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              popup
              showMultiDayTimes
              step={30}
              timeslots={2}
              toolbar={false} // We're using custom toolbar
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
                  `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
                dayHeaderFormat: 'EEE M/d',
                monthHeaderFormat: 'MMMM yyyy',
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedEvent?.type === 'appointment' ? (
                <CalendarIcon className="h-5 w-5" />
              ) : (
                <Pill className="h-5 w-5" />
              )}
              {selectedEvent?.type === 'appointment' ? 'Appointment Details' : 'Medication Details'}
            </SheetTitle>
          </SheetHeader>
          
          {selectedEvent && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                  {selectedEvent.type === 'appointment' ? 'Appointment' : 'Medication'}
                </h3>
                <p className="text-lg font-semibold mt-1">
                  {selectedEvent.type === 'appointment' 
                    ? (selectedEvent.data as Appointment).title
                    : (selectedEvent.data as Medication).name
                  }
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Client</h3>
                <p className="mt-1">{selectedEvent.clientName}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Time</h3>
                <p className="mt-1">
                  {format(selectedEvent.start, 'PPP')} at {format(selectedEvent.start, 'p')}
                  {selectedEvent.type === 'appointment' && (
                    ` - ${format(selectedEvent.end, 'p')}`
                  )}
                </p>
              </div>

              {selectedEvent.type === 'appointment' && (
                <>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Provider</h3>
                    <p className="mt-1">{(selectedEvent.data as Appointment).providerName}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Status</h3>
                    <Badge 
                      variant={
                        (selectedEvent.data as Appointment).status === 'scheduled' ? 'default' :
                        (selectedEvent.data as Appointment).status === 'confirmed' ? 'default' :
                        (selectedEvent.data as Appointment).status === 'completed' ? 'secondary' :
                        'destructive'
                      }
                      className="mt-1"
                    >
                      {(selectedEvent.data as Appointment).status}
                    </Badge>
                  </div>

                  {(selectedEvent.data as Appointment).address && (
                    <div>
                      <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Location</h3>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedEvent.data as Appointment).address || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-blue-600 underline hover:text-blue-800"
                      >
                        {(selectedEvent.data as Appointment).address}
                      </a>
                    </div>
                  )}
                </>
              )}

              {selectedEvent.type === 'medication' && (
                <>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Dosage</h3>
                    <p className="mt-1">{(selectedEvent.data as Medication).dosage} {(selectedEvent.data as Medication).unit}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Frequency</h3>
                    <p className="mt-1">{(selectedEvent.data as Medication).frequency}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Prescribing Doctor</h3>
                    <p className="mt-1">{(selectedEvent.data as Medication).prescribingDoctor}</p>
                  </div>

                  {(selectedEvent.data as Medication).instructions && (
                    <div>
                      <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Instructions</h3>
                      <p className="mt-1">{(selectedEvent.data as Medication).instructions}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      {/* Appointment Dialog */}
      <AppointmentDialog
        isOpen={showAppointmentDialog}
        onClose={() => {
          setShowAppointmentDialog(false);
          setSelectedSlot(null);
        }}
        onSave={async (data) => {
          await createAppointment(data as any);
        }}
        appointment={undefined}
        clients={(() => {
          if (!Array.isArray(clients)) return [] as Client[];
          if (clientId) {
            const p = clients.find((pt) => pt.id === clientId);
            return p ? [p] : [];
          }
          return clients;
        })()}
        currentUserId={user?.id || ''}
        existingAppointments={Array.isArray(appointments) ? appointments : []}
        isLoading={appointmentsLoading}
        initialDate={selectedSlot?.start}
      />
    </div>
  );
}