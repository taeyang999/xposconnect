import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, MapPin, User, AlertCircle
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths,
  subMonths, isToday, addDays, startOfDay, endOfDay
} from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from '@/components/ui/PageHeader';
import EventForm from '@/components/schedule/EventForm';
import EventDetail from '@/components/schedule/EventDetail';
import { cn } from "@/lib/utils";

export default function Schedule() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => isAdmin
      ? base44.entities.ScheduleEvent.list('-start_datetime')
      : base44.entities.ScheduleEvent.filter({ assigned_employee: user?.email }, '-start_datetime'),
    enabled: !!user,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const getCustomerName = (customerId) => {
    return customers.find(c => c.id === customerId)?.name || '';
  };

  const getEmployeeInitials = (email) => {
    const emp = employees.find(e => e.email === email);
    if (emp?.firstname && emp?.lastname) {
      return `${emp.firstname.charAt(0)}${emp.lastname.charAt(0)}`.toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleDelete = async () => {
    if (deleteEvent) {
      await base44.entities.ScheduleEvent.delete(deleteEvent.id);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteEvent(null);
      setSelectedEvent(null);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
    setSelectedEvent(null);
  };

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week view calculations
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventStart = startOfDay(parseISO(event.start_datetime));
      const eventEnd = startOfDay(parseISO(event.end_datetime));
      const checkDay = startOfDay(day);
      return checkDay >= eventStart && checkDay <= eventEnd;
    });
  };

  const statusColors = {
    scheduled: 'bg-blue-500',
    confirmed: 'bg-indigo-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-slate-400',
  };

  const typeColors = {
    appointment: 'border-l-blue-500',
    task: 'border-l-amber-500',
    service: 'border-l-emerald-500',
    meeting: 'border-l-purple-500',
    reminder: 'border-l-red-500',
  };

  // Check for conflicts
  const hasConflict = (event) => {
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime);
    
    return events.some(e => {
      if (e.id === event.id || e.assigned_employee !== event.assigned_employee) return false;
      const eStart = new Date(e.start_datetime);
      const eEnd = new Date(e.end_datetime);
      return (eventStart < eEnd && eventEnd > eStart);
    });
  };

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Manage appointments, tasks, and services"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        }
      />

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, -7))}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
            {view === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
            }
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7))}
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl ml-2"
          >
            Today
          </Button>
        </div>

        <Tabs value={view} onValueChange={setView}>
          <TabsList className="bg-slate-100/80 rounded-xl">
            <TabsTrigger value="month" className="rounded-lg">Month</TabsTrigger>
            <TabsTrigger value="week" className="rounded-lg">Week</TabsTrigger>
            <TabsTrigger value="day" className="rounded-lg">Day</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <Card className="p-6">
          <Skeleton className="h-96 w-full rounded-xl" />
        </Card>
      ) : view === 'month' ? (
        <Card className="overflow-hidden border-slate-200/80">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-3 text-center text-sm font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[160px] p-2 border-b border-r border-slate-100 transition-colors",
                    !isCurrentMonth && "bg-slate-50/50",
                    isToday(day) && "bg-blue-50/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    !isCurrentMonth && "text-slate-400",
                    isToday(day) && "text-blue-600"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 5).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "w-full text-left text-xs p-1.5 rounded-lg border-l-2 bg-white shadow-sm hover:shadow transition-shadow truncate",
                          typeColors[event.event_type] || typeColors.appointment
                        )}
                      >
                        <span className="font-medium text-slate-900">{event.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 5 && (
                      <button className="text-xs text-slate-500 hover:text-slate-700 pl-1">
                        +{dayEvents.length - 5} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : view === 'week' ? (
        <Card className="overflow-hidden border-slate-200/80">
          <div className="grid grid-cols-7">
            {weekDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              
              return (
                <div key={idx} className="border-r border-slate-100 last:border-r-0">
                  <div className={cn(
                    "p-3 text-center border-b border-slate-100",
                    isToday(day) && "bg-blue-50"
                  )}>
                    <div className="text-xs text-slate-500">{format(day, 'EEE')}</div>
                    <div className={cn(
                      "text-lg font-semibold",
                      isToday(day) ? "text-blue-600" : "text-slate-900"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="p-2 min-h-[400px] space-y-2">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "w-full text-left text-xs p-2 rounded-lg border-l-2 bg-slate-50 hover:bg-slate-100 transition-colors",
                          typeColors[event.event_type] || typeColors.appointment
                        )}
                      >
                        <div className="font-medium text-slate-900 truncate">{event.title}</div>
                        {hasConflict(event) && (
                          <div className="flex items-center gap-1 text-amber-600 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Conflict</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        // Day View
        <Card className="overflow-hidden border-slate-200/80 p-6">
          <div className={cn(
            "text-center mb-6 pb-4 border-b",
            isToday(currentDate) && "text-blue-600"
          )}>
            <div className="text-sm text-slate-500">{format(currentDate, 'EEEE')}</div>
            <div className="text-3xl font-bold">{format(currentDate, 'MMMM d, yyyy')}</div>
          </div>
          <div className="space-y-3">
            {getEventsForDay(currentDate).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No events scheduled for this day</p>
              </div>
            ) : (
              getEventsForDay(currentDate).map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors",
                    typeColors[event.event_type] || typeColors.appointment
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                        {event.assigned_employee && (
                          <span className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="bg-slate-800 text-white text-[8px] font-medium">
                                {getEmployeeInitials(event.assigned_employee)}
                              </AvatarFallback>
                            </Avatar>
                            {event.assigned_employee}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={`${statusColors[event.status]} text-white`}>
                      {event.status}
                    </Badge>
                  </div>
                  {hasConflict(event) && (
                    <div className="flex items-center gap-1 text-amber-600 mt-2 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>Schedule conflict detected</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Event Form */}
      <EventForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingEvent(null); }}
        event={editingEvent}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['events'] })}
      />

      {/* Event Detail */}
      <EventDetail
        event={selectedEvent}
        customerName={selectedEvent?.customer_id ? getCustomerName(selectedEvent.customer_id) : null}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEdit}
        onDelete={() => setDeleteEvent(selectedEvent)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEvent} onOpenChange={() => setDeleteEvent(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-lg">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}