import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export function usePermissions() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const { data: userPermission, isLoading: permissionLoading } = useQuery({
    queryKey: ['userPermission', user?.email],
    queryFn: async () => {
      const result = await base44.entities.Permission.filter({ user_email: user.email });
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: !!user?.email,
  });

  const { data: roleTemplates } = useQuery({
    queryKey: ['roleTemplates'],
    queryFn: async () => {
      const result = await base44.entities.Permission.filter({ user_email: 'role_templates' });
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: !!user?.email,
  });

  // Application administrator: built-in admin OR Permission.role === 'admin'
  const isSystemAdmin = user?.role === 'admin';
  const isAppAdmin = userPermission?.role === 'admin';
  const isAdmin = isSystemAdmin || isAppAdmin;
  
  // Manager check: Permission.role === 'manager'
  const isManager = userPermission?.role === 'manager';

  // Default permissions based on role if no specific permission record exists
  const getDefaultPermissions = () => {
    if (isAdmin) {
      return {
        can_manage_customers: true,
        can_delete_customers: true,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: true,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: true,
        can_view_service_logs: true,
        can_manage_inventory: true,
        can_delete_inventory: true,
        can_view_inventory: true,
        can_manage_employees: true,
        can_view_reports: true,
        can_export_data: true,
      };
    } else if (isManager) {
      // Check role templates for manager
      if (roleTemplates) {
        return {
          can_manage_customers: roleTemplates.manager_can_manage_customers !== undefined ? roleTemplates.manager_can_manage_customers : true,
          can_delete_customers: roleTemplates.manager_can_delete_customers !== undefined ? roleTemplates.manager_can_delete_customers : true,
          can_view_customers: roleTemplates.manager_can_view_customers !== undefined ? roleTemplates.manager_can_view_customers : true,
          can_manage_schedule: roleTemplates.manager_can_manage_schedule !== undefined ? roleTemplates.manager_can_manage_schedule : true,
          can_delete_schedule: roleTemplates.manager_can_delete_schedule !== undefined ? roleTemplates.manager_can_delete_schedule : true,
          can_view_schedule: roleTemplates.manager_can_view_schedule !== undefined ? roleTemplates.manager_can_view_schedule : true,
          can_manage_service_logs: roleTemplates.manager_can_manage_service_logs !== undefined ? roleTemplates.manager_can_manage_service_logs : true,
          can_delete_service_logs: roleTemplates.manager_can_delete_service_logs !== undefined ? roleTemplates.manager_can_delete_service_logs : true,
          can_view_service_logs: roleTemplates.manager_can_view_service_logs !== undefined ? roleTemplates.manager_can_view_service_logs : true,
          can_manage_inventory: roleTemplates.manager_can_manage_inventory !== undefined ? roleTemplates.manager_can_manage_inventory : true,
          can_delete_inventory: roleTemplates.manager_can_delete_inventory !== undefined ? roleTemplates.manager_can_delete_inventory : true,
          can_view_inventory: roleTemplates.manager_can_view_inventory !== undefined ? roleTemplates.manager_can_view_inventory : true,
          can_manage_employees: roleTemplates.manager_can_manage_employees !== undefined ? roleTemplates.manager_can_manage_employees : false,
          can_view_reports: roleTemplates.manager_can_view_reports !== undefined ? roleTemplates.manager_can_view_reports : true,
          can_export_data: roleTemplates.manager_can_export_data !== undefined ? roleTemplates.manager_can_export_data : true,
        };
      }
      return {
        can_manage_customers: true,
        can_delete_customers: true,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: true,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: true,
        can_view_service_logs: true,
        can_manage_inventory: true,
        can_delete_inventory: true,
        can_view_inventory: true,
        can_manage_employees: false,
        can_view_reports: true,
        can_export_data: true,
      };
    } else {
      // Employee role - check templates first
      if (roleTemplates) {
        return {
          can_manage_customers: roleTemplates.employee_can_manage_customers !== undefined ? roleTemplates.employee_can_manage_customers : true,
          can_delete_customers: roleTemplates.employee_can_delete_customers !== undefined ? roleTemplates.employee_can_delete_customers : false,
          can_view_customers: roleTemplates.employee_can_view_customers !== undefined ? roleTemplates.employee_can_view_customers : true,
          can_manage_schedule: roleTemplates.employee_can_manage_schedule !== undefined ? roleTemplates.employee_can_manage_schedule : true,
          can_delete_schedule: roleTemplates.employee_can_delete_schedule !== undefined ? roleTemplates.employee_can_delete_schedule : false,
          can_view_schedule: roleTemplates.employee_can_view_schedule !== undefined ? roleTemplates.employee_can_view_schedule : true,
          can_manage_service_logs: roleTemplates.employee_can_manage_service_logs !== undefined ? roleTemplates.employee_can_manage_service_logs : true,
          can_delete_service_logs: roleTemplates.employee_can_delete_service_logs !== undefined ? roleTemplates.employee_can_delete_service_logs : false,
          can_view_service_logs: roleTemplates.employee_can_view_service_logs !== undefined ? roleTemplates.employee_can_view_service_logs : true,
          can_manage_inventory: roleTemplates.employee_can_manage_inventory !== undefined ? roleTemplates.employee_can_manage_inventory : false,
          can_delete_inventory: roleTemplates.employee_can_delete_inventory !== undefined ? roleTemplates.employee_can_delete_inventory : false,
          can_view_inventory: roleTemplates.employee_can_view_inventory !== undefined ? roleTemplates.employee_can_view_inventory : false,
          can_manage_employees: roleTemplates.employee_can_manage_employees !== undefined ? roleTemplates.employee_can_manage_employees : false,
          can_view_reports: roleTemplates.employee_can_view_reports !== undefined ? roleTemplates.employee_can_view_reports : false,
          can_export_data: roleTemplates.employee_can_export_data !== undefined ? roleTemplates.employee_can_export_data : false,
        };
      }
      return {
        can_manage_customers: true,
        can_delete_customers: false,
        can_view_customers: true,
        can_manage_schedule: true,
        can_delete_schedule: false,
        can_view_schedule: true,
        can_manage_service_logs: true,
        can_delete_service_logs: false,
        can_view_service_logs: true,
        can_manage_inventory: false,
        can_delete_inventory: false,
        can_view_inventory: false,
        can_manage_employees: false,
        can_view_reports: false,
        can_export_data: false,
      };
    }
  };

  // Get the user's role from permission record
  const userRole = userPermission?.role || (isAdmin ? 'admin' : isManager ? 'manager' : 'employee');
  
  // Always use role templates as the source of truth for permissions
  const getEffectivePermissions = () => {
    if (isAdmin) {
      return getDefaultPermissions();
    }
    
    if (roleTemplates) {
      const prefix = `${userRole}_`;
      return {
        can_view_customers: roleTemplates[`${prefix}can_view_customers`] === true,
        can_manage_customers: roleTemplates[`${prefix}can_manage_customers`] === true,
        can_delete_customers: roleTemplates[`${prefix}can_delete_customers`] === true,
        can_view_schedule: roleTemplates[`${prefix}can_view_schedule`] === true,
        can_manage_schedule: roleTemplates[`${prefix}can_manage_schedule`] === true,
        can_delete_schedule: roleTemplates[`${prefix}can_delete_schedule`] === true,
        can_view_service_logs: roleTemplates[`${prefix}can_view_service_logs`] === true,
        can_manage_service_logs: roleTemplates[`${prefix}can_manage_service_logs`] === true,
        can_delete_service_logs: roleTemplates[`${prefix}can_delete_service_logs`] === true,
        can_view_inventory: roleTemplates[`${prefix}can_view_inventory`] === true,
        can_manage_inventory: roleTemplates[`${prefix}can_manage_inventory`] === true,
        can_delete_inventory: roleTemplates[`${prefix}can_delete_inventory`] === true,
        can_view_reports: roleTemplates[`${prefix}can_view_reports`] === true,
        can_export_data: roleTemplates[`${prefix}can_export_data`] === true,
        can_manage_employees: roleTemplates[`${prefix}can_manage_employees`] === true,
      };
    }
    
    return getDefaultPermissions();
  };

  const permissions = getEffectivePermissions();

  // Loading is true until user is loaded AND permission queries have resolved
  const isLoading = !user || (!!user?.email && permissionLoading);

  return {
    user,
    isAdmin,        // True if system admin OR Permission.role === 'admin'
    isSystemAdmin,  // True only if built-in Base44 role is 'admin'
    isAppAdmin,     // True only if Permission.role === 'admin'
    isManager,
    permissions,
    userRole: userPermission?.role || (isSystemAdmin ? 'admin' : 'employee'),
    loading: isLoading,
  };
}