import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logAudit } from '../components/audit/auditLogger';
import { usePermissions } from '@/components/hooks/usePermissions';
import { Plus, CalendarDays, LayoutGrid } from 'lucide-react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import ScheduleEventCard from '@/components/schedule/ScheduleEventCard';
import ScheduleEventCardDesktop from '@/components/schedule/ScheduleEventCardDesktop';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

// Custom compact event component for month view
const MonthEventComponent = ({ event }) => (
  <div className="truncate text-xs leading-tight py-0.5">
    {event.title}
  </div>
);

export default function Schedule() {
  const { user, permissions, isAdmin } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [desktopView, setDesktopView] = useState('calendar'); // 'calendar' or 'cards'
  const queryClient = useQueryClient();

  const canView = permissions?.can_view_schedule !== false;
  const canManage = isAdmin || permissions?.can_manage_schedule;
  const canDelete = isAdmin || permissions?.can_delete_schedule;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.ScheduleEvent.list('-start_datetime'),
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

  const getEmployeeName = (email) => {
    const emp = employees.find(e => e.email === email);
    if (emp?.firstname && emp?.lastname) {
      return `${emp.firstname} ${emp.lastname}`;
    }
    return email || 'Unknown';
  };

  const handleDelete = async () => {
    if (deleteEvent) {
      await base44.entities.ScheduleEvent.delete(deleteEvent.id);
      await logAudit('ScheduleEvent', deleteEvent.id, deleteEvent.title, 'delete', {}, 'Event deleted');
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

  // Convert events to React Big Calendar format
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      title: event.title,
      start: new Date(event.start_datetime),
      end: new Date(event.end_datetime),
      resource: event,
    }));
  }, [events]);

  const eventStyleGetter = (event) => {
    const typeColors = {
      appointment: '#3b82f6',
      task: '#f59e0b',
      service: '#10b981',
      meeting: '#a855f7',
      reminder: '#ef4444',
    };

    const statusColors = {
      scheduled: '#3b82f6',
      confirmed: '#6366f1',
      completed: '#10b981',
      cancelled: '#94a3b8',
    };

    return {
      style: {
        backgroundColor: statusColors[event.status] || typeColors[event.event_type] || '#3b82f6',
        borderRadius: '6px',
        opacity: event.status === 'completed' ? 0.7 : 0.95,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.8125rem',
        fontWeight: '500',
        padding: '2px 6px',
      },
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
  };

  const handleSelectSlot = ({ start, end }) => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEventDrop = async ({ event, start, end }) => {
    await base44.entities.ScheduleEvent.update(event.id, {
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const handleEventResize = async ({ event, start, end }) => {
    await base44.entities.ScheduleEvent.update(event.id, {
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Manage appointments, tasks, and services"
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center border border-slate-200 rounded-lg p-1">
              <Button
                variant={desktopView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDesktopView('calendar')}
                className={desktopView === 'calendar' ? 'bg-slate-900 hover:bg-slate-800' : ''}
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Button
                variant={desktopView === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDesktopView('cards')}
                className={desktopView === 'cards' ? 'bg-slate-900 hover:bg-slate-800' : ''}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        }
      />

      {/* Mobile: Event Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-40 w-full bg-slate-100 rounded-xl animate-pulse"></div>
          ))
        ) : calendarEvents.length > 0 ? (
          calendarEvents
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .map((event) => (
              <ScheduleEventCard
                key={event.id}
                event={event}
                getCustomerName={getCustomerName}
                getEmployeeInitials={getEmployeeInitials}
                getEmployeeName={getEmployeeName}
                onEdit={handleEdit}
                onDelete={setDeleteEvent}
                onSelect={handleSelectEvent}
              />
            ))
        ) : (
          <Card className="p-8 text-center text-slate-500">No events scheduled.</Card>
        )}
      </div>

      {/* Desktop: Calendar View */}
      {desktopView === 'calendar' && (
        <Card className="hidden lg:block overflow-hidden border-slate-200/80 p-2">
          <div style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}>
            <DnDCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              selectable
              resizable
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              popup
              components={{
                month: {
                  event: MonthEventComponent,
                },
              }}
              messages={{
                showMore: (total) => `+${total} more`,
              }}
              max={new Date(2099, 12, 31)}
              showAllEvents
            />
          </div>
        </Card>
      )}

      {/* Desktop: Card View */}
      {desktopView === 'cards' && (
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 w-full bg-slate-100 rounded-xl animate-pulse"></div>
            ))
          ) : calendarEvents.length > 0 ? (
            calendarEvents
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((event) => (
                <ScheduleEventCardDesktop
                  key={event.id}
                  event={event}
                  getCustomerName={getCustomerName}
                  getEmployeeInitials={getEmployeeInitials}
                  getEmployeeName={getEmployeeName}
                  onEdit={handleEdit}
                  onDelete={setDeleteEvent}
                  onSelect={handleSelectEvent}
                />
              ))
          ) : (
            <Card className="col-span-full p-8 text-center text-slate-500">No events scheduled.</Card>
          )}
        </div>
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
        customer={selectedEvent?.customer_id ? customers.find(c => c.id === selectedEvent.customer_id) : null}
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