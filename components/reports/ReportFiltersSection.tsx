
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Region, District, Zone, Area, Chapter } from '../../types';

interface FilterProps {
  filters: any;
  handleFilterChange: (level: string, value: string | null) => void;
  handleDateChange: (key: 'startDate' | 'endDate', value: string) => void;
}

export const ReportFiltersSection: React.FC<FilterProps> = ({ filters, handleFilterChange, handleDateChange }) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    apiService.getRegions().then(setRegions).catch(err => console.error("Filter Region Load Failed:", err));
  }, []);

  useEffect(() => {
    if (filters.regionId) apiService.getDistricts(filters.regionId).then(setDistricts).catch(e => console.error(e));
    else setDistricts([]);
  }, [filters.regionId]);

  useEffect(() => {
    if (filters.districtId) apiService.getZones(filters.districtId).then(setZones).catch(e => console.error(e));
    else setZones([]);
  }, [filters.districtId]);

  useEffect(() => {
    if (filters.zoneId) apiService.getAreas(filters.zoneId).then(setAreas).catch(e => console.error(e));
    else setAreas([]);
  }, [filters.zoneId]);

  useEffect(() => {
    if (filters.areaId) apiService.getChapters(filters.areaId).then(setChapters).catch(e => console.error(e));
    else setChapters([]);
  }, [filters.areaId]);

  const selectClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-fgbmfi-blue focus:border-fgbmfi-blue sm:text-sm rounded-md border";

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
            <select value={filters.regionId || ''} onChange={e => handleFilterChange('regionId', e.target.value || null)} className={selectClass}>
                <option value="">All Regions</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">District</label>
            <select value={filters.districtId || ''} onChange={e => handleFilterChange('districtId', e.target.value || null)} className={selectClass}>
                <option value="">All Districts</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">Zone</label>
            <select value={filters.zoneId || ''} onChange={e => handleFilterChange('zoneId', e.target.value || null)} className={selectClass}>
                <option value="">All Zones</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">Area</label>
            <select value={filters.areaId || ''} onChange={e => handleFilterChange('areaId', e.target.value || null)} className={selectClass}>
                <option value="">All Areas</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-medium text-gray-500">Chapter</label>
            <select value={filters.chapterId || ''} onChange={e => handleFilterChange('chapterId', e.target.value || null)} className={selectClass}>
                <option value="">All Chapters</option>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
      </div>
    </div>
  );
};
