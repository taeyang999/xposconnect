import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Grid3X3, List, Download, SlidersHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import CustomerCard from '@/components/customers/CustomerCard';
import CustomerForm from '@/components/customers/CustomerForm';
import AdvancedCustomerFilters from '@/components/filters/AdvancedCustomerFilters';

export default function Customers() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    businessType: 'all',
    assignedEmployee: 'all',
    hasHotspot: 'all',
    isDisabled: 'all',
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

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const result = await base44.entities.Customer.list('-created_date');
      return result || [];
    },
    enabled: !!user,
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesBusinessType = advancedFilters.businessType === 'all' || customer.business_type === advancedFilters.businessType;
    const matchesEmployee = advancedFilters.assignedEmployee === 'all' || customer.assigned_employee === advancedFilters.assignedEmployee;
    const matchesHotspot = advancedFilters.hasHotspot === 'all' || String(customer.has_hotspot) === advancedFilters.hasHotspot;
    const matchesDisabled = advancedFilters.isDisabled === 'all' || String(customer.is_disabled) === advancedFilters.isDisabled;
    return matchesSearch && matchesStatus && matchesBusinessType && matchesEmployee && matchesHotspot && matchesDisabled;
  });

  const activeAdvancedFilterCount = Object.values(advancedFilters).filter(v => v !== 'all').length;

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (deleteCustomer) {
      await base44.entities.Customer.delete(deleteCustomer.id);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteCustomer(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const exportCustomers = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Status', 'Assigned To'];
    const rows = filteredCustomers.map(c => [
      c.name, c.email, c.phone, c.address, c.city, c.state, c.zip_code, c.status, c.assigned_employee
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer relationships"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search customers..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
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
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={exportCustomers} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Customer List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={searchQuery || statusFilter !== 'all' ? Search : Plus}
          title={searchQuery || statusFilter !== 'all' ? 'No customers found' : 'No customers yet'}
          description={searchQuery || statusFilter !== 'all' 
            ? 'Try adjusting your search or filters'
            : 'Get started by adding your first customer'
          }
          action={
            !searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            )
          }
        />
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={handleEdit}
              onDelete={setDeleteCustomer}
            />
          ))}
        </div>
      )}

      {/* Customer Form Dialog */}
      <CustomerForm
        open={showForm}
        onClose={handleFormClose}
        customer={editingCustomer}
        onSave={handleSave}
      />

      {/* Advanced Filters */}
      <AdvancedCustomerFilters
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCustomer?.name}"? This will also remove all associated service logs, inventory, and photos. This action cannot be undone.
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