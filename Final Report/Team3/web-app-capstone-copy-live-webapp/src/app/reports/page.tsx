'use client';

import React, { useState, useMemo } from 'react';
import { PageErrorBoundary } from '@/components/error/page-error-boundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Pill,
  Heart,
  Activity,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Filter,
  Printer,
  AlertCircle
} from 'lucide-react';
import { useClients } from '@/hooks/use-clients';
import { useAppointments } from '@/hooks/use-appointments';
import { useMedications } from '@/hooks/use-medications';
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear, isAfter } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function ReportsContent() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { data: medications = [], isLoading: medicationsLoading } = useMedications();
  const { toast } = useToast();

  // Get the date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        return startOfWeek(now);
      case 'month':
        return startOfMonth(now);
      case 'quarter':
        return startOfQuarter(now);
      case 'year':
        return startOfYear(now);
      default:
        return startOfMonth(now);
    }
  };

  const periodStart = getDateRange();

  // Calculate real statistics from actual data
  const stats = useMemo(() => {
    const activeClients = clients.filter(p => p.isActive);
    const periodAppointments = appointments.filter(a => 
      new Date(a.scheduledAt) >= periodStart
    );
    const completedAppointments = periodAppointments.filter(a => a.status === 'completed');
    const upcomingAppointments = appointments.filter(a => 
      a.status === 'scheduled' && new Date(a.scheduledAt) > new Date()
    );
    const cancelledAppointments = periodAppointments.filter(a => a.status === 'cancelled');
    const noShowAppointments = periodAppointments.filter(a => a.status === 'no_show');
    
    // Calculate new clients added in the period
    const newClients = clients.filter(p => 
      p.createdAt && new Date(p.createdAt) >= periodStart
    );

    // Calculate average age
    const clientsWithAge = clients.filter(p => p.dateOfBirth);
    const averageAge = clientsWithAge.length > 0 
      ? Math.round(
          clientsWithAge.reduce((sum, p) => {
            const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
            return sum + age;
          }, 0) / clientsWithAge.length
        )
      : 0;

    // Count medications by client
    const medicationsByClient = medications.reduce((acc, med) => {
      if (med.isActive) {
        acc[med.clientId] = (acc[med.clientId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Attendance rate
    const totalScheduledAppointments = periodAppointments.filter(a => 
      a.status === 'completed' || a.status === 'no_show'
    ).length;
    const attendanceRate = totalScheduledAppointments > 0
      ? Math.round((completedAppointments.length / totalScheduledAppointments) * 100)
      : 0;

    return {
      totalClients: clients.length,
      activeClients: activeClients.length,
      newClients: newClients.length,
      averageAge,
      totalAppointments: periodAppointments.length,
      completedAppointments: completedAppointments.length,
      upcomingAppointments: upcomingAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      noShowAppointments: noShowAppointments.length,
      attendanceRate,
      totalMedications: medications.filter(m => m.isActive).length,
      medicationsByClient,
      clientsWithEmergencyContacts: clients.filter(p => p.emergencyContactName).length,
    };
  }, [clients, appointments, medications, periodStart]);

  // Export functions with real data
  const generateCSVData = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (filename: string, data: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = (type: string) => {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      
      switch (type) {
        case 'comprehensive':
        case 'summary': {
          const summaryData = [{
            Period: selectedPeriod,
            'Total Clients': stats.totalClients,
            'Active Clients': stats.activeClients,
            'New Clients': stats.newClients,
            'Average Age': stats.averageAge,
            'Total Appointments': stats.totalAppointments,
            'Completed Appointments': stats.completedAppointments,
            'Attendance Rate': `${stats.attendanceRate}%`,
            'Total Medications': stats.totalMedications,
            'Emergency Contacts': stats.clientsWithEmergencyContacts,
          }];
          const csv = generateCSVData(summaryData, Object.keys(summaryData[0]));
          downloadCSV(`healthcare_summary_${timestamp}.csv`, csv);
          break;
        }
        
        case 'clients': {
          const clientData = clients.map(client => ({
            'Client ID': client.id,
            'First Name': client.firstName,
            'Last Name': client.lastName,
            'Date of Birth': client.dateOfBirth || 'N/A',
            'Gender': client.gender || 'N/A',
            'Status': client.isActive ? 'Active' : 'Inactive',
            'Emergency Contact': client.emergencyContactName || 'N/A',
            'Emergency Phone': client.emergencyContactPhone || 'N/A',
            'Insurance Provider': client.insuranceProvider || 'N/A',
            'Insurance Policy': client.insurancePolicyNumber || 'N/A',
            'Medical Conditions': client.medicalConditions?.join('; ') || 'None',
            'Allergies': client.allergies?.join('; ') || 'None',
            'Medications Count': stats.medicationsByClient[client.id] || 0,
          }));
          const csv = generateCSVData(clientData, Object.keys(clientData[0]));
          downloadCSV(`client_report_${timestamp}.csv`, csv);
          break;
        }
        
        case 'medications': {
          const medicationData = medications
            .filter(med => med.isActive)
            .map(med => {
              const client = clients.find(p => p.id === med.clientId);
              return {
                'Medication ID': med.id,
                'Client Name': client ? `${client.firstName} ${client.lastName}` : 'Unknown',
                'Medication Name': med.name,
                'Generic Name': med.genericName || 'N/A',
                'Dosage': med.dosage,
                'Frequency': med.frequency,
                'Route': med.route || 'Oral',
                'Start Date': med.startDate || 'N/A',
                'End Date': med.endDate || 'Ongoing',
                'Prescribed By': med.prescribedBy || 'N/A',
                'Instructions': med.instructions || 'N/A',
              };
            });
          const csv = generateCSVData(medicationData, Object.keys(medicationData[0] || {}));
          downloadCSV(`medication_report_${timestamp}.csv`, csv);
          break;
        }
        
        case 'appointments': {
          const appointmentData = appointments.map(apt => {
            const client = clients.find(p => p.id === apt.clientId);
            return {
              'Appointment ID': apt.id,
              'Client Name': client ? `${client.firstName} ${client.lastName}` : 'Unknown',
              'Date': format(new Date(apt.scheduledAt), 'yyyy-MM-dd'),
              'Time': format(new Date(apt.scheduledAt), 'HH:mm'),
              'Duration': `${apt.duration} minutes`,
              'Type': apt.appointmentType || 'General',
              'Status': apt.status,
              'Provider': apt.provider || 'N/A',
              'Location': apt.location || 'N/A',
              'Notes': apt.notes || 'N/A',
            };
          });
          const csv = generateCSVData(appointmentData, Object.keys(appointmentData[0] || {}));
          downloadCSV(`appointment_report_${timestamp}.csv`, csv);
          break;
        }
        
        default:
          throw new Error('Unknown report type');
      }
      
      toast({
        title: 'Report exported',
        description: `${type} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export the report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const isLoading = clientsLoading || appointmentsLoading || medicationsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time healthcare data and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrintReport}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              onClick={() => handleExportReport('comprehensive')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                  <p className="text-xs text-green-600">
                    {stats.activeClients} active
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Appointments</p>
                  <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                  <p className="text-xs text-blue-600">
                    {stats.upcomingAppointments} upcoming
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Medications</p>
                  <p className="text-2xl font-bold">{stats.totalMedications}</p>
                  <p className="text-xs text-purple-600">
                    Active prescriptions
                  </p>
                </div>
                <Pill className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                  <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                  <p className="text-xs text-orange-600">
                    {stats.completedAppointments} completed
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Period Selector */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Report Period</CardTitle>
                  <div className="flex gap-2">
                    {['week', 'month', 'quarter', 'year'].map(period => (
                      <Button
                        key={period}
                        size="sm"
                        variant={selectedPeriod === period ? 'default' : 'outline'}
                        onClick={() => setSelectedPeriod(period)}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Healthcare Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Healthcare Summary Report
                </CardTitle>
                <CardDescription>
                  Comprehensive overview for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Client Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">New clients added:</span>
                        <span className="font-medium">{stats.newClients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active clients:</span>
                        <span className="font-medium">{stats.activeClients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average age:</span>
                        <span className="font-medium">
                          {stats.averageAge > 0 ? `${stats.averageAge} years` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Care Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total medications managed:</span>
                        <span className="font-medium">{stats.totalMedications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Appointments scheduled:</span>
                        <span className="font-medium">{stats.upcomingAppointments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Emergency contacts:</span>
                        <span className="font-medium">{stats.clientsWithEmergencyContacts}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('summary')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Period Insights */}
            {stats.totalClients === 0 && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No data available yet. Add clients and appointments to see insights.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Client Report
                </CardTitle>
                <CardDescription>
                  Detailed client information and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No clients found. Add clients to see them in the report.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left py-2">Client Name</th>
                              <th className="text-left py-2">Age</th>
                              <th className="text-left py-2">Status</th>
                              <th className="text-left py-2">Medications</th>
                              <th className="text-left py-2">Emergency Contact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clients.slice(0, 10).map(client => (
                              <tr key={client.id} className="border-b">
                                <td className="py-2">{client.firstName} {client.lastName}</td>
                                <td className="py-2">
                                  {client.dateOfBirth ? 
                                    new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()
                                    : 'N/A'
                                  }
                                </td>
                                <td className="py-2">
                                  <Badge variant={client.isActive ? 'default' : 'secondary'}>
                                    {client.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td className="py-2">{stats.medicationsByClient[client.id] || 0}</td>
                                <td className="py-2">{client.emergencyContactName || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {clients.length > 10 && (
                        <p className="text-sm text-gray-500 text-center">
                          Showing 10 of {clients.length} clients. Export to see all.
                        </p>
                      )}
                    </>
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleExportReport('clients')}
                      disabled={clients.length === 0}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export Client Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Medication Report
                </CardTitle>
                <CardDescription>
                  Active medications and prescriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.totalMedications === 0 ? (
                    <div className="text-center py-8">
                      <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No active medications found.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-3xl font-bold text-purple-600">{stats.totalMedications}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Active Medications</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {Object.keys(stats.medicationsByClient).length}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clients on Meds</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">
                            {stats.medicationsByClient[Object.keys(stats.medicationsByClient)[0]] || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Max per Client</p>
                        </div>
                      </div>
                      
                      {/* Medication frequency analysis */}
                      <div className="pt-4">
                        <h4 className="font-semibold mb-3">Medication Summary</h4>
                        <div className="space-y-2">
                          {medications
                            .filter(m => m.isActive)
                            .slice(0, 5)
                            .map((med, idx) => {
                              const client = clients.find(p => p.id === med.clientId);
                              return (
                                <div key={med.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div>
                                    <span className="text-sm font-medium">{med.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">{med.dosage}</span>
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {client ? `${client.firstName} ${client.lastName}` : 'Unknown'}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleExportReport('medications')}
                      disabled={stats.totalMedications === 0}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export Medication Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointment Report
                </CardTitle>
                <CardDescription>
                  Appointment statistics and attendance rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No appointments found.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">{stats.completedAppointments}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">{stats.upcomingAppointments}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-3xl font-bold text-red-600">{stats.cancelledAppointments}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-3xl font-bold text-orange-600">{stats.noShowAppointments}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">No Shows</p>
                        </div>
                      </div>

                      {/* Recent appointments */}
                      <div className="pt-4">
                        <h4 className="font-semibold mb-3">Recent Appointments</h4>
                        <div className="space-y-2">
                          {appointments
                            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                            .slice(0, 5)
                            .map(apt => {
                              const client = clients.find(p => p.id === apt.clientId);
                              return (
                                <div key={apt.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div>
                                    <span className="text-sm font-medium">
                                      {client ? `${client.firstName} ${client.lastName}` : 'Unknown'}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {format(new Date(apt.scheduledAt), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                  <Badge variant={
                                    apt.status === 'completed' ? 'default' :
                                    apt.status === 'scheduled' ? 'secondary' :
                                    apt.status === 'cancelled' ? 'destructive' : 'outline'
                                  }>
                                    {apt.status}
                                  </Badge>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleExportReport('appointments')}
                      disabled={appointments.length === 0}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export Appointment Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PageErrorBoundary pageName="Reports">
      <ReportsContent />
    </PageErrorBoundary>
  );
}