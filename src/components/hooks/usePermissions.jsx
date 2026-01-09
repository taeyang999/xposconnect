import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [roleTemplates, setRoleTemplates] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAndPermissions = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load role templates from Permission entity
        const templates = await base44.entities.Permission.filter({ user_email: 'role_templates' });
        if (templates && templates.length > 0) {
          setRoleTemplates(templates[0]);
        }
        
        // Load user-specific permissions from Permission entity
        if (currentUser?.email) {
          const userPerms = await base44.entities.Permission.filter({ user_email: currentUser.email });
          if (userPerms && userPerms.length > 0) {
            // Get the most recent permission record for this user
            setUserPermissions(userPerms[userPerms.length - 1]);
          }
        }
      } catch (e) {
        console.log('User not logged in');
      } finally {
        setLoading(false);
      }
    };
    loadUserAndPermissions();
  }, []);

  // System admin: Base44 built-in role === 'admin'
  const isSystemAdmin = user?.role === 'admin';
  
  // App admin: User.app_role === 'admin' (set by system admin in EmployeeForm)
  const isAppAdmin = user?.app_role === 'admin';
  
  // Combined admin check - system admins are always treated as admins
  const isAdmin = isSystemAdmin || isAppAdmin;
  
  // Manager check: User.app_role === 'manager' (but not if they're a system admin)
  const isManager = !isSystemAdmin && user?.app_role === 'manager';

  // Helper to get template value for a role and permission
  const getTemplatePermission = (role, permKey) => {
    if (!roleTemplates) return undefined;
    const templateKey = `${role}_${permKey}`;
    return roleTemplates[templateKey];
  };

  // Determine user's effective role from Permission entity or User.app_role
  const effectiveRole = userPermissions?.role || user?.app_role || 'employee';

  // Get effective permissions based on role
  // Priority: Role template first (from EmployeePermissions page), then hardcoded default
  // User-specific Permission records only store role, not individual permission overrides
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

    // For managers - use role template
    if (isManager || effectiveRole === 'manager') {
      return {
        can_manage_customers: getTemplatePermission('manager', 'can_manage_customers') ?? true,
        can_delete_customers: getTemplatePermission('manager', 'can_delete_customers') ?? true,
        can_view_customers: getTemplatePermission('manager', 'can_view_customers') ?? true,
        can_manage_schedule: getTemplatePermission('manager', 'can_manage_schedule') ?? true,
        can_delete_schedule: getTemplatePermission('manager', 'can_delete_schedule') ?? true,
        can_view_schedule: getTemplatePermission('manager', 'can_view_schedule') ?? true,
        can_manage_service_logs: getTemplatePermission('manager', 'can_manage_service_logs') ?? true,
        can_delete_service_logs: getTemplatePermission('manager', 'can_delete_service_logs') ?? true,
        can_view_service_logs: getTemplatePermission('manager', 'can_view_service_logs') ?? true,
        can_manage_inventory: getTemplatePermission('manager', 'can_manage_inventory') ?? true,
        can_delete_inventory: getTemplatePermission('manager', 'can_delete_inventory') ?? true,
        can_view_inventory: getTemplatePermission('manager', 'can_view_inventory') ?? true,
        can_manage_employees: getTemplatePermission('manager', 'can_manage_employees') ?? false,
        can_view_reports: getTemplatePermission('manager', 'can_view_reports') ?? true,
        can_export_data: getTemplatePermission('manager', 'can_export_data') ?? true,
      };
    }

    // Regular employees - use role template
    return {
      can_manage_customers: getTemplatePermission('employee', 'can_manage_customers') ?? true,
      can_delete_customers: getTemplatePermission('employee', 'can_delete_customers') ?? false,
      can_view_customers: getTemplatePermission('employee', 'can_view_customers') ?? true,
      can_manage_schedule: getTemplatePermission('employee', 'can_manage_schedule') ?? true,
      can_delete_schedule: getTemplatePermission('employee', 'can_delete_schedule') ?? false,
      can_view_schedule: getTemplatePermission('employee', 'can_view_schedule') ?? true,
      can_manage_service_logs: getTemplatePermission('employee', 'can_manage_service_logs') ?? true,
      can_delete_service_logs: getTemplatePermission('employee', 'can_delete_service_logs') ?? false,
      can_view_service_logs: getTemplatePermission('employee', 'can_view_service_logs') ?? true,
      can_manage_inventory: getTemplatePermission('employee', 'can_manage_inventory') ?? false,
      can_delete_inventory: getTemplatePermission('employee', 'can_delete_inventory') ?? false,
      can_view_inventory: getTemplatePermission('employee', 'can_view_inventory') ?? false,
      can_manage_employees: getTemplatePermission('employee', 'can_manage_employees') ?? false,
      can_view_reports: getTemplatePermission('employee', 'can_view_reports') ?? false,
      can_export_data: getTemplatePermission('employee', 'can_export_data') ?? false,
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