import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logAudit } from '../audit/auditLogger';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Paperclip, X, Image as ImageIcon, FileText, CalendarIcon } from 'lucide-react';
import ServiceLogComments from './ServiceLogComments';
import { createNotification } from '../notifications/notificationService';

export default function ServiceLogForm({ open, onClose, serviceLog, customerId, onSave }) {
  const [formData, setFormData] = useState({
    ticket_id: '',
    customer_id: customerId || '',
    title: '',
    description: '',
    service_date: undefined,
    status: 'new',
    assigned_employee: '',
    notes: '',
    schedule_event_id: null,
  });
  const [previousEmployee, setPreviousEmployee] = useState('');
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employeesForAssignment'],
    queryFn: async () => {
      // Get permissions to extract employee emails since User list may be restricted
      const permissions = await base44.entities.Permission.list();
      const employeeEmails = permissions
        .filter(p => p.user_email && p.user_email !== 'role_templates')
        .map(p => ({
          id: p.id,
          email: p.user_email,
          firstname: '',
          lastname: '',
          full_name: p.user_email,
          status: 'active',
        }));
      
      // Try to get full user data if possible
      try {
        const users = await base44.entities.User.list();
        if (users && users.length > 0) {
          return users.filter(u => u.status !== 'inactive');
        }
      } catch (err) {
        console.log('Using permissions for employee list');
      }
      
      return employeeEmails;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-name'),
    enabled: !customerId,
  });

  const { data: allServiceLogs = [] } = useQuery({
    queryKey: ['allServiceLogs'],
    queryFn: () => base44.entities.ServiceLog.list('-created_date'),
  });

  const generateTicketId = () => {
    const existingTickets = allServiceLogs
      .map(log => log.ticket_id)
      .filter(id => id)
      .map(id => parseInt(id, 10))
      .filter(num => !isNaN(num));
    
    const maxNumber = existingTickets.length > 0 ? Math.max(...existingTickets) : 0;
    return String(maxNumber + 1);
  };

  useEffect(() => {
    if (serviceLog) {
      setFormData({
        ticket_id: serviceLog.ticket_id || '',
        customer_id: serviceLog.customer_id || customerId || '',
        title: serviceLog.title || '',
        description: serviceLog.description || '',
        service_date: serviceLog.service_date ? new Date(serviceLog.service_date) : undefined,
        status: serviceLog.status || 'new',
        assigned_employee: serviceLog.assigned_employee || '',
        notes: serviceLog.notes || '',
        schedule_event_id: serviceLog.schedule_event_id || null,
      });
      setPreviousEmployee(serviceLog.assigned_employee || '');
    } else {
      setFormData({
        ticket_id: generateTicketId(),
        customer_id: customerId || '',
        title: '',
        description: '',
        service_date: new Date(),
        status: 'new',
        assigned_employee: '',
        notes: '',
        schedule_event_id: null,
      });
      setPreviousEmployee('');
    }
  }, [serviceLog, customerId, open, allServiceLogs]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          file_url,
          name: file.name,
          type: file.type,
        };
      });
      const uploaded = await Promise.all(uploadPromises);
      setAttachments([...attachments, ...uploaded]);
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let logId;
      const isNewAssignment = formData.assigned_employee && formData.assigned_employee !== previousEmployee;
      const serviceDateString = formData.service_date ? format(formData.service_date, 'yyyy-MM-dd') : '';

      const dataToSave = {
        ...formData,
        service_date: formData.service_date ? format(formData.service_date, 'yyyy-MM-dd') : null,
      };

      if (serviceLog) {
        // Calculate only changed fields
        const changes = {};
        for (const key in dataToSave) {
          const oldVal = serviceLog[key] ?? '';
          const newVal = dataToSave[key] ?? '';
          const oldNormalized = typeof oldVal === 'boolean' ? oldVal : String(oldVal);
          const newNormalized = typeof newVal === 'boolean' ? newVal : String(newVal);
          if (oldNormalized !== newNormalized) {
            changes[key] = { from: serviceLog[key], to: dataToSave[key] };
          }
        }
        await base44.entities.ServiceLog.update(serviceLog.id, dataToSave);
        if (Object.keys(changes).length > 0) {
          await logAudit('ServiceLog', serviceLog.id, formData.title, 'update', changes);
        }
        logId = serviceLog.id;
      } else {
        const newLog = await base44.entities.ServiceLog.create(dataToSave);
        await logAudit('ServiceLog', newLog.id, formData.title, 'create', dataToSave);
        logId = newLog.id;
      }

      // Create photo records for attachments
      if (attachments.length > 0) {
        await Promise.all(
          attachments.map(att =>
            base44.entities.CustomerPhoto.create({
              customer_id: formData.customer_id,
              service_log_id: logId,
              file_url: att.file_url,
              title: att.name,
              category: 'service',
            })
          )
        );
      }

      // Send notification if employee was assigned
      if (isNewAssignment) {
        try {
          const customerName = customers.find(c => c.id === formData.customer_id)?.name || 'a customer';
          
          // Send email notification
          await base44.integrations.Core.SendEmail({
            to: formData.assigned_employee,
            subject: `New Service Log Assigned: ${formData.title}`,
            body: `You have been assigned a new service log.\n\nTitle: ${formData.title}\nCustomer: ${customerName}\nService Date: ${serviceDateString}\nStatus: ${formData.status}\n\nPlease check the system for more details.`
          });
          
          // Create in-app notification
          await createNotification({
            recipientEmail: formData.assigned_employee,
            title: `New Service Log: ${formData.title}`,
            message: `You have been assigned a service log for ${customerName}. Service date: ${serviceDateString}.`,
            type: 'service_log',
            link: `/CustomerDetail?id=${formData.customer_id}`,
          });
          
          toast.success('Employee notified');
        } catch (err) {
          console.error('Failed to send notification:', err);
        }
      }

      // Handle schedule event creation/update when status is scheduled
      if (formData.status === 'scheduled' && formData.assigned_employee && formData.service_date) {
        const startDateTime = new Date(formData.service_date);
        startDateTime.setHours(9, 0, 0, 0);
        const endDateTime = new Date(formData.service_date);
        endDateTime.setHours(17, 0, 0, 0);

        const customerName = customers.find(c => c.id === formData.customer_id)?.name || '';
        const scheduleEventData = {
          title: `Service: ${formData.title}`,
          description: formData.description || `Service log for ${customerName}`,
          customer_id: formData.customer_id,
          assigned_employee: formData.assigned_employee,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          event_type: 'service',
          status: 'scheduled',
          location: '',
        };

        let scheduleEventId = formData.schedule_event_id;
        if (scheduleEventId) {
          await base44.entities.ScheduleEvent.update(scheduleEventId, scheduleEventData);
          await logAudit('ScheduleEvent', scheduleEventId, scheduleEventData.title, 'update', scheduleEventData);
        } else {
          const newScheduleEvent = await base44.entities.ScheduleEvent.create(scheduleEventData);
          await logAudit('ScheduleEvent', newScheduleEvent.id, scheduleEventData.title, 'create', scheduleEventData);
          scheduleEventId = newScheduleEvent.id;
          await base44.entities.ServiceLog.update(logId, { schedule_event_id: scheduleEventId });
        }
        
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }

      onSave();
      onClose();
      setAttachments([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {serviceLog ? 'Edit Service Log' : 'Add Service Log'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <Label htmlFor="ticket_id">Ticket ID</Label>
            <Input
              id="ticket_id"
              value={formData.ticket_id}
              readOnly
              className="mt-1.5 bg-slate-50"
            />
          </div>

          {!customerId && (
            <div>
              <Label>Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                required
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Annual Maintenance"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the service..."
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1.5",
                      !formData.service_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.service_date ? (
                      format(formData.service_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.service_date}
                    onSelect={(date) => setFormData({ ...formData, service_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assigned Employee {loadingEmployees && '(Loading...)'}</Label>
            <Select
              value={formData.assigned_employee || 'unassigned'}
              onValueChange={(value) => setFormData({ ...formData, assigned_employee: value === 'unassigned' ? '' : value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employees && employees.length > 0 ? (
                  employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.email}>
                      {emp.firstname && emp.lastname ? `${emp.firstname} ${emp.lastname}` : emp.full_name || emp.email}
                    </SelectItem>
                  ))
                ) : (
                  !loadingEmployees && <div className="px-2 py-1.5 text-sm text-slate-500">No employees found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Attachments</Label>
            <div className="mt-1.5 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload').click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Add Photos/Documents
                    </>
                  )}
                </Button>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      {att.type?.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-700 truncate flex-1">{att.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(index)}
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {serviceLog && serviceLog.id && (
            <div className="pt-4 border-t">
              <ServiceLogComments serviceLogId={serviceLog.id} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {serviceLog ? 'Save Changes' : 'Create Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}