import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, parseISO } from 'date-fns';
import { Calendar, MoreVertical, Pencil, Trash2, Building2, User, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ServiceLogCardDesktop({
  log,
  getCustomerName,
  getEmployeeInitials,
  getEmployeeName,
  statusColors,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              #{log.ticket_id || '-'}
            </span>
            <Badge className={statusColors[log.status] || 'bg-slate-100 text-slate-600'}>
              {log.status?.replace('_', ' ')}
            </Badge>
          </div>
          <h3 className="font-semibold text-slate-900 text-base line-clamp-2">{log.title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={() => onEdit(log)} className="cursor-pointer rounded-lg">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(log)}
              className="cursor-pointer rounded-lg text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {log.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{log.description}</p>
      )}

      <div className="space-y-2.5 text-sm text-slate-700">
        <Link 
          to={createPageUrl('CustomerDetail') + `?id=${log.customer_id}`}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Building2 className="h-4 w-4 text-slate-400" />
          <span className="truncate">{getCustomerName(log.customer_id)}</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>{log.service_date ? format(parseISO(log.service_date), 'MMM d, yyyy') : '-'}</span>
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
          <div className="flex items-center gap-2 text-slate-400">
            <User className="h-4 w-4" />
            <span>Unassigned</span>
          </div>
        )}

        {log.notes && (
          <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
            <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
            <span className="text-slate-500 text-xs line-clamp-2">{log.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}