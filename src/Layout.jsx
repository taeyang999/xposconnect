import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, Users, Calendar, Package, FileText, 
  Settings, Menu, X, LogOut, ChevronDown, Bell, Search,
  Building2, UserCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navigation = [
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: 'Customers', icon: Users },
    { name: 'Schedule', href: 'Schedule', icon: Calendar },
    { name: 'Inventory', href: 'Inventory', icon: Package },
    { name: 'Service Logs', href: 'ServiceLogs', icon: FileText },
  ];

  const adminNavigation = [
    { name: 'Employees', href: 'Employees', icon: UserCircle },
    { name: 'Reports', href: 'Reports', icon: Building2 },
  ];

  const isAdmin = user?.role === 'admin';

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
                <h1 className="text-lg font-bold text-slate-900">ERP System</h1>
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
            
            {isAdmin && (
              <>
                <p className="px-4 mt-8 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
                {adminNavigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </>
            )}
          </nav>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-slate-200 text-slate-600 font-medium">
                    {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                </div>
              </div>
            </div>
          )}
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
              <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-100/80 rounded-xl w-80">
                <Search className="h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search customers, services..."
                  className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      if (currentPageName === 'Customers') {
                        window.dispatchEvent(new CustomEvent('global-search', { detail: searchQuery }));
                      } else if (currentPageName === 'ServiceLogs') {
                        window.dispatchEvent(new CustomEvent('global-search', { detail: searchQuery }));
                      } else {
                        navigate(createPageUrl('Customers'));
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('global-search', { detail: searchQuery }));
                        }, 100);
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                <Bell className="h-5 w-5 text-slate-500" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-xl hover:bg-slate-100">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-800 text-white text-sm">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
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