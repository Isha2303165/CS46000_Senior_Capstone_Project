/**
 * Data Export Service
 * Handles exporting client data in various formats (JSON, CSV, PDF)
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { Client, Medication, Appointment } from '@/types';

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel'
}

export interface ExportOptions {
  format: ExportFormat;
  includeClients?: boolean;
  includeMedications?: boolean;
  includeAppointments?: boolean;
  includeHealthMetrics?: boolean;
  includeDocuments?: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  clientIds?: string[];
}

export interface ExportData {
  clients?: Client[];
  medications?: Medication[];
  appointments?: Appointment[];
  healthMetrics?: any[];
  documents?: any[];
  exportDate: string;
  exportedBy?: string;
}

class DataExportService {
  /**
   * Export data in the specified format
   */
  async exportData(
    data: ExportData,
    options: ExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case ExportFormat.JSON:
        return this.exportAsJSON(data);
      case ExportFormat.CSV:
        return this.exportAsCSV(data, options);
      case ExportFormat.PDF:
        return this.exportAsPDF(data, options);
      case ExportFormat.EXCEL:
        return this.exportAsExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export data as JSON
   */
  private exportAsJSON(data: ExportData): Blob {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Export data as CSV
   */
  private exportAsCSV(data: ExportData, options: ExportOptions): Blob {
    let csvContent = '';
    
    // Export Clients
    if (options.includeClients && data.clients && data.clients.length > 0) {
      csvContent += 'CLIENTS\n';
      csvContent += 'ID,First Name,Last Name,Date of Birth,Gender,Phone,Email,Address\n';
      
      data.clients.forEach(client => {
        csvContent += `"${client.id}","${client.firstName}","${client.lastName}",`;
        csvContent += `"${client.dateOfBirth}","${client.gender || ''}",`;
        csvContent += `"${client.phoneNumber || ''}","${client.email || ''}",`;
        csvContent += `"${client.address || ''}"\n`;
      });
      csvContent += '\n';
    }
    
    // Export Medications
    if (options.includeMedications && data.medications && data.medications.length > 0) {
      csvContent += 'MEDICATIONS\n';
      csvContent += 'ID,Client ID,Name,Dosage,Frequency,Start Date,End Date,Prescribing Doctor\n';
      
      data.medications.forEach(med => {
        csvContent += `"${med.id}","${med.clientId}","${med.name}",`;
        csvContent += `"${med.dosage} ${med.unit}","${med.frequency}",`;
        csvContent += `"${med.startDate}","${med.endDate || ''}",`;
        csvContent += `"${med.prescribingDoctor}"\n`;
      });
      csvContent += '\n';
    }
    
    // Export Appointments
    if (options.includeAppointments && data.appointments && data.appointments.length > 0) {
      csvContent += 'APPOINTMENTS\n';
      csvContent += 'ID,Client ID,Title,Date,Time,Provider,Location,Status\n';
      
      data.appointments.forEach(apt => {
        const aptDate = new Date(apt.scheduledAt);
        csvContent += `"${apt.id}","${apt.clientId}","${apt.title}",`;
        csvContent += `"${format(aptDate, 'yyyy-MM-dd')}","${format(aptDate, 'HH:mm')}",`;
        csvContent += `"${apt.provider || ''}","${apt.location || ''}",`;
        csvContent += `"${apt.status}"\n`;
      });
      csvContent += '\n';
    }
    
    return new Blob([csvContent], { type: 'text/csv' });
  }

  /**
   * Export data as PDF
   */
  private exportAsPDF(data: ExportData, options: ExportOptions): Blob {
    const pdf = new jsPDF();
    let yPosition = 20;
    
    // Title
    pdf.setFontSize(20);
    pdf.text('Healthcare Data Export', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Export date
    pdf.setFontSize(10);
    pdf.text(`Export Date: ${data.exportDate}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Clients Section
    if (options.includeClients && data.clients && data.clients.length > 0) {
      pdf.setFontSize(14);
      pdf.text('Clients', 20, yPosition);
      yPosition += 10;
      
      const clientData = data.clients.map(p => [
        p.firstName + ' ' + p.lastName,
        p.dateOfBirth,
        p.gender || 'N/A',
        p.phoneNumber || 'N/A',
        p.email || 'N/A'
      ]);
      
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Name', 'DOB', 'Gender', 'Phone', 'Email']],
        body: clientData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }
    
    // Medications Section
    if (options.includeMedications && data.medications && data.medications.length > 0) {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('Medications', 20, yPosition);
      yPosition += 10;
      
      const medData = data.medications.map(m => [
        m.name,
        `${m.dosage} ${m.unit}`,
        m.frequency,
        format(new Date(m.startDate), 'MM/dd/yyyy'),
        m.prescribingDoctor
      ]);
      
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Medication', 'Dosage', 'Frequency', 'Start Date', 'Doctor']],
        body: medData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }
    
    // Appointments Section
    if (options.includeAppointments && data.appointments && data.appointments.length > 0) {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('Appointments', 20, yPosition);
      yPosition += 10;
      
      const aptData = data.appointments.map(a => [
        a.title,
        format(new Date(a.scheduledAt), 'MM/dd/yyyy HH:mm'),
        a.provider || 'N/A',
        a.location || 'N/A',
        a.status
      ]);
      
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Title', 'Date & Time', 'Provider', 'Location', 'Status']],
        body: aptData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Convert PDF to blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  }

  /**
   * Export data as Excel (using CSV format that Excel can open)
   */
  private exportAsExcel(data: ExportData, options: ExportOptions): Blob {
    // For simplicity, we'll create a CSV that Excel can open
    // In production, you'd use a library like xlsx for proper Excel format
    return this.exportAsCSV(data, options);
  }

  /**
   * Generate filename for export
   */
  generateFilename(format: ExportFormat): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const extension = format === ExportFormat.EXCEL ? 'csv' : format;
    return `healthcare_export_${timestamp}.${extension}`;
  }

  /**
   * Download exported file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const dataExportService = new DataExportService();

/**
 * React hook for data export
 */
export function useDataExport() {
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const exportData = async (
    data: ExportData,
    options: ExportOptions
  ): Promise<boolean> => {
    setExporting(true);
    setError(null);

    try {
      const blob = await dataExportService.exportData(data, options);
      const filename = dataExportService.generateFilename(options.format);
      dataExportService.downloadFile(blob, filename);
      return true;
    } catch (err: any) {
      setError(err.message || 'Export failed');
      return false;
    } finally {
      setExporting(false);
    }
  };

  return {
    exportData,
    exporting,
    error,
  };
}

// Import React for the hook
import React from 'react';