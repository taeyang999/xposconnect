import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, User, Building2, MoreVertical, Pencil, Trash2, MapPin } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ScheduleEventCard({
  event,
  getCustomerName,
  getEmployeeInitials,
  getEmployeeName,
  onEdit,
  onDelete,
  onSelect,
}) {
  const typeColors = {
    appointment: 'bg-blue-500',
    task: 'bg-amber-500',
    service: 'bg-emerald-500',
    meeting: 'bg-purple-500',
    reminder: 'bg-red-500',
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  return (
    <div 
      className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect && onSelect({ resource: event })}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-900 text-base line-clamp-1 flex-1 pr-2">{event.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="cursor-pointer rounded-lg">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(event); }}
              className="cursor-pointer rounded-lg text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge className={`text-xs text-white ${typeColors[event.event_type] || typeColors.appointment}`}>
          {event.event_type?.replace('_', ' ')}
        </Badge>
        <Badge className={`text-xs ${statusColors[event.status] || statusColors.scheduled}`}>
          {event.status?.replace('_', ' ')}
        </Badge>
      </div>

      {event.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{event.description}</p>
      )}

      <div className="space-y-2 text-sm text-slate-700">
        {event.customer_id && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            <span className="truncate">{getCustomerName(event.customer_id)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="truncate">
            {event.start_datetime ? format(parseISO(event.start_datetime), 'MMM d, yyyy h:mm a') : '-'}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {event.assigned_employee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-slate-800 text-white text-[9px] font-medium">
                {getEmployeeInitials(event.assigned_employee)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{getEmployeeName(event.assigned_employee)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <User className="h-4 w-4" />
            <span>Unassigned</span>
          </div>
        )}
      </div>
    </div>
  );
}