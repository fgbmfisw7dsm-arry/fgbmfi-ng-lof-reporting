import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Icon from '../ui/Icon';
import { LOGO_BASE64, ROLES } from '../../constants';
import { supabase } from '../../services/supabaseClient';
import { apiService } from '../../services/apiService';
import { Role } from '../../types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const LoginScreen: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const { login, logout } = useContext(AuthContext);

  const [orgData, setOrgData] = useState<{
    regions: any[],
    districts: any[],
    zones: any[],
    areas: any[],
    chapters: any[]
  }>({
    regions: [],
    districts: [],
    zones: [],
    areas: [],
    chapters: []
  });

  useEffect(() => {
    // Basic initialization
    console.log("LoginScreen: Mount");
  }, []);

  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = window.setTimeout(() => {
        setShowReset(true);
      }, 10000); 
    } else if (!error) {
      // Only hide if there's no error. If there is an error, keep it visible for recovery.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setShowReset(false);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isLoading, error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        console.log("LoginScreen: Attempting login for", identifier);
        await login(identifier, password);
        console.log("LoginScreen: Login call returned successfully.");
    } catch (err: any) {
        console.error("LoginScreen: Login error:", err);
        setError(err.message || 'Login failed. Check your credentials.');
        setShowReset(true); 
    } finally {
        setIsLoading(false);
    }
  };

  const handleResetConnection = async () => {
    try {
        await logout();
    } catch (e) {
        console.warn("Reset: Logout failed, continuing with local clear", e);
    }
    handleClearLocalStorage();
    window.location.reload();
  };

  const handleClearLocalStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-10 space-y-8 bg-white rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
            <img src={LOGO_BASE64} alt="FGBMFI Logo" className="w-24 h-24 mx-auto mb-6 object-contain" />
          <h1 className="text-2xl font-black text-fgbmfi-blue tracking-tighter">FGBMFI Nigeria</h1>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">LOF Reporting System</h2>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-3">
            <div>
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required disabled={isLoading} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fgbmfi-blue outline-none text-sm disabled:bg-gray-50" placeholder="Username or Email" />
            </div>
            <div className="relative">
              <input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fgbmfi-blue outline-none text-sm disabled:bg-gray-50" placeholder="Password" />
               <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-500">
                    <Icon name={isPasswordVisible ? 'eye-slash' : 'eye'} className="h-5 w-5" />
                </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                <p className="text-red-600 text-[10px] text-center font-black uppercase tracking-tight">{error}</p>
            </div>
          )}
          <div className="flex flex-col space-y-3">
            <button type="submit" disabled={isLoading} className={`w-full flex justify-center py-4 px-4 text-sm font-black rounded-2xl text-white shadow-lg transition-all cursor-pointer ${isLoading ? 'bg-green-600' : 'bg-fgbmfi-blue hover:bg-blue-800 active:scale-95'}`}>
              {isLoading ? 'Connecting to Cloud...' : 'Login'}
            </button>
            {showReset && (
              <button type="button" onClick={handleResetConnection} className="w-full py-2 border border-gray-200 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Reset Connection</button>
            )}
          </div>
          <div className="text-center mt-6">
              <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center">
                  <Icon name="admin" className="w-3 h-3 mr-1" /> Authorized Personnel Only
              </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;