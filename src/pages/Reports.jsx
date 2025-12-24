import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, FileText, Package, Calendar, TrendingUp,
  ArrowUp, ArrowDown, Download, Shield
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';

export default function Reports() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('3months');

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    enabled: isAdmin,
  });

  const { data: serviceLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['serviceLogs'],
    queryFn: () => base44.entities.ServiceLog.list(),
    enabled: isAdmin,
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list(),
    enabled: isAdmin,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.ScheduleEvent.list(),
    enabled: isAdmin,
  });

  const isLoading = loadingCustomers || loadingLogs || loadingInventory || loadingEvents;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500">Only administrators can access reports.</p>
        </div>
      </div>
    );
  }

  // Date range calculation
  const getDateRange = () => {
    const end = new Date();
    let start;
    switch (dateRange) {
      case '1month':
        start = subMonths(end, 1);
        break;
      case '3months':
        start = subMonths(end, 3);
        break;
      case '6months':
        start = subMonths(end, 6);
        break;
      case '1year':
        start = subMonths(end, 12);
        break;
      default:
        start = subMonths(end, 3);
    }
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Filter data by date range
  const filteredLogs = serviceLogs.filter(log => {
    if (!log.service_date) return false;
    const date = parseISO(log.service_date);
    return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
  });

  // Calculate statistics
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const completedServices = filteredLogs.filter(l => l.status === 'completed').length;
  const pendingServices = filteredLogs.filter(l => l.status === 'scheduled' || l.status === 'in_progress').length;
  const activeInventory = inventory.filter(i => i.status === 'active').length;

  // Service status distribution
  const serviceStatusData = [
    { name: 'Completed', value: filteredLogs.filter(l => l.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: filteredLogs.filter(l => l.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Scheduled', value: filteredLogs.filter(l => l.status === 'scheduled').length, color: '#3b82f6' },
    { name: 'Cancelled', value: filteredLogs.filter(l => l.status === 'cancelled').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  // Customer status distribution
  const customerStatusData = [
    { name: 'Active', value: customers.filter(c => c.status === 'active').length, color: '#10b981' },
    { name: 'Inactive', value: customers.filter(c => c.status === 'inactive').length, color: '#6b7280' },
    { name: 'Prospect', value: customers.filter(c => c.status === 'prospect').length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Monthly service trends
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthLogs = serviceLogs.filter(log => {
        if (!log.service_date) return false;
        const date = parseISO(log.service_date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      months.push({
        name: format(month, 'MMM'),
        services: monthLogs.length,
        completed: monthLogs.filter(l => l.status === 'completed').length,
      });
    }
    return months;
  };

  const monthlyData = getMonthlyData();

  // Inventory status
  const inventoryStatusData = [
    { name: 'Active', value: inventory.filter(i => i.status === 'active').length, color: '#10b981' },
    { name: 'Maintenance', value: inventory.filter(i => i.status === 'maintenance').length, color: '#f59e0b' },
    { name: 'Retired', value: inventory.filter(i => i.status === 'retired').length, color: '#ef4444' },
    { name: 'Pending', value: inventory.filter(i => i.status === 'pending').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const exportReport = () => {
    const report = {
      generated: new Date().toISOString(),
      dateRange,
      summary: {
        totalCustomers: customers.length,
        activeCustomers,
        totalServices: filteredLogs.length,
        completedServices,
        pendingServices,
        totalInventory: inventory.length,
        activeInventory,
      },
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Overview of your business performance"
        actions={
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} variant="outline" className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Customers"
              value={customers.length}
              icon={Users}
              iconClassName="bg-blue-50"
              trend={`${activeCustomers} active`}
              trendUp={true}
            />
            <StatCard
              title="Services Completed"
              value={completedServices}
              icon={FileText}
              iconClassName="bg-emerald-50"
              trend={`${pendingServices} pending`}
              trendUp={completedServices > pendingServices}
            />
            <StatCard
              title="Inventory Items"
              value={inventory.length}
              icon={Package}
              iconClassName="bg-purple-50"
              trend={`${activeInventory} active`}
              trendUp={true}
            />
            <StatCard
              title="Scheduled Events"
              value={events.filter(e => e.status === 'scheduled' || e.status === 'confirmed').length}
              icon={Calendar}
              iconClassName="bg-amber-50"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Service Trends */}
            <Card className="border-slate-200/80">
              <CardHeader>
                <CardTitle className="text-lg">Service Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="services" name="Total Services" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Status Distribution */}
            <Card className="border-slate-200/80">
              <CardHeader>
                <CardTitle className="text-lg">Service Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={serviceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {serviceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px'
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Status */}
            <Card className="border-slate-200/80">
              <CardHeader>
                <CardTitle className="text-lg">Customer Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={customerStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {customerStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px'
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Inventory Status */}
            <Card className="border-slate-200/80">
              <CardHeader>
                <CardTitle className="text-lg">Inventory Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={inventoryStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {inventoryStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px'
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}