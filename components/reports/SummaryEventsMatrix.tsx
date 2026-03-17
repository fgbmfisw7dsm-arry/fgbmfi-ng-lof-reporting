import React, { useState, useEffect, useMemo, useContext } from 'react';
import { apiService } from '../../services/apiService';
import { DataContext } from '../../context/DataContext';
import { EventReport, EventType, User, Role } from '../../types';
import Icon from '../ui/Icon';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SummaryEventsMatrixProps {
  filters: any;
  user: User;
  unitName?: string;
}

const SummaryEventsMatrix: React.FC<SummaryEventsMatrixProps> = ({ filters, user, unitName }) => {
  const { dataVersion } = useContext(DataContext);
  const [reports, setReports] = useState<EventReport[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventData, types, regs, dists, zones, areas, chaps] = await Promise.all([
          apiService.getEventReports(filters, user),
          apiService.getEventTypes(),
          apiService.getRegions(),
          apiService.getDistricts(),
          apiService.getZones(),
          apiService.getAreas(),
          apiService.getChapters()
        ]);
        
        setReports(eventData);
        setEventTypes(types);
        
        // Combine all units for lookup
        setUnits([...regs, ...dists, ...zones, ...areas, ...chaps]);
      } catch (err) {
        console.error("Failed to fetch matrix data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, user, dataVersion]);

  const matrixData = useMemo(() => {
    const data: { [unitId: string]: { [eventType: string]: number } } = {};
    const unitNames: { [id: string]: string } = {};
    const columnTotals: { [eventType: string]: number } = {};
    let grandTotal = 0;

    reports.forEach(report => {
      const unitId = report.unitId.toUpperCase();
      // Only count reports that match one of our known event types to avoid off-by-one errors with legacy data
      const matchingType = eventTypes.find(t => t.name === report.eventType);
      if (!matchingType) return;

      if (!data[unitId]) data[unitId] = {};
      if (!data[unitId][report.eventType]) data[unitId][report.eventType] = 0;
      data[unitId][report.eventType]++;

      if (!columnTotals[report.eventType]) columnTotals[report.eventType] = 0;
      columnTotals[report.eventType]++;
      grandTotal++;

      // Store unit name for display
      if (!unitNames[unitId]) {
        const unit = units.find(u => u.id.toUpperCase() === unitId);
        unitNames[unitId] = unit ? unit.name : unitId;
      }
    });

    return { data, unitNames, columnTotals, grandTotal };
  }, [reports, units]);

  const exportToExcel = () => {
    const worksheetData = [];
    const headers = ['Unit / Office', ...eventTypes.map(t => t.name), 'Total Events'];
    worksheetData.push(headers);

    Object.keys(matrixData.data).forEach(unitId => {
      const row: string[] = [matrixData.unitNames[unitId] || unitId];
      let rowTotal = 0;
      eventTypes.forEach(type => {
        const count = matrixData.data[unitId][type.name] || 0;
        row.push(count.toString());
        rowTotal += count;
      });
      row.push(rowTotal.toString());
      worksheetData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary Events Matrix");
    XLSX.writeFile(wb, `Summary_Events_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text("Summary Events Matrix Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 14, 30);
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    doc.text(`Period: ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`, 14, 36);

    const headers = [['Unit / Office', ...eventTypes.map(t => t.name), 'Total']];
    const body = Object.keys(matrixData.data).map(unitId => {
      let rowTotal = 0;
      const row: (string | number)[] = [matrixData.unitNames[unitId] || unitId];
      eventTypes.forEach(type => {
        const count = matrixData.data[unitId][type.name] || 0;
        row.push(count);
        rowTotal += count;
      });
      row.push(rowTotal);
      return row;
    });

    (doc as any).autoTable({
      head: headers,
      body: body,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`Summary_Events_Matrix_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-fgbmfi-blue mb-4"></div>
        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Generating Matrix...</p>
      </div>
    );
  }

  const unitIds = Object.keys(matrixData.data);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-fgbmfi-blue uppercase tracking-tight">
            {unitName ? `${unitName} - ` : ''}Summary Events Matrix
          </h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Activity heatmap by unit and event type</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md"
          >
            <Icon name="file-excel" className="w-3 h-3" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md"
          >
            <Icon name="file-pdf" className="w-3 h-3" /> PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Unit / Office</th>
              {eventTypes.map(type => (
                <th key={type.id} className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">
                  {type.name}
                </th>
              ))}
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-b border-gray-100 text-center bg-fgbmfi-blue">Total</th>
            </tr>
          </thead>
          <tbody>
            {unitIds.length === 0 ? (
              <tr>
                <td colSpan={eventTypes.length + 2} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                  No event data found for the selected period
                </td>
              </tr>
            ) : (
              unitIds.map(unitId => {
                let rowTotal = 0;
                return (
                  <tr key={unitId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-black text-gray-700 border-b border-gray-50">
                      {matrixData.unitNames[unitId] || unitId}
                    </td>
                    {eventTypes.map(type => {
                      const count = matrixData.data[unitId][type.name] || 0;
                      rowTotal += count;
                      return (
                        <td key={type.id} className="px-4 py-4 text-sm font-bold text-gray-600 border-b border-gray-50 text-center">
                          {count > 0 ? (
                            <span className="bg-fgbmfi-blue/10 text-fgbmfi-blue px-2 py-1 rounded-lg">
                              {count}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-sm font-black text-fgbmfi-blue border-b border-gray-50 text-center bg-blue-50">
                      <span className="bg-fgbmfi-blue text-white px-3 py-1 rounded-full text-xs">
                        {rowTotal}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
            {unitIds.length > 0 && (
              <tr className="bg-fgbmfi-blue/5 font-black">
                <td className="px-6 py-4 text-sm text-fgbmfi-blue uppercase tracking-tight border-t-2 border-fgbmfi-blue/20">
                  GRAND TOTALS
                </td>
                {eventTypes.map(type => {
                  const count = matrixData.columnTotals[type.name] || 0;
                  return (
                    <td key={type.id} className="px-4 py-4 text-sm text-fgbmfi-blue border-t-2 border-fgbmfi-blue/20 text-center">
                      {count > 0 ? count : '-'}
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-sm text-white border-t-2 border-fgbmfi-blue/20 text-center bg-fgbmfi-blue">
                  {matrixData.grandTotal}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryEventsMatrix;
