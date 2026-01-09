import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/hooks/usePermissions';
import { 
  Plus, Search, Mail, Phone, Shield, ShieldCheck,
  MoreVertical, Pencil, UserPlus, Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import EmployeeForm from '@/components/employees/EmployeeForm';
import InviteEmployeeForm from '@/components/employees/InviteEmployeeForm';

export default function Employees() {
  const { user, permissions, isAdmin, isSystemAdmin, loading: permissionsLoading } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const canManageEmployees = isAdmin || permissions?.can_manage_employees || false;

  // System admins use direct User.list(), others use backend function
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', isSystemAdmin],
    queryFn: async () => {
      if (isSystemAdmin) {
        // System admin can directly list all users
        return await base44.entities.User.list('-created_date');
      } else {
        // Non-system-admin users use the backend function to get limited info
        const response = await base44.functions.invoke('getLimitedEmployeeInfo');
        return response.data?.employees || [];
      }
    },
    enabled: !!user && canManageEmployees,
  });

  const getEmployeeRole = (employee) => {
    return employee?.app_role || 'employee';
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = [emp.firstname, emp.lastname].filter(Boolean).join(' ');
    return (
      fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  if (permissionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (!canManageEmployees) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500">You don't have permission to manage employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage team members and their access"
        actions={
          isSystemAdmin && (
            <Button onClick={() => setShowInviteForm(true)} className="bg-slate-900 hover:bg-slate-800">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Employee
            </Button>
          )
        }
      />

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon={searchQuery ? Search : UserPlus}
          title={searchQuery ? 'No employees found' : 'No employees yet'}
          description={searchQuery 
            ? 'Try adjusting your search'
            : isSystemAdmin 
              ? 'Invite your first team member to get started'
              : 'No employees have been added yet.'
          }
          action={
            !searchQuery && isSystemAdmin && (
              <Button onClick={() => setShowInviteForm(true)} className="bg-slate-900 hover:bg-slate-800">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Employee
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="p-6 hover:shadow-lg transition-shadow border-slate-200/80">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-slate-800 text-white font-medium">
                      {employee.firstname?.charAt(0)?.toUpperCase() || ''}{employee.lastname?.charAt(0)?.toUpperCase() || employee.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900">{[employee.firstname, employee.lastname].filter(Boolean).join(' ') || 'Unnamed'}</h3>
                    <p className="text-sm text-slate-500 capitalize">{getEmployeeRole(employee)}</p>
                  </div>
                </div>
                {isSystemAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuItem onClick={() => handleEdit(employee)} className="cursor-pointer rounded-lg">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.department && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-slate-400">Dept:</span>
                    <span>{employee.department}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Hired {format(parseISO(employee.hire_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                {(() => {
                  const displayRole = getEmployeeRole(employee);
                  return (
                    <Badge className={displayRole === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : displayRole === 'manager'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
                    }>
                      {displayRole === 'admin' ? (
                        <ShieldCheck className="h-3 w-3 mr-1" />
                      ) : (
                        <Shield className="h-3 w-3 mr-1" />
                      )}
                      {displayRole}
                    </Badge>
                  );
                })()}
                <Badge className={employee.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-100 text-slate-600'
                }>
                  {employee.status || 'active'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Edit Form - Only for system admins */}
      {isSystemAdmin && (
        <EmployeeForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingEmployee(null); }}
          employee={editingEmployee}
          onSave={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
        />
      )}

      {/* Invite Employee Form - Only for system admins */}
      {isSystemAdmin && (
        <InviteEmployeeForm
          open={showInviteForm}
          onClose={() => setShowInviteForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
        />
      )}
    </div>
  );
}