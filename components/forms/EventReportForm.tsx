
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { EventReport, EventType } from '../../types';

const EventReportForm: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  const [formData, setFormData] = useState({
    dateOfEvent: '',
    eventType: '',
    attendance: 0,
    firstTimers: 0,
    salvations: 0,
    holyGhostBaptism: 0,
    offering: 0,
    membershipIntention: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTypes = async () => {
      const types = await apiService.getEventTypes();
      setEventTypes(types);
      if (types.length > 0) {
        setFormData(prev => ({ ...prev, eventType: types[0].name }));
      }
    };
    fetchTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name.match(/attendance|firstTimers|salvations|holyGhostBaptism|offering|membershipIntention/) ? parseInt(value) || 0 : value }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.eventType) {
      setMessage("Please select an event type category.");
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const reportData: Omit<EventReport, 'id'> = {
        ...formData,
        reportingOfficerId: user.id,
        unitId: user.unitId,
        officerRole: user.role,
      };
      await apiService.submitEventReport(reportData);
      setMessage('Event outcome submitted and synced with cloud!');
      setFormData(prev => ({ ...prev, attendance: 0, firstTimers: 0, salvations: 0, holyGhostBaptism: 0, offering: 0, membershipIntention: 0 }));
    } catch (error) {
      setMessage('Submission failed. Please check your network connection.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fgbmfi-blue focus:border-transparent sm:text-sm transition-all font-bold";

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <div className="mb-8 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-black text-fgbmfi-blue">Event Outcome Entry</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Data Submission for {user?.role}</p>
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
        </div>

        <div className="flex justify-end pt-8 border-t border-gray-100">
          <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-4 px-10 border border-transparent shadow-xl text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-fgbmfi-blue hover:bg-blue-800 focus:outline-none transition-all hover:scale-105 disabled:bg-gray-300">
            {isSubmitting ? 'Syncing...' : 'Submit Event Report'}
          </button>
        </div>
        {message && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-bold text-center border ${message.includes('successfully') || message.includes('synced') ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                {message}
            </div>
        )}
      </form>
    </div>
  );
};

export default EventReportForm;
