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
import { Loader2 } from 'lucide-react';

export default function InventoryForm({ open, onClose, inventoryItem, customerId, onSave }) {
  const [formData, setFormData] = useState({
    customer_id: customerId || '',
    name: '',
    description: '',
    serial_number: '',
    quantity: 1,
    status: 'active',
    purchase_date: '',
    warranty_expiry: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-name'),
    enabled: !customerId,
  });

  useEffect(() => {
    if (inventoryItem) {
      setFormData({
        customer_id: inventoryItem.customer_id || customerId || '',
        name: inventoryItem.name || '',
        description: inventoryItem.description || '',
        serial_number: inventoryItem.serial_number || '',
        quantity: inventoryItem.quantity || 1,
        status: inventoryItem.status || 'active',
        purchase_date: inventoryItem.purchase_date || '',
        warranty_expiry: inventoryItem.warranty_expiry || '',
        notes: inventoryItem.notes || '',
      });
    } else {
      setFormData({
        customer_id: customerId || '',
        name: '',
        description: '',
        serial_number: '',
        quantity: 1,
        status: 'active',
        purchase_date: '',
        warranty_expiry: '',
        notes: '',
      });
    }
  }, [inventoryItem, customerId, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (inventoryItem) {
        // Calculate only changed fields
        const changes = {};
        for (const key in formData) {
          const oldVal = inventoryItem[key] ?? '';
          const newVal = formData[key] ?? '';
          const oldNormalized = typeof oldVal === 'boolean' ? oldVal : String(oldVal);
          const newNormalized = typeof newVal === 'boolean' ? newVal : String(newVal);
          if (oldNormalized !== newNormalized) {
            changes[key] = { from: inventoryItem[key], to: formData[key] };
          }
        }
        await base44.entities.InventoryItem.update(inventoryItem.id, formData);
        if (Object.keys(changes).length > 0) {
          await logAudit('InventoryItem', inventoryItem.id, formData.name, 'update', changes);
        }
      } else {
        const newItem = await base44.entities.InventoryItem.create(formData);
        await logAudit('InventoryItem', newItem.id, formData.name, 'create', formData);
      }
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {inventoryItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {!customerId && (
            <div>
              <Label>Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                required
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., HP Laptop"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the item..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="mt-1.5"
              />
            </div>
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
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                id="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {inventoryItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}