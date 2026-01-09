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

  // Application administrator: built-in admin OR User.app_role === 'admin'
  const isSystemAdmin = user?.role === 'admin';
  const isAppAdmin = user?.app_role === 'admin';
  const isAdmin = isSystemAdmin || isAppAdmin;
  
  // Manager check: User.app_role === 'manager'
  const isManager = user?.app_role === 'manager';

  // Get effective permissions
  const getEffectivePermissions = () => {
    if (!user) return {};

    // Admins get all permissions
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

    // For managers and employees, use user's specific permissions
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

  return {
    user,
    isAdmin,        // True if system admin OR User.app_role === 'admin'
    isSystemAdmin,  // True only if built-in Base44 role is 'admin'
    isAppAdmin,     // True only if User.app_role === 'admin'
    isManager,
    permissions,
    userRole: user?.app_role || (isSystemAdmin ? 'admin' : 'employee'),
    loading,
  };
}