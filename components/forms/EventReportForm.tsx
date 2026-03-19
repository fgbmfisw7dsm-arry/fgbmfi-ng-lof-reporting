import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { apiService } from '../../services/apiService';
import { EventReport, EventType, Role } from '../../types';

interface EventReportFormProps {
  initialData?: EventReport;
  onComplete?: () => void;
  onCancel?: () => void;
}

const EventReportForm: React.FC<EventReportFormProps> = ({ initialData, onComplete, onCancel }) => {
  const { user } = useContext(AuthContext);
  const { refreshData } = useContext(DataContext);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [unitName, setUnitName] = useState('');

  const [formData, setFormData] = useState({
    dateOfEvent: initialData?.dateOfEvent || '',
    eventType: initialData?.eventType || '',
    attendance: initialData?.attendance || 0,
    firstTimers: initialData?.firstTimers || 0,
    salvations: initialData?.salvations || 0,
    holyGhostBaptism: initialData?.holyGhostBaptism || 0,
    offering: initialData?.offering || 0,
    membershipIntention: initialData?.membershipIntention || 0,
    membershipCount: initialData?.membershipCount || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialData) {
        setFormData({
            dateOfEvent: initialData.dateOfEvent || new Date().toISOString().split('T')[0],
            eventType: initialData.eventType || '',
            attendance: Number(initialData.attendance || 0),
            firstTimers: Number(initialData.firstTimers || 0),
            salvations: Number(initialData.salvations || 0),
            holyGhostBaptism: Number(initialData.holyGhostBaptism || 0),
            offering: Number(initialData.offering || 0),
            membershipIntention: Number(initialData.membershipIntention || 0),
            membershipCount: Number(initialData.membershipCount || 0),
        });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, regs, dists, zones, areas, chaps] = await Promise.all([
          apiService.getEventTypes(),
          apiService.getRegions(),
          apiService.getDistricts(),
          apiService.getZones(),
          apiService.getAreas(),
          apiService.getChapters()
        ]);
        
        setEventTypes(types);
        if (types.length > 0 && !initialData) {
          setFormData(prev => ({ ...prev, eventType: types[0].name }));
        }

        if (user?.unitId) {
          if (user.unitId === 'national') {
            setUnitName('National HQ');
          } else {
            const allUnits = [...regs, ...dists, ...zones, ...areas, ...chaps];
            const unit = allUnits.find(u => u.id === user.unitId);
            if (unit) setUnitName(unit.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch form data", err);
      }
    };
    fetchData();
  }, [user?.unitId, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'dateOfEvent' || name === 'eventType' ? value : Number(value) 
    }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // SECURITY CHECK: Prevent archived users from submitting
    const isViewOnly = [Role.DISTRICT_BOARD_MEMBER, Role.REGIONAL_EXECUTIVE_COUNCIL, Role.NATIONAL_EXECUTIVE_COUNCIL].includes(user.role);
    if (user.role === Role.FORMER_OFFICER || user.email.toLowerCase().endsWith('@archived.lof') || isViewOnly) {
        setMessage(isViewOnly ? "READ-ONLY: Your account does not have permission to submit reports." : "ACCESS REVOKED: Your officer profile has been archived. You can no longer submit reports.");
        if (!isViewOnly) setTimeout(() => window.location.reload(), 3000);
        return;
    }

    if (!formData.eventType) {
      setMessage("Please select an event type category.");
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      if (initialData) {
          const updatedReport: EventReport = {
              ...initialData,
              ...formData
          };
          await apiService.updateEventReport(updatedReport);
          setMessage('SUCCESS: Report updated and synced with cloud!');
          refreshData();
          if (onComplete) setTimeout(onComplete, 2500);
      } else {
          const reportData: Omit<EventReport, 'id'> = {
            ...formData,
            reportingOfficerId: user.id,
            unitId: user.unitId,
            officerRole: user.role,
          };
          
          await apiService.submitEventReport(reportData);
          refreshData();
          
          setMessage('Event outcome submitted and synced with cloud!');
          // Reset numeric fields
          setFormData(prev => ({ 
            ...prev, 
            attendance: 0, 
            firstTimers: 0, 
            salvations: 0, 
            holyGhostBaptism: 0, 
            offering: 0, 
            membershipIntention: 0,
            membershipCount: 0
          }));
          if (onComplete) setTimeout(onComplete, 2500);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Submission failed. Please check your network connection.';
      setMessage(`Sync Failed: ${errorMsg}`);
      console.error("Submission Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fgbmfi-blue focus:border-transparent sm:text-sm transition-all font-bold";

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <div className="mb-8 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-black text-fgbmfi-blue">{initialData ? 'Edit Event Report' : 'Event Outcome Entry'}</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{initialData ? 'Updating existing record' : `Data Submission for ${user?.role}`}</p>
            {unitName && (
              <p className="text-[10px] font-black text-fgbmfi-blue uppercase tracking-widest bg-fgbmfi-blue/5 px-3 py-1 rounded-full mt-2 md:mt-0">
                {unitName}
              </p>
            )}
          </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Reporting Officer</label>
            <input type="text" value={user?.name} disabled className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold sm:text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Officer Role</label>
            <input type="text" value={user?.role} disabled className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold sm:text-sm cursor-not-allowed" />
          </div>
           <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Date of Event</label>
            <input type="date" name="dateOfEvent" value={formData.dateOfEvent} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Event Category</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange} className={inputClass} required>
              {eventTypes.length === 0 ? (
                <option value="">No Categories Available</option>
              ) : (
                eventTypes.map(type => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Total Attendance</label><input type="number" name="attendance" value={formData.attendance} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">First Timers</label><input type="number" name="firstTimers" value={formData.firstTimers} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Souls Saved</label><input type="number" name="salvations" value={formData.salvations} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Holy Ghost Baptism</label><input type="number" name="holyGhostBaptism" value={formData.holyGhostBaptism} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Offering Collected (₦)</label><input type="number" name="offering" value={formData.offering} onChange={handleChange} onFocus={handleFocus} className={`${inputClass} font-bold text-green-600`} /></div>
          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Membership Intentions</label><input type="number" name="membershipIntention" value={formData.membershipIntention} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
          {user?.role === Role.CHAPTER_PRESIDENT && (
            <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Membership Count</label><input type="number" name="membershipCount" value={formData.membershipCount} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
          )}
        </div>

        <div className="flex justify-end pt-8 border-t border-gray-100 gap-4">
          {onCancel && (
            <button type="button" onClick={onCancel} className="inline-flex justify-center py-4 px-10 border border-gray-200 text-xs font-black uppercase tracking-widest rounded-2xl text-gray-400 hover:bg-gray-50 transition-all">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-4 px-10 border border-transparent shadow-xl text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-fgbmfi-blue hover:bg-blue-800 focus:outline-none transition-all hover:scale-105 disabled:bg-gray-300">
            {isSubmitting ? 'Syncing...' : (initialData ? 'Update Report' : 'Submit Event Report')}
          </button>
        </div>
        {message && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-bold text-center border ${message.includes('synced') || message.includes('successfully') ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                {message}
            </div>
        )}
      </form>
    </div>
  );
};

export default EventReportForm;