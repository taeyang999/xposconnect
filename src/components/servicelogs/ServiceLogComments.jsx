import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { Loader2, Paperclip, X, FileText, Image as ImageIcon, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ServiceLogComments({ serviceLogId }) {
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewFile, setViewFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['serviceLogComments', serviceLogId],
    queryFn: async () => {
      const result = await base44.entities.ServiceLogComment.filter(
        { service_log_id: serviceLogId },
        '-created_date'
      );
      return result || [];
    },
    enabled: !!serviceLogId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const getUserName = (email) => {
    const user = allUsers.find(u => u.email === email);
    if (user?.firstname && user?.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user?.full_name || email;
  };

  const getUserInitials = (email) => {
    const user = allUsers.find(u => u.email === email);
    if (user?.firstname && user?.lastname) {
      return `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          file_url,
          file_name: file.name,
          file_type: file.type,
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
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.ServiceLogComment.create({
        service_log_id: serviceLogId,
        comment: comment.trim(),
        attachments: attachments,
      });
      
      setComment('');
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['serviceLogComments', serviceLogId] });
      toast.success('Comment added');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error(error?.message || 'Failed to add comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Follow-up History</h3>
        <span className="text-sm text-slate-500">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No follow-up comments yet
          </div>
        ) : (
          comments.map((c, index) => (
            <div key={c.id}>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-slate-800 text-white text-xs font-medium">
                    {getUserInitials(c.created_by)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-900">
                      {getUserName(c.created_by)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(c.created_date), 'MMM d, yyyy \'at\' h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.comment}</p>
                  
                  {c.attachments && c.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {c.attachments.map((att, idx) => (
                        <button
                          key={idx}
                          onClick={() => setViewFile(att)}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-left"
                        >
                          {att.file_type?.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4 text-slate-600 flex-shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-slate-600 flex-shrink-0" />
                          )}
                          <span className="text-xs text-slate-700 truncate max-w-[150px]">
                            {att.file_name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {index < comments.length - 1 && <Separator className="mt-4" />}
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-slate-800 text-white text-xs font-medium">
                {currentUser?.firstname?.charAt(0)?.toUpperCase() || ''}{currentUser?.lastname?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a follow-up comment..."
                rows={3}
                className="resize-none"
              />

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      {att.file_type?.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      )}
                      <span className="text-xs text-slate-700 truncate flex-1">{att.file_name}</span>
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

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`file-upload-${serviceLogId}`}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`file-upload-${serviceLogId}`).click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach Files
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !comment.trim()}
                  size="sm"
                  className="ml-auto bg-slate-900 hover:bg-slate-800"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Add Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* File Viewer Dialog */}
      <Dialog open={!!viewFile} onOpenChange={() => setViewFile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewFile?.file_name || 'Attachment'}</DialogTitle>
          </DialogHeader>
          {viewFile && (
            <div className="space-y-4">
              {viewFile.file_type?.startsWith('image/') ? (
                <img 
                  src={viewFile.file_url} 
                  alt={viewFile.file_name} 
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <p className="text-sm text-slate-600 mb-4">{viewFile.file_name}</p>
                  <Button asChild variant="outline">
                    <a href={viewFile.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}