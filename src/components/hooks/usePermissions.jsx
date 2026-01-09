import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.log('User not logged in');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // System admin: Base44 built-in role === 'admin'
  const isSystemAdmin = user?.role === 'admin';
  
  // App admin: User.app_role === 'admin' (set by system admin in EmployeeForm)
  const isAppAdmin = user?.app_role === 'admin';
  
  // Combined admin check - system admins are always treated as admins
  const isAdmin = isSystemAdmin || isAppAdmin;
  
  // Manager check: User.app_role === 'manager' (but not if they're a system admin)
  const isManager = !isSystemAdmin && user?.app_role === 'manager';

  // Get effective permissions based on role
  const getEffectivePermissions = () => {
    if (!user) return {};

    // System admins and app admins get all permissions
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
    }

    // Managers get elevated permissions by default, but respect explicit settings
    if (isManager) {
      return {
        can_manage_customers: user.can_manage_customers ?? true,
        can_delete_customers: user.can_delete_customers ?? true,
        can_view_customers: user.can_view_customers ?? true,
        can_manage_schedule: user.can_manage_schedule ?? true,
        can_delete_schedule: user.can_delete_schedule ?? true,
        can_view_schedule: user.can_view_schedule ?? true,
        can_manage_service_logs: user.can_manage_service_logs ?? true,
        can_delete_service_logs: user.can_delete_service_logs ?? true,
        can_view_service_logs: user.can_view_service_logs ?? true,
        can_manage_inventory: user.can_manage_inventory ?? true,
        can_delete_inventory: user.can_delete_inventory ?? true,
        can_view_inventory: user.can_view_inventory ?? true,
        can_manage_employees: user.can_manage_employees ?? false,
        can_view_reports: user.can_view_reports ?? true,
        can_export_data: user.can_export_data ?? true,
      };
    }

    // Regular employees use their specific permissions with restrictive defaults
    return {
      can_manage_customers: user.can_manage_customers ?? true,
      can_delete_customers: user.can_delete_customers ?? false,
      can_view_customers: user.can_view_customers ?? true,
      can_manage_schedule: user.can_manage_schedule ?? true,
      can_delete_schedule: user.can_delete_schedule ?? false,
      can_view_schedule: user.can_view_schedule ?? true,
      can_manage_service_logs: user.can_manage_service_logs ?? true,
      can_delete_service_logs: user.can_delete_service_logs ?? false,
      can_view_service_logs: user.can_view_service_logs ?? true,
      can_manage_inventory: user.can_manage_inventory ?? false,
      can_delete_inventory: user.can_delete_inventory ?? false,
      can_view_inventory: user.can_view_inventory ?? false,
      can_manage_employees: user.can_manage_employees ?? false,
      can_view_reports: user.can_view_reports ?? false,
      can_export_data: user.can_export_data ?? false,
    };
  };

  const permissions = getEffectivePermissions();

  // Determine effective role for display
  const getUserRole = () => {
    if (isSystemAdmin) return 'admin';
    if (user?.app_role) return user.app_role;
    return 'employee';
  };

  return {
    user,
    isAdmin,        // True if system admin OR User.app_role === 'admin'
    isSystemAdmin,  // True only if built-in Base44 role is 'admin'
    isAppAdmin,     // True only if User.app_role === 'admin'
    isManager,      // True only if User.app_role === 'manager' (and not system admin)
    permissions,
    userRole: getUserRole(),
    loading,
  };
}