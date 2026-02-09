
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Icon from '../ui/Icon';
import { Role } from '../../types';

type Page = 'Dashboard' | 'My Forms' | 'My Reports' | 'Admin' | 'User Manual';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: Page;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 transform rounded-md ${
      isActive
        ? 'bg-fgbmfi-blue text-white'
        : 'text-gray-600 hover:bg-gray-200'
    }`}
  >
    <Icon name={icon} className="h-5 w-5" />
    <span className="mx-4">{label}</span>
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setSidebarOpen }) => {
  const { user } = useContext(AuthContext);

  const isAdmin = user && [Role.NATIONAL_ADMIN, Role.REGIONAL_ADMIN, Role.DISTRICT_ADMIN].includes(user.role);
  
  const hasForms = user && [
      Role.CHAPTER_PRESIDENT, 
      Role.FIELD_REPRESENTATIVE, 
      Role.NATIONAL_DIRECTOR, 
      Role.DISTRICT_COORDINATOR, 
      Role.REGIONAL_VICE_PRESIDENT, 
      Role.NATIONAL_PRESIDENT
    ].includes(user.role);
    
  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false); // Close sidebar on navigation in mobile
  };

  return (
    <>
      {/* Overlay for mobile */}
       <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-20 border-b px-4">
          <div className='text-center'>
            <h1 className="text-xl font-bold text-fgbmfi-blue">LOF Reporting</h1>
          </div>
          <button className="md:hidden p-2" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 bg-white">
            <NavLink icon="dashboard" label="Dashboard" isActive={currentPage === 'Dashboard'} onClick={() => handleNavClick('Dashboard')} />
            {hasForms && <NavLink icon="form" label="My Forms" isActive={currentPage === 'My Forms'} onClick={() => handleNavClick('My Forms')} />}
            <NavLink icon="report" label="My Reports" isActive={currentPage === 'My Reports'} onClick={() => handleNavClick('My Reports')} />
            {isAdmin && <NavLink icon="admin" label="Admin" isActive={currentPage === 'Admin'} onClick={() => handleNavClick('Admin')} />}
             <div className="border-t my-2 border-gray-200"></div>
            <NavLink icon="book-open" label="User Manual" isActive={currentPage === 'User Manual'} onClick={() => handleNavClick('User Manual')} />
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
