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

  const { data: userPermission } = useQuery({
    queryKey: ['userPermission', user?.email],
    queryFn: async () => {
      const result = await base44.entities.Permission.filter({ user_email: user.email });
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: !!user?.email,
  });

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

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
      // Employee role - restrictive defaults
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

  const permissions = userPermission || getDefaultPermissions();

  return {
    user,
    isAdmin,
    isManager,
    permissions,
    loading: !user,
  };
}