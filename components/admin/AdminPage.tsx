
import React, { useState, useContext, useEffect } from 'react';
import { Role, User, Region, District, Zone, Area, Chapter, EventType } from '../../types';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import UserManagementSection from './sections/UserManagementSection';
import OrgSetupSection from './sections/OrgSetupSection';
import MaintenanceSection from './sections/MaintenanceSection';
import AdminManualPage from '../support/AdminManualPage';

const AdminPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'users' | 'org' | 'maintenance' | 'manual'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [orgData, setOrgData] = useState({
      regions: [] as Region[],
      districts: [] as District[],
      zones: [] as Zone[],
      areas: [] as Area[],
      chapters: [] as Chapter[],
      eventTypes: [] as EventType[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  useEffect(() => {
      const loadData = async () => {
          setIsLoading(true);
          try {
              const [regs, dists, zones, areas, chaps, dbUsers, evTypes] = await Promise.all([
                  apiService.getRegions(),
                  apiService.getDistricts(),
                  apiService.getZones(),
                  apiService.getAreas(),
                  apiService.getChapters(),
                  apiService.getUsers(),
                  apiService.getEventTypes()
              ]);
              setOrgData({
                  regions: regs,
                  districts: dists,
                  zones: zones,
                  areas: areas,
                  chapters: chaps,
                  eventTypes: evTypes
              });
              setUsers(dbUsers);
          } catch (error: any) {
              console.error("Failed to load admin data", error);
              alert("Admin Registry Sync Failed: " + error.message);
          } finally {
              setIsLoading(false);
          }
      };
      loadData();
  }, [tick]);

  if (!user || ![Role.NATIONAL_ADMIN, Role.REGIONAL_ADMIN, Role.DISTRICT_ADMIN].includes(user.role)) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied.</div>;
  }

  const tabClass = (tab: string) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-fgbmfi-blue text-fgbmfi-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="max-w-full overflow-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>
      
      {/* Tab Navigation with Horizontal Scroll */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto pb-1">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 whitespace-nowrap min-w-max px-1">
            <button onClick={() => setActiveTab('users')} className={tabClass('users')}>User Management</button>
            <button onClick={() => setActiveTab('org')} className={tabClass('org')}>Organizational Setup</button>
            <button onClick={() => setActiveTab('maintenance')} className={tabClass('maintenance')}>Maintenance</button>
            <button onClick={() => setActiveTab('manual')} className={tabClass('manual')}>Admin Manual</button>
        </nav>
      </div>

      {/* Content Area with Horizontal Scroll for wide tables/grids */}
      <div className="mt-4 overflow-x-auto pb-4">
        <div className="min-w-full">
            {isLoading ? (
                <div className="text-center p-10 text-gray-500 flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fgbmfi-blue"></div>
                    <span>Syncing Cloud Registry...</span>
                </div>
            ) : (
                <>
                    {activeTab === 'users' && <UserManagementSection orgData={orgData} users={users} setUsers={setUsers} />}
                    {activeTab === 'org' && <OrgSetupSection orgData={orgData} setOrgData={setOrgData} users={users} setUsers={setUsers} forceRefresh={forceUpdate} />}
                    {activeTab === 'maintenance' && <MaintenanceSection forceUpdate={forceUpdate} />}
                    {activeTab === 'manual' && <AdminManualPage />}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
