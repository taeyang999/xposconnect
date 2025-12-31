import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Mail, Phone, MapPin, User, Calendar,
  FileText, Package, Image, Pencil, Plus, Trash2, 
  MoreVertical, Upload, X, Eye, Download, Building2,
  CreditCard, Wifi, ShieldAlert, Ban, Paperclip, Clock, ChevronDown
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getAuditLogs } from '../components/audit/auditLogger';
import AuditLogViewer from '../components/audit/AuditLogViewer';
import { format, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomerForm from '@/components/customers/CustomerForm';
import ServiceLogForm from '@/components/servicelogs/ServiceLogForm.jsx';
import InventoryForm from '@/components/inventory/InventoryForm.jsx';
import PhotoUploader from '@/components/customers/PhotoUploader.jsx';
import ServiceLogComments from '@/components/servicelogs/ServiceLogComments.jsx';

export default function CustomerDetail() {
  const [customerId, setCustomerId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showServiceLogForm, setShowServiceLogForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [editingServiceLog, setEditingServiceLog] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [photoCategoryFilter, setPhotoCategoryFilter] = useState('all');
  const [viewServiceLogFromPhoto, setViewServiceLogFromPhoto] = useState(null);
  const [openSections, setOpenSections] = useState({
    service: true,
    inventory: false,
    photos: false,
    audit: false,
  });
  const queryClient = useQueryClient();

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setCustomerId(urlParams.get('id'));
  }, []);

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => base44.entities.Customer.filter({ id: customerId }),
    enabled: !!customerId,
    select: (data) => data[0],
  });

  const { data: serviceLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['serviceLogs', customerId],
    queryFn: () => base44.entities.ServiceLog.filter({ customer_id: customerId }, '-service_date'),
    enabled: !!customerId,
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ['inventory', customerId],
    queryFn: () => base44.entities.InventoryItem.filter({ customer_id: customerId }, '-created_date'),
    enabled: !!customerId,
  });

  const { data: photos = [], isLoading: loadingPhotos } = useQuery({
    queryKey: ['photos', customerId],
    queryFn: () => base44.entities.CustomerPhoto.filter({ customer_id: customerId }, '-created_date'),
    enabled: !!customerId,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs', 'Customer', customerId],
    queryFn: () => getAuditLogs('Customer', customerId),
    enabled: !!customerId,
  });

  const getEmployeeInitials = (email) => {
    const emp = employees.find(e => e.email === email);
    if (emp?.firstname && emp?.lastname) {
      return `${emp.firstname.charAt(0)}${emp.lastname.charAt(0)}`.toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleDelete = async () => {
    if (deleteItem && deleteType) {
      if (deleteType === 'serviceLog') {
        // Delete associated schedule event if exists
        if (deleteItem.schedule_event_id) {
          await base44.entities.ScheduleEvent.delete(deleteItem.schedule_event_id);
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
        await base44.entities.ServiceLog.delete(deleteItem.id);
        queryClient.invalidateQueries({ queryKey: ['serviceLogs', customerId] });
      } else if (deleteType === 'inventory') {
        await base44.entities.InventoryItem.delete(deleteItem.id);
        queryClient.invalidateQueries({ queryKey: ['inventory', customerId] });
      } else if (deleteType === 'photo') {
        await base44.entities.CustomerPhoto.delete(deleteItem.id);
        queryClient.invalidateQueries({ queryKey: ['photos', customerId] });
      }
      setDeleteItem(null);
      setDeleteType(null);
    }
  };

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    prospect: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600',
    maintenance: 'bg-amber-100 text-amber-700',
    retired: 'bg-red-100 text-red-700',
    pending: 'bg-purple-100 text-purple-700',
  };

  if (loadingCustomer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Customer not found</p>
        <Link to={createPageUrl('Customers')}>
          <Button variant="link">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={createPageUrl('Customers')} className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Customers
      </Link>

      {/* Customer Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white font-bold text-2xl">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={statusColors[customer.status] || statusColors.active}>
                  {customer.status || 'active'}
                </Badge>
                {customer.is_disabled && (
                  <Badge className="bg-red-100 text-red-700">
                    <Ban className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
                {customer.has_hotspot && (
                  <Badge className="bg-green-100 text-green-700">
                    <Wifi className="h-3 w-3 mr-1" />
                    Hotspot
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => setShowEditForm(true)} variant="outline" className="rounded-xl">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
        </div>

        {/* Owner & Business Info */}
        {(customer.owner_firstname || customer.owner_lastname || customer.corporation || customer.business_type) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            {(customer.owner_firstname || customer.owner_lastname) && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Owner</p>
                  <p className="text-sm font-medium text-slate-900">
                    {[customer.owner_firstname, customer.owner_lastname].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>
            )}
            {customer.corporation && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Building2 className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Corporation</p>
                  <p className="text-sm font-medium text-slate-900">{customer.corporation}</p>
                </div>
              </div>
            )}
            {customer.business_type && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Building2 className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Business Type</p>
                  <p className="text-sm font-medium text-slate-900">{customer.business_type}</p>
                </div>
              </div>
            )}
            {customer.merchant_id && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <CreditCard className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Merchant ID</p>
                  <p className="text-sm font-medium text-slate-900">{customer.merchant_id}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
          {customer.email && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Mail className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Primary Email</p>
                <p className="text-sm font-medium text-slate-900">{customer.email}</p>
              </div>
            </div>
          )}
          {customer.email_1 && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Mail className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email #1</p>
                <p className="text-sm font-medium text-slate-900">{customer.email_1}</p>
              </div>
            </div>
          )}
          {customer.email_2 && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Mail className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email #2</p>
                <p className="text-sm font-medium text-slate-900">{customer.email_2}</p>
              </div>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Phone className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Primary Phone</p>
                <p className="text-sm font-medium text-slate-900">{customer.phone}</p>
              </div>
            </div>
          )}
          {customer.cell_phone_1 && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Phone className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Cell #1</p>
                <p className="text-sm font-medium text-slate-900">{customer.cell_phone_1}</p>
              </div>
            </div>
          )}
          {customer.cell_phone_2 && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Phone className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Cell #2</p>
                <p className="text-sm font-medium text-slate-900">{customer.cell_phone_2}</p>
              </div>
            </div>
          )}
          {(customer.city || customer.state) && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <MapPin className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-medium text-slate-900">
                  {[customer.city, customer.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
          {customer.platform && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Platform</p>
                <p className="text-sm font-medium text-slate-900">{customer.platform}</p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
          {customer.assigned_employee && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-800 text-white text-xs font-medium">
                  {getEmployeeInitials(customer.assigned_employee)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-slate-500">Assigned To</p>
                <p className="text-sm font-medium text-slate-900">{customer.assigned_employee}</p>
              </div>
            </div>
          )}
          {customer.pci_expire_date && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <ShieldAlert className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">PCI Expire Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {format(parseISO(customer.pci_expire_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>

        {customer.notes && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="bg-slate-100/80 rounded-xl p-1">
          <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-white">
            <FileText className="h-4 w-4 mr-2" />
            Service Logs ({serviceLogs.length})
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-white">
            <Package className="h-4 w-4 mr-2" />
            Inventory ({inventory.length})
          </TabsTrigger>
          <TabsTrigger value="photos" className="rounded-lg data-[state=active]:bg-white">
            <Image className="h-4 w-4 mr-2" />
            Photos ({photos.length})
          </TabsTrigger>
        </TabsList>

        {/* Service Logs Tab */}
        <TabsContent value="services">
          <Card className="border-slate-200/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Service History</CardTitle>
              <Button onClick={() => setShowServiceLogForm(true)} className="bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Service Log
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : serviceLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>No service logs yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-start justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 transition-colors cursor-pointer"
                      onClick={() => { setEditingServiceLog(log); setShowServiceLogForm(true); }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-slate-900">{log.title}</h4>
                          <Badge className={statusColors[log.status] || statusColors.scheduled}>
                            {log.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        {log.description && (
                          <p className="text-sm text-slate-600 mb-2">{log.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                         <span className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {log.service_date && format(parseISO(log.service_date), 'MMM d, yyyy')}
                         </span>
                         {log.assigned_employee && (
                           <span className="flex items-center gap-1">
                             <Avatar className="h-4 w-4">
                               <AvatarFallback className="bg-slate-800 text-white text-[8px] font-medium">
                                 {getEmployeeInitials(log.assigned_employee)}
                               </AvatarFallback>
                             </Avatar>
                             {log.assigned_employee}
                           </span>
                         )}
                         {photos.filter(p => p.service_log_id === log.id).length > 0 && (
                           <span className="flex items-center gap-1">
                             <Paperclip className="h-3 w-3" />
                             {photos.filter(p => p.service_log_id === log.id).length} attachment(s)
                           </span>
                         )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); setDeleteItem(log); setDeleteType('serviceLog'); }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card className="border-slate-200/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned Inventory</CardTitle>
              <Button onClick={() => setShowInventoryForm(true)} className="bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {loadingInventory ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : inventory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>No inventory items assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inventory.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-slate-900">{item.name}</h4>
                          <Badge className={statusColors[item.status] || statusColors.active}>
                            {item.status}
                          </Badge>
                          <span className="text-sm text-slate-500">Qty: {item.quantity || 1}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {item.serial_number && <span>S/N: {item.serial_number}</span>}
                          {item.warranty_expiry && (
                            <span>Warranty: {format(parseISO(item.warranty_expiry), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingInventory(item); setShowInventoryForm(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setDeleteItem(item); setDeleteType('inventory'); }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card className="border-slate-200/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Photos & Documents</CardTitle>
                <Select value={photoCategoryFilter} onValueChange={setPhotoCategoryFilter}>
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowPhotoUploader(true)} className="bg-slate-900 hover:bg-slate-800">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPhotos ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : photos.filter(p => photoCategoryFilter === 'all' || p.category === photoCategoryFilter).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Image className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>No photos uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.filter(p => photoCategoryFilter === 'all' || p.category === photoCategoryFilter).map((photo) => (
                   <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                     <img 
                       src={photo.file_url} 
                       alt={photo.title || 'Photo'} 
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <Button 
                         size="icon" 
                         variant="secondary" 
                         className="h-8 w-8"
                         onClick={() => setViewPhoto(photo)}
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button 
                         size="icon" 
                         variant="secondary" 
                         className="h-8 w-8"
                         onClick={() => { setDeleteItem(photo); setDeleteType('photo'); }}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                       {photo.title && (
                         <p className="text-white text-xs font-medium truncate">{photo.title}</p>
                       )}
                       {photo.service_log_id && (
                         <p className="text-white/80 text-[10px] truncate flex items-center gap-1">
                           <FileText className="h-2 w-2" />
                           Linked to service log
                         </p>
                       )}
                     </div>
                   </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activity History Section */}
      <div className="mt-6">
        <Collapsible open={openSections.audit} onOpenChange={() => toggleSection('audit')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-slate-50 rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Clock className="h-5 w-5 text-slate-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">Activity History</h3>
                  <p className="text-sm text-slate-500">{auditLogs.length} activities recorded</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${openSections.audit ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <AuditLogViewer logs={auditLogs} />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Forms and Dialogs */}
      <CustomerForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        customer={customer}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
          queryClient.invalidateQueries({ queryKey: ['auditLogs', 'Customer', customerId] });
        }}
      />

      <ServiceLogForm
        open={showServiceLogForm}
        onClose={() => { setShowServiceLogForm(false); setEditingServiceLog(null); }}
        serviceLog={editingServiceLog}
        customerId={customerId}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['serviceLogs', customerId] });
          queryClient.invalidateQueries({ queryKey: ['photos', customerId] });
        }}
      />

      <InventoryForm
        open={showInventoryForm}
        onClose={() => { setShowInventoryForm(false); setEditingInventory(null); }}
        inventoryItem={editingInventory}
        customerId={customerId}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['inventory', customerId] })}
      />

      <PhotoUploader
        open={showPhotoUploader}
        onClose={() => setShowPhotoUploader(false)}
        customerId={customerId}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['photos', customerId] })}
      />

      {/* Photo Viewer */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewPhoto?.title || 'Photo'}</DialogTitle>
            {viewPhoto?.description && (
              <p className="text-sm text-slate-500">{viewPhoto.description}</p>
            )}
          </DialogHeader>
          {viewPhoto && (
            <div className="space-y-4">
              <img 
                src={viewPhoto.file_url} 
                alt={viewPhoto.title || 'Photo'} 
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />
              {viewPhoto.service_log_id && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 mb-1">Linked to Service Log</p>
                      <p className="text-xs text-slate-500">
                        {serviceLogs.find(l => l.id === viewPhoto.service_log_id)?.title || 'Service Log'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const log = serviceLogs.find(l => l.id === viewPhoto.service_log_id);
                        if (log) {
                          setViewServiceLogFromPhoto(log);
                          setViewPhoto(null);
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Service Log
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Log Viewer from Photo */}
      <Dialog open={!!viewServiceLogFromPhoto} onOpenChange={() => setViewServiceLogFromPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Log Details</DialogTitle>
          </DialogHeader>
          {viewServiceLogFromPhoto && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-900">{viewServiceLogFromPhoto.title}</h3>
                <Badge className={statusColors[viewServiceLogFromPhoto.status] || statusColors.scheduled}>
                  {viewServiceLogFromPhoto.status?.replace('_', ' ')}
                </Badge>
              </div>
              
              {viewServiceLogFromPhoto.description && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{viewServiceLogFromPhoto.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Service Date</p>
                  <p className="text-sm text-slate-900 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {viewServiceLogFromPhoto.service_date && format(parseISO(viewServiceLogFromPhoto.service_date), 'MMM d, yyyy')}
                  </p>
                </div>
                
                {viewServiceLogFromPhoto.assigned_employee && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Assigned To</p>
                    <p className="text-sm text-slate-900 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-slate-800 text-white text-[10px] font-medium">
                          {getEmployeeInitials(viewServiceLogFromPhoto.assigned_employee)}
                        </AvatarFallback>
                      </Avatar>
                      {viewServiceLogFromPhoto.assigned_employee}
                    </p>
                  </div>
                )}
              </div>

              {viewServiceLogFromPhoto.notes && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{viewServiceLogFromPhoto.notes}</p>
                </div>
              )}

              {photos.filter(p => p.service_log_id === viewServiceLogFromPhoto.id).length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Service Attachments ({photos.filter(p => p.service_log_id === viewServiceLogFromPhoto.id).length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.filter(p => p.service_log_id === viewServiceLogFromPhoto.id).map((photo) => (
                      <div 
                        key={photo.id} 
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer hover:opacity-80"
                        onClick={() => {
                          setViewServiceLogFromPhoto(null);
                          setViewPhoto(photo);
                        }}
                      >
                        <img 
                          src={photo.file_url} 
                          alt={photo.title || 'Attachment'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <ServiceLogComments serviceLogId={viewServiceLogFromPhoto.id} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewServiceLogFromPhoto(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setEditingServiceLog(viewServiceLogFromPhoto);
                    setShowServiceLogForm(true);
                    setViewServiceLogFromPhoto(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Service Log
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => { setDeleteItem(null); setDeleteType(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteType?.replace(/([A-Z])/g, ' $1').trim()}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
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