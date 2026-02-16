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
    const normalizedUnitId = unitId.trim().toUpperCase();

    if (normalizedUnitId === 'NATIONAL') {
      const [regs, dists, zones, areas, chaps] = await Promise.all([
        supabase.from('regions').select('id').limit(REGISTRY_LIMIT),
        supabase.from('districts').select('id').limit(REGISTRY_LIMIT),
        supabase.from('zones').select('id').limit(REGISTRY_LIMIT),
        supabase.from('areas').select('id').limit(REGISTRY_LIMIT),
        supabase.from('chapters').select('id').limit(REGISTRY_LIMIT)
      ]);

      const allDescendants = [
        'NATIONAL',
        ...(regs.data || []).map((r: any) => r.id.trim().toUpperCase()),
        ...(dists.data || []).map((d: any) => d.id.trim().toUpperCase()),
        ...(zones.data || []).map((z: any) => z.id.trim().toUpperCase()),
        ...(areas.data || []).map((a: any) => a.id.trim().toUpperCase()),
        ...(chaps.data || []).map((c: any) => c.id.trim().toUpperCase())
      ];

      return { 
        descendantIds: Array.from(new Set(allDescendants)), 
        chapterIds: (chaps.data || []).map((c: any) => c.id.trim().toUpperCase()) 
      };
    }

    const [dists, zones, areas, chaps] = await Promise.all([
      supabase.from('districts').select('id, region_id').limit(REGISTRY_LIMIT),
      supabase.from('zones').select('id, district_id').limit(REGISTRY_LIMIT),
      supabase.from('areas').select('id, zone_id').limit(REGISTRY_LIMIT),
      supabase.from('chapters').select('id, area_id').limit(REGISTRY_LIMIT)
    ]);

    const descendantIds: string[] = [normalizedUnitId];
    const chapterIds: string[] = [];
    
    const crawl = (currId: string) => {
      const normCurr = currId.trim().toUpperCase();
      (dists.data as any[])?.filter(d => d.region_id.trim().toUpperCase() === normCurr).forEach(d => { descendantIds.push(d.id.trim().toUpperCase()); crawl(d.id); });
      (zones.data as any[])?.filter(z => z.district_id.trim().toUpperCase() === normCurr).forEach(z => { descendantIds.push(z.id.trim().toUpperCase()); crawl(z.id); });
      (areas.data as any[])?.filter(a => a.zone_id.trim().toUpperCase() === normCurr).forEach(a => { descendantIds.push(a.id.trim().toUpperCase()); crawl(a.id); });
      (chaps.data as any[])?.filter(c => c.area_id.trim().toUpperCase() === normCurr).forEach(c => { descendantIds.push(c.id.trim().toUpperCase()); chapterIds.push(c.id.trim().toUpperCase()); });
    };

    crawl(unitId);
    if ((chaps.data as any[])?.some(c => c.id.trim().toUpperCase() === normalizedUnitId)) {
        chapterIds.push(normalizedUnitId);
    }
    
    return { descendantIds: Array.from(new Set(descendantIds)), chapterIds: Array.from(new Set(chapterIds)) };
  },

  getDashboardData: async (role: Role, unitId: string): Promise<DashboardStats> => {
    const year = new Date().getFullYear();
    const normalizedUnitId = unitId.trim().toUpperCase();
    const { descendantIds, chapterIds } = await apiService.getAllDescendantIds(normalizedUnitId);

    const results = await Promise.all([
        apiService.getRegions(),
        apiService.getDistricts(),
        apiService.getZones(),
        apiService.getAreas(),
        apiService.getChapters(),
        supabase.from('chapter_reports').select('*').in('chapter_id', chapterIds).eq('year', year).limit(REGISTRY_LIMIT),
        supabase.from('event_reports').select('*').in('unit_id', descendantIds).gte('date_of_event', `${year}-01-01`).lte('date_of_event', `${year}-12-31`).limit(REGISTRY_LIMIT)
    ]);

    const regs = results[0] as Region[];
    const dists = results[1] as District[];
    const zones = results[2] as Zone[];
    const areas = results[3] as Area[];
    const chaps = results[4] as Chapter[];
    const allMonthly = (results[5].data as any[]) || [];
    const allEvents = (results[6].data as any[]) || [];

    const stats = { totalAttendance: 0, totalFirstTimers: 0, totalSalvations: 0, totalHolyGhostBaptisms: 0, totalOfferings: 0, totalMembershipCount: 0, totalMembershipIntentions: 0 };
    allMonthly.forEach(r => {
        stats.totalAttendance += (r.attendance || 0); stats.totalFirstTimers += (r.first_timers || 0);
        stats.totalSalvations += (r.salvations || 0); stats.totalHolyGhostBaptisms += (r.holy_ghost_baptism || 0);
        stats.totalOfferings += Number(r.offering || 0); stats.totalMembershipCount += (r.membership_count || 0);
        stats.totalMembershipIntentions += (r.membership_intention || 0);
    });
    allEvents.forEach(r => {
        stats.totalAttendance += (r.attendance || 0); stats.totalFirstTimers += (r.first_timers || 0);
        stats.totalSalvations += (r.salvations || 0); stats.totalHolyGhostBaptisms += (r.holy_ghost_baptism || 0);
        stats.totalOfferings += Number(r.offering || 0); stats.totalMembershipIntentions += (r.membership_intention || 0);
    });

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const growthTrend = months.map(m => ({ 
        name: m.substring(0, 3), 
        value: (allMonthly.filter(r => r.month === m).reduce((sum, r) => sum + (r.attendance || 0), 0) || 0) +
               (allEvents.filter(r => new Date(r.date_of_event).toLocaleString('default', { month: 'long' }) === m).reduce((sum, r) => sum + (r.attendance || 0), 0) || 0)
    }));

    const breakdown: any[] = [];
    const getOfficeLabel = (r: Role) => {
        if (r === Role.NATIONAL_PRESIDENT || r === Role.NATIONAL_ADMIN) return "National HQ Events";
        if (r === Role.REGIONAL_VICE_PRESIDENT || r === Role.REGIONAL_ADMIN) return "Regional HQ Events";
        if (r === Role.DISTRICT_COORDINATOR || r === Role.DISTRICT_ADMIN) return "District HQ Events";
        if (r === Role.NATIONAL_DIRECTOR) return "Zonal HQ Events";
        if (r === Role.FIELD_REPRESENTATIVE) return "Area HQ Events";
        return "Office Events";
    };

    const directOfficeEvents = allEvents.filter(r => r.unit_id.trim().toUpperCase() === normalizedUnitId);
    const directOfficeTotal = directOfficeEvents.reduce((sum, r) => sum + (r.attendance || 0), 0);
    if (directOfficeTotal > 0 && role !== Role.CHAPTER_PRESIDENT) {
        breakdown.push({ name: getOfficeLabel(role), value: directOfficeTotal, unitId: normalizedUnitId, role: role });
    }

    const getUnitTotals = (targetId: string) => {
        const normTarget = targetId.trim().toUpperCase();
        const targetDescendants: string[] = [normTarget];
        const targetChapters: string[] = [];
        const localCrawl = (curr: string) => {
            const nc = curr.trim().toUpperCase();
            (dists as any[]).filter(d => d.regionId.trim().toUpperCase() === nc).forEach(d => { targetDescendants.push(d.id.trim().toUpperCase()); localCrawl(d.id); });
            (zones as any[]).filter(z => z.districtId.trim().toUpperCase() === nc).forEach(z => { targetDescendants.push(z.id.trim().toUpperCase()); localCrawl(z.id); });
            (areas as any[]).filter(a => a.zoneId.trim().toUpperCase() === nc).forEach(a => { targetDescendants.push(a.id.trim().toUpperCase()); localCrawl(a.id); });
            (chaps as any[]).filter(c => c.areaId.trim().toUpperCase() === nc).forEach(c => { targetDescendants.push(c.id.trim().toUpperCase()); targetChapters.push(c.id.trim().toUpperCase()); });
        };
        if (chaps.some(c => c.id.trim().toUpperCase() === normTarget)) targetChapters.push(normTarget);
        else localCrawl(targetId);
        const mTotal = allMonthly.filter(r => targetChapters.includes(r.chapter_id.trim().toUpperCase())).reduce((sum, r) => sum + (r.attendance || 0), 0);
        const eTotal = allEvents.filter(r => targetDescendants.includes(r.unit_id.trim().toUpperCase())).reduce((sum, r) => sum + (r.attendance || 0), 0);
        return mTotal + eTotal;
    };

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    const subUnitsBreakdown: any[] = [];
    if (normalizedUnitId === 'NATIONAL') { regs.forEach(r => subUnitsBreakdown.push({ name: r.name, value: getUnitTotals(r.id), unitId: r.id, role: Role.REGIONAL_VICE_PRESIDENT })); }
    else if (role === Role.REGIONAL_VICE_PRESIDENT || role === Role.REGIONAL_ADMIN) { dists.filter(d => d.regionId.trim().toUpperCase() === normalizedUnitId).forEach(d => subUnitsBreakdown.push({ name: d.name, value: getUnitTotals(d.id), unitId: d.id, role: Role.DISTRICT_COORDINATOR })); }
    else if (role === Role.DISTRICT_COORDINATOR || role === Role.DISTRICT_ADMIN) { zones.filter(z => z.districtId.trim().toUpperCase() === normalizedUnitId).forEach(z => subUnitsBreakdown.push({ name: z.name, value: getUnitTotals(z.id), unitId: z.id, role: Role.NATIONAL_DIRECTOR })); }
    else if (role === Role.NATIONAL_DIRECTOR) { areas.filter(a => a.zoneId.trim().toUpperCase() === normalizedUnitId).forEach(a => subUnitsBreakdown.push({ name: a.name, value: getUnitTotals(a.id), unitId: a.id, role: Role.FIELD_REPRESENTATIVE })); }
    else if (role === Role.FIELD_REPRESENTATIVE) { chaps.filter(c => c.areaId.trim().toUpperCase() === normalizedUnitId).forEach(c => subUnitsBreakdown.push({ name: c.name, value: getUnitTotals(c.id), unitId: c.id, role: Role.CHAPTER_PRESIDENT })); }

    subUnitsBreakdown.sort((a, b) => collator.compare(a.name, b.name));
    const finalBreakdown = [...breakdown, ...subUnitsBreakdown].filter(b => b.value > 0);
    return { ...stats, growthTrend, breakdown: finalBreakdown };
  },

  getChapterReports: async (f: any, user?: User) => {
    let targetUnitId = f.chapterId || f.areaId || f.zoneId || f.districtId || f.regionId || user?.unitId;
    if (!targetUnitId) return [];
    
    // SECURITY: Ensure targetUnitId is within user's downward scope
    if (user && user.unitId.trim().toUpperCase() !== 'NATIONAL') {
        const authorized = await apiService.getAllDescendantIds(user.unitId);
        if (!authorized.descendantIds.includes(targetUnitId.trim().toUpperCase())) {
            targetUnitId = user.unitId; // Override unauthorized selection
        }
    }

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
    let targetUnitId = f.chapterId || f.areaId || f.zoneId || f.districtId || f.regionId || user?.unitId;
    if (!targetUnitId) return [];

    // SECURITY: Ensure targetUnitId is within user's downward scope
    if (user && user.unitId.trim().toUpperCase() !== 'NATIONAL') {
        const authorized = await apiService.getAllDescendantIds(user.unitId);
        if (!authorized.descendantIds.includes(targetUnitId.trim().toUpperCase())) {
            targetUnitId = user.unitId; // Override unauthorized selection
        }
    }

    const { descendantIds } = await apiService.getAllDescendantIds(targetUnitId);
    let q = supabase.from('event_reports').select('*').limit(REGISTRY_LIMIT);
    if (descendantIds.length > 0) q = q.in('unit_id', descendantIds);
    else q = q.eq('unit_id', 'NONE');
    if (f.startDate) q = q.gte('date_of_event', f.startDate);
    if (f.endDate) q = q.lte('date_of_event', f.endDate);
    const { data } = await q.order('date_of_event', { ascending: false });
    return (data || []).map(r => ({ 
        id: r.id, 
        reportingOfficerId: r.reporting_officer_id, 
        unitId: r.unit_id, 
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
      const { descendantIds, chapterIds } = await apiService.getAllDescendantIds(unitId);
      if (chapterIds.length > 0) await supabase.from('chapter_reports').delete().in('chapter_id', chapterIds).gte('year', fromYear).lte('year', toYear);
      if (descendantIds.length > 0) await supabase.from('event_reports').delete().in('unit_id', descendantIds).gte('date_of_event', `${fromYear}-01-01`).lte('date_of_event', `${toYear}-12-31`);
      return { success: true };
  },

  submitChapterReport: async (r: any) => {
    const { error } = await supabase.from('chapter_reports').insert({ 
        chapter_id: r.chapterId.trim().toUpperCase(), 
        month: r.month, 
        year: r.year, 
        membership_count: r.membershipCount, 
        attendance: r.attendance, 
        first_timers: r.first_timers, 
        salvations: r.salvations, 
        holy_ghost_baptism: r.holy_ghost_baptism, 
        membership_intention: r.membership_intention, 
        offering: r.offering 
    });
    if (error) throw error;
  },

  submitEventReport: async (r: any) => {
    const { error } = await supabase.from('event_reports').insert({ 
        reporting_officer_id: r.reportingOfficerId, 
        unit_id: r.unitId.trim().toUpperCase(), 
        officer_role: r.officerRole, 
        date_of_event: r.dateOfEvent, 
        event_type: r.eventType, 
        attendance: r.attendance, 
        first_timers: r.first_timers, 
        salvations: r.salvations, 
        holy_ghost_baptism: r.holy_ghost_baptism, 
        membership_intention: r.membership_intention, 
        offering: r.offering 
    });
    if (error) throw error;
  },

  clearAllData: () => Promise.all([supabase.from('chapter_reports').delete().neq('id', '0'), supabase.from('event_reports').delete().neq('id', '0')])
};