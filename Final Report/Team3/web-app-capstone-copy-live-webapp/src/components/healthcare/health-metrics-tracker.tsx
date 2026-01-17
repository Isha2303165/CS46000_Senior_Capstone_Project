'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Weight, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface HealthMetric {
  id: string;
  clientId: string;
  type: MetricType;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
  systolic?: number; // For blood pressure
  diastolic?: number; // For blood pressure
}

export enum MetricType {
  BLOOD_PRESSURE = 'blood_pressure',
  HEART_RATE = 'heart_rate',
  TEMPERATURE = 'temperature',
  WEIGHT = 'weight',
  BLOOD_SUGAR = 'blood_sugar',
  OXYGEN_SATURATION = 'oxygen_saturation',
}

interface HealthMetricsTrackerProps {
  clientId: string;
  clientName?: string;
}

export function HealthMetricsTracker({ clientId, clientName }: HealthMetricsTrackerProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>(MetricType.BLOOD_PRESSURE);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form state for adding new metrics
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    bloodSugar: '',
    oxygenSat: '',
    notes: '',
  });

  // Generate mock data for demonstration
  useEffect(() => {
    generateMockData();
  }, [clientId]);

  const generateMockData = () => {
    const mockMetrics: HealthMetric[] = [];
    const now = new Date();
    
    // Generate 30 days of mock data
    for (let i = 0; i < 30; i++) {
      const date = subDays(now, i);
      
      // Blood pressure
      mockMetrics.push({
        id: `bp_${i}`,
        clientId,
        type: MetricType.BLOOD_PRESSURE,
        value: 0,
        systolic: 110 + Math.floor(Math.random() * 30),
        diastolic: 70 + Math.floor(Math.random() * 20),
        unit: 'mmHg',
        recordedAt: date.toISOString(),
      });
      
      // Heart rate
      mockMetrics.push({
        id: `hr_${i}`,
        clientId,
        type: MetricType.HEART_RATE,
        value: 60 + Math.floor(Math.random() * 40),
        unit: 'bpm',
        recordedAt: date.toISOString(),
      });
      
      // Weight (weekly)
      if (i % 7 === 0) {
        mockMetrics.push({
          id: `weight_${i}`,
          clientId,
          type: MetricType.WEIGHT,
          value: 150 + Math.floor(Math.random() * 10),
          unit: 'lbs',
          recordedAt: date.toISOString(),
        });
      }
    }
    
    setMetrics(mockMetrics.sort((a, b) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    ));
  };

  const handleAddMetric = () => {
    const newMetric: Partial<HealthMetric> = {
      id: `metric_${Date.now()}`,
      clientId,
      type: selectedMetricType,
      recordedAt: new Date().toISOString(),
      notes: formData.notes,
    };

    switch (selectedMetricType) {
      case MetricType.BLOOD_PRESSURE:
        newMetric.systolic = Number(formData.systolic);
        newMetric.diastolic = Number(formData.diastolic);
        newMetric.unit = 'mmHg';
        break;
      case MetricType.HEART_RATE:
        newMetric.value = Number(formData.heartRate);
        newMetric.unit = 'bpm';
        break;
      case MetricType.TEMPERATURE:
        newMetric.value = Number(formData.temperature);
        newMetric.unit = '°F';
        break;
      case MetricType.WEIGHT:
        newMetric.value = Number(formData.weight);
        newMetric.unit = 'lbs';
        break;
      case MetricType.BLOOD_SUGAR:
        newMetric.value = Number(formData.bloodSugar);
        newMetric.unit = 'mg/dL';
        break;
      case MetricType.OXYGEN_SATURATION:
        newMetric.value = Number(formData.oxygenSat);
        newMetric.unit = '%';
        break;
    }

    setMetrics([newMetric as HealthMetric, ...metrics]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      systolic: '',
      diastolic: '',
      heartRate: '',
      temperature: '',
      weight: '',
      bloodSugar: '',
      oxygenSat: '',
      notes: '',
    });
  };

  const getLatestMetric = (type: MetricType) => {
    return metrics.find(m => m.type === type);
  };

  const getMetricTrend = (type: MetricType) => {
    const typeMetrics = metrics
      .filter(m => m.type === type)
      .slice(0, 7)
      .reverse();
    
    if (typeMetrics.length < 2) return null;
    
    const latest = typeMetrics[typeMetrics.length - 1];
    const previous = typeMetrics[typeMetrics.length - 2];
    
    const latestValue = type === MetricType.BLOOD_PRESSURE 
      ? latest.systolic || 0 
      : latest.value;
    const previousValue = type === MetricType.BLOOD_PRESSURE 
      ? previous.systolic || 0 
      : previous.value;
    
    return latestValue > previousValue ? 'up' : 'down';
  };

  const getChartData = (type: MetricType) => {
    return metrics
      .filter(m => m.type === type)
      .slice(0, 30)
      .reverse()
      .map(m => ({
        date: format(new Date(m.recordedAt), 'MM/dd'),
        value: m.value,
        systolic: m.systolic,
        diastolic: m.diastolic,
      }));
  };

  const getMetricStatus = (type: MetricType, metric?: HealthMetric) => {
    if (!metric) return 'unknown';
    
    switch (type) {
      case MetricType.BLOOD_PRESSURE:
        if (!metric.systolic || !metric.diastolic) return 'unknown';
        if (metric.systolic > 140 || metric.diastolic > 90) return 'high';
        if (metric.systolic < 90 || metric.diastolic < 60) return 'low';
        return 'normal';
      case MetricType.HEART_RATE:
        if (metric.value > 100) return 'high';
        if (metric.value < 60) return 'low';
        return 'normal';
      case MetricType.TEMPERATURE:
        if (metric.value > 100.4) return 'high';
        if (metric.value < 97) return 'low';
        return 'normal';
      case MetricType.OXYGEN_SATURATION:
        if (metric.value < 95) return 'low';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'low':
        return 'text-yellow-600 bg-yellow-50';
      case 'normal':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Health Metrics</CardTitle>
              <CardDescription>
                {clientName ? `Track vital signs and health data for ${clientName}` : 'Monitor and track vital health metrics'}
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reading
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blood-pressure">Blood Pressure</TabsTrigger>
          <TabsTrigger value="heart-rate">Heart Rate</TabsTrigger>
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="all">All Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blood Pressure Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  {getMetricTrend(MetricType.BLOOD_PRESSURE) === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Blood Pressure</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const latest = getLatestMetric(MetricType.BLOOD_PRESSURE);
                    return latest ? `${latest.systolic}/${latest.diastolic}` : '--/--';
                  })()}
                </p>
                <Badge className={cn("mt-2", getStatusColor(getMetricStatus(MetricType.BLOOD_PRESSURE, getLatestMetric(MetricType.BLOOD_PRESSURE))))}>
                  {getMetricStatus(MetricType.BLOOD_PRESSURE, getLatestMetric(MetricType.BLOOD_PRESSURE))}
                </Badge>
              </CardContent>
            </Card>

            {/* Heart Rate Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-pink-500" />
                  {getMetricTrend(MetricType.HEART_RATE) === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Heart Rate</p>
                <p className="text-2xl font-bold">
                  {getLatestMetric(MetricType.HEART_RATE)?.value || '--'} bpm
                </p>
                <Badge className={cn("mt-2", getStatusColor(getMetricStatus(MetricType.HEART_RATE, getLatestMetric(MetricType.HEART_RATE))))}>
                  {getMetricStatus(MetricType.HEART_RATE, getLatestMetric(MetricType.HEART_RATE))}
                </Badge>
              </CardContent>
            </Card>

            {/* Temperature Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="text-2xl font-bold">
                  {getLatestMetric(MetricType.TEMPERATURE)?.value || '--'} °F
                </p>
                <Badge className={cn("mt-2", getStatusColor(getMetricStatus(MetricType.TEMPERATURE, getLatestMetric(MetricType.TEMPERATURE))))}>
                  {getMetricStatus(MetricType.TEMPERATURE, getLatestMetric(MetricType.TEMPERATURE))}
                </Badge>
              </CardContent>
            </Card>

            {/* Weight Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Weight className="h-5 w-5 text-blue-500" />
                  {getMetricTrend(MetricType.WEIGHT) === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="text-2xl font-bold">
                  {getLatestMetric(MetricType.WEIGHT)?.value || '--'} lbs
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last: {getLatestMetric(MetricType.WEIGHT) ? format(new Date(getLatestMetric(MetricType.WEIGHT)!.recordedAt), 'MM/dd') : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blood Pressure Tab */}
        <TabsContent value="blood-pressure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData(MetricType.BLOOD_PRESSURE)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heart Rate Tab */}
        <TabsContent value="heart-rate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Heart Rate Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData(MetricType.HEART_RATE)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#ec4899" name="Heart Rate (bpm)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Metric Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Health Reading</DialogTitle>
            <DialogDescription>
              Record a new health metric reading
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Metric Type</Label>
              <select
                value={selectedMetricType}
                onChange={(e) => setSelectedMetricType(e.target.value as MetricType)}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value={MetricType.BLOOD_PRESSURE}>Blood Pressure</option>
                <option value={MetricType.HEART_RATE}>Heart Rate</option>
                <option value={MetricType.TEMPERATURE}>Temperature</option>
                <option value={MetricType.WEIGHT}>Weight</option>
                <option value={MetricType.BLOOD_SUGAR}>Blood Sugar</option>
                <option value={MetricType.OXYGEN_SATURATION}>Oxygen Saturation</option>
              </select>
            </div>

            {selectedMetricType === MetricType.BLOOD_PRESSURE && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Systolic</Label>
                  <Input
                    type="number"
                    value={formData.systolic}
                    onChange={(e) => setFormData({...formData, systolic: e.target.value})}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label>Diastolic</Label>
                  <Input
                    type="number"
                    value={formData.diastolic}
                    onChange={(e) => setFormData({...formData, diastolic: e.target.value})}
                    placeholder="80"
                  />
                </div>
              </div>
            )}

            {selectedMetricType === MetricType.HEART_RATE && (
              <div>
                <Label>Heart Rate (bpm)</Label>
                <Input
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({...formData, heartRate: e.target.value})}
                  placeholder="72"
                />
              </div>
            )}

            {selectedMetricType === MetricType.TEMPERATURE && (
              <div>
                <Label>Temperature (°F)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                  placeholder="98.6"
                />
              </div>
            )}

            {selectedMetricType === MetricType.WEIGHT && (
              <div>
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="150"
                />
              </div>
            )}

            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMetric}>
              Add Reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import cn utility
import { cn } from '@/lib/utils';