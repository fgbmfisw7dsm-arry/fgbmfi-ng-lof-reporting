import { Role } from './types';

export const LOGO_BASE64 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 220'%3E%3Cpath d='M92 75L96 200L104 200L108 75Z' fill='%23F5DEB3' stroke='%23DAA520' stroke-width='1'/%3E%3Cellipse cx='100' cy='130' rx='85' ry='55' fill='none' stroke='%23DAA520' stroke-width='3'/%3E%3Cpath d='M15 130Q100 185 185 130' fill='none' stroke='%23DAA520' stroke-width='1'/%3E%3Cpath d='M15 130Q100 75 185 130' fill='none' stroke='%23DAA520' stroke-width='1'/%3E%3Cpath d='M100 75Q55 130 100 185' fill='none' stroke='%23DAA520' stroke-width='1'/%3E%3Cpath d='M100 75Q145 130 100 185' fill='none' stroke='%23DAA520' stroke-width='1'/%3E%3Ctext x='54' y='145' text-anchor='middle' font-family='serif' font-weight='900' font-size='28' fill='%23B71C1C' stroke='%23fff' stroke-width='1'%3EFGB%3C/text%3E%3Ctext x='146' y='145' text-anchor='middle' font-family='serif' font-weight='900' font-size='28' fill='%23B71C1C' stroke='%23fff' stroke-width='1'%3EMFI%3C/text%3E%3Cpath d='M100 5Q75 45 90 75L110 75Q125 45 100 5Z' fill='%23FFD500' stroke='%23FF8C00' stroke-width='2'/%3E%3Cpath d='M100 15Q88 45 95 65L105 65Q112 45 100 15Z' fill='%23FF4500'/%3E%3C/svg%3E";

export const ROLES = Object.values(Role).filter(r => r !== Role.FORMER_OFFICER);

export const STORAGE_KEYS = {
    REGIONS: 'fgbmfi_regions',
    DISTRICTS: 'fgbmfi_districts',
    ZONES: 'fgbmfi_zones',
    AREAS: 'fgbmfi_areas',
    CHAPTERS: 'fgbmfi_chapters',
    USERS: 'fgbmfi_users',
    CHAPTER_REPORTS: 'fgbmfi_chapter_reports',
    EVENT_REPORTS: 'fgbmfi_event_reports',
};

// Mock data arrays are now empty as the app uses Supabase
export const MOCK_REGIONS: any[] = [];
export const MOCK_DISTRICTS: any[] = [];
export const MOCK_ZONES: any[] = [];
export const MOCK_AREAS: any[] = [];
export const MOCK_CHAPTERS: any[] = [];
export const MOCK_USERS: any[] = [];
export const MOCK_CHAPTER_REPORTS: any[] = [];
export const MOCK_EVENT_REPORTS: any[] = [];

export const saveData = (key: string, data: any) => {};