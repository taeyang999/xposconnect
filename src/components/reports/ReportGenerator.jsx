import React, { useState } from 'react';
import { Calendar as CalendarIcon, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportGenerator({ open, onClose, onGenerate, isGenerating }) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [exportFormat, setExportFormat] = useState('pdf');
  const [selectedMetrics, setSelectedMetrics] = useState({
    customers: true,
    serviceLogs: true,
    inventory: true,
    events: true,
    charts: true,
  });

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const handleGenerate = () => {
    onGenerate({
      dateRange,
      format: exportFormat,
      metrics: selectedMetrics,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Custom Report</DialogTitle>
          <DialogDescription>
            Select date range, metrics, and export format for your report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500 mb-2 block">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-xs text-slate-500 mb-2 block">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Metrics Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Include Metrics</Label>
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customers"
                  checked={selectedMetrics.customers}
                  onCheckedChange={() => toggleMetric('customers')}
                />
                <Label htmlFor="customers" className="text-sm cursor-pointer">
                  Customer Statistics
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="serviceLogs"
                  checked={selectedMetrics.serviceLogs}
                  onCheckedChange={() => toggleMetric('serviceLogs')}
                />
                <Label htmlFor="serviceLogs" className="text-sm cursor-pointer">
                  Service Logs & Performance
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inventory"
                  checked={selectedMetrics.inventory}
                  onCheckedChange={() => toggleMetric('inventory')}
                />
                <Label htmlFor="inventory" className="text-sm cursor-pointer">
                  Inventory Status
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="events"
                  checked={selectedMetrics.events}
                  onCheckedChange={() => toggleMetric('events')}
                />
                <Label htmlFor="events" className="text-sm cursor-pointer">
                  Scheduled Events
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={selectedMetrics.charts}
                  onCheckedChange={() => toggleMetric('charts')}
                />
                <Label htmlFor="charts" className="text-sm cursor-pointer">
                  Charts & Visualizations (PDF only)
                </Label>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="bg-slate-900 hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}