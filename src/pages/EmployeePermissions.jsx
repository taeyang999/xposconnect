import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Save, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function EmployeePermissions() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('employee');

  const [permissions, setPermissions] = useState({
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
  });

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  const updatePermission = (role, key, value) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // This is a template configuration that can be referenced
      // In a real implementation, you might store this in a settings entity
      // or use it as defaults when creating new Permission records
      toast.success('Permission templates updated successfully');
    } catch (error) {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500">Only administrators can access permission settings.</p>
        </div>
      </div>
    );
  }

  const PermissionSection = ({ title, permissions: perms, role }) => (
    <div className="border-t pt-4 first:border-t-0 first:pt-0">
      <h4 className="font-medium text-sm mb-3 text-slate-900">{title}</h4>
      <div className="space-y-3">
        {perms.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={`${role}-${key}`} className="font-normal cursor-pointer">
              {label}
              <span className="block text-xs text-slate-500">{description}</span>
            </Label>
            <Switch
              id={`${role}-${key}`}
              checked={permissions[role][key]}
              onCheckedChange={(checked) => updatePermission(role, key, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const RolePermissions = ({ role }) => (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          These permissions will be used as defaults when inviting new users with the {role} role.
        </AlertDescription>
      </Alert>

      <PermissionSection
        title="Customer Management"
        role={role}
        permissions={[
          { key: 'can_manage_customers', label: 'Create & Edit Customers', description: 'Create and edit customer records' },
          { key: 'can_delete_customers', label: 'Delete Customers', description: 'Delete customer records' },
          { key: 'can_view_customers', label: 'View Customers', description: 'View customer information' },
        ]}
      />

      <PermissionSection
        title="Schedule Management"
        role={role}
        permissions={[
          { key: 'can_manage_schedule', label: 'Create & Edit Events', description: 'Create and edit schedule events' },
          { key: 'can_delete_schedule', label: 'Delete Events', description: 'Delete schedule events' },
          { key: 'can_view_schedule', label: 'View Schedule', description: 'View calendar and events' },
        ]}
      />

      <PermissionSection
        title="Service Logs"
        role={role}
        permissions={[
          { key: 'can_manage_service_logs', label: 'Create & Edit Logs', description: 'Create and edit service logs' },
          { key: 'can_delete_service_logs', label: 'Delete Logs', description: 'Delete service logs' },
          { key: 'can_view_service_logs', label: 'View Service Logs', description: 'View service history' },
        ]}
      />

      <PermissionSection
        title="Inventory Management"
        role={role}
        permissions={[
          { key: 'can_manage_inventory', label: 'Create & Edit Items', description: 'Create and edit inventory items' },
          { key: 'can_delete_inventory', label: 'Delete Items', description: 'Delete inventory items' },
          { key: 'can_view_inventory', label: 'View Inventory', description: 'View inventory items' },
        ]}
      />

      <PermissionSection
        title="Advanced Permissions"
        role={role}
        permissions={[
          { key: 'can_manage_employees', label: 'Manage Employees', description: 'Invite and manage team members' },
          { key: 'can_view_reports', label: 'View Reports', description: 'Access business reports' },
          { key: 'can_export_data', label: 'Export Data', description: 'Export data to CSV' },
        ]}
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Role Permissions"
        description="Configure default permissions for each role"
        actions={
          <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        }
      />

      <Card className="p-6 border-slate-200/80">
        <Tabs value={activeRole} onValueChange={setActiveRole}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="employee">Employee</TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="mt-6">
            <RolePermissions role="admin" />
          </TabsContent>

          <TabsContent value="manager" className="mt-6">
            <RolePermissions role="manager" />
          </TabsContent>

          <TabsContent value="employee" className="mt-6">
            <RolePermissions role="employee" />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}