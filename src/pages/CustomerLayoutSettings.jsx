import React, { useState } from 'react';
import { Settings, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePermissions } from '@/components/hooks/usePermissions';
import CustomerLayoutEditor from '@/components/admin/CustomerLayoutEditor';

export default function CustomerLayoutSettings() {
  const { isAdmin, loading } = usePermissions();
  const [showEditor, setShowEditor] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Layout Settings</h1>
          <p className="text-slate-500 mt-1">Customize how customer details are displayed</p>
        </div>
        <Card className="p-12 text-center border-slate-200/80">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h3>
            <p className="text-slate-600">Only administrators can access layout settings.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Layout Settings</h1>
          <p className="text-slate-500 mt-1">Customize how customer details are displayed</p>
        </div>
        <Button onClick={() => setShowEditor(true)} className="bg-slate-900 hover:bg-slate-800">
          <Settings className="h-4 w-4 mr-2" />
          Open Layout Editor
        </Button>
      </div>

      <CustomerLayoutEditor 
        open={showEditor} 
        onClose={() => setShowEditor(false)} 
      />
    </div>
  );
}