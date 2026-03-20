import React, { useState, useEffect, useMemo, useContext } from 'react';
import { apiService } from '../../services/apiService';
import { DataContext } from '../../context/DataContext';
import { EventReport, EventType, User, Role, Region, District, Zone, Area, Chapter } from '../../types';
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
  const [orgRegistry, setOrgRegistry] = useState<{
    regions: Region[], districts: District[], zones: Zone[], areas: Area[], chapters: Chapter[]
  }>({ regions: [], districts: [], zones: [], areas: [], chapters: [] });
  const [loading, setLoading] = useState(true);

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
        setOrgRegistry({ regions: regs, districts: dists, zones: zones, areas: areas, chapters: chaps });
      } catch (err) {
        console.error("Failed to fetch matrix data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, user, dataVersion]);

  const matrixData = useMemo(() => {
    let groupBy: 'chapter' | 'area' | 'zone' | 'district' | 'region' | 'none' = 'region';
    let nextLevelUnits: {id: string, name: string}[] = [];
    let currentScopeUnitId: string | null = null;
    let currentScopeRole: Role | null = null;
    let currentScopeName = "Office Events";

    if (filters.areaId) {
        groupBy = 'chapter';
        nextLevelUnits = orgRegistry.chapters.filter(c => c.areaId === filters.areaId);
        currentScopeUnitId = filters.areaId;
        currentScopeRole = Role.FIELD_REPRESENTATIVE;
        currentScopeName = "Area Events";
    } else if (filters.zoneId) {
        groupBy = 'area';
        nextLevelUnits = orgRegistry.areas.filter(a => a.zoneId === filters.zoneId);
        currentScopeUnitId = filters.zoneId;
        currentScopeRole = Role.NATIONAL_DIRECTOR;
        currentScopeName = "Zonal Events";
    } else if (filters.districtId) {
        groupBy = 'zone';
        nextLevelUnits = orgRegistry.zones.filter(z => z.districtId === filters.districtId);
        currentScopeUnitId = filters.districtId;
        currentScopeRole = Role.DISTRICT_COORDINATOR;
        currentScopeName = "District Events";
    } else if (filters.regionId) {
        groupBy = 'district';
        nextLevelUnits = orgRegistry.districts.filter(d => d.regionId === filters.regionId);
        currentScopeUnitId = filters.regionId;
        currentScopeRole = Role.REGIONAL_VICE_PRESIDENT;
        currentScopeName = "Regional Events";
    } else if (user) {
        switch (user.role) {
            case Role.FIELD_REPRESENTATIVE:
                 groupBy = 'chapter';
                 nextLevelUnits = orgRegistry.chapters.filter(c => c.areaId === user.unitId);
                 currentScopeUnitId = user.unitId;
                 currentScopeRole = Role.FIELD_REPRESENTATIVE;
                 currentScopeName = "Area Events";
                 break;
            case Role.NATIONAL_DIRECTOR:
                 groupBy = 'area';
                 nextLevelUnits = orgRegistry.areas.filter(a => a.zoneId === user.unitId);
                 currentScopeUnitId = user.unitId;
                 currentScopeRole = Role.NATIONAL_DIRECTOR;
                 currentScopeName = "Zonal Events";
                 break;
            case Role.DISTRICT_COORDINATOR:
            case Role.DISTRICT_ADMIN:
            case Role.DISTRICT_BOARD_MEMBER:
                 groupBy = 'zone';
                 nextLevelUnits = orgRegistry.zones.filter(z => z.districtId === user.unitId);
                 currentScopeUnitId = user.unitId;
                 currentScopeRole = Role.DISTRICT_COORDINATOR;
                 currentScopeName = "District Events";
                 break;
            case Role.REGIONAL_VICE_PRESIDENT:
            case Role.REGIONAL_ADMIN:
            case Role.REGIONAL_EXECUTIVE_COUNCIL:
                 groupBy = 'district';
                 nextLevelUnits = orgRegistry.districts.filter(d => d.regionId === user.unitId);
                 currentScopeUnitId = user.unitId;
                 currentScopeRole = Role.REGIONAL_VICE_PRESIDENT;
                 currentScopeName = "Regional Events";
                 break;
            case Role.CHAPTER_PRESIDENT:
                 groupBy = 'none' as any;
                 currentScopeUnitId = user.unitId;
                 currentScopeRole = Role.CHAPTER_PRESIDENT;
                 currentScopeName = "Chapter Events";
                 break;
            case Role.NATIONAL_EXECUTIVE_COUNCIL:
            default:
                 groupBy = 'region';
                 nextLevelUnits = orgRegistry.regions;
                 currentScopeUnitId = 'national';
                 currentScopeRole = Role.NATIONAL_PRESIDENT;
                 currentScopeName = "National Events";
                 break;
        }
    }

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    
    const getUnitSortKey = (unit: any, type: string) => {
        if (type === 'region') return unit.name;
        if (type === 'district') {
            const reg = orgRegistry.regions.find(r => r.id === unit.regionId);
            return `${reg?.name || ''} | ${unit.name}`;
        }
        if (type === 'zone') {
            const dist = orgRegistry.districts.find(d => d.id === unit.districtId);
            const reg = orgRegistry.regions.find(r => r.id === dist?.regionId);
            return `${reg?.name || ''} | ${dist?.name || ''} | ${unit.name}`;
        }
        if (type === 'area') {
            const zone = orgRegistry.zones.find(z => z.id === unit.zoneId);
            const dist = orgRegistry.districts.find(d => d.id === zone?.districtId);
            return `${dist?.name || ''} | ${zone?.name || ''} | ${unit.name}`;
        }
        if (type === 'chapter') {
            const area = orgRegistry.areas.find(a => a.id === unit.areaId);
            const zone = orgRegistry.zones.find(z => z.id === area?.zoneId);
            return `${zone?.name || ''} | ${area?.name || ''} | ${unit.name}`;
        }
        return unit.name;
    };
    
    nextLevelUnits.sort((a, b) => collator.compare(getUnitSortKey(a, groupBy), getUnitSortKey(b, groupBy)));

    const data: { [unitId: string]: { [eventType: string]: number } } = {};
    const unitNames: { [id: string]: string } = {};
    const columnTotals: { [eventType: string]: number } = {};
    let grandTotal = 0;

    const rows: string[] = [];
    const normalizedScopeUnitId = currentScopeUnitId?.trim().toUpperCase();

    if (normalizedScopeUnitId) {
        const scopeId = `scope-${normalizedScopeUnitId}`;
        rows.push(scopeId);
        unitNames[scopeId] = currentScopeName;
        data[scopeId] = {};
    }

    nextLevelUnits.forEach(unit => {
        const normId = unit.id.trim().toUpperCase();
        rows.push(normId);
        unitNames[normId] = unit.name;
        data[normId] = {};
    });

    reports.forEach(report => {
        const reportUnitId = report.unitId.trim().toUpperCase();
        let targetRowId = '';

        if (reportUnitId === normalizedScopeUnitId) {
            targetRowId = `scope-${normalizedScopeUnitId}`;
        } else {
            const findParentRow = (id: string): string | null => {
                const normId = id.trim().toUpperCase();
                if (rows.includes(normId) && normId !== `scope-${normalizedScopeUnitId}`) return normId;
                
                const chapter = orgRegistry.chapters.find(c => c.id.trim().toUpperCase() === normId);
                if (chapter) return findParentRow(chapter.areaId);
                
                const area = orgRegistry.areas.find(a => a.id.trim().toUpperCase() === normId);
                if (area) return findParentRow(area.zoneId);
                
                const zone = orgRegistry.zones.find(z => z.id.trim().toUpperCase() === normId);
                if (zone) return findParentRow(zone.districtId);
                
                const district = orgRegistry.districts.find(d => d.id.trim().toUpperCase() === normId);
                if (district) return findParentRow(district.regionId);
                
                return null;
            };

            targetRowId = findParentRow(reportUnitId) || '';
        }

        if (targetRowId && data[targetRowId]) {
            const matchingType = eventTypes.find(t => t.name === report.eventType);
            if (!matchingType) return;

            if (!data[targetRowId][report.eventType]) data[targetRowId][report.eventType] = 0;
            data[targetRowId][report.eventType]++;

            if (!columnTotals[report.eventType]) columnTotals[report.eventType] = 0;
            columnTotals[report.eventType]++;
            grandTotal++;
        }
    });

    return { data, unitNames, columnTotals, grandTotal, rows };
  }, [reports, orgRegistry, eventTypes, filters, user]);

  const exportToExcel = () => {
    const worksheetData = [];
    const headers = ['Unit / Office', ...eventTypes.map(t => t.name), 'Total Events'];
    worksheetData.push(headers);

    matrixData.rows.forEach(unitId => {
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
    const body = matrixData.rows.map(unitId => {
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

  const unitIds = matrixData.rows;

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
