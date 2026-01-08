import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import CustomerLayoutEditor from '@/components/admin/CustomerLayoutEditor';

export default function CustomerLayoutSettings() {
  const [showEditor, setShowEditor] = useState(true);

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