
import React from 'react';
import { EventReport, User, Role } from '../../types';
import Icon from '../ui/Icon';

interface EventReportListProps {
  reports: EventReport[];
  onEdit: (report: EventReport) => void;
  user: User;
}

const EventReportList: React.FC<EventReportListProps> = ({ reports, onEdit, user }) => {
  if (reports.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 text-center">
        <Icon name="archive-box" className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No individual event records found.</p>
      </div>
    );
  }

  // Sort reports by date descending
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.dateOfEvent).getTime() - new Date(a.dateOfEvent).getTime()
  );

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Event Type</th>
              <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Att.</th>
              <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">F.T.</th>
              <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Salv.</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedReports.map((report) => {
              // Only allow editing if the user is the owner (same unitId) 
              // or if they are an admin (National/Regional/District Admin)
              const canEdit = report.unitId.toUpperCase() === user.unitId.toUpperCase() || 
                              user.role.includes('ADMIN') || 
                              user.unitId.toUpperCase() === 'NATIONAL';

              return (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-700 border-b border-gray-50">
                    {new Date(report.dateOfEvent).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-fgbmfi-blue border-b border-gray-50">
                    {report.eventType}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-600 border-b border-gray-50 text-center">
                    {report.attendance}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-600 border-b border-gray-50 text-center">
                    {report.firstTimers}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-600 border-b border-gray-50 text-center">
                    {report.salvations}
                  </td>
                  <td className="px-6 py-4 text-right border-b border-gray-50">
                    {canEdit && (
                      <button 
                        onClick={() => onEdit(report)}
                        className="p-2 text-fgbmfi-blue hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Report"
                      >
                        <Icon name="edit" className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventReportList;
