import React, { useState, useEffect, useContext, useMemo } from 'react';
import ReportTable from './ReportTable';
import SummaryEventsMatrix from './SummaryEventsMatrix';
import EventReportList from './EventReportList';
import EventReportForm from '../forms/EventReportForm';
import { Role, EventReport, Region, District, Zone, Area, Chapter } from '../../types';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { apiService } from '../../services/apiService';
import { exportService } from '../../services/exportService';
import { ReportFiltersSection } from './ReportFiltersSection';
import Icon from '../ui/Icon';

const ReportsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { dataVersion, refreshData } = useContext(DataContext);
  const [reports, setReports] = useState<any[]>([]);
  const [eventReports, setEventReports] = useState<EventReport[]>([]);
  const [myEventReports, setMyEventReports] = useState<EventReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'detailed' | 'matrix' | 'my-submissions'>('detailed');
  const [editingReport, setEditingReport] = useState<EventReport | null>(null);
  
  const [orgRegistry, setOrgRegistry] = useState<{
    regions: Region[], districts: District[], zones: Zone[], areas: Area[], chapters: Chapter[]
  }>({ regions: [], districts: [], zones: [], areas: [], chapters: [] });

  const [filters, setFilters] = useState({
    regionId: null as string | null,
    districtId: null as string | null,
    zoneId: null as string | null,
    areaId: null as string | null,
    chapterId: null as string | null,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const fetchOrg = async () => {
        try {
            const [regs, dists, zones, areas, chaps] = await Promise.all([
                apiService.getRegions(), apiService.getDistricts(), apiService.getZones(), apiService.getAreas(), apiService.getChapters()
            ]);
            setOrgRegistry({ regions: regs, districts: dists, zones: zones, areas: areas, chapters: chaps });

            if (user && user.unitId.trim().toUpperCase() !== 'NATIONAL') {
                const normUnitId = user.unitId.trim().toUpperCase();
                let initialFilters = { ...filters };

                const findAncestors = () => {
                    const chapter = chaps.find(c => c.id.trim().toUpperCase() === normUnitId);
                    if (chapter) {
                        const area = areas.find(a => a.id === chapter.areaId);
                        const zone = zones.find(z => z.id === area?.zoneId);
                        const district = dists.find(d => d.id === zone?.districtId);
                        initialFilters = { ...initialFilters, regionId: district?.regionId || null, districtId: district?.id || null, zoneId: zone?.id || null, areaId: area?.id || null, chapterId: chapter.id };
                        return;
                    }
                    const area = areas.find(a => a.id.trim().toUpperCase() === normUnitId);
                    if (area) {
                        const zone = zones.find(z => z.id === area.zoneId);
                        const district = dists.find(d => d.id === zone?.districtId);
                        initialFilters = { ...initialFilters, regionId: district?.regionId || null, districtId: district?.id || null, zoneId: zone?.id || null, areaId: area.id };
                        return;
                    }
                    const zone = zones.find(z => z.id.trim().toUpperCase() === normUnitId);
                    if (zone) {
                        const district = dists.find(d => d.id === zone.districtId);
                        initialFilters = { ...initialFilters, regionId: district?.regionId || null, districtId: district?.id || null, zoneId: zone.id };
                        return;
                    }
                    const district = dists.find(d => d.id.trim().toUpperCase() === normUnitId);
                    if (district) {
                        initialFilters = { ...initialFilters, regionId: district.regionId, districtId: district.id };
                        return;
                    }
                    const region = regs.find(r => r.id.trim().toUpperCase() === normUnitId);
                    if (region) {
                        initialFilters = { ...initialFilters, regionId: region.id };
                    }
                };

                findAncestors();
                setFilters(initialFilters);
            }
        } catch (e) { console.error("Org Registry Sync Failed", e); }
    };
    fetchOrg();
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fetchReports = async () => {
      if (user) {
        setLoading(true);
        try {
            const [chapterReportsData, eventReportsData, myReportsData] = await Promise.all([
                apiService.getChapterReports(filters, user),
                apiService.getEventReports(filters, user),
                apiService.getEventReports({ ...filters, reportingOfficerId: user.id }, user)
            ]);
            if (mounted) {
                setReports(chapterReportsData);
                setEventReports(eventReportsData);
                setMyEventReports(myReportsData);
                setLoading(false);
            }
        } catch (err) {
            console.error("Report Fetch Failed", err);
            setLoading(false);
        }
      }
    };
    fetchReports();
    return () => { mounted = false; };
  }, [user, filters, dataVersion]);

  const handleFilterChange = (level: any, value: string | null) => {
    setFilters(prev => {
        const newFilters = { ...prev, [level]: value };
        const cascadeLevels: (keyof typeof filters)[] = ['regionId', 'districtId', 'zoneId', 'areaId', 'chapterId'];
        const startIndex = cascadeLevels.indexOf(level as any);
        if (startIndex !== -1) {
            for (let i = startIndex + 1; i < cascadeLevels.length; i++) {
                (newFilters as any)[cascadeLevels[i]] = null;
            }
        }
        return newFilters;
    });
  };

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const breakdownData = useMemo(() => {
    if (filters.chapterId) return [];
    
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
                 groupBy = 'zone';
                 nextLevelUnits = orgRegistry.zones.filter(z => z.districtId === user.unitId);
                 currentScopeUnitId = user.unitId;
                 currentScopeRole = Role.DISTRICT_COORDINATOR;
                 currentScopeName = "District Events";
                 break;
            case Role.REGIONAL_VICE_PRESIDENT:
            case Role.REGIONAL_ADMIN:
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
    
    // Hierarchical Sorting Helper
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
    
    // Perform Hierarchical Sort
    nextLevelUnits.sort((a, b) => collator.compare(getUnitSortKey(a, groupBy), getUnitSortKey(b, groupBy)));
    
    const sumData = (acc: any, curr: any) => ({
        attendance: (acc.attendance || 0) + (curr.attendance || 0),
        firstTimers: (acc.firstTimers || 0) + (curr.firstTimers || 0),
        salvations: (acc.salvations || 0) + (curr.salvations || 0),
        holyGhostBaptism: (acc.holyGhostBaptism || 0) + (curr.holyGhostBaptism || 0),
        membershipIntention: (acc.membershipIntention || 0) + (curr.membershipIntention || 0),
        offering: (acc.offering || 0) + (curr.offering || 0),
    });
    const identity = { attendance: 0, firstTimers: 0, salvations: 0, holyGhostBaptism: 0, membershipIntention: 0, offering: 0 };

    const getLatestMembership = (unitEvents: EventReport[], chapterIds: string[]) => {
        const latest: { [cid: string]: { date: number, count: number } } = {};
        
        unitEvents.forEach(r => {
            const cid = r.unitId.trim().toUpperCase();
            if (chapterIds.includes(cid) && r.membershipCount && r.membershipCount > 0) {
                const date = new Date(r.dateOfEvent).getTime();
                if (!latest[cid] || date > latest[cid].date) {
                    latest[cid] = { date, count: r.membershipCount };
                }
            }
        });

        return Object.values(latest).reduce((sum, item) => sum + item.count, 0);
    };

    const rows: any[] = [];
    const normalizedScopeUnitId = currentScopeUnitId?.trim().toUpperCase();

    if (normalizedScopeUnitId && currentScopeRole) {
         const scopeEvents = eventReports.filter(r => r.unitId.trim().toUpperCase() === normalizedScopeUnitId);
         
         if (scopeEvents.length > 0 || (nextLevelUnits.length > 0 && (currentScopeRole as Role) !== Role.CHAPTER_PRESIDENT)) {
            const membershipCount = getLatestMembership(scopeEvents, [normalizedScopeUnitId]);
            rows.push({ 
                id: `scope-${normalizedScopeUnitId}`, 
                name: currentScopeName, 
                membershipCount,
                ...scopeEvents.reduce(sumData, identity)
            });
         }
    }

    nextLevelUnits.forEach(unit => {
        const normUnitId = unit.id.trim().toUpperCase();
        const descendantChapterIds: string[] = [];
        const descendantUnitIds: string[] = [normUnitId]; 

        const localFind = (currId: string) => {
            const nc = currId.trim().toUpperCase();
            orgRegistry.districts.filter(d => d.regionId.trim().toUpperCase() === nc).forEach(d => { descendantUnitIds.push(d.id.trim().toUpperCase()); localFind(d.id); });
            orgRegistry.zones.filter(z => z.districtId.trim().toUpperCase() === nc).forEach(z => { descendantUnitIds.push(z.id.trim().toUpperCase()); localFind(z.id); });
            orgRegistry.areas.filter(a => a.zoneId.trim().toUpperCase() === nc).forEach(a => { descendantUnitIds.push(a.id.trim().toUpperCase()); localFind(a.id); });
            orgRegistry.chapters.filter(c => c.areaId.trim().toUpperCase() === nc).forEach(c => { descendantChapterIds.push(c.id.trim().toUpperCase()); descendantUnitIds.push(c.id.trim().toUpperCase()); });
        };
        
        if (groupBy === 'chapter') {
            descendantChapterIds.push(normUnitId);
            descendantUnitIds.push(normUnitId);
        } else {
            localFind(unit.id);
        }
        
        const unitEvents = eventReports.filter(r => descendantUnitIds.includes(r.unitId.trim().toUpperCase())); 
        
        const membershipCount = getLatestMembership(unitEvents, descendantChapterIds);
        const unitSum = unitEvents.reduce(sumData, identity);
        rows.push({ id: unit.id, name: unit.name, membershipCount, ...unitSum });
    });

    if (rows.length > 0) {
        // For the GRAND TOTAL row, we need to sum the latest membership across ALL chapters in the current scope
        const allChapterIdsInScope: string[] = [];
        if (groupBy === 'chapter') {
            nextLevelUnits.forEach(u => allChapterIdsInScope.push(u.id.trim().toUpperCase()));
        } else {
            // This is a bit complex, but we can just sum the membershipCount of the rows we just created
            // since each row represents a disjoint set of chapters (except for the "Office Events" row)
        }
        
        const totalMembership = rows.reduce((sum, row) => sum + (row.membershipCount || 0), 0);
        const totalOther = rows.reduce(sumData, identity);

        rows.push({ 
            id: 'total-row', 
            name: 'GRAND TOTAL SUMMARY', 
            membershipCount: totalMembership,
            ...totalOther, 
            isTotal: true 
        });
    }
    return rows; 
  }, [reports, eventReports, filters, user, orgRegistry]);

  const reportMetadata = useMemo(() => {
    let unitName = ""; let suffix = ""; let targetOffice = "";
    const cleanRole = (r: string) => r.replace(/\s*\(.*\)/, '').trim();
    if (filters.chapterId) { unitName = orgRegistry.chapters.find(c => c.id === filters.chapterId)?.name || ""; targetOffice = "Chapter President"; }
    else if (filters.areaId) { unitName = orgRegistry.areas.find(a => a.id === filters.areaId)?.name || ""; targetOffice = "Field Representative"; }
    else if (filters.zoneId) { unitName = orgRegistry.zones.find(z => z.id === filters.zoneId)?.name || ""; targetOffice = "National Director"; }
    else if (filters.districtId) { unitName = orgRegistry.districts.find(d => d.id === filters.districtId)?.name || ""; if (unitName && !unitName.toLowerCase().includes('district')) suffix = " District"; targetOffice = "District Coordinator"; }
    else if (filters.regionId) { unitName = orgRegistry.regions.find(r => r.id === filters.regionId)?.name || ""; if (unitName && !unitName.toLowerCase().includes('region')) suffix = " Region"; targetOffice = "Regional Vice President"; } 
    if (!unitName && user) { targetOffice = cleanRole(user.role); if (user.role === Role.CHAPTER_PRESIDENT) unitName = orgRegistry.chapters.find(c => c.id === user.unitId)?.name || ""; else if (user.role === Role.FIELD_REPRESENTATIVE) unitName = orgRegistry.areas.find(a => a.id === user.unitId)?.name || ""; else if (user.role === Role.NATIONAL_DIRECTOR) unitName = orgRegistry.zones.find(z => z.id === user.unitId)?.name || ""; else if (user.role === Role.DISTRICT_COORDINATOR || user.role === Role.DISTRICT_ADMIN) { unitName = orgRegistry.districts.find(d => d.id === user.unitId)?.name || ""; if (unitName && !unitName.toLowerCase().includes('district')) suffix = " District"; } else if (user.role === Role.REGIONAL_VICE_PRESIDENT || user.role === Role.REGIONAL_ADMIN) { unitName = orgRegistry.regions.find(r => r.id === user.unitId)?.name || ""; if (unitName && !unitName.toLowerCase().includes('region')) suffix = " Region"; } else { unitName = "National Headquarters"; targetOffice = "Administration"; } }
    const finalUnit = unitName ? (unitName === "National Headquarters" ? unitName : `${unitName}${suffix}`) : "National Headquarters";
    return { unit: finalUnit, title: `FGBMFI Nigeria LOF - ${finalUnit}`, subTitle: `${targetOffice} | ${finalUnit}` };
  }, [filters, user, orgRegistry]);

  const handleEditReport = (report: EventReport) => {
    setEditingReport(report);
  };

  const handleEditComplete = () => {
    setEditingReport(null);
    // Refresh data explicitly
    refreshData();
    setFilters({ ...filters }); 
  };

  const handleEditCancel = () => {
    setEditingReport(null);
  };

  return (
    <div className="printable-area">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reports Portal</h1>
          <p className="text-gray-500 mt-1 font-medium">Analyze performance and growth trends across the Fellowship.</p>
        </div>
        {reportMetadata.unit && (
          <div className="bg-fgbmfi-blue text-white px-6 py-3 rounded-2xl shadow-lg flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Assigned Unit</span>
            <span className="text-sm font-black uppercase tracking-tight">{reportMetadata.unit}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 print:hidden">
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveView('detailed')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'detailed' ? 'bg-white text-fgbmfi-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Detailed Reports
          </button>
          <button 
            onClick={() => setActiveView('matrix')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'matrix' ? 'bg-white text-fgbmfi-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Events Matrix
          </button>
          <button 
            onClick={() => setActiveView('my-submissions')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'my-submissions' ? 'bg-white text-fgbmfi-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            My Submissions
          </button>
        </div>
        <div className="flex space-x-2">
            {activeView === 'detailed' && (
              <>
                <button onClick={() => exportService.toPDF(reportMetadata.title, reportMetadata.subTitle, filters.startDate ? `Period: ${filters.startDate} to ${filters.endDate}` : "Period: All Recorded History", breakdownData.length > 0 && !filters.chapterId, breakdownData.length > 0 && !filters.chapterId ? breakdownData : reports)} className="bg-fgbmfi-red text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-800 flex items-center shadow-sm active:scale-95"><Icon name="archive-box" className="w-4 h-4 mr-2"/>Export PDF</button>
                <button onClick={() => exportService.toCSV(reportMetadata.title, reportMetadata.subTitle, filters.startDate ? `Period: ${filters.startDate} to ${filters.endDate}` : "Period: All Recorded History", breakdownData.length > 0 && !filters.chapterId, breakdownData.length > 0 && !filters.chapterId ? breakdownData : reports)} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm active:scale-95"><Icon name="report" className="w-4 h-4 mr-2"/>Export Excel</button>
              </>
            )}
            {activeView === 'my-submissions' && (
              <>
                <button onClick={() => exportService.toPDF("My Submitted Reports", `User: ${user?.name}`, filters.startDate ? `Period: ${filters.startDate} to ${filters.endDate}` : "Period: All History", false, myEventReports)} className="bg-fgbmfi-red text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-800 flex items-center shadow-sm active:scale-95"><Icon name="archive-box" className="w-4 h-4 mr-2"/>Export PDF</button>
                <button onClick={() => exportService.toCSV("My Submitted Reports", `User: ${user?.name}`, filters.startDate ? `Period: ${filters.startDate} to ${filters.endDate}` : "Period: All History", false, myEventReports)} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm active:scale-95"><Icon name="report" className="w-4 h-4 mr-2"/>Export Excel</button>
              </>
            )}
        </div>
      </div>

      <ReportFiltersSection filters={filters} handleFilterChange={handleFilterChange} handleDateChange={handleDateChange} />
      
      {loading ? ( 
        <div className="p-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fgbmfi-blue mx-auto mb-4"></div>
          <p className="text-xs font-black uppercase text-gray-400">Syncing Cloud Reports...</p>
        </div> 
      ) : editingReport ? (
        <div className="mt-6 max-w-4xl mx-auto">
          <EventReportForm 
            key={editingReport.id}
            initialData={editingReport} 
            onComplete={handleEditComplete} 
            onCancel={handleEditCancel} 
          />
        </div>
      ) : (
        <div className="mt-6">
          {activeView === 'matrix' ? (
            <SummaryEventsMatrix filters={filters} user={user!} unitName={reportMetadata.unit} />
          ) : activeView === 'my-submissions' ? (
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-lg font-black text-fgbmfi-blue mb-2 uppercase tracking-tight">My Recent Submissions</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">You can edit reports you submitted for your office or chapter.</p>
                </div>
                <EventReportList 
                    reports={myEventReports} 
                    onEdit={handleEditReport} 
                    user={user!} 
                />
            </div>
          ) : (
            <>
                {breakdownData.length > 0 && !filters.chapterId && ( <div className="mb-6"><h2 className="text-lg font-black text-fgbmfi-blue mb-4 uppercase tracking-tight">{reportMetadata.unit} - Summary Breakdown</h2><ReportTable data={breakdownData} isAggregated={true} /></div> )}
                {((filters.chapterId && reports.length > 0) || (user?.role === Role.CHAPTER_PRESIDENT && reports.length > 0)) && ( <div className="mt-8"><h2 className="text-lg font-black text-fgbmfi-blue mb-4 uppercase tracking-tight">Monthly Activity History</h2><ReportTable data={reports} /></div> )}
                {breakdownData.length === 0 && reports.length === 0 && ( <div className="bg-white p-20 rounded-[2rem] shadow-sm border border-gray-100 text-center"><Icon name="archive-box" className="w-12 h-12 text-gray-200 mx-auto mb-4" /><p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No reporting records found for this unit.</p></div> )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default ReportsPage;