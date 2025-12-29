import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from './utils';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Users, Calendar, Package, FileText, 
  Settings, Menu, X, LogOut, ChevronDown, Bell, Search,
  Building2, UserCircle, Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
      } from "@/components/ui/dropdown-menu";
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load permissions and role templates
        if (currentUser && currentUser.role !== 'admin') {
          const [perms, templates] = await Promise.all([
            base44.entities.Permission.filter({ user_email: currentUser.email }),
            base44.entities.Permission.filter({ user_email: 'role_templates' })
          ]);
          
          const userPerm = perms && perms.length > 0 ? perms[0] : null;
          const roleTemplate = templates && templates.length > 0 ? templates[0] : null;
          
          // Get the user's role from permission record
          const userRole = userPerm?.role || 'employee';
          const prefix = `${userRole}_`;
          
          // ALWAYS use role template as the source of truth for permissions
          // This ensures when role changes, permissions update immediately
          const effectivePermissions = {
            role: userRole,
            can_view_customers: roleTemplate?.[`${prefix}can_view_customers`] === true,
            can_manage_customers: roleTemplate?.[`${prefix}can_manage_customers`] === true,
            can_delete_customers: roleTemplate?.[`${prefix}can_delete_customers`] === true,
            can_view_schedule: roleTemplate?.[`${prefix}can_view_schedule`] === true,
            can_manage_schedule: roleTemplate?.[`${prefix}can_manage_schedule`] === true,
            can_delete_schedule: roleTemplate?.[`${prefix}can_delete_schedule`] === true,
            can_view_service_logs: roleTemplate?.[`${prefix}can_view_service_logs`] === true,
            can_manage_service_logs: roleTemplate?.[`${prefix}can_manage_service_logs`] === true,
            can_delete_service_logs: roleTemplate?.[`${prefix}can_delete_service_logs`] === true,
            can_view_inventory: roleTemplate?.[`${prefix}can_view_inventory`] === true,
            can_manage_inventory: roleTemplate?.[`${prefix}can_manage_inventory`] === true,
            can_delete_inventory: roleTemplate?.[`${prefix}can_delete_inventory`] === true,
            can_view_reports: roleTemplate?.[`${prefix}can_view_reports`] === true,
            can_export_data: roleTemplate?.[`${prefix}can_export_data`] === true,
            can_manage_employees: roleTemplate?.[`${prefix}can_manage_employees`] === true,
          };
          
          setPermissions(effectivePermissions);
        }
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const result = await base44.entities.Customer.list();
      return result || [];
    },
    enabled: !!user,
  });

  const { data: serviceLogs = [] } = useQuery({
    queryKey: ['serviceLogs'],
    queryFn: async () => {
      const result = await base44.entities.ServiceLog.list();
      return result || [];
    },
    enabled: !!user,
  });

  const getCustomerName = (customerId) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };

  const searchResults = searchQuery.trim() ? {
    customers: customers.filter(c => 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
    ).slice(0, 5),
    serviceLogs: serviceLogs.filter(s => 
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ticket_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(s.customer_id)?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  } : { customers: [], serviceLogs: [] };

  const hasResults = searchResults.customers.length > 0 || searchResults.serviceLogs.length > 0;

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  // Filter navigation based on permissions
  const getFilteredNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard, requiresPermission: null },
      { name: 'Customers', href: 'Customers', icon: Users, requiresPermission: 'can_view_customers' },
      { name: 'Schedule', href: 'Schedule', icon: Calendar, requiresPermission: 'can_view_schedule' },
      { name: 'Service Logs', href: 'ServiceLogs', icon: FileText, requiresPermission: 'can_view_service_logs' },
    ];

    if (isAdmin || isManager) {
      return baseNav; // Show all navigation items
    }

    // Filter based on permissions for regular employees
    return baseNav.filter(item => {
      if (!item.requiresPermission) return true;
      return permissions?.[item.requiresPermission] === true;
    });
  };

  const getFilteredAdminNavigation = () => {
    const adminNav = [
      { name: 'Inventory', href: 'Inventory', icon: Package, requiresPermission: 'can_view_inventory' },
      { name: 'Reports', href: 'Reports', icon: Building2, requiresPermission: 'can_view_reports' },
      { name: 'Employees', href: 'Employees', icon: UserCircle, requiresPermission: 'can_manage_employees' },
      { name: 'Permissions', href: 'EmployeePermissions', icon: Shield, requiresAdmin: true },
      { name: 'Audit Logs', href: 'AuditLogs', icon: FileText, requiresAdmin: true },
    ];

    return adminNav.filter(item => {
      if (item.requiresAdmin) return isAdmin;
      if (item.requiresPermission) {
        // For admins, always show
        if (isAdmin) return true;
        // For managers, check permission explicitly
        if (isManager) return permissions?.[item.requiresPermission] !== false;
        // For employees, only show if permission is explicitly true
        return permissions?.[item.requiresPermission] === true;
      }
      return false;
    });
  };

  const navigation = getFilteredNavigation();
  const adminNavigation = getFilteredAdminNavigation();

  const NavLink = ({ item }) => (
    <Link
      to={createPageUrl(item.href)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
        currentPageName === item.href
          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
      onClick={() => setSidebarOpen(false)}
    >
      <item.icon className="h-5 w-5" />
      {item.name}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200/80 transform transition-transform duration-300 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">xPOSConnect</h1>
                <p className="text-xs text-slate-500">Business Management</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <p className="px-4 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main</p>
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}

            {adminNavigation.length > 0 && (
              <>
                <p className="px-4 mt-8 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {isAdmin ? 'Admin' : 'Management'}
                </p>
                {adminNavigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </>
            )}
          </nav>


        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Menu className="h-6 w-6 text-slate-600" />
              </button>
              <div className="hidden md:block relative w-80" ref={searchRef}>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100/80 rounded-xl">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search customers, services..."
                    className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => searchQuery && setShowResults(true)}
                  />
                </div>

                {showResults && searchQuery && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
                    {hasResults ? (
                      <>
                        {searchResults.customers.length > 0 && (
                          <div className="p-2">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Customers</div>
                            {searchResults.customers.map(customer => (
                              <button
                                key={customer.id}
                                onClick={() => {
                                  navigate(createPageUrl('CustomerDetail') + `?id=${customer.id}`);
                                  setSearchQuery('');
                                  setShowResults(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Building2 className="h-4 w-4 text-slate-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{customer.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{customer.email || customer.phone}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.serviceLogs.length > 0 && (
                          <div className="p-2 border-t border-slate-100">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Service Logs</div>
                            {searchResults.serviceLogs.map(log => (
                              <button
                                key={log.id}
                                onClick={() => {
                                  navigate(createPageUrl('CustomerDetail') + `?id=${log.customer_id}`);
                                  setSearchQuery('');
                                  setShowResults(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{log.title}</p>
                                    <p className="text-xs text-slate-500 truncate">{getCustomerName(log.customer_id)}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No results found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
                                <NotificationDropdown userEmail={user?.email} />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-xl hover:bg-slate-100">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-800 text-white text-sm">
                              {user ? (() => {
                                const first = user.firstname?.charAt(0) || '';
                                const last = user.lastname?.charAt(0) || '';
                                if (first && last) {
                                  return (first + last).toUpperCase();
                                }
                                return first.toUpperCase() || last.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';
                              })() : 'U'}
                            </AvatarFallback>
                      </Avatar>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  <div className="px-3 py-2">
                                            <p className="text-sm font-medium">{[user?.firstname, user?.lastname].filter(Boolean).join(' ') || 'User'}</p>
                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                          </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to={createPageUrl('Profile')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}