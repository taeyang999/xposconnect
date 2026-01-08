import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, User, Building2, MoreVertical, Pencil, Trash2,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ServiceLogCard({
  log,
  getCustomerName,
  getEmployeeInitials,
  getEmployeeName,
  statusColors,
  onEdit,
  onDelete,
}) {
  const hasActions = onEdit || onDelete;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-900 text-base line-clamp-1 flex-1 pr-2">{log.title}</h3>
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(log)} className="cursor-pointer rounded-lg">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(log)}
                  className="cursor-pointer rounded-lg text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge className={cn("text-xs", statusColors[log.status])}>
          {log.status?.replace('_', ' ')}
        </Badge>
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
          #{log.ticket_id || '-'}
        </span>
      </div>

      {log.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{log.description}</p>
      )}

      <div className="space-y-2 text-sm text-slate-700">
        <Link 
          to={createPageUrl('CustomerDetail') + `?id=${log.customer_id}`}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <Building2 className="h-4 w-4 text-slate-500" />
          <span className="truncate">{getCustomerName(log.customer_id)}</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          {log.service_date ? format(parseISO(log.service_date), 'MMM d, yyyy') : '-'}
        </div>

        {log.assigned_employee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-slate-800 text-white text-[9px] font-medium">
                {getEmployeeInitials(log.assigned_employee)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{getEmployeeName(log.assigned_employee)}</span>
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