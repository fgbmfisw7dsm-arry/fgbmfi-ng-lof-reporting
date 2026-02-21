
import React, { useState, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPage from '../dashboard/DashboardPage';
import FormsPage from '../forms/FormsPage';
import ReportsPage from '../reports/ReportsPage';
import AdminPage from '../admin/AdminPage';
import UserManualPage from '../support/UserManualPage';
import ChangePasswordModal from '../user/ChangePasswordModal';
import { AuthContext } from '../../context/AuthContext';
import { Role } from '../../types';
import Icon from '../ui/Icon';

type Page = 'Dashboard' | 'My Forms' | 'My Reports' | 'Admin' | 'User Manual';

const Layout: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  if (user?.role === Role.FORMER_OFFICER) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Icon name="close" className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Access Revoked</h2>
          <p className="text-gray-500 mt-4 text-sm leading-relaxed">
            Your officer profile has been archived by the National/District Admin. 
            You no longer have access to the reporting portal.
          </p>
          <button 
            onClick={logout}
            className="mt-8 w-full py-4 bg-fgbmfi-blue text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-800 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'My Forms':
        return <FormsPage />;
      case 'My Reports':
        return <ReportsPage />;
      case 'Admin':
        return <AdminPage />;
      case 'User Manual':
        return <UserManualPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          setSidebarOpen={setSidebarOpen} 
          onChangePassword={() => setChangePasswordModalOpen(true)} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default Layout;
