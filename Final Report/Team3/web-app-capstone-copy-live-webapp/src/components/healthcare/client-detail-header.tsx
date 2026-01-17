'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronRight, 
  Edit, 
  Phone, 
  AlertTriangle,
  Home,
  Users
} from 'lucide-react';
import type { ClientDetailHeaderProps, BreadcrumbItem } from '@/types';

export function ClientDetailHeader({ 
  client, 
  onEdit, 
  onEmergencyContact 
}: ClientDetailHeaderProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Clients', href: '/clients' },
    { label: `${client.firstName} ${client.lastName}`, current: true }
  ];

  const getClientAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const hasAllergies = client.allergies && client.allergies.length > 0;
  const hasCriticalConditions = client.medicalConditions && 
    client.medicalConditions.some(condition => 
      condition.toLowerCase().includes('diabetes') ||
      condition.toLowerCase().includes('heart') ||
      condition.toLowerCase().includes('seizure') ||
      condition.toLowerCase().includes('stroke')
    );

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumb Navigation */}
        <nav 
          className="flex mb-4" 
          aria-label="Breadcrumb"
          role="navigation"
        >
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight 
                    className="w-4 h-4 text-gray-400 mx-2" 
                    aria-hidden="true"
                  />
                )}
                {item.current ? (
                  <span 
                    className="text-gray-900 font-medium"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href!}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {index === 0 && <Home className="w-4 h-4 mr-1 inline" />}
                    {index === 1 && <Users className="w-4 h-4 mr-1 inline" />}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Client Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Client Avatar */}
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
              <AvatarImage 
                src={client.profilePicture} 
                alt={`${client.firstName} ${client.lastName}`}
              />
              <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Client Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                  {client.firstName} {client.lastName}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Age {getClientAge(client.dateOfBirth)}
                  </Badge>
                  {client.medicalRecordNumber && (
                    <Badge variant="outline" className="text-xs">
                      MRN: {client.medicalRecordNumber}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Critical Alerts */}
              {(hasAllergies || hasCriticalConditions) && (
                <div className="mb-3">
                  {hasAllergies && (
                    <div 
                      className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md mb-2"
                      role="alert"
                      aria-label="Allergy Alert"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Allergies: {client.allergies!.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {hasCriticalConditions && (
                    <div 
                      className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-md"
                      role="alert"
                      aria-label="Critical Medical Conditions"
                    >
                      <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Critical Conditions: {client.medicalConditions!
                            .filter(condition => 
                              condition.toLowerCase().includes('diabetes') ||
                              condition.toLowerCase().includes('heart') ||
                              condition.toLowerCase().includes('seizure') ||
                              condition.toLowerCase().includes('stroke')
                            )
                            .join(', ')
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Contact Quick Access */}
              {client.emergencyContactName && client.emergencyContactPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Emergency Contact:</span>
                  <a
                    href={`tel:${client.emergencyContactPhone}`}
                    onClick={onEmergencyContact}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    aria-label={`Call emergency contact ${client.emergencyContactName} at ${client.emergencyContactPhone}`}
                  >
                    <Phone className="w-3 h-3" />
                    {client.emergencyContactName}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {client.emergencyContactPhone && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="sm:hidden"
              >
                <a
                  href={`tel:${client.emergencyContactPhone}`}
                  onClick={onEmergencyContact}
                  aria-label={`Call emergency contact at ${client.emergencyContactPhone}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2"
              aria-label="Edit client information"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Client</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}