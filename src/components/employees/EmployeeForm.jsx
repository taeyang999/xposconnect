import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeForm({ open, onClose, employee, onSave }) {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    department: '',
    title: '',
    hire_date: '',
    status: 'active',
    app_role: 'employee',
    can_manage_customers: true,
    can_delete_customers: false,
    can_view_customers: true,
    can_manage_schedule: true,
    can_delete_schedule: false,
    can_view_schedule: true,
    can_manage_service_logs: true,
    can_delete_service_logs: false,
    can_view_service_logs: true,
    can_manage_inventory: false,
    can_delete_inventory: false,
    can_view_inventory: false,
    can_manage_employees: false,
    can_view_reports: false,
    can_export_data: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee && open) {
      setFormData({
        firstname: employee.firstname || '',
        lastname: employee.lastname || '',
        phone: employee.phone || '',
        department: employee.department || '',
        title: employee.title || '',
        hire_date: employee.hire_date || '',
        status: employee.status || 'active',
        app_role: employee.app_role || 'employee',
        can_manage_customers: employee.can_manage_customers ?? true,
        can_delete_customers: employee.can_delete_customers ?? false,
        can_view_customers: employee.can_view_customers ?? true,
        can_manage_schedule: employee.can_manage_schedule ?? true,
        can_delete_schedule: employee.can_delete_schedule ?? false,
        can_view_schedule: employee.can_view_schedule ?? true,
        can_manage_service_logs: employee.can_manage_service_logs ?? true,
        can_delete_service_logs: employee.can_delete_service_logs ?? false,
        can_view_service_logs: employee.can_view_service_logs ?? true,
        can_manage_inventory: employee.can_manage_inventory ?? false,
        can_delete_inventory: employee.can_delete_inventory ?? false,
        can_view_inventory: employee.can_view_inventory ?? false,
        can_manage_employees: employee.can_manage_employees ?? false,
        can_view_reports: employee.can_view_reports ?? false,
        can_export_data: employee.can_export_data ?? false,
      });
    } else {
      setFormData({
        firstname: '',
        lastname: '',
        phone: '',
        department: '',
        title: '',
        hire_date: '',
        status: 'active',
        app_role: 'employee',
        can_manage_customers: true,
        can_delete_customers: false,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: false,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: false,
        can_view_service_logs: true,
        can_manage_inventory: false,
        can_delete_inventory: false,
        can_view_inventory: false,
        can_manage_employees: false,
        can_view_reports: false,
        can_export_data: false,
      });
    }
  }, [employee, open]);

  const handleRoleChange = (newRole) => {
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
        can_delete_customers: false,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: false,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: false,
        can_view_service_logs: true,
        can_manage_inventory: false,
        can_delete_inventory: false,
        can_view_inventory: false,
        can_manage_employees: false,
        can_view_reports: false,
        can_export_data: false,
      },
    };

    setFormData({
      ...formData,
      app_role: newRole,
      ...presets[newRole],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.User.update(employee.id, formData);
      toast.success('Employee updated successfully');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
          <DialogDescription>
            Update additional information for {[employee?.firstname, employee?.lastname].filter(Boolean).join(' ') || employee?.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstname">First Name</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                placeholder="John"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="lastname">Last Name</Label>
              <Input
                id="lastname"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                placeholder="Doe"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Service Technician"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Operations"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="hire_date">Hire Date</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Role</Label>
            <Select
              value={formData.app_role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              {formData.app_role === 'admin' && 'Full access to all features'}
              {formData.app_role === 'manager' && 'Can manage operations and view reports'}
              {formData.app_role === 'employee' && 'Standard access to daily operations'}
            </p>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}