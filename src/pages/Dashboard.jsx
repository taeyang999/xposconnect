import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Calendar, Package, FileText, 
  TrendingUp, Clock, AlertCircle, CheckCircle2,
  ArrowRight, Activity
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [user, setUser] = useState(null);

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
    queryFn: async () => {
      const result = isAdmin
        ? await base44.entities.Customer.list('-created_date', 100)
        : await base44.entities.Customer.filter({ assigned_employee: user?.email }, '-created_date', 100);
      return result || [];
    },
    enabled: !!user && isAdmin !== undefined,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => isAdmin
      ? base44.entities.ScheduleEvent.list('-start_datetime', 50)
      : base44.entities.ScheduleEvent.filter({ assigned_employee: user?.email }, '-start_datetime', 50),
    enabled: !!user,
  });

  const { data: serviceLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['serviceLogs'],
    queryFn: () => isAdmin
      ? base44.entities.ServiceLog.list('-created_date', 50)
      : base44.entities.ServiceLog.filter({ assigned_employee: user?.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      if (isAdmin) {
        return await base44.entities.InventoryItem.list('-created_date', 100);
      } else {
        const assignedCustomers = await base44.entities.Customer.filter({ assigned_employee: user?.email });
        const customerIds = assignedCustomers.map(c => c.id);
        const allInventory = await base44.entities.InventoryItem.list('-created_date', 100);
        return allInventory.filter(item => customerIds.includes(item.customer_id));
      }
    },
    enabled: !!user && isAdmin !== undefined,
  });

  const upcomingEvents = events
    .filter(e => new Date(e.start_datetime) >= new Date() && e.status !== 'cancelled')
    .slice(0, 5);

  const recentLogs = serviceLogs.slice(0, 5);

  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const pendingServices = serviceLogs.filter(l => l.status === 'scheduled' || l.status === 'in_progress').length;
  const maintenanceItems = inventory.filter(i => i.status === 'maintenance').length;

  // Alerts logic
  const todayEvents = events.filter(e => {
    const eventDate = parseISO(e.start_datetime);
    return isToday(eventDate) && e.status !== 'cancelled';
  });

  const expiringWarranties = inventory.filter(item => {
    if (!item.warranty_expiry) return false;
    const expiry = parseISO(item.warranty_expiry);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= new Date();
  });

  const overdueServices = serviceLogs.filter(log => {
    if (!log.service_date || log.status === 'completed' || log.status === 'cancelled') return false;
    return parseISO(log.service_date) < new Date();
  });

  const getEventDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600',
    confirmed: 'bg-indigo-100 text-indigo-700',
  };

  const isLoading = loadingCustomers || loadingEvents || loadingLogs || loadingInventory;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Alerts Section */}
      {!isLoading && (todayEvents.length > 0 || expiringWarranties.length > 0 || overdueServices.length > 0) && (
        <Card className="mb-8 border-l-4 border-l-amber-500 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Alerts & Reminders</h3>
                <p className="text-sm text-slate-600">Important items that need your attention</p>
              </div>
            </div>
            <div className="space-y-2">
              {todayEvents.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-slate-900">{todayEvents.length} event{todayEvents.length > 1 ? 's' : ''} scheduled for today</span>
                </div>
              )}
              {overdueServices.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-slate-900">{overdueServices.length} overdue service{overdueServices.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {expiringWarranties.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-slate-900">{expiringWarranties.length} warrant{expiringWarranties.length > 1 ? 'ies' : 'y'} expiring soon</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Active Customers"
              value={activeCustomers}
              icon={Users}
              iconClassName="bg-blue-50"
            />
            <StatCard
              title="Upcoming Events"
              value={upcomingEvents.length}
              icon={Calendar}
              iconClassName="bg-purple-50"
            />
            <StatCard
              title="Pending Services"
              value={pendingServices}
              icon={Clock}
              iconClassName="bg-amber-50"
            />
            <StatCard
              title="Items in Maintenance"
              value={maintenanceItems}
              icon={AlertCircle}
              iconClassName="bg-red-50"
            />
          </>
        )}
      </div>

      {/* Today's Schedule Highlight */}
      {!isLoading && todayEvents.length > 0 && (
        <Card className="mb-8 border-slate-200/80 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-white shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900">{event.title}</p>
                    <p className="text-sm text-slate-500">{event.location || 'No location'}</p>
                  </div>
                  <Badge className={statusColors[event.status] || statusColors.scheduled}>
                    {event.status}
                  </Badge>
                </div>
              ))}
              {todayEvents.length > 3 && (
                <Link to={createPageUrl('Schedule')}>
                  <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700">
                    View all {todayEvents.length} events <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Upcoming Schedule</CardTitle>
            <Link to={createPageUrl('Schedule')}>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingEvents ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-slate-500">{format(parseISO(event.start_datetime), 'MMM')}</span>
                    <span className="text-lg font-bold text-slate-900">{format(parseISO(event.start_datetime), 'd')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{event.title}</p>
                    <p className="text-sm text-slate-500">
                      {format(parseISO(event.start_datetime), 'h:mm a')} • {getEventDateLabel(event.start_datetime)}
                    </p>
                  </div>
                  <Badge className={statusColors[event.status] || statusColors.scheduled}>
                    {event.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Service Logs</CardTitle>
            <Link to={createPageUrl('ServiceLogs')}>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingLogs ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 transition-colors">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    log.status === 'completed' ? 'bg-emerald-100' : 
                    log.status === 'in_progress' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    {log.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : log.status === 'in_progress' ? (
                      <Activity className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{log.title}</p>
                    <p className="text-sm text-slate-500">
                      {log.service_date && format(parseISO(log.service_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge className={statusColors[log.status] || statusColors.scheduled}>
                    {log.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No service logs yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to={createPageUrl('Customers') + '?action=new'}>
              <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-slate-900">Add Customer</p>
              </div>
            </Link>
            <Link to={createPageUrl('Schedule') + '?action=new'}>
              <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium text-slate-900">Schedule Event</p>
              </div>
            </Link>
            <Link to={createPageUrl('ServiceLogs') + '?action=new'}>
              <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="text-sm font-medium text-slate-900">Add Service Log</p>
              </div>
            </Link>
            <Link to={createPageUrl('Inventory') + '?action=new'}>
              <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm font-medium text-slate-900">Add Inventory</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}