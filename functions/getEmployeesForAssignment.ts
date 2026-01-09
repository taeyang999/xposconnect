export default async function getEmployeesForAssignment() {
  const user = await base44.auth.me();
  
  // Check user permissions
  const perms = await base44.asServiceRole.entities.Permission.filter({ 
    user_email: user.email 
  });
  const perm = perms && perms.length > 0 ? perms[0] : null;
  
  // Allow system admins or users with can_manage_service_logs/customers/schedule
  const isSystemAdmin = user.role === 'admin';
  const isAppAdmin = perm?.role === 'admin';
  const canManage = perm?.can_manage_service_logs || 
                    perm?.can_manage_customers || 
                    perm?.can_manage_schedule;
  
  if (!isSystemAdmin && !isAppAdmin && !canManage) {
    return [];
  }
  
  // Fetch all users using service role
  const employees = await base44.asServiceRole.entities.User.list();
  
  return employees;
}