import { Role, DashboardStats, ChapterMonthlyReport, EventReport, User, Region, District, Zone, Area, Chapter, EventType } from '../types';
import { supabase } from './supabaseClient';

const REGISTRY_LIMIT = 10000;

export const apiService = {
  getUsers: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('profiles').select('*').limit(REGISTRY_LIMIT).order('name');
      if (error) throw new Error(`Registry Load Error: ${error.message}`);
      return (data || []).map(p => ({
          id: p.id, name: p.name, username: p.username, email: p.email,
          phone: p.phone || '', password: '', role: p.role as Role, unitId: p.unit_id
      }));
  },

  createNewUserAuth: async (email: string) => {
      const { data, error } = await supabase.auth.signUp({
          email,
          password: '123456', 
          options: { 
            data: { is_managed: true } 
          }
      });
      if (error) {
          if (error.message.toLowerCase().includes('already registered')) throw new Error("ALREADY_EXISTS");
          throw error;
      }
      return data.user;
  },

  upsertUser: async (user: User) => {
      if (!user.id || !user.unitId || !user.role) {
          throw new Error("Missing required profile fields.");
      }
      const payload = {
          id: user.id, 
          name: user.name || 'New Officer',
          username: (user.username || user.email.split('@')[0]).toLowerCase().trim(),
          email: user.email.toLowerCase().trim(),
          role: user.role,
          unit_id: user.unitId.trim().toUpperCase(),
          phone: user.phone || ''
      };
      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) throw new Error(`Profile Sync Failed: ${error.message}`);
      return 'SUCCESS';
  },

  deleteUser: async (userId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw new Error(`Cloud Delete Failed: ${error.message}`);
      return true;
  },

  getRegions: async (): Promise<Region[]> => {
    const { data, error } = await supabase.from('regions').select('*').limit(REGISTRY_LIMIT).order('name');
    if (error) throw new Error(`Region Sync Error: ${error.message}`);
    return (data || []).map(r => ({ id: r.id, name: r.name, nationalId: r.national_id || 'national' }));
  },

  getDistricts: async (regionId?: string): Promise<District[]> => {
    let q = supabase.from('districts').select('*').limit(REGISTRY_LIMIT).order('name');
    if (regionId) q = q.eq('region_id', regionId);
    const { data, error } = await q;
    if (error) throw new Error(`District Sync Error: ${error.message}`);
    return (data || []).map(d => ({ id: d.id, name: d.name, regionId: d.region_id }));
  },

  getZones: async (districtId?: string): Promise<Zone[]> => {
    let q = supabase.from('zones').select('*').limit(REGISTRY_LIMIT).order('name');
    if (districtId) q = q.eq('district_id', districtId);
    const { data, error } = await q;
    if (error) throw new Error(`Zone Sync Error: ${error.message}`);
    return (data || []).map(z => ({ id: z.id, name: z.name, districtId: z.district_id }));
  },

  getAreas: async (zoneId?: string): Promise<Area[]> => {
    let q = supabase.from('areas').select('*').limit(REGISTRY_LIMIT).order('name');
    if (zoneId) q = q.eq('zone_id', zoneId);
    const { data, error } = await q;
    if (error) throw new Error(`Area Sync Error: ${error.message}`);
    return (data || []).map(a => ({ id: a.id, name: a.name, zoneId: a.zone_id }));
  },

  getChapters: async (areaId?: string): Promise<Chapter[]> => {
    let q = supabase.from('chapters').select('*').limit(REGISTRY_LIMIT).order('name');
    if (areaId) q = q.eq('area_id', areaId);
    const { data, error } = await q;
    if (error) throw new Error(`Chapter Sync Error: ${error.message}`);
    return (data || []).map(c => ({ id: c.id, name: c.name, areaId: c.area_id }));
  },

  upsertRegion: async (r: Region) => {
    const { error } = await supabase.from('regions').upsert({ id: r.id, name: r.name, national_id: r.nationalId }, { onConflict: 'id' });
    if (error) throw error;
  },

  upsertDistrict: async (d: District) => {
    const { error } = await supabase.from('districts').upsert({ id: d.id, name: d.name, region_id: d.regionId }, { onConflict: 'id' });
    if (error) throw error;
  },

  upsertZone: async (z: Zone) => {
    const { error } = await supabase.from('zones').upsert({ id: z.id, name: z.name, district_id: z.districtId }, { onConflict: 'id' });
    if (error) throw error;
  },

  upsertArea: async (a: Area) => {
    const { error } = await supabase.from('areas').upsert({ id: a.id, name: a.name, zone_id: a.zoneId }, { onConflict: 'id' });
    if (error) throw error;
  },

  upsertChapter: async (c: Chapter) => {
    const { error } = await supabase.from('chapters').upsert({ id: c.id, name: c.name, area_id: c.areaId }, { onConflict: 'id' });
    if (error) throw error;
  },

  deleteRegion: (id: string) => supabase.from('regions').delete().eq('id', id),
  deleteDistrict: (id: string) => supabase.from('districts').delete().eq('id', id),
  deleteZone: (id: string) => supabase.from('zones').delete().eq('id', id),
  deleteArea: (id: string) => supabase.from('areas').delete().eq('id', id),
  deleteChapter: (id: string) => supabase.from('chapters').delete().eq('id', id),

  getEventTypes: async (): Promise<EventType[]> => {
    const { data, error } = await supabase.from('event_types').select('*').limit(REGISTRY_LIMIT).order('name');
    if (error) throw new Error(`Event Types Sync Error: ${error.message}`);
    return data || [];
  },
  upsertEventType: async (et: EventType) => {
    const { error } = await supabase.from('event_types').upsert({ id: et.id, name: et.name }, { onConflict: 'id' });
    if (error) throw error;
  },
  deleteEventType: (id: string) => supabase.from('event_types').delete().eq('id', id),

  getAllDescendantIds: async (unitId: string): Promise<{ descendantIds: string[], chapterIds: string[] }> => {
    if (unitId === 'national') {
      const [chaps] = await Promise.all([supabase.from('chapters').select('id').limit(REGISTRY_LIMIT)]);
      return { descendantIds: ['national'], chapterIds: (chaps.data as any[])?.map(c => c.id) || [] };
    }
    const [dists, zones, areas, chaps] = await Promise.all([
      supabase.from('districts').select('id, region_id').limit(REGISTRY_LIMIT),
      supabase.from('zones').select('id, district_id').limit(REGISTRY_LIMIT),
      supabase.from('areas').select('id, zone_id').limit(REGISTRY_LIMIT),
      supabase.from('chapters').select('id, area_id').limit(REGISTRY_LIMIT)
    ]);
    const descendantIds: string[] = [unitId];
    const chapterIds: string[] = [];
    const crawl = (currId: string) => {
      (dists.data as any[])?.filter(d => d.region_id === currId).forEach(d => { descendantIds.push(d.id); crawl(d.id); });
      (zones.data as any[])?.filter(z => z.district_id === currId).forEach(z => { descendantIds.push(z.id); crawl(z.id); });
      (areas.data as any[])?.filter(a => a.zone_id === currId).forEach(a => { descendantIds.push(a.id); crawl(a.id); });
      (chaps.data as any[])?.filter(c => c.area_id === currId).forEach(c => { descendantIds.push(c.id); chapterIds.push(c.id); });
    };
    crawl(unitId);
    if ((chaps.data as any[])?.some(c => c.id === unitId) && !chapterIds.includes(unitId)) chapterIds.push(unitId);
    return { descendantIds, chapterIds };
  },

  getDashboardData: async (role: Role, unitId: string): Promise<DashboardStats> => {
    const year = new Date().getFullYear();
    const { descendantIds, chapterIds } = await apiService.getAllDescendantIds(unitId);

    let officerQ = supabase.from('profiles').select('id').limit(REGISTRY_LIMIT);
    if (unitId !== 'national') officerQ = officerQ.in('unit_id', descendantIds);
    const { data: profiles } = await officerQ;
    const officerIds = (profiles as any[])?.map(p => p.id) || [];

    const results = await Promise.all([
        apiService.getRegions(),
        apiService.getDistricts(),
        apiService.getZones(),
        apiService.getAreas(),
        apiService.getChapters(),
        supabase.from('chapter_reports').select('*').in('chapter_id', chapterIds).eq('year', year).limit(REGISTRY_LIMIT),
        supabase.from('event_reports').select('*').in('reporting_officer_id', officerIds).gte('date_of_event', `${year}-01-01`).lte('date_of_event', `${year}-12-31`).limit(REGISTRY_LIMIT)
    ]);

    const regs = results[0] as Region[];
    const dists = results[1] as District[];
    const zones = results[2] as Zone[];
    const areas = results[3] as Area[];
    const chaps = results[4] as Chapter[];
    const allMonthly = results[5] as any;
    const allEvents = results[6] as any;

    const filteredMonthly = (allMonthly.data as any[]) || [];
    const filteredEvents = (allEvents.data as any[]) || [];

    const stats = { totalAttendance: 0, totalFirstTimers: 0, totalSalvations: 0, totalHolyGhostBaptisms: 0, totalOfferings: 0, totalMembershipCount: 0, totalMembershipIntentions: 0 };
    filteredMonthly.forEach(r => {
        stats.totalAttendance += (r.attendance || 0); stats.totalFirstTimers += (r.first_timers || 0);
        stats.totalSalvations += (r.salvations || 0); stats.totalHolyGhostBaptisms += (r.holy_ghost_baptism || 0);
        stats.totalOfferings += Number(r.offering || 0); stats.totalMembershipCount += (r.membership_count || 0);
        stats.totalMembershipIntentions += (r.membership_intention || 0);
    });
    filteredEvents.forEach(r => {
        stats.totalAttendance += (r.attendance || 0); stats.totalFirstTimers += (r.first_timers || 0);
        stats.totalSalvations += (r.salvations || 0); stats.totalHolyGhostBaptisms += (r.holy_ghost_baptism || 0);
        stats.totalOfferings += Number(r.offering || 0); stats.totalMembershipIntentions += (r.membership_intention || 0);
    });

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const growthTrend = months.map(m => ({ 
        name: m.substring(0, 3), 
        value: (filteredMonthly.filter(r => r.month === m).reduce((sum, r) => sum + (r.attendance || 0), 0) || 0) +
               (filteredEvents.filter(r => new Date(r.date_of_event).toLocaleString('default', { month: 'long' }) === m).reduce((sum, r) => sum + (r.attendance || 0), 0) || 0)
    }));

    const { data: allProfiles } = await supabase.from('profiles').select('id, unit_id').limit(REGISTRY_LIMIT);
    const officerToUnitMap = new Map<string, string>((allProfiles as any[] || []).map(p => [p.id as string, p.unit_id as string]));

    const breakdown: any[] = [];
    
    // Add current Office contribution to breakdown
    const getOfficeLabel = (r: Role) => {
        if (r === Role.NATIONAL_PRESIDENT) return "National Events";
        if (r === Role.REGIONAL_VICE_PRESIDENT) return "Regional Events";
        if (r === Role.DISTRICT_COORDINATOR) return "District Events";
        if (r === Role.NATIONAL_DIRECTOR) return "Zonal Events";
        if (r === Role.FIELD_REPRESENTATIVE) return "Area Events";
        return "Office Events";
    };

    const directOfficeEvents = filteredEvents.filter(r => officerToUnitMap.get(r.reporting_officer_id) === unitId);
    const directOfficeTotal = directOfficeEvents.reduce((sum, r) => sum + (r.attendance || 0), 0);
    if (directOfficeTotal > 0 && role !== Role.CHAPTER_PRESIDENT) {
        breakdown.push({ name: getOfficeLabel(role), value: directOfficeTotal, unitId: unitId, role: role });
    }

    const getUnitTotals = (targetUnitId: string) => {
        const targetChapterIds: string[] = [];
        const targetDescendantIds: string[] = [targetUnitId];
        const localFind = (currId: string) => {
            (dists as any[]).filter(d => d.regionId === currId).forEach(d => { targetDescendantIds.push(d.id); localFind(d.id); });
            (zones as any[]).filter(z => z.districtId === currId).forEach(z => { targetDescendantIds.push(z.id); localFind(z.id); });
            (areas as any[]).filter(a => a.zoneId === currId).forEach(a => { targetDescendantIds.push(a.id); localFind(a.id); });
            (chaps as any[]).filter(c => c.areaId === currId).forEach(c => { targetChapterIds.push(c.id); targetDescendantIds.push(c.id); });
        };
        if (chaps.some(c => c.id === targetUnitId)) targetChapterIds.push(targetUnitId);
        else localFind(targetUnitId);
        
        return (filteredMonthly.filter(r => targetChapterIds.includes(r.chapter_id)).reduce((sum, r) => sum + (r.attendance || 0), 0) || 0) +
               (filteredEvents.filter(r => targetDescendantIds.includes(officerToUnitMap.get(r.reporting_officer_id) || '')).reduce((sum, r) => sum + (r.attendance || 0), 0) || 0);
    };

    if (unitId === 'national') { regs.forEach(r => breakdown.push({ name: r.name, value: getUnitTotals(r.id), unitId: r.id, role: Role.REGIONAL_VICE_PRESIDENT })); }
    else if (role === Role.REGIONAL_VICE_PRESIDENT || role === Role.REGIONAL_ADMIN) { dists.filter(d => d.regionId === unitId).forEach(d => breakdown.push({ name: d.name, value: getUnitTotals(d.id), unitId: d.id, role: Role.DISTRICT_COORDINATOR })); }
    else if (role === Role.DISTRICT_COORDINATOR || role === Role.DISTRICT_ADMIN) { zones.filter(z => z.districtId === unitId).forEach(z => breakdown.push({ name: z.name, value: getUnitTotals(z.id), unitId: z.id, role: Role.NATIONAL_DIRECTOR })); }
    else if (role === Role.NATIONAL_DIRECTOR) { areas.filter(a => a.zoneId === unitId).forEach(a => breakdown.push({ name: a.name, value: getUnitTotals(a.id), unitId: a.id, role: Role.FIELD_REPRESENTATIVE })); }
    else if (role === Role.FIELD_REPRESENTATIVE) { chaps.filter(c => c.areaId === unitId).forEach(c => breakdown.push({ name: c.name, value: getUnitTotals(c.id), unitId: c.id, role: Role.CHAPTER_PRESIDENT })); }

    return { ...stats, growthTrend, breakdown: breakdown.filter(b => b.value > 0) };
  },

  getChapterReports: async (f: any, user?: User) => {
    const targetUnitId = f.chapterId || f.areaId || f.zoneId || f.districtId || f.regionId || user?.unitId;
    if (!targetUnitId) return [];
    const { chapterIds } = await apiService.getAllDescendantIds(targetUnitId);
    let q = supabase.from('chapter_reports').select('*').limit(REGISTRY_LIMIT);
    if (chapterIds.length > 0) q = q.in('chapter_id', chapterIds);
    else q = q.eq('chapter_id', 'NONE');
    if (f.startDate) q = q.gte('year', new Date(f.startDate).getFullYear());
    if (f.endDate) q = q.lte('year', new Date(f.endDate).getFullYear());
    const { data } = await q.order('year', { ascending: false }).order('month', { ascending: false });
    return (data || []).map(r => ({ id: r.id, chapterId: r.chapter_id, month: r.month, year: r.year, membershipCount: r.membership_count || 0, attendance: r.attendance || 0, firstTimers: r.first_timers || 0, salvations: r.salvations || 0, holyGhostBaptism: r.holy_ghost_baptism || 0, membershipIntention: r.membership_intention || 0, offering: Number(r.offering || 0) }));
  },

  getEventReports: async (f: any, user?: User) => {
    const targetUnitId = f.chapterId || f.areaId || f.zoneId || f.districtId || f.regionId || user?.unitId;
    if (!targetUnitId) return [];

    const { descendantIds } = await apiService.getAllDescendantIds(targetUnitId);
    
    // We need to fetch profiles to know WHICH unit each event belongs to for grouping in reports
    const { data: allProfiles } = await supabase.from('profiles').select('id, unit_id').limit(REGISTRY_LIMIT);
    const officerToUnitMap = new Map<string, string>((allProfiles as any[] || []).map(p => [p.id, p.unit_id]));
    
    // Filter officer IDs based on whether their unit is within the target scope
    const officerIds = (allProfiles as any[])
        ?.filter(p => targetUnitId === 'national' || descendantIds.includes(p.unit_id))
        .map(p => p.id) || [];

    let q = supabase.from('event_reports').select('*').limit(REGISTRY_LIMIT);
    if (officerIds.length > 0) q = q.in('reporting_officer_id', officerIds);
    else q = q.eq('reporting_officer_id', 'NONE');
    
    if (f.startDate) q = q.gte('date_of_event', f.startDate);
    if (f.endDate) q = q.lte('date_of_event', f.endDate);
    
    const { data } = await q.order('date_of_event', { ascending: false });
    return (data || []).map(r => ({ 
        id: r.id, 
        reportingOfficerId: r.reporting_officer_id, 
        unitId: officerToUnitMap.get(r.reporting_officer_id) || '', // Inject unitId for Reports portal aggregation
        officerRole: r.officer_role as Role, 
        dateOfEvent: r.date_of_event, 
        eventType: r.event_type, 
        attendance: r.attendance || 0, 
        firstTimers: r.first_timers || 0, 
        salvations: r.salvations || 0, 
        holyGhostBaptism: r.holy_ghost_baptism || 0, 
        membershipIntention: r.membership_intention || 0, 
        offering: Number(r.offering || 0) 
    }));
  },

  archiveReportsByScope: async (scope: any, unitId: string, fromYear: number, toYear: number) => ({ success: true }),
  deleteReportsByScope: async (scope: any, unitId: string, fromYear: number, toYear: number) => {
      const { chapterIds, descendantIds } = await apiService.getAllDescendantIds(unitId);
      if (chapterIds.length > 0) await supabase.from('chapter_reports').delete().in('chapter_id', chapterIds).gte('year', fromYear).lte('year', toYear);
      const { data: profiles } = await supabase.from('profiles').select('id').in('unit_id', descendantIds).limit(REGISTRY_LIMIT);
      const officerIds = (profiles as any[])?.map(p => p.id) || [];
      if (officerIds.length > 0) await supabase.from('event_reports').delete().in('reporting_officer_id', officerIds).gte('date_of_event', `${fromYear}-01-01`).lte('date_of_event', `${toYear}-12-31`);
      return { success: true };
  },
  submitChapterReport: (r: any) => supabase.from('chapter_reports').insert({ chapter_id: r.chapterId, month: r.month, year: r.year, membership_count: r.membership_count, attendance: r.attendance, first_timers: r.first_timers, salvations: r.salvations, holy_ghost_baptism: r.holy_ghost_baptism, membership_intention: r.membership_intention, offering: r.offering }),
  submitEventReport: (r: any) => supabase.from('event_reports').insert({ reporting_officer_id: r.reportingOfficerId, officer_role: r.officer_role, date_of_event: r.dateOfEvent, event_type: r.eventType, attendance: r.attendance, first_timers: r.first_timers, salvations: r.salvations, holy_ghost_baptism: r.holy_ghost_baptism, membership_intention: r.membership_intention, offering: r.offering }),
  clearAllData: () => Promise.all([supabase.from('chapter_reports').delete().neq('id', '0'), supabase.from('event_reports').delete().neq('id', '0')])
};