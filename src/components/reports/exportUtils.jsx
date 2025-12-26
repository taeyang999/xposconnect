import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToPDF = async (data, config) => {
  const { dateRange, metrics, reportData } = data;
  const doc = new jsPDF();
  
  let yPosition = 20;
  
  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Business Performance Report', 14, yPosition);
  yPosition += 10;
  
  // Date Range
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text(
    `Report Period: ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`,
    14,
    yPosition
  );
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, yPosition + 5);
  yPosition += 20;
  doc.setTextColor(0);

  // Summary Statistics
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Executive Summary', 14, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  const summaryData = [
    ['Metric', 'Value'],
    ['Total Customers', reportData.summary.totalCustomers],
    ['Active Customers', reportData.summary.activeCustomers],
    ['Total Services', reportData.summary.totalServices],
    ['Completed Services', reportData.summary.completedServices],
    ['Pending Services', reportData.summary.pendingServices],
    ['Total Inventory', reportData.summary.totalInventory],
    ['Active Inventory', reportData.summary.activeInventory],
    ['Scheduled Events', reportData.summary.scheduledEvents],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: 14 },
    styles: { fontSize: 9 },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Customer Details
  if (metrics.customers && reportData.customers.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Details', 14, yPosition);
    yPosition += 8;

    const customerData = [
      ['Name', 'Status', 'Business Type', 'Assigned To'],
      ...reportData.customers.slice(0, 20).map(c => [
        c.name || '-',
        c.status || '-',
        c.business_type || '-',
        c.assigned_employee || '-',
      ]),
    ];

    doc.autoTable({
      startY: yPosition,
      head: [customerData[0]],
      body: customerData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      margin: { left: 14 },
      styles: { fontSize: 8 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Service Logs
  if (metrics.serviceLogs && reportData.serviceLogs.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Service Logs', 14, yPosition);
    yPosition += 8;

    const serviceData = [
      ['Date', 'Customer', 'Title', 'Status'],
      ...reportData.serviceLogs.slice(0, 20).map(s => [
        s.service_date ? format(new Date(s.service_date), 'MMM dd, yyyy') : '-',
        s.customer_name || '-',
        s.title || '-',
        s.status || '-',
      ]),
    ];

    doc.autoTable({
      startY: yPosition,
      head: [serviceData[0]],
      body: serviceData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      margin: { left: 14 },
      styles: { fontSize: 8 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Inventory
  if (metrics.inventory && reportData.inventory.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Inventory Items', 14, yPosition);
    yPosition += 8;

    const inventoryData = [
      ['Customer', 'Item Name', 'Status', 'Quantity'],
      ...reportData.inventory.slice(0, 20).map(i => [
        i.customer_name || '-',
        i.name || '-',
        i.status || '-',
        i.quantity?.toString() || '1',
      ]),
    ];

    doc.autoTable({
      startY: yPosition,
      head: [inventoryData[0]],
      body: inventoryData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      margin: { left: 14 },
      styles: { fontSize: 8 },
    });
  }

  // Save PDF
  doc.save(`report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
};

export const exportToCSV = (data, config) => {
  const { metrics, reportData } = data;
  let csvContent = '';

  // Summary
  csvContent += 'Executive Summary\n';
  csvContent += 'Metric,Value\n';
  csvContent += `Total Customers,${reportData.summary.totalCustomers}\n`;
  csvContent += `Active Customers,${reportData.summary.activeCustomers}\n`;
  csvContent += `Total Services,${reportData.summary.totalServices}\n`;
  csvContent += `Completed Services,${reportData.summary.completedServices}\n`;
  csvContent += `Pending Services,${reportData.summary.pendingServices}\n`;
  csvContent += `Total Inventory,${reportData.summary.totalInventory}\n`;
  csvContent += `Active Inventory,${reportData.summary.activeInventory}\n`;
  csvContent += `Scheduled Events,${reportData.summary.scheduledEvents}\n\n`;

  // Customers
  if (metrics.customers && reportData.customers.length > 0) {
    csvContent += 'Customers\n';
    csvContent += 'Name,Email,Phone,Status,Business Type,City,State,Assigned To\n';
    reportData.customers.forEach(c => {
      csvContent += `"${c.name || ''}","${c.email || ''}","${c.phone || ''}","${c.status || ''}","${c.business_type || ''}","${c.city || ''}","${c.state || ''}","${c.assigned_employee || ''}"\n`;
    });
    csvContent += '\n';
  }

  // Service Logs
  if (metrics.serviceLogs && reportData.serviceLogs.length > 0) {
    csvContent += 'Service Logs\n';
    csvContent += 'Date,Customer,Title,Description,Status,Assigned To\n';
    reportData.serviceLogs.forEach(s => {
      csvContent += `"${s.service_date || ''}","${s.customer_name || ''}","${s.title || ''}","${s.description || ''}","${s.status || ''}","${s.assigned_employee || ''}"\n`;
    });
    csvContent += '\n';
  }

  // Inventory
  if (metrics.inventory && reportData.inventory.length > 0) {
    csvContent += 'Inventory\n';
    csvContent += 'Customer,Item Name,Description,Status,Quantity,Serial Number\n';
    reportData.inventory.forEach(i => {
      csvContent += `"${i.customer_name || ''}","${i.name || ''}","${i.description || ''}","${i.status || ''}","${i.quantity || 1}","${i.serial_number || ''}"\n`;
    });
    csvContent += '\n';
  }

  // Events
  if (metrics.events && reportData.events.length > 0) {
    csvContent += 'Scheduled Events\n';
    csvContent += 'Title,Start Date,End Date,Type,Status,Customer,Assigned To\n';
    reportData.events.forEach(e => {
      csvContent += `"${e.title || ''}","${e.start_datetime || ''}","${e.end_datetime || ''}","${e.event_type || ''}","${e.status || ''}","${e.customer_name || ''}","${e.assigned_employee || ''}"\n`;
    });
  }

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToJSON = (data, config) => {
  const { dateRange, metrics, reportData } = data;
  
  const jsonData = {
    generated: new Date().toISOString(),
    dateRange: {
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    },
    metrics: metrics,
    data: reportData,
  };

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
  link.click();
  URL.revokeObjectURL(url);
};