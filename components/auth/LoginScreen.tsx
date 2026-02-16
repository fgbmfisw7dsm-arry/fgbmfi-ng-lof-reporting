import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Icon from '../ui/Icon';
import { LOGO_BASE64, ROLES } from '../../constants';
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
  const { login, pendingProfileUser, completeProfile, logout } = useContext(AuthContext);

  // Onboarding Form State
  const [onboardingData, setOnboardingData] = useState({ name: '', phone: '', role: Role.CHAPTER_PRESIDENT, unitId: '' });
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
    if (isLoading) {
      timeoutRef.current = window.setTimeout(() => {
        setShowReset(true);
      }, 10000); // 10 seconds timeout
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setShowReset(false);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isLoading]);

  useEffect(() => {
    if (pendingProfileUser) {
        setIsLoading(true);
        Promise.all([
            apiService.getRegions(),
            apiService.getDistricts(),
            apiService.getZones(),
            apiService.getAreas(),
            apiService.getChapters()
        ]).then(([r, d, z, a, c]) => {
            setOrgData({ regions: r, districts: d, zones: z, areas: a, chapters: c });
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load onboarding registry:", err);
            setIsLoading(false);
        });
    }
  }, [pendingProfileUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        await login(identifier, password);
    } catch (err: any) {
        setError(err.message || 'Login failed. Check your credentials.');
        setIsLoading(false);
    }
  };

  const handleResetConnection = () => {
    handleClearLocalStorage();
    window.location.reload();
  };

  const handleClearLocalStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
  };

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const finalPhone = onboardingData.phone.startsWith('+234') 
        ? onboardingData.phone 
        : `+234${onboardingData.phone.replace(/^0/, '')}`;

    try {
        await completeProfile({ ...onboardingData, phone: finalPhone });
    } catch (err: any) {
        setError("Onboarding failed: " + (err.message || "Database connection error."));
    } finally {
        setIsLoading(false);
    }
  };

  const getAvailableUnits = () => {
    let units: any[] = [];
    switch (onboardingData.role) {
        case Role.CHAPTER_PRESIDENT: units = orgData.chapters; break;
        case Role.FIELD_REPRESENTATIVE: units = orgData.areas; break;
        case Role.NATIONAL_DIRECTOR: units = orgData.zones; break;
        case Role.DISTRICT_COORDINATOR:
        case Role.DISTRICT_ADMIN: units = orgData.districts; break;
        case Role.REGIONAL_VICE_PRESIDENT:
        case Role.REGIONAL_ADMIN: units = orgData.regions; break;
        default: return [{ id: 'national', name: 'National Headquarters' }];
    }
    return [...units].sort((a, b) => collator.compare(a.name, b.name));
  };

  if (pendingProfileUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-fgbmfi-blue p-4">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 z-[60] flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fgbmfi-blue mb-4"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-fgbmfi-blue">Syncing Registry...</p>
                        {showReset && (
                          <button onClick={handleResetConnection} className="mt-4 px-6 py-2 border border-gray-300 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Reset Connection</button>
                        )}
                    </div>
                )}
                
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-fgbmfi-blue text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <Icon name="user" className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Profile Activation</h2>
                    <p className="text-gray-500 text-sm mt-2">Finish setting up your portal access.</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-[10px] font-black uppercase tracking-tight border border-red-100 flex items-center">
                         <Icon name="close" className="w-4 h-4 mr-2" /> {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleFinishOnboarding}>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Full Official Name</label>
                        <input type="text" value={onboardingData.name} onChange={e => setOnboardingData({...onboardingData, name: e.target.value})} required className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-fgbmfi-blue outline-none transition-all text-sm font-bold" placeholder="Title Firstname Lastname" disabled={isLoading} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Your Office</label>
                            <select value={onboardingData.role} onChange={e => setOnboardingData({...onboardingData, role: e.target.value as Role, unitId: ''})} className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-fgbmfi-blue outline-none bg-white text-sm font-bold" disabled={isLoading}>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Phone Number</label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-400 font-bold text-sm">+234</span>
                                <input 
                                    type="text" 
                                    value={onboardingData.phone} 
                                    onChange={e => setOnboardingData({...onboardingData, phone: e.target.value.replace(/[^0-9]/g, '')})} 
                                    className="w-full pl-14 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-fgbmfi-blue outline-none text-sm font-bold tracking-wider" 
                                    placeholder="803 000 0000" 
                                    disabled={isLoading} 
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Assigned Organizational Unit</label>
                        <select 
                            value={onboardingData.unitId} 
                            onChange={e => setOnboardingData({...onboardingData, unitId: e.target.value})} 
                            required 
                            className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-fgbmfi-blue outline-none bg-white text-sm font-bold" 
                            disabled={isLoading}
                        >
                            <option value="">-- Select Your Unit --</option>
                            {getAvailableUnits().map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                            ))}
                        </select>
                        <p className="text-[9px] text-gray-400 mt-2 px-1 italic">Selecting your specific unit ensures your reports are correctly aggregated.</p>
                    </div>

                    <div className="pt-6">
                        <button type="submit" disabled={isLoading} className={`w-full py-4 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all cursor-pointer ${isLoading ? 'bg-green-600 opacity-50 cursor-not-allowed' : 'bg-fgbmfi-blue hover:bg-blue-800 active:scale-95'}`}>
                            {isLoading ? 'Syncing Profile...' : 'Activate Portal Access'}
                        </button>
                    </div>
                </form>

                <div className="relative z-[9999] text-center pt-2">
                    <button 
                        type="button" 
                        onMouseDown={(e) => { e.preventDefault(); logout(); }}
                        onClick={(e) => { e.preventDefault(); logout(); }} 
                        className="w-full py-3 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600 cursor-pointer transition-colors active:scale-95 pointer-events-auto"
                        style={{ pointerEvents: 'auto' }}
                    >
                        Cancel and Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
  }

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
              {isLoading ? 'Connecting to Cloud...' : 'Sign In'}
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