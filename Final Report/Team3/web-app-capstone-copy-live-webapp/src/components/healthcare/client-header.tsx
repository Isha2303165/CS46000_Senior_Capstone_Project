'use client';

import React from 'react';
import { Edit, Download, ChevronDown, FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Client } from '@/types';

interface ClientHeaderProps {
  client: Client;
  onEdit: () => void;
  onExport: (format: 'pdf' | 'csv' | 'print') => void;
  loading?: boolean;
}

export function ClientHeader({ client, onEdit, onExport, loading = false }: ClientHeaderProps) {
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Generate initials for avatar fallback
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format gender for display
  const formatGender = (gender?: string): string => {
    if (!gender) return 'Not specified';
    
    const genderMap: Record<string, string> = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      prefer_not_to_say: 'Prefer not to say',
    };
    
    return genderMap[gender] || gender;
  };

  const age = calculateAge(client.dateOfBirth);
  const initials = getInitials(client.firstName, client.lastName);

  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Client Info Section */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage 
              src={client.profilePicture} 
              alt={`${client.firstName} ${client.lastName}`}
            />
            <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>Age: {age}</span>
              <span>•</span>
              <span>{formatGender(client.gender)}</span>
              {client.medicalRecordNumber && (
                <>
                  <span>•</span>
                  <span>MRN: {client.medicalRecordNumber}</span>
                </>
              )}
            </div>
            
            {/* Critical Alerts - Allergies */}
            {client.allergies && client.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs font-medium text-red-700 mr-1">Allergies:</span>
                {client.allergies.slice(0, 3).map((allergy, index) => (
                  <Badge 
                    key={index} 
                    variant="destructive" 
                    className="text-xs px-2 py-0.5"
                  >
                    {allergy}
                  </Badge>
                ))}
                {client.allergies.length > 3 && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    +{client.allergies.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex items-center gap-2"
            aria-label={`Edit ${client.firstName} ${client.lastName}'s information`}
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Client</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default"
                className="flex items-center gap-2"
                aria-label={`Export ${client.firstName} ${client.lastName}'s data`}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export Data</span>
                <span className="sm:hidden">Export</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => onExport('pdf')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onExport('csv')}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onExport('print')}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Summary
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}