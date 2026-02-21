import React, { useState, useEffect, useContext } from 'react';
import { apiService } from '../../services/apiService';
import { Region, District, Zone, Area, Chapter, Role } from '../../types';
import { AuthContext } from '../../context/AuthContext';

interface FilterProps {
  filters: any;
  handleFilterChange: (level: string, value: string | null) => void;
  handleDateChange: (key: 'startDate' | 'endDate', value: string) => void;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const ReportFiltersSection: React.FC<FilterProps> = ({ filters, handleFilterChange, handleDateChange }) => {
  const { user } = useContext(AuthContext);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Strict boolean casting for Vercel/TS compiler compatibility
  const isNational = user?.unitId ? user.unitId.trim().toUpperCase() === 'NATIONAL' : false;
  
  const lockRegion = user ? [Role.REGIONAL_VICE_PRESIDENT, Role.REGIONAL_ADMIN, Role.DISTRICT_COORDINATOR, Role.DISTRICT_ADMIN, Role.NATIONAL_DIRECTOR, Role.FIELD_REPRESENTATIVE, Role.CHAPTER_PRESIDENT].includes(user.role) : false;
  const lockDistrict = user ? [Role.DISTRICT_COORDINATOR, Role.DISTRICT_ADMIN, Role.NATIONAL_DIRECTOR, Role.FIELD_REPRESENTATIVE, Role.CHAPTER_PRESIDENT].includes(user.role) : false;
  const lockZone = user ? [Role.NATIONAL_DIRECTOR, Role.FIELD_REPRESENTATIVE, Role.CHAPTER_PRESIDENT].includes(user.role) : false;
  const lockArea = user ? [Role.FIELD_REPRESENTATIVE, Role.CHAPTER_PRESIDENT].includes(user.role) : false;
  const lockChapter = user ? [Role.CHAPTER_PRESIDENT].includes(user.role) : false;

  useEffect(() => {
    apiService.getRegions().then(data => setRegions([...data].sort((a,b) => collator.compare(a.name, b.name))));
  }, []);

  useEffect(() => {
    if (filters.regionId) apiService.getDistricts(filters.regionId).then(data => setDistricts([...data].sort((a,b) => collator.compare(a.name, b.name))));
    else setDistricts([]);
  }, [filters.regionId]);

  useEffect(() => {
    if (filters.districtId) apiService.getZones(filters.districtId).then(data => setZones([...data].sort((a,b) => collator.compare(a.name, b.name))));
    else setZones([]);
  }, [filters.districtId]);

  useEffect(() => {
    if (filters.zoneId) apiService.getAreas(filters.zoneId).then(data => setAreas([...data].sort((a,b) => collator.compare(a.name, b.name))));
    else setAreas([]);
  }, [filters.zoneId]);

  useEffect(() => {
    if (filters.areaId) apiService.getChapters(filters.areaId).then(data => setChapters([...data].sort((a,b) => collator.compare(a.name, b.name))));
    else setChapters([]);
  }, [filters.areaId]);

  const selectClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-fgbmfi-blue focus:border-fgbmfi-blue sm:text-sm rounded-md border disabled:bg-gray-100 disabled:text-gray-400";

  return (
    <div className="space-y-4 print:hidden">
      <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={filters.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} className={selectClass} />
            <input type="date" value={filters.endDate} onChange={(e) => handleDateChange('endDate', e.target.value)} className={selectClass} />
          </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
            <label className="text-xs font-medium text-gray-500">Region</label>
            <select value={filters.regionId || ''} onChange={e => handleFilterChange('regionId', e.target.value || null)} className={selectClass} disabled={lockRegion && !isNational}>
                <option value="">All Regions</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">District</label>
            <select value={filters.districtId || ''} onChange={e => handleFilterChange('districtId', e.target.value || null)} className={selectClass} disabled={lockDistrict && !isNational}>
                <option value="">All Districts</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">Zone</label>
            <select value={filters.zoneId || ''} onChange={e => handleFilterChange('zoneId', e.target.value || null)} className={selectClass} disabled={lockZone && !isNational}>
                <option value="">All Zones</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">Area</label>
            <select value={filters.areaId || ''} onChange={e => handleFilterChange('areaId', e.target.value || null)} className={selectClass} disabled={lockArea && !isNational}>
                <option value="">All Areas</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">Chapter</label>
            <select value={filters.chapterId || ''} onChange={e => handleFilterChange('chapterId', e.target.value || null)} className={selectClass} disabled={lockChapter && !isNational}>
                <option value="">All Chapters</option>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
      </div>
    </div>
  );
};