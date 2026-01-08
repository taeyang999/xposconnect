import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { logAudit } from '../audit/auditLogger';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';

export default function CustomerForm({ open, onClose, customer, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    owner_firstname: '',
    owner_lastname: '',
    corporation: '',
    business_type: '',
    platform: '',
    merchant_id: '',
    email: '',
    secondary_email: '',
    store_phone: '',
    owner_phone_1: '',
    owner_phone_2: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    has_hotspot: false,
    is_disabled: false,
    pci_expire_date: '',
    notes: '',
    status: 'active',
    assigned_employee: '',
  });
  const [saving, setSaving] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.status !== 'inactive');
    },
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        owner_firstname: customer.owner_firstname || '',
        owner_lastname: customer.owner_lastname || '',
        corporation: customer.corporation || '',
        business_type: customer.business_type || '',
        platform: customer.platform || '',
        merchant_id: customer.merchant_id || '',
        email: customer.email || '',
        secondary_email: customer.secondary_email || '',
        store_phone: customer.store_phone || '',
        owner_phone_1: customer.owner_phone_1 || '',
        owner_phone_2: customer.owner_phone_2 || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        has_hotspot: customer.has_hotspot || false,
        is_disabled: customer.is_disabled || false,
        pci_expire_date: customer.pci_expire_date || '',
        notes: customer.notes || '',
        status: customer.status || 'active',
        assigned_employee: customer.assigned_employee || '',
      });
    } else {
      setFormData({
        name: '',
        owner_firstname: '',
        owner_lastname: '',
        corporation: '',
        business_type: '',
        platform: '',
        merchant_id: '',
        email: '',
        secondary_email: '',
        store_phone: '',
        owner_phone_1: '',
        owner_phone_2: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        has_hotspot: false,
        is_disabled: false,
        pci_expire_date: '',
        notes: '',
        status: 'active',
        assigned_employee: '',
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (customer) {
        const changes = {};
        for (const key in formData) {
          const oldVal = customer[key] ?? '';
          const newVal = formData[key] ?? '';
          const oldNormalized = typeof oldVal === 'boolean' ? oldVal : String(oldVal);
          const newNormalized = typeof newVal === 'boolean' ? newVal : String(newVal);
          if (oldNormalized !== newNormalized) {
            changes[key] = { from: customer[key], to: formData[key] };
          }
        }
        await base44.entities.Customer.update(customer.id, formData);
        if (Object.keys(changes).length > 0) {
          await logAudit('Customer', customer.id, formData.name, 'update', changes);
        }
      } else {
        const newCustomer = await base44.entities.Customer.create(formData);
        await logAudit('Customer', newCustomer.id, formData.name, 'create', formData);
      }
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company or individual name"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="owner_firstname">Owner's First Name</Label>
              <Input
                id="owner_firstname"
                value={formData.owner_firstname}
                onChange={(e) => setFormData({ ...formData, owner_firstname: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="owner_lastname">Owner's Last Name</Label>
              <Input
                id="owner_lastname"
                value={formData.owner_lastname}
                onChange={(e) => setFormData({ ...formData, owner_lastname: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="corporation">Corporation</Label>
              <Input
                id="corporation"
                value={formData.corporation}
                onChange={(e) => setFormData({ ...formData, corporation: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="business_type">Business Type</Label>
              <Select
                value={formData.business_type}
                onValueChange={(value) => setFormData({ ...formData, business_type: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="QSR">QSR</SelectItem>
                  <SelectItem value="Market">Market</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="platform">Platform</Label>
              <Input
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="merchant_id">Merchant ID</Label>
              <Input
                id="merchant_id"
                value={formData.merchant_id}
                onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Primary Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="secondary_email">Secondary Email</Label>
              <Input
                id="secondary_email"
                type="email"
                value={formData.secondary_email}
                onChange={(e) => setFormData({ ...formData, secondary_email: e.target.value })}
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="store_phone">Store Phone</Label>
              <Input
                id="store_phone"
                value={formData.store_phone}
                onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="owner_phone_1">Owner's Phone #1</Label>
              <Input
                id="owner_phone_1"
                value={formData.owner_phone_1}
                onChange={(e) => setFormData({ ...formData, owner_phone_1: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="owner_phone_2">Owner's Phone #2</Label>
              <Input
                id="owner_phone_2"
                value={formData.owner_phone_2}
                onChange={(e) => setFormData({ ...formData, owner_phone_2: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                      "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
                      "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
                      "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"].map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
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
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_employee">Assigned Employee</Label>
              <Select
                value={formData.assigned_employee}
                onValueChange={(value) => setFormData({ ...formData, assigned_employee: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.email}>
                      {emp.firstname && emp.lastname ? `${emp.firstname} ${emp.lastname}` : emp.full_name || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pci_expire_date">PCI Expire Date</Label>
              <Input
                id="pci_expire_date"
                type="date"
                value={formData.pci_expire_date}
                onChange={(e) => setFormData({ ...formData, pci_expire_date: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <Checkbox
                id="has_hotspot"
                checked={formData.has_hotspot}
                onCheckedChange={(checked) => setFormData({ ...formData, has_hotspot: checked })}
              />
              <Label htmlFor="has_hotspot" className="cursor-pointer">Hotspot</Label>
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <Checkbox
                id="is_disabled"
                checked={formData.is_disabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_disabled: checked })}
              />
              <Label htmlFor="is_disabled" className="cursor-pointer">Disable Account</Label>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this customer..."
                rows={4}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}