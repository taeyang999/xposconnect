import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus, Pencil, Trash2, Clock } from 'lucide-react';

export default function AuditLogViewer({ logs }) {
  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4" />;
      case 'update':
        return <Pencil className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatChanges = (changesStr) => {
    try {
      const changes = JSON.parse(changesStr);
      return Object.entries(changes).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium text-slate-700">{key}:</span>{' '}
          <span className="text-slate-600">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
        </div>
      ));
    } catch {
      return null;
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <Card className="border-slate-200/80">
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No activity recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0">
                <div className={`mt-1 p-2 rounded-lg ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {log.user_name}{' '}
                        <Badge variant="outline" className="ml-2 font-normal">
                          {log.action}
                        </Badge>
                      </p>
                      {log.entity_name && (
                        <p className="text-sm text-slate-600 mt-0.5">{log.entity_name}</p>
                      )}
                    </div>
                    <time className="text-xs text-slate-500 whitespace-nowrap">
                      {format(parseISO(log.created_date), 'MMM d, h:mm a')}
                    </time>
                  </div>
                  {log.changes && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-md space-y-1">
                      {formatChanges(log.changes)}
                    </div>
                  )}
                  {log.metadata && (
                    <p className="text-xs text-slate-500 mt-1">{log.metadata}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}