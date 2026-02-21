import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Role } from '../../types';
import ChapterReportForm from './ChapterReportForm';
import EventReportForm from './EventReportForm';
import { apiService } from '../../services/apiService';

const FormsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [unitName, setUnitName] = useState('');

  useEffect(() => {
    const fetchUnitName = async () => {
      if (user?.unitId) {
        try {
          if (user.unitId === 'national') {
            setUnitName('National HQ');
            return;
          }
          
          // Fetch all possible units to find the name
          const [regs, dists, zones, areas, chaps] = await Promise.all([
            apiService.getRegions(),
            apiService.getDistricts(),
            apiService.getZones(),
            apiService.getAreas(),
            apiService.getChapters()
          ]);
          
          const allUnits = [...regs, ...dists, ...zones, ...areas, ...chaps];
          const unit = allUnits.find(u => u.id === user.unitId);
          if (unit) {
            setUnitName(unit.name);
          } else {
            setUnitName(user.unitId);
          }
        } catch (err) {
          setUnitName(user.unitId);
        }
      }
    };
    fetchUnitName();
  }, [user?.unitId]);

  if (!user) return null;

  const isChapterPresident = user.role === Role.CHAPTER_PRESIDENT;
  const formTitle = isChapterPresident ? 'Chapter President Monthly Input Form' : `${user.role} Event Data Form`;
  const formDescription = isChapterPresident 
    ? "As a Chapter President, please fill out your chapter's monthly performance report below."
    : `As a ${user.role}, please use this form to submit data for your periodic events.`;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{formTitle}</h1>
          <p className="text-gray-500 mt-1 font-medium">{formDescription}</p>
        </div>
        {unitName && (
          <div className="bg-fgbmfi-blue text-white px-6 py-3 rounded-2xl shadow-lg flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Assigned Unit</span>
            <span className="text-sm font-black uppercase tracking-tight">{unitName}</span>
          </div>
        )}
      </div>
      <div className="max-w-4xl mx-auto">
        {isChapterPresident ? (
          <ChapterReportForm />
        ) : (
          <EventReportForm />
        )}
      </div>
    </div>
  );
};

export default FormsPage;