
import React from 'react';
import { ChapterMonthlyReport } from '../../types';

interface ReportTableProps {
  data: Partial<ChapterMonthlyReport & { name?: string; isTotal?: boolean }>[];
  isAggregated?: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, isAggregated = false }) => {
  const headers = isAggregated 
    ? ['Name', 'Membership', 'Attendance', 'First Timers', 'Salvations', 'H.G. Baptism', 'Membership Intentions', 'Offering (₦)']
    : ['Month', 'Year', 'Membership', 'Attendance', 'First Timers', 'Salvations', 'H.G. Baptism', 'Membership Intentions', 'Offering (₦)'];

  if (data.length === 0) {
    return <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">No report data available.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="px-6 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((report) => (
            <tr 
              key={report.id || Math.random()} 
              className={`border-b ${report.isTotal ? 'bg-fgbmfi-blue text-white font-bold border-t-2 border-fgbmfi-gold' : 'bg-white hover:bg-gray-50'}`}
            >
              {isAggregated ? (
                <td className={`px-6 py-4 ${report.isTotal ? 'font-extrabold uppercase' : 'font-bold text-gray-900'}`}>
                    {report.name || 'Summary'}
                </td>
              ) : (
                <>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{report.month}</td>
                    <td className="px-6 py-4">{report.year}</td>
                </>
              )}
              <td className="px-6 py-4">{report.membershipCount?.toLocaleString()}</td>
              <td className="px-6 py-4">{report.attendance?.toLocaleString()}</td>
              <td className="px-6 py-4">{report.firstTimers?.toLocaleString()}</td>
              <td className="px-6 py-4">{report.salvations?.toLocaleString()}</td>
              <td className="px-6 py-4">{report.holyGhostBaptism?.toLocaleString()}</td>
              <td className="px-6 py-4">{report.membershipIntention?.toLocaleString()}</td>
              <td className="px-6 py-4">{report.offering?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;
