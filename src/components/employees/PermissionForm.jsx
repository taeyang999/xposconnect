import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function PermissionForm({ open, onClose, employee, onSave }) {
  const [formData, setFormData] = useState({
    role: 'employee',
    can_manage_customers: true,
    can_delete_customers: true,
    can_view_customers: true,
    can_manage_schedule: true,
    can_delete_schedule: true,
    can_view_schedule: true,
    can_manage_service_logs: true,
    can_delete_service_logs: true,
    can_view_service_logs: true,
    can_manage_inventory: true,
    can_delete_inventory: true,
    can_view_inventory: true,
    can_manage_employees: false,
    can_view_reports: false,
    can_export_data: false,
  });
  const [saving, setSaving] = useState(false);
  const [existingPermission, setExistingPermission] = useState(null);

  // Fetch existing permission for this employee
  const { data: permissions = [], refetch } = useQuery({
    queryKey: ['permissions', employee?.email],
    queryFn: async () => {
      const result = await base44.entities.Permission.filter({ 
        user_email: employee.email 
      });
      return result;
    },
    enabled: open && !!employee?.email,
  });

  useEffect(() => {
    if (permissions.length > 0) {
      const perm = permissions[0];
      setExistingPermission(perm);
      setFormData({
        role: perm.role || 'employee',
        can_manage_customers: perm.can_manage_customers ?? true,
        can_delete_customers: perm.can_delete_customers ?? true,
        can_view_customers: perm.can_view_customers ?? true,
        can_manage_schedule: perm.can_manage_schedule ?? true,
        can_delete_schedule: perm.can_delete_schedule ?? true,
        can_view_schedule: perm.can_view_schedule ?? true,
        can_manage_service_logs: perm.can_manage_service_logs ?? true,
        can_delete_service_logs: perm.can_delete_service_logs ?? true,
        can_view_service_logs: perm.can_view_service_logs ?? true,
        can_manage_inventory: perm.can_manage_inventory ?? true,
        can_delete_inventory: perm.can_delete_inventory ?? true,
        can_view_inventory: perm.can_view_inventory ?? true,
        can_manage_employees: perm.can_manage_employees ?? false,
        can_view_reports: perm.can_view_reports ?? false,
        can_export_data: perm.can_export_data ?? false,
      });
    } else {
      setExistingPermission(null);
      // Set defaults based on role
      const role = 'employee';
      setFormData({
        role,
        can_manage_customers: true,
        can_delete_customers: true,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: true,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: true,
        can_view_service_logs: true,
        can_manage_inventory: true,
        can_delete_inventory: true,
        can_view_inventory: true,
        can_manage_employees: false,
        can_view_reports: false,
        can_export_data: false,
      });
    }
  }, [permissions, open]);

  const handleRoleChange = (newRole) => {
    // Preset permissions based on role
    const presets = {
      admin: {
        can_manage_customers: true,
        can_delete_customers: true,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: true,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: true,
        can_view_service_logs: true,
        can_manage_inventory: true,
        can_delete_inventory: true,
        can_view_inventory: true,
        can_manage_employees: true,
        can_view_reports: true,
        can_export_data: true,
      },
      manager: {
        can_manage_customers: true,
        can_delete_customers: true,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: true,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: true,
        can_view_service_logs: true,
        can_manage_inventory: true,
        can_delete_inventory: true,
        can_view_inventory: true,
        can_manage_employees: false,
        can_view_reports: true,
        can_export_data: true,
      },
      employee: {
        can_manage_customers: true,
        can_delete_customers: true,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: true,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: true,
        can_view_service_logs: true,
        can_manage_inventory: true,
        can_delete_inventory: true,
        can_view_inventory: true,
        can_manage_employees: false,
        can_view_reports: false,
        can_export_data: false,
      },
    };

    setFormData({
      role: newRole,
      ...presets[newRole],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const permissionData = {
        user_email: employee.email,
        ...formData,
      };

      if (existingPermission) {
        await base44.entities.Permission.update(existingPermission.id, permissionData);
        toast.success('Permissions updated successfully');
      } else {
        await base44.entities.Permission.create(permissionData);
        toast.success('Permissions created successfully');
      }
      
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions
          </DialogTitle>
          <DialogDescription>
            Set role and permissions for {employee?.full_name || employee?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Role Selection */}
          <div>
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              {formData.role === 'admin' && 'Full access to all features'}
              {formData.role === 'manager' && 'Can manage operations and view reports'}
              {formData.role === 'employee' && 'Standard access to daily operations'}
            </p>
          </div>

          {/* Permissions Grid */}
          <div className="space-y-6">
            {/* Customer Permissions */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 text-slate-900">Customer Management</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_manage_customers" className="font-normal cursor-pointer">
                    Create & Edit Customers
                    <span className="block text-xs text-slate-500">Create and edit customer records</span>
                  </Label>
                  <Switch
                    id="can_manage_customers"
                    checked={formData.can_manage_customers}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_manage_customers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_delete_customers" className="font-normal cursor-pointer">
                    Delete Customers
                    <span className="block text-xs text-slate-500">Delete customer records</span>
                  </Label>
                  <Switch
                    id="can_delete_customers"
                    checked={formData.can_delete_customers}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_delete_customers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_customers" className="font-normal cursor-pointer">
                    View Customers
                    <span className="block text-xs text-slate-500">View customer information</span>
                  </Label>
                  <Switch
                    id="can_view_customers"
                    checked={formData.can_view_customers}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_view_customers: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Schedule Permissions */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 text-slate-900">Schedule Management</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_manage_schedule" className="font-normal cursor-pointer">
                    Create & Edit Events
                    <span className="block text-xs text-slate-500">Create and edit schedule events</span>
                  </Label>
                  <Switch
                    id="can_manage_schedule"
                    checked={formData.can_manage_schedule}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_manage_schedule: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_delete_schedule" className="font-normal cursor-pointer">
                    Delete Events
                    <span className="block text-xs text-slate-500">Delete schedule events</span>
                  </Label>
                  <Switch
                    id="can_delete_schedule"
                    checked={formData.can_delete_schedule}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_delete_schedule: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_schedule" className="font-normal cursor-pointer">
                    View Schedule
                    <span className="block text-xs text-slate-500">View calendar and events</span>
                  </Label>
                  <Switch
                    id="can_view_schedule"
                    checked={formData.can_view_schedule}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_view_schedule: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Service Logs Permissions */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 text-slate-900">Service Logs</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_manage_service_logs" className="font-normal cursor-pointer">
                    Create & Edit Logs
                    <span className="block text-xs text-slate-500">Create and edit service logs</span>
                  </Label>
                  <Switch
                    id="can_manage_service_logs"
                    checked={formData.can_manage_service_logs}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_manage_service_logs: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_delete_service_logs" className="font-normal cursor-pointer">
                    Delete Logs
                    <span className="block text-xs text-slate-500">Delete service logs</span>
                  </Label>
                  <Switch
                    id="can_delete_service_logs"
                    checked={formData.can_delete_service_logs}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_delete_service_logs: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_service_logs" className="font-normal cursor-pointer">
                    View Service Logs
                    <span className="block text-xs text-slate-500">View service history</span>
                  </Label>
                  <Switch
                    id="can_view_service_logs"
                    checked={formData.can_view_service_logs}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_view_service_logs: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Inventory Permissions */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 text-slate-900">Inventory Management</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_manage_inventory" className="font-normal cursor-pointer">
                    Create & Edit Items
                    <span className="block text-xs text-slate-500">Create and edit inventory items</span>
                  </Label>
                  <Switch
                    id="can_manage_inventory"
                    checked={formData.can_manage_inventory}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_manage_inventory: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_delete_inventory" className="font-normal cursor-pointer">
                    Delete Items
                    <span className="block text-xs text-slate-500">Delete inventory items</span>
                  </Label>
                  <Switch
                    id="can_delete_inventory"
                    checked={formData.can_delete_inventory}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_delete_inventory: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_inventory" className="font-normal cursor-pointer">
                    View Inventory
                    <span className="block text-xs text-slate-500">View inventory items</span>
                  </Label>
                  <Switch
                    id="can_view_inventory"
                    checked={formData.can_view_inventory}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_view_inventory: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Permissions */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 text-slate-900">Advanced Permissions</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_manage_employees" className="font-normal cursor-pointer">
                    Manage Employees
                    <span className="block text-xs text-slate-500">Invite and manage team members</span>
                  </Label>
                  <Switch
                    id="can_manage_employees"
                    checked={formData.can_manage_employees}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_manage_employees: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_reports" className="font-normal cursor-pointer">
                    View Reports
                    <span className="block text-xs text-slate-500">Access business reports</span>
                  </Label>
                  <Switch
                    id="can_view_reports"
                    checked={formData.can_view_reports}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_view_reports: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_export_data" className="font-normal cursor-pointer">
                    Export Data
                    <span className="block text-xs text-slate-500">Export data to CSV</span>
                  </Label>
                  <Switch
                    id="can_export_data"
                    checked={formData.can_export_data}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_export_data: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}