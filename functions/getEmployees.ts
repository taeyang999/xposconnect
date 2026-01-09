import { base44 } from '@base44/node-sdk';

export default async function getEmployees(request, context) {
  try {
    // Fetch all users using service role (bypasses standard permissions)
    const users = await base44.asServiceRole.entities.User.list('-created_date');
    
    // Filter out inactive users
    const activeUsers = users.filter(u => u.status !== 'inactive');
    
    return {
      success: true,
      employees: activeUsers,
    };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return {
      success: false,
      error: error.message,
      employees: [],
    };
  }
}