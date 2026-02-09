
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { ChapterMonthlyReport } from '../../types';

const ChapterReportForm: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [unitLabel, setUnitLabel] = useState('Loading Chapter Registry...');
  const [formData, setFormData] = useState({
    month: 'January',
    year: new Date().getFullYear(),
    membershipCount: 0,
    attendance: 0,
    firstTimers: 0,
    salvations: 0,
    holyGhostBaptism: 0,
    membershipIntention: 0,
    offering: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUnitDetails = async () => {
        if (user?.unitId) {
            try {
                const chapters = await apiService.getChapters();
                const currentUnit = chapters.find(c => c.id === user.unitId);
                if (currentUnit) {
                    setUnitLabel(`${currentUnit.name} (${currentUnit.id})`);
                } else {
                    setUnitLabel(user.unitId);
                }
            } catch (err) {
                setUnitLabel(user.unitId);
            }
        }
    };
    fetchUnitDetails();
  }, [user?.unitId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value) : (name === 'month' ? value : parseInt(value) || 0) }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const reportData: Omit<ChapterMonthlyReport, 'id'> = {
        ...formData,
        chapterId: user.unitId,
      };
      await apiService.submitChapterReport(reportData);
      setMessage('Monthly report synced with cloud registry!');
      setFormData(prev => ({ ...prev, membershipCount: 0, attendance: 0, firstTimers: 0, salvations: 0, holyGhostBaptism: 0, membershipIntention: 0, offering: 0 }));
    } catch (error) {
      setMessage('Cloud sync failed. Verify your network and try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputClass = "mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fgbmfi-blue focus:border-transparent sm:text-sm transition-all";

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <div className="mb-8 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-black text-fgbmfi-blue">Monthly Data Entry</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Submission for {formData.month} {formData.year}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label htmlFor="chapterName" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Assigned Unit</label>
            <input type="text" id="chapterName" value={unitLabel} disabled className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold sm:text-sm cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="month" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Reporting Month</label>
             <select id="month" name="month" value={formData.month} onChange={handleChange} className={inputClass}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="year" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Year</label>
            <input id="year" type="number" name="year" value={formData.year} onChange={handleChange} onFocus={handleFocus} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
           <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Membership Count</label><input type="number" name="membershipCount" value={formData.membershipCount} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
           <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Meeting Attendance</label><input type="number" name="attendance" value={formData.attendance} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
           <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Total First Timers</label><input type="number" name="firstTimers" value={formData.firstTimers} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
           <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Souls Saved (Salvations)</label><input type="number" name="salvations" value={formData.salvations} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
           <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Holy Ghost Baptism</label><input type="number" name="holyGhostBaptism" value={formData.holyGhostBaptism} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
           <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Membership Intentions</label><input type="number" name="membershipIntention" value={formData.membershipIntention} onChange={handleChange} onFocus={handleFocus} className={inputClass} /></div>
           <div className="lg:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Offering Total (₦)</label><input type="number" name="offering" value={formData.offering} onChange={handleChange} onFocus={handleFocus} className={`${inputClass} font-bold text-green-600`} /></div>
        </div>

        <div className="flex justify-end pt-8 border-t border-gray-100">
          <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-4 px-10 border border-transparent shadow-xl text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-fgbmfi-blue hover:bg-blue-800 focus:outline-none transition-all hover:scale-105 disabled:bg-gray-300">
            {isSubmitting ? 'Processing...' : 'Submit Monthly Report'}
          </button>
        </div>
        {message && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-bold text-center border ${message.includes('synced') ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                {message}
            </div>
        )}
      </form>
    </div>
  );
};

export default ChapterReportForm;
