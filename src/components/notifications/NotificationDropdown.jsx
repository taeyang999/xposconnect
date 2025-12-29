import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, FileText, Calendar, Package, Info, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const typeIcons = {
  service_log: FileText,
  schedule: Calendar,
  inventory: Package,
  general: Info,
};

export default function NotificationDropdown({ userEmail }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: userEmail }, '-created_date', 20),
    enabled: !!userEmail,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 2000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      await base44.entities.Notification.update(notification.id, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    await Promise.all(
      unreadNotifications.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
    );
    queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
  };

  const deleteNotification = async (e, notification) => {
    e.stopPropagation();
    await base44.entities.Notification.delete(notification.id);
    queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 relative">
          <Bell className="h-5 w-5 text-slate-500" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700">
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Info;
                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${!notification.is_read ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <Icon className={`h-4 w-4 ${!notification.is_read ? 'text-blue-600' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => deleteNotification(e, notification)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}