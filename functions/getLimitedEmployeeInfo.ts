import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role to fetch all users (bypasses user-level restrictions)
        const allUsers = await base44.asServiceRole.entities.User.list('-created_date');

        // Return only limited, non-sensitive fields
        const limitedEmployeeInfo = allUsers.map(emp => ({
            id: emp.id,
            email: emp.email,
            firstname: emp.firstname || '',
            lastname: emp.lastname || '',
            app_role: emp.app_role || 'employee',
            department: emp.department || '',
            title: emp.title || '',
            phone: emp.phone || '',
            status: emp.status || 'active',
            hire_date: emp.hire_date || null,
        }));

        return Response.json({ employees: limitedEmployeeInfo });
    } catch (error) {
        console.error('Error fetching employee info:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});