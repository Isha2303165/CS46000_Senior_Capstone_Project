'use client';

import React, { useState } from 'react';
import { 
  dataExportService, 
  ExportFormat, 
  ExportOptions,
  ExportData,
  useDataExport
} from '@/lib/data-export';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  Table,
  Calendar as CalendarIcon,
  Users,
  Pill,
  CalendarDays,
  Activity,
  FileBox,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/use-clients';
import { useMedications } from '@/hooks/use-medications';
import { useAppointments } from '@/hooks/use-appointments';
import type { Client, Medication, Appointment } from '@/types';

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClientId?: string;
}

export function DataExportDialog({ 
  open, 
  onOpenChange,
  selectedClientId 
}: DataExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.JSON);
  const [includeClients, setIncludeClients] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeHealthMetrics, setIncludeHealthMetrics] = useState(false);
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(
    selectedClientId ? [selectedClientId] : []
  );
  const [exportSuccess, setExportSuccess] = useState(false);

  const { clients } = useClients();
  const { medications } = useMedications();
  const { appointments } = useAppointments();
  const { exportData, exporting, error } = useDataExport();

  const handleExport = async () => {
    // Filter data based on selections
    let filteredClients: Client[] = [];
    let filteredMedications: Medication[] = [];
    let filteredAppointments: Appointment[] = [];

    // Filter clients
    if (includeClients && clients) {
      filteredClients = selectedClientIds.length > 0
        ? clients.filter(p => selectedClientIds.includes(p.id))
        : clients;
    }

    // Filter medications
    if (includeMedications && medications) {
      filteredMedications = selectedClientIds.length > 0
        ? medications.filter(m => selectedClientIds.includes(m.clientId))
        : medications;

      // Apply date range filter
      if (dateRange.from) {
        filteredMedications = filteredMedications.filter(m => {
          const medDate = new Date(m.startDate);
          if (dateRange.from && medDate < dateRange.from) return false;
          if (dateRange.to && medDate > dateRange.to) return false;
          return true;
        });
      }
    }

    // Filter appointments
    if (includeAppointments && appointments) {
      filteredAppointments = selectedClientIds.length > 0
        ? appointments.filter(a => selectedClientIds.includes(a.clientId))
        : appointments;

      // Apply date range filter
      if (dateRange.from) {
        filteredAppointments = filteredAppointments.filter(a => {
          const aptDate = new Date(a.scheduledAt);
          if (dateRange.from && aptDate < dateRange.from) return false;
          if (dateRange.to && aptDate > dateRange.to) return false;
          return true;
        });
      }
    }

    // Prepare export data
    const exportDataObj: ExportData = {
      exportDate: new Date().toISOString(),
      exportedBy: 'System User', // Would get from auth context
    };

    if (includeClients) exportDataObj.clients = filteredClients;
    if (includeMedications) exportDataObj.medications = filteredMedications;
    if (includeAppointments) exportDataObj.appointments = filteredAppointments;
    if (includeHealthMetrics) exportDataObj.healthMetrics = []; // Would fetch from API
    if (includeDocuments) exportDataObj.documents = []; // Would fetch from API

    // Prepare export options
    const options: ExportOptions = {
      format: exportFormat,
      includeClients,
      includeMedications,
      includeAppointments,
      includeHealthMetrics,
      includeDocuments,
      dateRange: dateRange.from ? {
        startDate: dateRange.from,
        endDate: dateRange.to || new Date()
      } : undefined,
      clientIds: selectedClientIds.length > 0 ? selectedClientIds : undefined,
    };

    // Export data
    const success = await exportData(exportDataObj, options);
    
    if (success) {
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onOpenChange(false);
      }, 2000);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case ExportFormat.JSON:
        return <FileJson className="h-4 w-4" />;
      case ExportFormat.CSV:
        return <FileSpreadsheet className="h-4 w-4" />;
      case ExportFormat.PDF:
        return <FileText className="h-4 w-4" />;
      case ExportFormat.EXCEL:
        return <Table className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case ExportFormat.JSON:
        return 'Machine-readable format for developers';
      case ExportFormat.CSV:
        return 'Spreadsheet compatible, opens in Excel';
      case ExportFormat.PDF:
        return 'Formatted document for printing/sharing';
      case ExportFormat.EXCEL:
        return 'Excel spreadsheet format';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Healthcare Data
          </DialogTitle>
          <DialogDescription>
            Choose what data to export and in which format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              {Object.values(ExportFormat).map((format) => (
                <div key={format} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={format} id={format} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={format} className="flex items-center gap-2 cursor-pointer">
                      {getFormatIcon(format)}
                      <span className="font-medium">{format.toUpperCase()}</span>
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {getFormatDescription(format)}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Data Types Selection */}
          <div className="space-y-3">
            <Label>Data to Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <Checkbox 
                  id="clients" 
                  checked={includeClients} 
                  onCheckedChange={(checked) => setIncludeClients(checked as boolean)}
                />
                <Label 
                  htmlFor="clients" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Users className="h-4 w-4" />
                  Client Information
                  {clients && (
                    <span className="text-sm text-gray-500">({clients.length} records)</span>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <Checkbox 
                  id="medications" 
                  checked={includeMedications} 
                  onCheckedChange={(checked) => setIncludeMedications(checked as boolean)}
                />
                <Label 
                  htmlFor="medications" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Pill className="h-4 w-4" />
                  Medications
                  {medications && (
                    <span className="text-sm text-gray-500">({medications.length} records)</span>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <Checkbox 
                  id="appointments" 
                  checked={includeAppointments} 
                  onCheckedChange={(checked) => setIncludeAppointments(checked as boolean)}
                />
                <Label 
                  htmlFor="appointments" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <CalendarDays className="h-4 w-4" />
                  Appointments
                  {appointments && (
                    <span className="text-sm text-gray-500">({appointments.length} records)</span>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <Checkbox 
                  id="healthMetrics" 
                  checked={includeHealthMetrics} 
                  onCheckedChange={(checked) => setIncludeHealthMetrics(checked as boolean)}
                />
                <Label 
                  htmlFor="healthMetrics" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Activity className="h-4 w-4" />
                  Health Metrics
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <Checkbox 
                  id="documents" 
                  checked={includeDocuments} 
                  onCheckedChange={(checked) => setIncludeDocuments(checked as boolean)}
                />
                <Label 
                  htmlFor="documents" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <FileBox className="h-4 w-4" />
                  Medical Documents
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label>Date Range (Optional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'PPP') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'PPP') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {exportSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Export completed successfully!</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={exporting || (!includeClients && !includeMedications && !includeAppointments && !includeHealthMetrics && !includeDocuments)}
          >
            {exporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}