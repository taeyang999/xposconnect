import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Building2, Mail, Phone, MapPin, MoreVertical, Pencil, Trash2, Wifi, Ban } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function CustomerListItem({ customer, onEdit, onDelete }) {
  const navigate = useNavigate();

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    prospect: 'bg-amber-100 text-amber-700',
  };

  return (
    <div 
      className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(createPageUrl('CustomerDetail') + `?id=${customer.id}`)}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {customer.name?.charAt(0)?.toUpperCase() || 'C'}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{customer.name}</h3>
            {customer.merchant_id && (
              <span className="font-bold text-blue-600 text-sm">{customer.merchant_id}</span>
            )}
            {customer.has_hotspot && (
              <Wifi className="h-4 w-4 text-blue-500" />
            )}
            {customer.is_disabled && (
              <Ban className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {customer.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {customer.email}
              </span>
            )}
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </span>
            )}
            {(customer.city || customer.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[customer.city, customer.state].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Business Type */}
        {customer.business_type && (
          <Badge variant="outline" className="hidden md:flex">
            {customer.business_type}
          </Badge>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onEdit(customer); }} 
              className="cursor-pointer rounded-lg"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(customer); }}
              className="cursor-pointer rounded-lg text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}