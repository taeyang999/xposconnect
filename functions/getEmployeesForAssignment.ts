import { base44 } from './base44Client.js';

export default async function getEmployeesForAssignment() {
  // Get the current user making the request
  const currentUser = await base44.auth.currentUser();
  
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  // Check if user is a system admin (built-in Base44 admin role)
  const isSystemAdmin = currentUser.role === 'admin';
  
  // If not system admin, check if user has can_manage_service_logs permission
  let hasPermission = isSystemAdmin;
  
  if (!isSystemAdmin) {
    // Fetch the user's permission record and role templates
    const [userPermissions, roleTemplates] = await Promise.all([
      base44.asServiceRole.entities.Permission.filter({ user_email: currentUser.email }),
      base44.asServiceRole.entities.Permission.filter({ user_email: 'role_templates' })
    ]);
    
    const userPerm = userPermissions && userPermissions.length > 0 ? userPermissions[0] : null;
    const roleTemplate = roleTemplates && roleTemplates.length > 0 ? roleTemplates[0] : null;
    
    // Check if user has Permission.role === 'admin' (app admin)
    if (userPerm?.role === 'admin') {
      hasPermission = true;
    } else if (roleTemplate) {
      // Check role-based permission from templates
      const userRole = userPerm?.role || 'employee';
      const prefix = `${userRole}_`;
      hasPermission = roleTemplate[`${prefix}can_manage_service_logs`] === true;
    }
  }
  
  if (!hasPermission) {
    return { employees: [] };
  }
  
  // Fetch all users using service role to bypass security restrictions
  const allUsers = await base44.asServiceRole.entities.User.list();
  
  // Return only the fields needed for the dropdown
  const employees = allUsers
    .filter(u => u.status !== 'inactive')
    .map(user => ({
      id: user.id,
      email: user.email,
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      full_name: user.full_name || '',
      role: user.role || 'user',
    }));
  
  return { employees };
}