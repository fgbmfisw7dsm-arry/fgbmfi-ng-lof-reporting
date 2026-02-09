
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPage from '../dashboard/DashboardPage';
import FormsPage from '../forms/FormsPage';
import ReportsPage from '../reports/ReportsPage';
import AdminPage from '../admin/AdminPage';
import UserManualPage from '../support/UserManualPage';
import ChangePasswordModal from '../user/ChangePasswordModal';

type Page = 'Dashboard' | 'My Forms' | 'My Reports' | 'Admin' | 'User Manual';

const Layout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

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
