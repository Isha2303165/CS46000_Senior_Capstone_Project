'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Pill,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  Heart,
  Brain,
  Stethoscope,
  FileText,
  Download
} from 'lucide-react';
import { useClients } from '@/hooks/use-clients';
import { useMedications } from '@/hooks/use-medications';
import { useAppointments } from '@/hooks/use-appointments';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  
  const { clients } = useClients();
  const { medications } = useMedications();
  const { appointments } = useAppointments();

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!clients || !medications || !appointments) {
      return {
        totalClients: 0,
        activeClients: 0,
        totalMedications: 0,
        adherenceRate: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        averageWaitTime: 0,
        revenue: 0
      };
    }

    const now = new Date();
    const rangeStart = timeRange === '7d' ? subDays(now, 7) :
                      timeRange === '30d' ? subDays(now, 30) :
                      timeRange === '90d' ? subDays(now, 90) :
                      subDays(now, 365);

    // Filter data by time range
    const recentAppointments = appointments.filter(apt => 
      new Date(apt.scheduledAt) >= rangeStart
    );

    const activeMedications = medications.filter(med => 
      !med.endDate || new Date(med.endDate) >= now
    );

    return {
      totalClients: clients.length,
      activeClients: clients.filter(p => p.status === 'active').length,
      totalMedications: activeMedications.length,
      adherenceRate: 85, // Mock data
      totalAppointments: recentAppointments.length,
      completedAppointments: recentAppointments.filter(apt => apt.status === 'completed').length,
      averageWaitTime: 15, // Mock data in minutes
      revenue: 125000 // Mock data
    };
  }, [clients, medications, appointments, timeRange]);

  // Prepare chart data
  const appointmentTrends = useMemo(() => {
    if (!appointments) return [];

    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledAt);
        return aptDate.toDateString() === date.toDateString();
      });

      data.push({
        date: format(date, 'MMM dd'),
        total: dayAppointments.length,
        completed: dayAppointments.filter(apt => apt.status === 'completed').length,
        cancelled: dayAppointments.filter(apt => apt.status === 'cancelled').length
      });
    }

    return data;
  }, [appointments, timeRange]);

  const medicationCategories = useMemo(() => {
    if (!medications) return [];

    const categories: Record<string, number> = {};
    medications.forEach(med => {
      const category = med.category || 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / medications.length) * 100).toFixed(1)
    }));
  }, [medications]);

  const clientDemographics = useMemo(() => {
    if (!clients) return [];

    const ageGroups: Record<string, number> = {
      '0-17': 0,
      '18-34': 0,
      '35-49': 0,
      '50-64': 0,
      '65+': 0
    };

    clients.forEach(client => {
      const age = new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear();
      if (age < 18) ageGroups['0-17']++;
      else if (age < 35) ageGroups['18-34']++;
      else if (age < 50) ageGroups['35-49']++;
      else if (age < 65) ageGroups['50-64']++;
      else ageGroups['65+']++;
    });

    return Object.entries(ageGroups).map(([age, count]) => ({
      age,
      count,
      percentage: ((count / clients.length) * 100).toFixed(1)
    }));
  }, [clients]);

  const healthMetricsRadar = [
    { metric: 'Blood Pressure', value: 75 },
    { metric: 'Glucose', value: 82 },
    { metric: 'Cholesterol', value: 68 },
    { metric: 'BMI', value: 71 },
    { metric: 'Heart Rate', value: 88 },
    { metric: 'Activity', value: 65 }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const metricCards: MetricCard[] = [
    {
      title: 'Total Clients',
      value: metrics.totalClients,
      change: 12,
      changeType: 'increase',
      icon: <Users className="h-4 w-4" />,
      description: `${metrics.activeClients} active`
    },
    {
      title: 'Appointments',
      value: metrics.totalAppointments,
      change: 8,
      changeType: 'increase',
      icon: <Calendar className="h-4 w-4" />,
      description: `${metrics.completedAppointments} completed`
    },
    {
      title: 'Medications',
      value: metrics.totalMedications,
      change: 5,
      changeType: 'decrease',
      icon: <Pill className="h-4 w-4" />,
      description: `${metrics.adherenceRate}% adherence`
    },
    {
      title: 'Avg Wait Time',
      value: `${metrics.averageWaitTime} min`,
      change: 10,
      changeType: 'decrease',
      icon: <Clock className="h-4 w-4" />,
      description: 'Down from 17 min'
    }
  ];

  const exportData = () => {
    // Prepare data for export
    const exportData = {
      metrics,
      appointmentTrends,
      medicationCategories,
      clientDemographics,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Track key metrics and performance indicators</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-2 mt-2">
                {metric.changeType === 'increase' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : metric.changeType === 'decrease' ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : null}
                <span className={`text-xs ${
                  metric.changeType === 'increase' ? 'text-green-600' :
                  metric.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {metric.change}% from last period
                </span>
              </div>
              {metric.description && (
                <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="health">Health Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Trends</CardTitle>
              <CardDescription>Daily appointment statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={appointmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="2"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cancelled" 
                    stackId="3"
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Medication Categories</CardTitle>
                <CardDescription>Distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={medicationCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {medicationCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adherence Rates</CardTitle>
                <CardDescription>Medication compliance by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', rate: 82 },
                    { month: 'Feb', rate: 85 },
                    { month: 'Mar', rate: 87 },
                    { month: 'Apr', rate: 84 },
                    { month: 'May', rate: 88 },
                    { month: 'Jun', rate: 85 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Client age groups</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clientDemographics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Client gender breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: 45, percentage: '45' },
                        { name: 'Female', value: 52, percentage: '52' },
                        { name: 'Other', value: 3, percentage: '3' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#EC4899" />
                      <Cell fill="#8B5CF6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Metrics Overview</CardTitle>
              <CardDescription>Average client health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={healthMetricsRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Current" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6} 
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Depression'].map((condition, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{condition}</span>
                  <Badge variant="secondary">{15 - i * 2}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Provider Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'].map((provider, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{provider}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">{95 - i * 2}%</span>
                    {i < 2 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span>5 clients need follow-up</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-red-600" />
                <span>3 critical lab results</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Pill className="h-4 w-4 text-blue-600" />
                <span>12 prescriptions expiring</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-green-600" />
                <span>8 appointments today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}