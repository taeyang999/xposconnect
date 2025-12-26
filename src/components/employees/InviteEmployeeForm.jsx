import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";

export default function InviteEmployeeForm({ open, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Determine the user role for invitation (admin or user)
      const inviteRole = role === 'admin' ? 'admin' : 'user';
      await base44.users.inviteUser(email, inviteRole);
      
      // Create default permission record for the user
      const permissionDefaults = {
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

      await base44.entities.Permission.create({
        user_email: email,
        role: role,
        ...permissionDefaults[role],
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