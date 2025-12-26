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
    role: 'employee',
  });
  const [saving, setSaving] = useState(false);

  const { data: permission } = useQuery({
    queryKey: ['permission', employee?.email],
    queryFn: async () => {
      const permissions = await base44.entities.Permission.filter({ user_email: employee.email });
      return permissions?.[0] || null;
    },
    enabled: !!employee?.email,
  });

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
        role: permission?.role || employee.role || 'employee',
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
        role: 'employee',
      });
    }
  }, [employee, open, permission]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { role, ...userData } = formData;
      await base44.entities.User.update(employee.id, userData);
      
      // Update or create permission record with new role
      if (permission) {
        await base44.entities.Permission.update(permission.id, { role });
      } else {
        const permissionDefaults = {
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
        };
        await base44.entities.Permission.create({
          user_email: employee.email,
          role,
          ...permissionDefaults[role],
        });
      }
      
      toast.success('Employee details updated');
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
            Update additional information for {employee?.full_name || employee?.email}
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
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
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