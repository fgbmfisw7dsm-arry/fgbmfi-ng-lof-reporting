import { Role, DashboardStats, EventReport, User, Region, District, Zone, Area, Chapter, EventType } from '../types';
import { supabase, supabaseUrl, supabaseKey } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';

const REGISTRY_LIMIT = 10000;

export const apiService = {
  getUsers: async (): Promise<User[]> => {
      // Filter out deactivated/deleted profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', Role.FORMER_OFFICER)
        .not('email', 'ilike', '%@archived.lof')
        .limit(REGISTRY_LIMIT)
        .order('name');

      if (error) throw new Error(`Registry Load Error: ${error.message}`);
      return (data || []).map(p => ({
          id: p.id, name: p.name, username: p.username, email: p.email,
          phone: p.phone || '', password: '', role: p.role as Role, unitId: p.unit_id
      }));
  },

  getArchivedUsers: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`role.eq."${Role.FORMER_OFFICER}",email.ilike."%@archived.lof"`)
        .limit(REGISTRY_LIMIT)
        .order('name');

      if (error) throw new Error(`Archive Load Error: ${error.message}`);
      return (data || []).map(p => ({
          id: p.id, name: p.name, username: p.username, email: p.email,
          phone: p.phone || '', password: '', role: p.role as Role, unitId: p.unit_id
      }));
  },

  createNewUserAuth: async (email: string) => {
      // Create a temporary, isolated client that DOES NOT persist session
      // This allows us to use the official signUp (which fixes schema errors)
      // WITHOUT logging out the Administrator.
      const tempSupabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
          }
      });

      const { data, error } = await tempSupabase.auth.signUp({
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
      const isDeletedUsername = user.username.startsWith('deleted_');
      const payload = {
          id: user.id, 
          name: user.name || 'New Officer',
          username: (isDeletedUsername || !user.username ? user.email.split('@')[0] : user.username).toLowerCase().trim(),
          email: user.email.toLowerCase().trim(),
          role: user.role,
          unit_id: user.unitId.trim().toUpperCase(),
          phone: user.phone || ''
      };
      
      console.log("apiService: Upserting profile for", payload.email);
      const { error, data } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select();
      
      if (error) {
          console.error("apiService: Upsert error:", error);
          throw new Error(`Profile Sync Failed: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
          throw new Error("Profile Sync Blocked: Row-Level Security (RLS) prevented this update. Ensure your Admin account has 'UPDATE' permissions for other profiles.");
      }
      
      return 'SUCCESS';
  },

  deleteUser: async (userId: string) => {
      // PERMANENT FIX FOR DATA LOSS: 
      // Instead of deleting the profile (which triggers cascade delete of reports),
      // we "deactivate" it by renaming and changing the email/username.
      // This preserves the UUID (id) so historical reports stay linked and visible.
      
      const { data: profile } = await supabase.from('profiles').select('email, name').eq('id', userId).single();
      
      if (!profile) throw new Error("Profile not found.");

      const deletedMarker = `deleted_${Date.now()}_${userId.substring(0, 8)}`;
      const payload = {
          name: `(Former) ${profile.name}`,
          email: `${deletedMarker}@archived.lof`,
          username: deletedMarker,
          role: Role.FORMER_OFFICER
      };

      console.log("apiService: Archiving profile for", userId);
      const { error, data } = await supabase.from('profiles').update(payload).eq('id', userId).select();
      
      if (error) {
          console.error("apiService: Deactivation error:", error);
          throw new Error(`Deactivation Failed: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
          throw new Error("Deactivation Blocked: Row-Level Security (RLS) prevented this update. You may not have permission to modify this specific profile.");
      }
      
      return true;
  },

  adminResetPassword: async (userId: string) => {
      const { error } = await supabase.rpc('admin_reset_password', {
          target_user_id: userId,
          new_password: '123456'
      });
      if (error) throw error;
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
  updateEventReport: async (report: EventReport) => {
    const reportId = String(report.id).trim();
    if (!reportId) {
      throw new Error("Update failed: Missing report ID.");
    }

    const { error, status } = await supabase
      .from('event_reports')
      .update({
        event_type: report.eventType,
        date_of_event: report.dateOfEvent,
        attendance: Number(report.attendance || 0),
        first_timers: Number(report.firstTimers || 0),
        salvations: Number(report.salvations || 0),
        holy_ghost_baptism: Number(report.holyGhostBaptism || 0),
        membership_intention: Number(report.membershipIntention || 0),
        offering: Number(report.offering || 0),
        membership_count: Number(report.membershipCount || 0)
      })
      .eq('id', reportId);
    
    if (error) {
      console.error('Supabase Update Error:', error);
      throw new Error(`Cloud Sync Error: ${error.message} (Status: ${status})`);
    }

    return 'SUCCESS';
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
        supabase.from('event_reports').select('*').in('unit_id', descendantIds).gte('date_of_event', `${year}-01-01`).lte('date_of_event', `${year}-12-31`).limit(REGISTRY_LIMIT)
    ]);

    const regs = results[0] as Region[];
    const dists = results[1] as District[];
    const zones = results[2] as Zone[];
    const areas = results[3] as Area[];
    const chaps = results[4] as Chapter[];
    const allEvents = (results[5].data as any[]) || [];

    const stats = { totalAttendance: 0, totalFirstTimers: 0, totalSalvations: 0, totalHolyGhostBaptisms: 0, totalOfferings: 0, totalMembershipCount: 0, totalMembershipIntentions: 0 };
    
    // Membership logic: Latest value per chapter
    const latestMembershipByChapter: { [chapterId: string]: { date: number, count: number } } = {};

    allEvents.forEach(r => {
        stats.totalAttendance += (r.attendance || 0); stats.totalFirstTimers += (r.first_timers || 0);
        stats.totalSalvations += (r.salvations || 0); stats.totalHolyGhostBaptisms += (r.holy_ghost_baptism || 0);
        stats.totalOfferings += Number(r.offering || 0); stats.totalMembershipIntentions += (r.membership_intention || 0);
        
        // Track latest membership from events if applicable (some events might have membership count)
        const reportDate = new Date(r.date_of_event).getTime();
        const uid = r.unit_id.trim().toUpperCase();
        // Only consider it if it's a chapter (descendantIds includes chapters)
        if (chapterIds.includes(uid) && r.membership_count > 0) {
            if (!latestMembershipByChapter[uid] || reportDate > latestMembershipByChapter[uid].date) {
                latestMembershipByChapter[uid] = { date: reportDate, count: r.membership_count };
            }
        }
    });

    // Sum up latest membership counts
    stats.totalMembershipCount = Object.values(latestMembershipByChapter).reduce((sum, item) => sum + item.count, 0);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const growthTrend = months.map(m => ({ 
        name: m.substring(0, 3), 
        value: allEvents.filter(r => new Date(r.date_of_event).toLocaleString('default', { month: 'long' }) === m).reduce((sum, r) => sum + (r.attendance || 0), 0) || 0
    }));

    const breakdown: any[] = [];
    const getOfficeLabel = (r: Role) => {
        if (r === Role.NATIONAL_PRESIDENT || r === Role.NATIONAL_ADMIN || r === Role.NATIONAL_EXECUTIVE_COUNCIL) return "National Events";
        if (r === Role.REGIONAL_VICE_PRESIDENT || r === Role.REGIONAL_ADMIN || r === Role.REGIONAL_EXECUTIVE_COUNCIL) return "Regional Events";
        if (r === Role.DISTRICT_COORDINATOR || r === Role.DISTRICT_ADMIN || r === Role.DISTRICT_BOARD_MEMBER) return "District Events";
        if (r === Role.NATIONAL_DIRECTOR) return "Zonal Events";
        if (r === Role.FIELD_REPRESENTATIVE) return "Area Events";
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
        const eTotal = allEvents.filter(r => targetDescendants.includes(r.unit_id.trim().toUpperCase())).reduce((sum, r) => sum + (r.attendance || 0), 0);
        return eTotal;
    };

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    const subUnitsBreakdown: any[] = [];
    if (normalizedUnitId === 'NATIONAL' || role === Role.NATIONAL_EXECUTIVE_COUNCIL) { regs.forEach(r => subUnitsBreakdown.push({ name: r.name, value: getUnitTotals(r.id), unitId: r.id, role: Role.REGIONAL_VICE_PRESIDENT })); }
    else if (role === Role.REGIONAL_VICE_PRESIDENT || role === Role.REGIONAL_ADMIN || role === Role.REGIONAL_EXECUTIVE_COUNCIL) { dists.filter(d => d.regionId.trim().toUpperCase() === normalizedUnitId).forEach(d => subUnitsBreakdown.push({ name: d.name, value: getUnitTotals(d.id), unitId: d.id, role: Role.DISTRICT_COORDINATOR })); }
    else if (role === Role.DISTRICT_COORDINATOR || role === Role.DISTRICT_ADMIN || role === Role.DISTRICT_BOARD_MEMBER) { zones.filter(z => z.districtId.trim().toUpperCase() === normalizedUnitId).forEach(z => subUnitsBreakdown.push({ name: z.name, value: getUnitTotals(z.id), unitId: z.id, role: Role.NATIONAL_DIRECTOR })); }
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

    const { descendantIds } = await apiService.getAllDescendantIds(targetUnitId);
    
    const { data: eventRes, error } = await supabase.from('event_reports').select('*').in('unit_id', descendantIds).limit(REGISTRY_LIMIT);
    if (error) throw error;

    const eventData = (eventRes || []).map(r => {
        const d = new Date(r.date_of_event);
        return {
            id: r.id,
            chapterId: r.unit_id,
            month: d.toLocaleString('default', { month: 'long' }),
            year: d.getFullYear(),
            membershipCount: r.membership_count || 0,
            attendance: r.attendance || 0,
            firstTimers: r.first_timers || 0,
            salvations: r.salvations || 0,
            holyGhostBaptism: r.holy_ghost_baptism || 0,
            membershipIntention: r.membership_intention || 0,
            offering: Number(r.offering || 0),
            date: d,
            isEvent: true,
            eventType: r.event_type
        };
    });

    let filtered = eventData;
    if (f.startDate) filtered = filtered.filter(r => r.date >= new Date(f.startDate));
    if (f.endDate) filtered = filtered.filter(r => r.date <= new Date(f.endDate));

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
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
    if (f.reportingOfficerId) q = q.eq('reporting_officer_id', f.reportingOfficerId);
    const { data, error } = await q.order('date_of_event', { ascending: false });
    if (error) throw error;

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
        offering: Number(r.offering || 0),
        membershipCount: r.membership_count || 0
    }));
  },

  archiveReportsByScope: async (scope: any, unitId: string, fromYear: number, toYear: number) => ({ success: true }),
  deleteReportsByScope: async (scope: any, unitId: string, fromYear: number, toYear: number) => {
      const { descendantIds } = await apiService.getAllDescendantIds(unitId);
      if (descendantIds.length > 0) await supabase.from('event_reports').delete().in('unit_id', descendantIds).gte('date_of_event', `${fromYear}-01-01`).lte('date_of_event', `${toYear}-12-31`);
      return { success: true };
  },

  submitEventReport: async (r: any) => {
    const { error } = await supabase.from('event_reports').insert({ 
        reporting_officer_id: r.reportingOfficerId, 
        unit_id: r.unitId.trim().toUpperCase(), 
        officer_role: r.officerRole, 
        date_of_event: r.dateOfEvent, 
        event_type: r.eventType, 
        attendance: Number(r.attendance || 0), 
        first_timers: Number(r.firstTimers || 0), 
        salvations: Number(r.salvations || 0), 
        holy_ghost_baptism: Number(r.holyGhostBaptism || 0), 
        membership_intention: Number(r.membershipIntention || 0), 
        membership_count: Number(r.membershipCount || 0),
        offering: Number(r.offering || 0) 
    });
    if (error) throw error;
  },

  // Legacy function to prevent build errors from phantom files
  submitChapterReport: async (r: any) => {
      return apiService.submitEventReport({
          ...r,
          unitId: r.unitId || r.chapterId,
          dateOfEvent: `${r.year}-${String(r.month).padStart(2, '0')}-01`,
          eventType: 'Chapter Meeting'
      });
  },

  clearAllData: () => supabase.from('event_reports').delete().neq('id', '0')
};