'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical, 
  Phone, 
  Calendar, 
  Pill, 
  MessageSquare, 
  AlertTriangle 
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useMedications } from '@/hooks/use-medications';
import { useAppointments } from '@/hooks/use-appointments';
import { useMessages } from '@/hooks/use-messages';
import { useTranslation } from '@/components/language/translation-context';

import type { Client } from '@/types';

interface ClientCardsProps {
  clients: Client[];
  onClientClick?: (clientId: string) => void;
  onActionClick?: (action: string, clientId: string) => void;
}

export function ClientCards({ clients, onClientClick, onActionClick }: ClientCardsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const { data: allMedications = [] } = useMedications();
  const { data: allAppointments = [] } = useAppointments();
  const { data: allMessages = [] } = useMessages();

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('clients.none')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('clients.noneDescription')}
            </p>
            <Button onClick={() => router.push('/clients')}>
              {t('clients.addClient')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getClientStats = (clientId: string) => {
    const medications = allMedications.filter(med => med.clientId === clientId && med.isActive);
    const appointments = allAppointments.filter(apt => 
      apt.clientId === clientId &&
      apt.status === 'scheduled' &&
      new Date(apt.appointmentDate) >= new Date()
    );
    const messages = allMessages.filter(msg => msg.clientId === clientId && !msg.isRead);

    const overdueMedications = medications.filter(med => {
      if (!med.nextDueAt) return false;
      return new Date(med.nextDueAt) < new Date();
    });

    return {
      activeMedications: medications.length,
      upcomingAppointments: appointments.length,
      unreadMessages: messages.length,
      overdueMedications: overdueMedications.length,
    };
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleCardClick = (clientId: string) => {
    onClientClick?.(clientId);
    router.push(`/clients/${clientId}`);
  };

  const handleActionClick = (action: string, clientId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onActionClick?.(action, clientId);

    switch (action) {
      case 'view_medications':
        router.push(`/clients/${clientId}`);
        break;
      case 'schedule_appointment':
        router.push(`/calendar?new_appointment=${clientId}`);
        break;
      case 'send_message':
        router.push(`/chat?client=${clientId}`);
        break;
      case 'call_emergency':
        break;
      case 'view_details':
        router.push(`/clients/${clientId}`);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('clients.title')}
        </h2>
        <Button variant="outline" size="sm" onClick={() => router.push('/clients')}>
          {t('clients.viewAll')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {clients.map((client) => {
          const stats = getClientStats(client.id);
          const hasUrgentItems = stats.overdueMedications > 0;

          return (
            <Card
              key={client.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                hasUrgentItems ? 'border-red-200 bg-red-50' : ''
              }`}
              onClick={() => handleCardClick(client.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={client.profilePicture}
                        alt={`${client.firstName} ${client.lastName}`}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(client.firstName, client.lastName)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {client.firstName} {client.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('clients.age')} {formatAge(client.dateOfBirth)} •{' '}
                        {client.gender || t('clients.notSpecified')}
                      </p>
                    </div>
                  </div>

                  {/* Urgent & Menu */}
                  <div className="flex items-center gap-2">
                    {hasUrgentItems && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {t('clients.urgent')}
                      </Badge>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleActionClick('view_details', client.id, e)}>
                          {t('clients.viewDetails')}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleActionClick('view_medications', client.id, e)}>
                          {t('clients.viewMedications')}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleActionClick('schedule_appointment', client.id, e)}>
                          {t('clients.scheduleAppointment')}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleActionClick('send_message', client.id, e)}>
                          {t('clients.sendMessage')}
                        </DropdownMenuItem>

                        {client.emergencyContactPhone && (
                          <DropdownMenuItem
                            onClick={(e) => handleActionClick('call_emergency', client.id, e)}
                            className="text-red-600"
                          >
                            {t('clients.callEmergency')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {/* Meds */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Pill className={`h-4 w-4 ${stats.overdueMedications > 0 ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div className={`text-sm font-medium ${stats.overdueMedications > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {stats.activeMedications}
                    </div>
                    <div className="text-xs text-gray-600">{t('clients.meds')}</div>
                  </div>

                  {/* Appts */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {stats.upcomingAppointments}
                    </div>
                    <div className="text-xs text-gray-600">{t('clients.appts')}</div>
                  </div>

                  {/* Msgs */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <MessageSquare className={`h-4 w-4 ${stats.unreadMessages > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className={`text-sm font-medium ${stats.unreadMessages > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                      {stats.unreadMessages}
                    </div>
                    <div className="text-xs text-gray-600">{t('clients.msgs')}</div>
                  </div>

                  {/* Emergency */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Phone className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {client.emergencyContactPhone ? '✓' : '—'}
                    </div>
                    <div className="text-xs text-gray-600">{t('clients.emergency')}</div>
                  </div>
                </div>

                {/* Conditions */}
                {(client.medicalConditions?.length > 0 || client.allergies?.length > 0) && (
                  <div className="space-y-2">
                    {/* Conditions */}
                    {client.medicalConditions?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          {t('clients.conditions')}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {client.medicalConditions.slice(0, 3).map((condition, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                          {client.medicalConditions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{client.medicalConditions.length - 3} {t('clients.more')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Allergies */}
                    {client.allergies?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-red-700 mb-1">
                          {t('clients.allergies')}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {client.allergies.slice(0, 2).map((allergy, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {allergy}
                            </Badge>
                          ))}
                          {client.allergies.length > 2 && (
                            <Badge variant="destructive" className="text-xs">
                              +{client.allergies.length - 2} {t('clients.more')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleActionClick('view_medications', client.id, e)}
                  >
                    <Pill className="h-3 w-3 mr-1" />
                    {t('clients.meds')}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleActionClick('schedule_appointment', client.id, e)}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {t('clients.schedule')}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleActionClick('send_message', client.id, e)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {t('clients.chat')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
