import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { 
  Mail, Phone, MapPin, MoreVertical, 
  Pencil, Trash2, Eye, User
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function CustomerCard({ customer, onEdit, onDelete }) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    prospect: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white font-semibold text-lg">
            {customer.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{customer.name}</h3>
            <Badge className={cn("mt-1", statusColors[customer.status] || statusColors.active)}>
              {customer.status || 'active'}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
              <Link to={createPageUrl('CustomerDetail') + `?id=${customer.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(customer)} className="cursor-pointer rounded-lg">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(customer)} 
              className="cursor-pointer rounded-lg text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2.5 text-sm">
        {customer.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="h-4 w-4 text-slate-400" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="h-4 w-4 text-slate-400" />
            <span>{customer.phone}</span>
          </div>
        )}
        {(customer.city || customer.state) && (
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {customer.assigned_employee && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <span className="truncate">{customer.assigned_employee}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <Link to={createPageUrl('CustomerDetail') + `?id=${customer.id}`}>
          <Button variant="outline" className="w-full rounded-lg text-sm">
            View Full Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}