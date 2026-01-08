import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DEFAULT_SECTIONS = [
  { id: 'owner_business', label: 'Owner & Business Info', visible: true, order: 0 },
  { id: 'contact', label: 'Contact Info', visible: true, order: 1 },
  { id: 'additional', label: 'Additional Info', visible: true, order: 2 },
  { id: 'notes', label: 'Notes', visible: true, order: 3 },
];

const DEFAULT_FIELDS = [
  // Owner & Business Info
  { id: 'owner', label: 'Owner', section: 'owner_business', visible: true, order: 0 },
  { id: 'corporation', label: 'Corporation', section: 'owner_business', visible: true, order: 1 },
  { id: 'business_type', label: 'Business Type', section: 'owner_business', visible: true, order: 2 },
  { id: 'merchant_id', label: 'Merchant ID', section: 'owner_business', visible: true, order: 3 },
  // Contact Info
  { id: 'email', label: 'Primary Email', section: 'contact', visible: true, order: 0 },
  { id: 'secondary_email', label: 'Secondary Email', section: 'contact', visible: true, order: 1 },
  { id: 'store_phone', label: 'Store Phone', section: 'contact', visible: true, order: 2 },
  { id: 'owner_phone_1', label: "Owner's Phone #1", section: 'contact', visible: true, order: 3 },
  { id: 'owner_phone_2', label: "Owner's Phone #2", section: 'contact', visible: true, order: 4 },
  { id: 'location', label: 'Location', section: 'contact', visible: true, order: 5 },
  { id: 'platform', label: 'Platform', section: 'contact', visible: true, order: 6 },
  // Additional Info
  { id: 'assigned_employee', label: 'Assigned To', section: 'additional', visible: true, order: 0 },
  { id: 'pci_expire_date', label: 'PCI Expire Date', section: 'additional', visible: true, order: 1 },
];

export default function CustomerLayoutEditor({ open, onClose }) {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('owner_business');
  const queryClient = useQueryClient();

  const { data: existingConfig } = useQuery({
    queryKey: ['customerLayoutConfig'],
    queryFn: async () => {
      const configs = await base44.entities.CustomerLayoutConfig.filter({ config_name: 'default' });
      return configs?.[0] || null;
    },
  });

  useEffect(() => {
    if (existingConfig) {
      if (existingConfig.sections?.length) setSections(existingConfig.sections);
      if (existingConfig.fields?.length) setFields(existingConfig.fields);
    }
  }, [existingConfig]);

  const handleSectionDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setSections(items.map((item, index) => ({ ...item, order: index })));
  };

  const handleFieldDragEnd = (result) => {
    if (!result.destination) return;
    const sectionFields = fields.filter(f => f.section === activeSection);
    const otherFields = fields.filter(f => f.section !== activeSection);
    const [reordered] = sectionFields.splice(result.source.index, 1);
    sectionFields.splice(result.destination.index, 0, reordered);
    const updatedSectionFields = sectionFields.map((item, index) => ({ ...item, order: index }));
    setFields([...otherFields, ...updatedSectionFields]);
  };

  const toggleSectionVisibility = (sectionId) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    ));
  };

  const toggleFieldVisibility = (fieldId) => {
    setFields(fields.map(f => 
      f.id === fieldId ? { ...f, visible: !f.visible } : f
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingConfig?.id) {
        await base44.entities.CustomerLayoutConfig.update(existingConfig.id, {
          sections,
          fields,
        });
      } else {
        await base44.entities.CustomerLayoutConfig.create({
          config_name: 'default',
          sections,
          fields,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['customerLayoutConfig'] });
      toast.success('Layout saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save layout');
    }
    setSaving(false);
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
    setFields(DEFAULT_FIELDS);
    toast.info('Layout reset to default');
  };

  if (!open) return null;

  const currentSectionFields = fields
    .filter(f => f.section === activeSection)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>Customize Customer Detail Layout</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Layout'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-6">
            {/* Sections Column */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Sections Order</h3>
              <DragDropContext onDragEnd={handleSectionDragEnd}>
                <Droppable droppableId="sections">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {sections.sort((a, b) => a.order - b.order).map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                snapshot.isDragging ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                              } ${activeSection === section.id ? 'ring-2 ring-blue-500' : ''}`}
                              onClick={() => setActiveSection(section.id)}
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-4 w-4 text-slate-400" />
                              </div>
                              <span className={`flex-1 text-sm ${!section.visible ? 'text-slate-400' : ''}`}>
                                {section.label}
                              </span>
                              <Switch
                                checked={section.visible}
                                onCheckedChange={() => toggleSectionVisibility(section.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Fields Column */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Fields in "{sections.find(s => s.id === activeSection)?.label}"
              </h3>
              <DragDropContext onDragEnd={handleFieldDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {currentSectionFields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                snapshot.isDragging ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-4 w-4 text-slate-400" />
                              </div>
                              <span className={`flex-1 text-sm ${!field.visible ? 'text-slate-400' : ''}`}>
                                {field.label}
                              </span>
                              <Switch
                                checked={field.visible}
                                onCheckedChange={() => toggleFieldVisibility(field.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}