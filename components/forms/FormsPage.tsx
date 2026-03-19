import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Role } from '../../types';
import EventReportForm from './EventReportForm';
import { apiService } from '../../services/apiService';
import Icon from '../ui/Icon';

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
  const isViewOnly = [Role.DISTRICT_BOARD_MEMBER, Role.REGIONAL_EXECUTIVE_COUNCIL, Role.NATIONAL_EXECUTIVE_COUNCIL].includes(user.role);

  if (isViewOnly) {
    return (
      <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-gray-100 text-center max-w-2xl mx-auto mt-10">
        <div className="w-20 h-20 bg-fgbmfi-blue/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="archive-box" className="w-10 h-10 text-fgbmfi-blue" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">View-Only Access</h1>
        <p className="text-gray-500 font-medium leading-relaxed">
          As a <span className="text-fgbmfi-blue font-black">{user.role}</span>, your account is configured for observation and reporting oversight. 
          You do not have permission to submit or edit event data.
        </p>
        <div className="mt-8 pt-8 border-t border-gray-50">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Please visit the Dashboard or Reports portal to view performance data.</p>
        </div>
      </div>
    );
  }

  const formTitle = isChapterPresident ? 'Chapter Event Data Entry Form' : `${user.role} Event Data Form`;
  const formDescription = isChapterPresident 
    ? "As a Chapter President, please fill out your chapter's event performance report below."
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
        <EventReportForm />
      </div>
    </div>
  );
};

export default FormsPage;