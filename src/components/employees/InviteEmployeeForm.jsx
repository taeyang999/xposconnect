import React, { useState } from 'react';
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
import { Loader2, Mail, CheckCircle2, User } from 'lucide-react';
import { toast } from "sonner";

export default function InviteEmployeeForm({ open, onClose, onSuccess }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Fetch role templates
  const { data: roleTemplates } = useQuery({
    queryKey: ['roleTemplates'],
    queryFn: async () => {
      const result = await base44.entities.Permission.filter({ user_email: 'role_templates' });
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: open,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Determine the user role for invitation (admin or user)
      const inviteRole = role === 'admin' ? 'admin' : 'user';
      await base44.users.inviteUser(email, inviteRole);
      
      // Update the user with firstname, lastname, and fullname
      const users = await base44.entities.User.filter({ email: email });
      if (users && users.length > 0) {
        const fullname = `${firstname} ${lastname}`.trim();
        await base44.entities.User.update(users[0].id, {
          firstname,
          lastname,
          fullname
        });
      }
      
      // Get permissions from role templates or use defaults
      const getPermissionsForRole = (roleName) => {
        if (!roleTemplates) {
          // Fallback defaults if no templates exist
          const fallbackDefaults = {
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
          return fallbackDefaults[roleName];
        }

        // Load from templates
        const prefix = `${roleName}_`;
        return {
          can_manage_customers: roleTemplates[`${prefix}can_manage_customers`] !== undefined ? roleTemplates[`${prefix}can_manage_customers`] : true,
          can_delete_customers: roleTemplates[`${prefix}can_delete_customers`] !== undefined ? roleTemplates[`${prefix}can_delete_customers`] : (roleName === 'employee' ? false : true),
          can_view_customers: roleTemplates[`${prefix}can_view_customers`] !== undefined ? roleTemplates[`${prefix}can_view_customers`] : true,
          can_manage_schedule: roleTemplates[`${prefix}can_manage_schedule`] !== undefined ? roleTemplates[`${prefix}can_manage_schedule`] : true,
          can_delete_schedule: roleTemplates[`${prefix}can_delete_schedule`] !== undefined ? roleTemplates[`${prefix}can_delete_schedule`] : (roleName === 'employee' ? false : true),
          can_view_schedule: roleTemplates[`${prefix}can_view_schedule`] !== undefined ? roleTemplates[`${prefix}can_view_schedule`] : true,
          can_manage_service_logs: roleTemplates[`${prefix}can_manage_service_logs`] !== undefined ? roleTemplates[`${prefix}can_manage_service_logs`] : true,
          can_delete_service_logs: roleTemplates[`${prefix}can_delete_service_logs`] !== undefined ? roleTemplates[`${prefix}can_delete_service_logs`] : (roleName === 'employee' ? false : true),
          can_view_service_logs: roleTemplates[`${prefix}can_view_service_logs`] !== undefined ? roleTemplates[`${prefix}can_view_service_logs`] : true,
          can_manage_inventory: roleTemplates[`${prefix}can_manage_inventory`] !== undefined ? roleTemplates[`${prefix}can_manage_inventory`] : (roleName === 'employee' ? false : true),
          can_delete_inventory: roleTemplates[`${prefix}can_delete_inventory`] !== undefined ? roleTemplates[`${prefix}can_delete_inventory`] : (roleName === 'employee' ? false : true),
          can_view_inventory: roleTemplates[`${prefix}can_view_inventory`] !== undefined ? roleTemplates[`${prefix}can_view_inventory`] : (roleName === 'employee' ? false : true),
          can_manage_employees: roleTemplates[`${prefix}can_manage_employees`] !== undefined ? roleTemplates[`${prefix}can_manage_employees`] : (roleName === 'admin'),
          can_view_reports: roleTemplates[`${prefix}can_view_reports`] !== undefined ? roleTemplates[`${prefix}can_view_reports`] : (roleName !== 'employee'),
          can_export_data: roleTemplates[`${prefix}can_export_data`] !== undefined ? roleTemplates[`${prefix}can_export_data`] : (roleName !== 'employee'),
        };
      };

      await base44.entities.Permission.create({
        user_email: email,
        role: role,
        ...getPermissionsForRole(role),
      });

      setSent(true);
      toast.success('Invitation sent successfully!');
      onSuccess();
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setFirstname('');
    setLastname('');
    setEmail('');
    setRole('employee');
    setSent(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Employee</DialogTitle>
          <DialogDescription>
            Send an email invitation to join your team
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Invitation Sent!</h3>
            <p className="text-slate-500">
              An email has been sent to <span className="font-medium text-slate-700">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstname">First Name *</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="firstname"
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    placeholder="John"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lastname">Last Name *</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="lastname"
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    placeholder="Doe"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@example.com"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">
                    <div>
                      <p className="font-medium">Employee</p>
                      <p className="text-xs text-slate-500">Standard access to daily operations</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div>
                      <p className="font-medium">Manager</p>
                      <p className="text-xs text-slate-500">Can manage operations and view reports</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div>
                      <p className="font-medium">Administrator</p>
                      <p className="text-xs text-slate-500">Full access to all features and data</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-slate-900 mb-2">Permission Summary</h4>
              {role === 'admin' ? (
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Full access to all features</li>
                  <li>• Can manage employees and permissions</li>
                  <li>• Can edit and delete all records</li>
                  <li>• Access to reports and analytics</li>
                </ul>
              ) : role === 'manager' ? (
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Can manage operations</li>
                  <li>• View and export reports</li>
                  <li>• Full access to customers and schedule</li>
                  <li>• Cannot manage employees</li>
                </ul>
              ) : (
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Access to daily operations</li>
                  <li>• Manage customers and schedule</li>
                  <li>• Create and edit service logs</li>
                  <li>• Limited administrative access</li>
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending} className="bg-slate-900 hover:bg-slate-800">
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}