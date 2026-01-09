import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/hooks/usePermissions';
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
  const { user, permissions, isAdmin } = usePermissions();
  const canManageCustomers = isAdmin || permissions?.can_manage_customers;
  const canDeleteCustomers = isAdmin || permissions?.can_delete_customers;
  const canManageServiceLogs = isAdmin || permissions?.can_manage_service_logs;
  const canDeleteServiceLogs = isAdmin || permissions?.can_delete_service_logs;
  const canManageInventory = isAdmin || permissions?.can_manage_inventory;
  const canDeleteInventory = isAdmin || permissions?.can_delete_inventory;

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
    queryFn: () => base44.functions.getEmployeesForAssignment(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs', 'Customer', customerId],
    queryFn: () => getAuditLogs('Customer', customerId),
    enabled: !!customerId,
  });

  const { data: layoutConfig } = useQuery({
    queryKey: ['customerLayoutConfig'],
    queryFn: async () => {
      const configs = await base44.entities.CustomerLayoutConfig.filter({ config_name: 'default' });
      return configs?.[0] || null;
    },
  });

  // Helper to check if section/field is visible
  const isSectionVisible = (sectionId) => {
    if (!layoutConfig?.sections) return true;
    const section = layoutConfig.sections.find(s => s.id === sectionId);
    return section?.visible !== false;
  };

  const isFieldVisible = (fieldId) => {
    if (!layoutConfig?.fields) return true;
    const field = layoutConfig.fields.find(f => f.id === fieldId);
    return field?.visible !== false;
  };

  const getSectionOrder = () => {
    if (!layoutConfig?.sections) return ['owner_business', 'contact', 'additional', 'notes'];
    return layoutConfig.sections
      .filter(s => s.visible !== false)
      .sort((a, b) => a.order - b.order)
      .map(s => s.id);
  };

  const getFieldsForSection = (sectionId) => {
    if (!layoutConfig?.fields) return null;
    return layoutConfig.fields
      .filter(f => f.section === sectionId && f.visible !== false)
      .sort((a, b) => a.order - b.order)
      .map(f => f.id);
  };

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
    new: 'bg-purple-100 text-purple-700',
    scheduled: 'bg-blue-100 text-blue-700',
    assigned: 'bg-indigo-100 text-indigo-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    on_hold: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-slate-100 text-slate-600',
    maintenance: 'bg-amber-100 text-amber-700',
    retired: 'bg-red-100 text-red-700',
    pending: 'bg-purple-100 text-purple-700',
  };

  // Memoize filtered photos to avoid recalculating on each render
  const filteredPhotos = useMemo(() => 
    photos.filter(p => photoCategoryFilter === 'all' || p.category === photoCategoryFilter),
    [photos, photoCategoryFilter]
  );

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
          {canManageCustomers && (
            <Button onClick={() => setShowEditForm(true)} variant="outline" className="rounded-xl">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
          )}
        </div>

        {/* Dynamic Sections based on layout config */}
        {getSectionOrder().map((sectionId) => {
          if (sectionId === 'owner_business' && isSectionVisible('owner_business')) {
            const orderedFields = getFieldsForSection('owner_business') || ['owner', 'corporation', 'business_type', 'merchant_id'];
            const fieldComponents = {
              owner: (
                <div key="owner" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Owner</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {[customer.owner_firstname, customer.owner_lastname].filter(Boolean).join(' ')}
                    </p>
                  </div>
                </div>
              ),
              corporation: (
                <div key="corporation" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Corporation</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.corporation || ''}</p>
                  </div>
                </div>
              ),
              business_type: (
                <div key="business_type" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Business Type</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.business_type || ''}</p>
                  </div>
                </div>
              ),
              merchant_id: (
                <div key="merchant_id" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <CreditCard className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Merchant ID</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.merchant_id || ''}</p>
                  </div>
                </div>
              ),
            };
            return (
              <div key="owner_business" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                {orderedFields.map(fieldId => fieldComponents[fieldId])}
              </div>
            );
          }

          if (sectionId === 'contact' && isSectionVisible('contact')) {
            const orderedFields = getFieldsForSection('contact') || ['email', 'secondary_email', 'store_phone', 'owner_phone_1', 'owner_phone_2', 'location', 'platform'];
            const fieldComponents = {
              email: (
                <div key="email" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Primary Email</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.email || ''}</p>
                  </div>
                </div>
              ),
              secondary_email: (
                <div key="secondary_email" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Secondary Email</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.secondary_email || ''}</p>
                  </div>
                </div>
              ),
              store_phone: (
                <div key="store_phone" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Store Phone</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.store_phone || ''}</p>
                  </div>
                </div>
              ),
              owner_phone_1: (
                <div key="owner_phone_1" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Owner's Phone #1</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.owner_phone_1 || ''}</p>
                  </div>
                </div>
              ),
              owner_phone_2: (
                <div key="owner_phone_2" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Owner's Phone #2</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.owner_phone_2 || ''}</p>
                  </div>
                </div>
              ),
              location: (
                <div key="location" className="flex items-start gap-3 min-w-0 lg:col-span-2">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <MapPin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm font-medium text-slate-900">
                      {[customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              ),
              platform: (
                <div key="platform" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Platform</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.platform || ''}</p>
                  </div>
                </div>
              ),
            };
            return (
              <div key="contact" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                {orderedFields.map(fieldId => fieldComponents[fieldId])}
              </div>
            );
          }

          if (sectionId === 'additional' && isSectionVisible('additional')) {
            const orderedFields = getFieldsForSection('additional') || ['assigned_employee', 'pci_expire_date'];
            const fieldComponents = {
              assigned_employee: (
                <div key="assigned_employee" className="flex items-start gap-3 min-w-0">
                  {customer.assigned_employee ? (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-slate-800 text-white text-xs font-medium">
                        {getEmployeeInitials(customer.assigned_employee)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Assigned To</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{customer.assigned_employee || ''}</p>
                  </div>
                </div>
              ),
              pci_expire_date: (
                <div key="pci_expire_date" className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                    <ShieldAlert className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">PCI Expire Date</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {customer.pci_expire_date ? format(parseISO(customer.pci_expire_date), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                </div>
              ),
            };
            return (
              <div key="additional" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                {orderedFields.map(fieldId => fieldComponents[fieldId])}
              </div>
            );
          }

          if (sectionId === 'notes' && isSectionVisible('notes')) {
            return (
              <div key="notes" className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{customer.notes || ''}</p>
              </div>
            );
          }

          return null;
        })}
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
              {canManageServiceLogs && (
                <Button onClick={() => setShowServiceLogForm(true)} className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service Log
                </Button>
              )}
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
                      {canDeleteServiceLogs && (
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
                      )}
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
              {canManageInventory && (
                <Button onClick={() => setShowInventoryForm(true)} className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
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
                      {(canManageInventory || canDeleteInventory) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageInventory && (
                              <DropdownMenuItem onClick={() => { setEditingInventory(item); setShowInventoryForm(true); }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDeleteInventory && (
                              <DropdownMenuItem 
                                onClick={() => { setDeleteItem(item); setDeleteType('inventory'); }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
              ) : filteredPhotos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Image className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>No photos uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredPhotos.map((photo) => (
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