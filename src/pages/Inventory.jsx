import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logAudit } from '../components/audit/auditLogger';
import { usePermissions } from '@/components/hooks/usePermissions';
import { 
  Plus, Search, Filter, Package, Building2,
  MoreVertical, Pencil, Trash2, Download, AlertTriangle
} from 'lucide-react';
import { format, parseISO, isBefore, addMonths } from 'date-fns';
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
import InventoryForm from '@/components/inventory/InventoryForm';

export default function Inventory() {
  const { user, permissions, isAdmin, isManager } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, []);

  const canView = isAdmin || isManager || permissions?.can_view_inventory;
  const canManage = isAdmin || isManager || permissions?.can_manage_inventory;
  const canDelete = isAdmin || isManager || permissions?.can_delete_inventory;

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      return await base44.entities.InventoryItem.list('-created_date');
    },
    enabled: !!user && canView,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const getCustomerName = (customerId) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };

  const filteredItems = inventory.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(item.customer_id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (deleteItem) {
      await base44.entities.InventoryItem.delete(deleteItem.id);
      await logAudit('InventoryItem', deleteItem.id, deleteItem.name, 'delete', {}, 'Inventory item deleted');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setDeleteItem(null);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const exportInventory = () => {
    const headers = ['Name', 'Customer', 'Serial Number', 'Quantity', 'Status', 'Purchase Date', 'Warranty Expiry'];
    const rows = filteredItems.map(i => [
      i.name,
      getCustomerName(i.customer_id),
      i.serial_number,
      i.quantity,
      i.status,
      i.purchase_date,
      i.warranty_expiry
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
  };

  const isWarrantyExpiringSoon = (date) => {
    if (!date) return false;
    const expiryDate = parseISO(date);
    const threeMonthsFromNow = addMonths(new Date(), 3);
    return isBefore(expiryDate, threeMonthsFromNow);
  };

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    maintenance: 'bg-amber-100 text-amber-700',
    retired: 'bg-red-100 text-red-700',
    pending: 'bg-purple-100 text-purple-700',
  };

  if (user && !canView) {
    return (
      <div>
        <PageHeader
          title="Inventory"
          description="Manage equipment and items assigned to customers"
        />
        <Card className="p-12 text-center border-slate-200/80">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h3>
            <p className="text-slate-600">
              You don't have permission to access inventory. Please contact your administrator if you need access.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage equipment and items assigned to customers"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search inventory..."
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
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportInventory} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="overflow-hidden border-slate-200/80">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={searchQuery || statusFilter !== 'all' ? Search : Package}
            title={searchQuery || statusFilter !== 'all' ? 'No items found' : 'No inventory items yet'}
            description={searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Add your first inventory item to get started'
            }
            action={
              !searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )
            }
            className="py-16"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Item</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100">
                        <Package className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-slate-500 truncate max-w-xs">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link 
                      to={createPageUrl('CustomerDetail') + `?id=${item.customer_id}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Building2 className="h-4 w-4" />
                      {getCustomerName(item.customer_id)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {item.serial_number || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-900 font-medium">
                    {item.quantity || 1}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[item.status] || statusColors.active}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.warranty_expiry ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          {format(parseISO(item.warranty_expiry), 'MMM d, yyyy')}
                        </span>
                        {isWarrantyExpiringSoon(item.warranty_expiry) && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
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
                        <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer rounded-lg">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteItem(item)}
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

      {/* Inventory Form */}
      <InventoryForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingItem(null); }}
        inventoryItem={editingItem}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['inventory'] })}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
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