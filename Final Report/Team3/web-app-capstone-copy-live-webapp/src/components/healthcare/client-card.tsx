'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Client } from '@/types';
import { Phone, AlertTriangle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onView?: (client: Client) => void;
  className?: string;
  children?: React.ReactNode;
}

export function ClientCard({ client, onEdit, onView, className }: ClientCardProps) {
  const age = new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear();
  const hasAllergies = client.allergies && client.allergies.length > 0;
  const hasMedicalConditions = client.medicalConditions && client.medicalConditions.length > 0;

  return (
    <Card 
      className={`hover:shadow-2xl transition-all duration-300 border-gray-100/50 bg-white/90 backdrop-blur-sm ${className}`}
      role="article"
      aria-labelledby={`client-${client.id}-name`}
      aria-describedby={`client-${client.id}-info`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-md"
              aria-hidden="true"
            >
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle 
                id={`client-${client.id}-name`}
                className="text-lg font-semibold"
              >
                {client.firstName} {client.lastName}
              </CardTitle>
              <p 
                id={`client-${client.id}-info`}
                className="text-sm text-muted-foreground"
              >
                Age {age} • {client.gender || 'Not specified'}
              </p>
            </div>
          </div>
          {hasAllergies && (
            <Badge 
              variant="destructive" 
              className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm animate-pulse"
              role="alert"
              aria-label={`Client has allergies: ${client.allergies?.join(', ')}`}
            >
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              Allergies
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Medical Information */}
        {hasMedicalConditions && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Medical Conditions</h4>
            <div 
              className="flex flex-wrap gap-1"
              role="list"
              aria-label="Medical conditions"
            >
              {client.medicalConditions?.slice(0, 3).map((condition, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300/50"
                  role="listitem"
                >
                  {condition}
                </Badge>
              ))}
              {client.medicalConditions && client.medicalConditions.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  role="listitem"
                  aria-label={`${client.medicalConditions.length - 3} additional medical conditions`}
                >
                  +{client.medicalConditions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Allergies */}
        {hasAllergies && (
          <div role="alert" aria-label="Client allergies">
            <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Allergies
            </h4>
            <div 
              className="flex flex-wrap gap-1"
              role="list"
              aria-label="Client allergies list"
            >
              {client.allergies?.slice(0, 3).map((allergy, index) => (
                <Badge 
                  key={index} 
                  variant="destructive" 
                  className="text-xs"
                  role="listitem"
                >
                  {allergy}
                </Badge>
              ))}
              {client.allergies && client.allergies.length > 3 && (
                <Badge 
                  variant="destructive" 
                  className="text-xs"
                  role="listitem"
                  aria-label={`${client.allergies.length - 3} additional allergies`}
                >
                  +{client.allergies.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        <div 
          className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200/50 shadow-sm"
          role="region"
          aria-labelledby={`client-${client.id}-emergency-contact`}
        >
          <h4 
            id={`client-${client.id}-emergency-contact`}
            className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-1"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            Emergency Contact
          </h4>
          <p className="text-sm text-orange-700 font-medium">{client.emergencyContactName}</p>
          <p className="text-sm text-orange-600">
            <a 
              href={`tel:${client.emergencyContactPhone}`}
              className="hover:underline focus:underline"
              aria-label={`Call emergency contact at ${client.emergencyContactPhone}`}
            >
              {client.emergencyContactPhone}
            </a>
          </p>
          {client.emergencyContactRelationship && (
            <p className="text-xs text-orange-600">{client.emergencyContactRelationship}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Born {format(new Date(client.dateOfBirth), 'MMM dd, yyyy')}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2" role="group" aria-label="Client actions">
          {onView && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onView(client)} 
              className="flex-1 hover:scale-105 transition-transform duration-200"
              aria-label={`View details for ${client.firstName} ${client.lastName}`}
            >
              View Details
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onEdit(client)} 
              className="flex-1 hover:scale-105 transition-transform duration-200"
              aria-label={`Edit information for ${client.firstName} ${client.lastName}`}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}