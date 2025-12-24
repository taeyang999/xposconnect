import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, parseISO } from 'date-fns';
import { Calendar, MapPin, User, Building2, Pencil, Trash2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function EventDetail({ event, customerName, onClose, onEdit, onDelete }) {
  if (!event) return null;

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600',
  };

  const typeLabels = {
    appointment: 'Appointment',
    task: 'Task',
    service: 'Service',
    meeting: 'Meeting',
    reminder: 'Reminder',
  };

  return (
    <Sheet open={!!event} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="flex flex-row items-start justify-between">
          <div>
            <Badge className="mb-2">{typeLabels[event.event_type] || 'Event'}</Badge>
            <SheetTitle className="text-xl">{event.title}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <Badge className={statusColors[event.status] || statusColors.scheduled}>
              {event.status}
            </Badge>
          </div>

          {/* Date Range */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Calendar className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Date Range</p>
              <p className="font-medium text-slate-900">
                {format(parseISO(event.start_datetime), 'MMM d, yyyy')}
                {format(parseISO(event.start_datetime), 'yyyy-MM-dd') !== format(parseISO(event.end_datetime), 'yyyy-MM-dd') && 
                  ` - ${format(parseISO(event.end_datetime), 'MMM d, yyyy')}`
                }
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <MapPin className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium text-slate-900">{event.location}</p>
              </div>
            </div>
          )}

          {/* Customer */}
          {customerName && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <Link 
                  to={createPageUrl('CustomerDetail') + `?id=${event.customer_id}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  {customerName}
                </Link>
              </div>
            </div>
          )}

          {/* Assigned Employee */}
          {event.assigned_employee && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Assigned To</p>
                <p className="font-medium text-slate-900">{event.assigned_employee}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-4 border-t">
              <p className="text-sm text-slate-500 mb-2">Description</p>
              <p className="text-slate-700">{event.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button onClick={() => onEdit(event)} variant="outline" className="flex-1 rounded-xl">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={onDelete} variant="outline" className="flex-1 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}