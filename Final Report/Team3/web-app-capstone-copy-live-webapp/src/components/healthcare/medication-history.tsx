'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Pill,
  Calendar,
  Clock,
  User,
  Search,
  Filter
} from 'lucide-react';
import { format, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';
import { useMedicationLogs } from '@/hooks/use-medications';
import type { MedicationLog, MedicationLogStatus } from '@/types';

interface MedicationHistoryProps {
  medicationId: string;
  medicationName: string;
  className?: string;
}

type FilterPeriod = 'all' | 'today' | 'yesterday' | 'week' | 'month';
type FilterStatus = 'all' | 'taken' | 'missed' | 'skipped' | 'partial';

export function MedicationHistory({ 
  medicationId, 
  medicationName, 
  className 
}: MedicationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const { data: logs = [], isLoading, error } = useMedicationLogs(medicationId);

  const getStatusIcon = (status: MedicationLogStatus) => {
    switch (status) {
      case 'taken':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'partial':
        return <Pill className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: MedicationLogStatus) => {
    switch (status) {
      case 'taken':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Taken</Badge>;
      case 'missed':
        return <Badge variant="destructive">Missed</Badge>;
      case 'skipped':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Skipped</Badge>;
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatLogDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM dd, yyyy h:mm a');
  };

  const filterLogs = (logs: MedicationLog[]) => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.sideEffectsNoted?.some(effect => 
          effect.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date();
      filtered = filtered.filter(log => {
        const logDate = new Date(log.takenAt);
        switch (filterPeriod) {
          case 'today':
            return isToday(logDate);
          case 'yesterday':
            return isYesterday(logDate);
          case 'week':
            return logDate >= startOfWeek(now) && logDate <= endOfWeek(now);
          case 'month':
            return logDate.getMonth() === now.getMonth() && 
                   logDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    return filtered.sort((a, b) => 
      new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    );
  };

  const filteredLogs = filterLogs(logs);

  // Calculate statistics
  const stats = logs.reduce((acc, log) => {
    acc.total++;
    acc[log.status]++;
    return acc;
  }, {
    total: 0,
    taken: 0,
    missed: 0,
    skipped: 0,
    partial: 0,
  });

  const adherenceRate = stats.total > 0 
    ? Math.round(((stats.taken + stats.partial) / stats.total) * 100)
    : 0;

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading medication history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          {medicationName} History
        </CardTitle>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-blue-600">Total Logs</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{adherenceRate}%</p>
            <p className="text-sm text-green-600">Adherence</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
            <p className="text-sm text-red-600">Missed</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.skipped}</p>
            <p className="text-sm text-yellow-600">Skipped</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notes or side effects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="taken">Taken</option>
              <option value="missed">Missed</option>
              <option value="skipped">Skipped</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {logs.length === 0 ? 'No medication logs yet.' : 'No logs match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="border-l-4 border-l-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(log.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(log.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatLogDate(log.takenAt)}
                          </span>
                        </div>
                        
                        {log.dosageTaken && (
                          <p className="text-sm font-medium mb-1">
                            Dosage: {log.dosageTaken}
                          </p>
                        )}
                        
                        {log.scheduledFor && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Scheduled for: {format(new Date(log.scheduledFor), 'h:mm a')}
                          </p>
                        )}
                        
                        {log.notes && (
                          <p className="text-sm text-gray-700 mb-2">
                            {log.notes}
                          </p>
                        )}
                        
                        {log.sideEffectsNoted && log.sideEffectsNoted.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-sm text-muted-foreground mr-2">
                              Side effects:
                            </span>
                            {log.sideEffectsNoted.map((effect, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {effect}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}