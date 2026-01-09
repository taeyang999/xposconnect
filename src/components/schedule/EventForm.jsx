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
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function EventForm({ open, onClose, event, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customer_id: '',
    assigned_employee: '',
    event_type: 'appointment',
    status: 'scheduled',
    location: '',
  });
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [saving, setSaving] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-limited'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getLimitedEmployeeInfo');
      const users = response.data?.employees || [];
      return users.filter(u => u.status !== 'inactive');
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-name'),
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        customer_id: event.customer_id || '',
        assigned_employee: event.assigned_employee || '',
        event_type: event.event_type || 'appointment',
        status: event.status || 'scheduled',
        location: event.location || '',
      });
      setDateRange({
        from: event.start_datetime ? new Date(event.start_datetime) : undefined,
        to: event.end_datetime ? new Date(event.end_datetime) : undefined,
      });
    } else {
      const now = new Date();
      setFormData({
        title: '',
        description: '',
        customer_id: '',
        assigned_employee: '',
        event_type: 'appointment',
        status: 'scheduled',
        location: '',
      });
      setDateRange({ from: now, to: now });
    }
  }, [event, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateRange?.from) return;
    
    setSaving(true);
    try {
      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.to || dateRange.from);
      endDate.setHours(23, 59, 59, 999);
      
      const data = {
        title: formData.title,
        description: formData.description,
        customer_id: formData.customer_id,
        assigned_employee: formData.assigned_employee,
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        event_type: formData.event_type,
        status: formData.status,
        location: formData.location,
      };
      
      if (event) {
        // Calculate only changed fields
        const changes = {};
        for (const key in data) {
          const oldVal = event[key] ?? '';
          const newVal = data[key] ?? '';
          const oldNormalized = typeof oldVal === 'boolean' ? oldVal : String(oldVal);
          const newNormalized = typeof newVal === 'boolean' ? newVal : String(newVal);
          if (oldNormalized !== newNormalized) {
            changes[key] = { from: event[key], to: data[key] };
          }
        }
        await base44.entities.ScheduleEvent.update(event.id, data);
        if (Object.keys(changes).length > 0) {
          await logAudit('ScheduleEvent', event.id, data.title, 'update', changes);
        }
      } else {
        await base44.entities.ScheduleEvent.create(data);
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
            {event ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Client Meeting"
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
              placeholder="Event details..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Date Range *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1.5",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Customer (optional)</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assigned Employee</Label>
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
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location"
              className="mt-1.5"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}