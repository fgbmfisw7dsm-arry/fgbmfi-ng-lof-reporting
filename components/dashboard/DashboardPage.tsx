
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { apiService } from '../../services/apiService';
import { DashboardStats, Role } from '../../types';
import StatCard from './StatCard';
import SummaryChart from './SummaryChart';

const DashboardPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { dataVersion } = useContext(DataContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredView, setFilteredView] = useState<{ name: string; stats: DashboardStats } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        try {
          const data = await apiService.getDashboardData(user.role, user.unitId);
          setStats(data);
          setFilteredView(null); // Reset drill-down view on user change or page load
        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user, dataVersion]);

  const displayStats = useMemo(() => filteredView?.stats || stats, [filteredView, stats]);

  const handleSliceClick = async (slice: { name: string; unitId: string; role: Role }) => {
    if (!slice.unitId || !slice.role) return;

    setLoading(true);
    try {
        const data = await apiService.getDashboardData(slice.role, slice.unitId);
        setFilteredView({
            name: slice.name,
            stats: data,
        });
    } catch (error) {
        console.error("Failed to fetch drill-down data", error);
    } finally {
        setLoading(false);
    }
  };

  const resetView = () => setFilteredView(null);

  if (loading) {
    return <div className="text-center p-10">Loading Dashboard...</div>;
  }

  if (!displayStats) {
    return <div className="text-center p-10 text-red-500">Could not load dashboard data.</div>;
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                {filteredView && (
                    <p className="text-sm text-gray-600">Showing data for: <span className="font-semibold">{filteredView.name}</span></p>
                )}
            </div>
            {filteredView && (
                 <button onClick={resetView} className="bg-fgbmfi-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800">Reset View</button>
            )}
        </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Membership" value={displayStats.totalMembershipCount.toLocaleString()} icon="users" />
        <StatCard title="Total Attendance" value={displayStats.totalAttendance.toLocaleString()} icon="users" />
        <StatCard title="Total First Timers" value={displayStats.totalFirstTimers.toLocaleString()} icon="user" />
        <StatCard title="Membership Intentions" value={displayStats.totalMembershipIntentions.toLocaleString()} icon="trending-up" />
        <StatCard title="Total Salvations" value={displayStats.totalSalvations.toLocaleString()} icon="trending-up" />
        <StatCard title="Holy Ghost Baptisms" value={displayStats.totalHolyGhostBaptisms.toLocaleString()} icon="chart-pie" />
        <StatCard title="Total Offerings" value={`₦${displayStats.totalOfferings.toLocaleString()}`} icon="cash" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-2">
        <SummaryChart 
          title="Growth Trends" 
          type="line" 
          data={displayStats.growthTrend}
          dataKey="value"
          />
        {displayStats.breakdown.length > 0 && (
          <SummaryChart 
            title="Contribution Breakdown" 
            type="pie" 
            data={displayStats.breakdown}
            dataKey="value"
            onSliceClick={handleSliceClick}
            />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
