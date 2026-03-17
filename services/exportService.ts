import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportService = {
  toPDF: (title: string, subTitle: string, dateRangeStr: string, isAggregated: boolean, data: any[]) => {
    if (data.length === 0) {
      alert('No data to export.');
      return;
    }

    const doc = new jsPDF();
    
    // Main Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102); // FGBMFI Blue
    doc.text(title, 14, 22);

    // Sub-title (Role & Unit)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(subTitle, 14, 30);

    // Metadata (Date Range & Generation Date)
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(dateRangeStr, 14, 37);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 14, 42);

    const head = isAggregated 
        ? [['Name', 'Membership', 'Attendance', 'First Timers', 'Salvations', 'H.G. Baptism', 'Intentions', 'Offering']]
        : [['Date/Period', 'Membership', 'Attendance', 'First Timers', 'Salvations', 'H.G. Baptism', 'Intentions', 'Offering']];

    const body = data.map((row: any) => {
        if (isAggregated) {
            return [
                row.name || 'Summary',
                row.membershipCount?.toLocaleString() || 0,
                row.attendance?.toLocaleString() || 0,
                row.firstTimers?.toLocaleString() || 0,
                row.salvations?.toLocaleString() || 0,
                row.holyGhostBaptism?.toLocaleString() || 0,
                row.membershipIntention?.toLocaleString() || 0,
                row.offering?.toLocaleString() || 0
            ];
        } else {
             const dateStr = row.isEvent 
                ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : `${row.month} ${row.year}`;
             return [
                dateStr,
                row.membershipCount?.toLocaleString() || 0,
                row.attendance?.toLocaleString() || 0,
                row.firstTimers?.toLocaleString() || 0,
                row.salvations?.toLocaleString() || 0,
                row.holyGhostBaptism?.toLocaleString() || 0,
                row.membershipIntention?.toLocaleString() || 0,
                row.offering?.toLocaleString() || 0
            ];
        }
    });

    autoTable(doc, {
        head: head,
        body: body,
        startY: 48,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        didParseCell: (dataCell) => {
            // Check if the first cell (Name/Month) matches the Grand Total Summary identifier
            const cellValue = dataCell.row.raw ? (dataCell.row.raw as any)[0] : null;
            if (cellValue === 'GRAND TOTAL SUMMARY') {
                dataCell.cell.styles.fontStyle = 'bold';
                dataCell.cell.styles.fillColor = [0, 51, 102]; // FGBMFI Blue
                dataCell.cell.styles.textColor = [255, 255, 255]; // White
            }
        }
    });

    doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
  },

  toCSV: (title: string, subTitle: string, dateRange: string, isAggregated: boolean, data: any[]) => {
    if (data.length === 0) {
        alert('No data to export.');
        return;
    }
    const headers = isAggregated 
        ? ['Name', 'Membership', 'Attendance', 'First Timers', 'Salvations', 'H.G. Baptism', 'Membership Intentions', 'Offering']
        : ['Date/Period', 'Membership', 'Attendance', 'First Timers', 'Salvations', 'H.G. Baptism', 'Membership Intentions', 'Offering'];
        
    // Add metadata rows at the top for context
    const csvRows = [
        `"REPORT: ${title.replace(/"/g, '""')}"`,
        `"OFFICE/UNIT: ${subTitle.replace(/"/g, '""')}"`,
        `"PERIOD: ${dateRange.replace(/"/g, '""')}"`,
        `"GENERATED: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/"/g, '""')}"`,
        '', // Empty spacer
        headers.join(','),
        ...data.map(row => {
            const dateStr = isAggregated ? (row.name || 'Summary') : (row.isEvent 
                ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : `${row.month} ${row.year}`);
            
            return [
                `"${dateStr.replace(/"/g, '""')}"`,
                `"${String(row.membershipCount || 0).replace(/"/g, '""')}"`,
                `"${String(row.attendance || 0).replace(/"/g, '""')}"`,
                `"${String(row.firstTimers || 0).replace(/"/g, '""')}"`,
                `"${String(row.salvations || 0).replace(/"/g, '""')}"`,
                `"${String(row.holyGhostBaptism || 0).replace(/"/g, '""')}"`,
                `"${String(row.membershipIntention || 0).replace(/"/g, '""')}"`,
                `"${String(row.offering || 0).replace(/"/g, '""')}"`
            ].join(',');
        })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}_Registry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};