import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function AdvancedCustomerFilters({ open, onClose, filters, onFiltersChange }) {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Profile.filter({ status: 'active' }),
  });

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      businessType: 'all',
      assignedEmployee: 'all',
      hasHotspot: 'all',
      isDisabled: 'all',
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Refine your customer search with additional filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div>
            <Label>Business Type</Label>
            <Select value={filters.businessType} onValueChange={(value) => updateFilter('businessType', value)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Restaurant">Restaurant</SelectItem>
                <SelectItem value="QSR">QSR</SelectItem>
                <SelectItem value="Market">Market</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assigned Employee</Label>
            <Select value={filters.assignedEmployee} onValueChange={(value) => updateFilter('assignedEmployee', value)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.email} value={emp.email}>
                    {emp.firstname && emp.lastname 
                      ? `${emp.firstname} ${emp.lastname}` 
                      : emp.full_name || emp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Hotspot Status</Label>
            <Select value={filters.hasHotspot} onValueChange={(value) => updateFilter('hasHotspot', value)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Has Hotspot</SelectItem>
                <SelectItem value="false">No Hotspot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Account Status</Label>
            <Select value={filters.isDisabled} onValueChange={(value) => updateFilter('isDisabled', value)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Enabled</SelectItem>
                <SelectItem value="true">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t space-y-3">
            {activeFilterCount > 0 && (
              <div className="text-sm text-slate-600">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear All
              </Button>
              <Button onClick={onClose} className="flex-1 bg-slate-900 hover:bg-slate-800">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}