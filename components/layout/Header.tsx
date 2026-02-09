
import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Icon from '../ui/Icon';

interface HeaderProps {
    setSidebarOpen: (isOpen: boolean) => void;
    onChangePassword: () => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen, onChangePassword }) => {
  const { user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b">
       <div className="flex items-center">
         <button 
            className="text-gray-500 focus:outline-none md:hidden" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
        >
            <Icon name="menu" className="w-6 h-6" />
         </button>
       </div>
       <div className="flex items-center relative" ref={dropdownRef}>
         <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fgbmfi-blue">
            <div className="flex flex-col items-end mr-3 text-right">
                <span className="font-semibold text-gray-800 text-sm">{user?.name}</span>
                <span className="text-xs text-gray-500">{user?.role}</span>
            </div>
            <Icon name="user" className="w-8 h-8 rounded-full p-1 bg-gray-200 text-gray-600"/>
            <Icon name="arrow-down" className={`w-4 h-4 ml-1 text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
         </button>

         {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[9999] ring-1 ring-black ring-opacity-5">
                <button
                    onClick={() => { onChangePassword(); setDropdownOpen(false); }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    <Icon name="admin" className="w-4 h-4 mr-2" />
                    Change Password
                </button>
                <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold"
                >
                    <Icon name="logout" className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </div>
         )}
      </div>
    </header>
  );
};

export default Header;
