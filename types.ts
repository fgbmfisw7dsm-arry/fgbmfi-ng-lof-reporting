
export enum Role {
  NATIONAL_ADMIN = 'National Admin',
  REGIONAL_ADMIN = 'Regional Admin',
  DISTRICT_ADMIN = 'District Admin',
  NATIONAL_PRESIDENT = 'National President (NP)',
  REGIONAL_VICE_PRESIDENT = 'Regional Vice President (RVP)',
  DISTRICT_COORDINATOR = 'District Coordinator (DC)',
  NATIONAL_DIRECTOR = 'National Director (ND)',
  FIELD_REPRESENTATIVE = 'Field Representative (FR)',
  CHAPTER_PRESIDENT = 'Chapter President (CP)',
  DISTRICT_BOARD_MEMBER = 'District Board Member (DBM)',
  REGIONAL_EXECUTIVE_COUNCIL = 'Regional Executive Council (REC)',
  NATIONAL_EXECUTIVE_COUNCIL = 'National Executive Council (NEC)',
  FORMER_OFFICER = 'Former Officer',
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  unitId: string; 
  isActive?: boolean;
  deactivatedAt?: string;
  reactivatedAt?: string;
}

export interface Chapter {
  id: string;
  name: string;
  areaId: string;
}

export interface Area {
  id: string;
  name: string;
  zoneId: string;
}

export interface Zone {
  id: string;
  name: string;
  districtId: string;
}

export interface District {
  id: string;
  name: string;
  regionId: string;
}

export interface Region {
  id: string;
  name: string;
  nationalId: string;
}

export interface EventType {
  id: string;
  name: string;
}

export interface EventReport {
  id: string;
  reportingOfficerId: string;
  unitId: string;
  officerRole: Role;
  dateOfEvent: string;
  eventType: string;
  attendance: number;
  firstTimers: number;
  salvations: number;
  holyGhostBaptism: number;
  offering: number;
  membershipIntention: number;
  membershipCount?: number; // Added for Chapter reports
  chapterId?: string; // Legacy support
  isLegacy?: boolean;
}

// Legacy type to prevent build errors from phantom files
export interface ChapterMonthlyReport {
  id?: string;
  reportingOfficerId?: string;
  unitId?: string;
  officerRole?: Role;
  dateOfEvent?: string;
  eventType?: string;
  attendance?: number;
  firstTimers?: number;
  salvations?: number;
  holyGhostBaptism?: number;
  offering?: number;
  membershipIntention?: number;
  membershipCount?: number;
  chapterId?: string;
  month?: string | number;
  year?: number;
  isLegacy?: boolean;
}

export interface DashboardStats {
  totalAttendance: number;
  totalFirstTimers: number;
  totalSalvations: number;
  totalHolyGhostBaptisms: number;
  totalOfferings: number;
  totalMembershipCount: number;
  totalMembershipIntentions: number;
  growthTrend: { name: string; value: number }[];
  breakdown: { name: string; value: number; unitId: string; role: Role }[];
}
