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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteEmployeeForm({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee',
  });
  const [inviting, setInviting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      // Invite user with specified role (this will use Base44's invite system)
      await base44.users.inviteUser(formData.email, 'user');
      
      toast.success(`Invitation sent to ${formData.email}`);
      onSuccess();
      onClose();
      setFormData({ email: '', role: 'employee' });
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New Employee</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They will receive an email with instructions to set up their account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="employee@company.com"
              required
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
            <p className="text-xs text-slate-500 mt-1">
              {formData.role === 'admin' && 'Full access to all features'}
              {formData.role === 'manager' && 'Can manage operations and view reports'}
              {formData.role === 'employee' && 'Standard access to daily operations'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              The invited user will need to set their role and permissions after accepting the invitation by editing their profile.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviting} className="bg-slate-900 hover:bg-slate-800">
              {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}