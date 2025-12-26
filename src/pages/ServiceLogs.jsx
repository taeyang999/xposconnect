import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Calendar, User, Building2,
  MoreVertical, Pencil, Trash2, Eye, Download, SlidersHorizontal
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ServiceLogForm from '@/components/servicelogs/ServiceLogForm';
import AdvancedServiceLogFilters from '@/components/filters/AdvancedServiceLogFilters';

export default function ServiceLogs() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [deleteLog, setDeleteLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    assignedEmployee: 'all',
    customer: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: serviceLogs = [], isLoading } = useQuery({
    queryKey: ['serviceLogs'],
    queryFn: async () => {
      const result = await base44.entities.ServiceLog.list('-service_date');
      return result || [];
    },
    enabled: !!user,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list(),
  });

  const getCustomerName = (customerId) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };

  const getEmployeeInitials = (email) => {
    const emp = employees.find(e => e.email === email);
    if (emp?.firstname && emp?.lastname) {
      return `${emp.firstname.charAt(0)}${emp.lastname.charAt(0)}`.toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const getEmployeeName = (email) => {
    const emp = employees.find(e => e.email === email);
    if (emp?.firstname && emp?.lastname) {
      return `${emp.firstname} ${emp.lastname}`;
    }
    return emp?.full_name || email;
  };

  const filteredLogs = serviceLogs.filter(log => {
    const matchesSearch = 
      log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(log.customer_id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesEmployee = advancedFilters.assignedEmployee === 'all' || log.assigned_employee === advancedFilters.assignedEmployee;
    const matchesCustomer = advancedFilters.customer === 'all' || log.customer_id === advancedFilters.customer;
    const matchesDateFrom = !advancedFilters.dateFrom || log.service_date >= advancedFilters.dateFrom;
    const matchesDateTo = !advancedFilters.dateTo || log.service_date <= advancedFilters.dateTo;
    return matchesSearch && matchesStatus && matchesEmployee && matchesCustomer && matchesDateFrom && matchesDateTo;
  });

  const activeAdvancedFilterCount = Object.entries(advancedFilters).filter(([key, value]) => {
    if (key === 'dateFrom' || key === 'dateTo') return value !== '';
    return value !== 'all';
  }).length;

  const handleDelete = async () => {
    if (deleteLog) {
      await base44.entities.ServiceLog.delete(deleteLog.id);
      queryClient.invalidateQueries({ queryKey: ['serviceLogs'] });
      setDeleteLog(null);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const exportLogs = () => {
    const headers = ['Title', 'Customer', 'Date', 'Status', 'Assigned To', 'Description'];
    const rows = filteredLogs.map(l => [
      l.title,
      getCustomerName(l.customer_id),
      l.service_date,
      l.status,
      l.assigned_employee,
      l.description
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service-logs.csv';
    a.click();
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600',
  };

  return (
    <div>
      <PageHeader
        title="Service Logs"
        description="Track and manage all service activities"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Service Log
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedFilters(true)} 
            className="rounded-xl relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeAdvancedFilterCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-slate-900 text-white text-xs">
                {activeAdvancedFilterCount}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={exportLogs} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Service Logs Table */}
      <Card className="overflow-hidden border-slate-200/80">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={searchQuery || statusFilter !== 'all' ? Search : Plus}
            title={searchQuery || statusFilter !== 'all' ? 'No logs found' : 'No service logs yet'}
            description={searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first service log to get started'
            }
            action={
              !searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service Log
                </Button>
              )
            }
            className="py-16"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{log.title}</p>
                      {log.description && (
                        <p className="text-sm text-slate-500 truncate max-w-xs">{log.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link 
                      to={createPageUrl('CustomerDetail') + `?id=${log.customer_id}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Building2 className="h-4 w-4" />
                      {getCustomerName(log.customer_id)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {log.service_date && format(parseISO(log.service_date), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[log.status] || statusColors.scheduled}>
                      {log.status?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.assigned_employee && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-slate-800 text-white text-[10px] font-medium">
                          {getEmployeeInitials(log.assigned_employee)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => handleEdit(log)} className="cursor-pointer rounded-lg">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteLog(log)}
                          className="cursor-pointer rounded-lg text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Service Log Form */}
      <ServiceLogForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingLog(null); }}
        serviceLog={editingLog}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['serviceLogs'] })}
      />

      {/* Advanced Filters */}
      <AdvancedServiceLogFilters
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLog} onOpenChange={() => setDeleteLog(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteLog?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-lg">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}