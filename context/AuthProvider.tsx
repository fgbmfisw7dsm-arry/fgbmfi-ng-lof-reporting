
import React, { ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';
import { apiService } from '../services/apiService';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (id: string): Promise<'FOUND' | 'MISSING' | 'ERROR'> => {
      console.log("AuthProvider: Fetching profile for ID:", id);
      
      try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) {
              if (error.code === 'PGRST116') {
                  console.warn("AuthProvider: Profile missing for ID:", id);
                  return 'MISSING';
              }
              console.error("AuthProvider: Profile fetch error:", error);
              return 'ERROR';
          }

          if (data) {
              if (data.role === Role.FORMER_OFFICER || (data.email && data.email.toLowerCase().endsWith('@archived.lof'))) {
                  console.warn("AuthProvider: Access denied for archived user");
                  await supabase.auth.signOut().catch(() => {});
                  return 'ERROR';
              }

              console.log("AuthProvider: Profile data found");
              setCurrentUser({
                  id: data.id,
                  name: data.name,
                  username: data.username,
                  email: data.email,
                  phone: data.phone || '',
                  password: '', 
                  role: data.role as Role,
                  unitId: String(data.unit_id || '').trim().toUpperCase()
              });
              return 'FOUND';
          }
          return 'MISSING';
      } catch (err) {
          console.error("AuthProvider: fetchProfile exception:", err);
          return 'ERROR';
      }
  }, []);

  const logout = useCallback(async () => {
    // Optimistic Update: Clear local state first to switch UI instantly
    setCurrentUser(null);
    
    try {
        // Non-blocking sign out call
        supabase.auth.signOut().catch(e => console.error("Async signOut error:", e));
    } catch (e) {
        console.error("Immediate signOut error:", e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let profileSubscription: any = null;

    const setupProfileSubscription = (userId: string) => {
        if (profileSubscription) profileSubscription.unsubscribe();
        console.log("AuthProvider: Setting up real-time sync for user:", userId);
        profileSubscription = supabase
            .channel(`public:profiles:id=eq.${userId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'profiles',
                filter: `id=eq.${userId}` 
            }, (payload) => {
                if (!isMounted) return;
                console.log("AuthProvider: Profile update detected via real-time channel:", payload.new);
                const data = payload.new;
                
                if (data.role === Role.FORMER_OFFICER || (data.email && data.email.toLowerCase().endsWith('@archived.lof'))) {
                    logout();
                    return;
                }

                setCurrentUser({
                    id: data.id,
                    name: data.name,
                    username: data.username,
                    email: data.email,
                    phone: data.phone || '',
                    password: '', 
                    role: data.role as Role,
                    unitId: String(data.unit_id || '').trim().toUpperCase()
                });
            })
            .subscribe();
    };

    const handleAuthStateChange = async (event: string, session: any) => {
        console.log(`AuthProvider: Auth Event [${event}]`);
        
        if (session?.user) {
            const status = await fetchProfile(session.user.id);
            if (status === 'MISSING') {
                await supabase.auth.signOut();
            } else if (status === 'FOUND') {
                setupProfileSubscription(session.user.id);
            }
        } else {
            setCurrentUser(null);
        }
        
        if (isMounted) setLoading(false);
    };

    // Safety timeout for initial sync
    const safetyTimer = setTimeout(() => {
        if (isMounted) {
            setLoading(prev => {
                if (prev) console.warn("AuthProvider: Initial sync timed out, forcing UI ready.");
                return false;
            });
        }
    }, 8000);

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (isMounted) handleAuthStateChange('INITIAL_SESSION', session);
    }).catch(err => {
        console.error("AuthProvider: Session check error:", err);
        if (isMounted) setLoading(false);
    });

    // Listen for future changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            handleAuthStateChange(event, session);
        }
    });

    return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
        authListener.subscription.unsubscribe();
        if (profileSubscription) profileSubscription.unsubscribe();
    };
  }, [fetchProfile, logout]);

  // Periodic status check to catch archived users in active sessions
  useEffect(() => {
    if (!currentUser) return;
    
    const heartbeat = setInterval(() => {
        console.log("AuthProvider: Running session heartbeat check...");
        fetchProfile(currentUser.id);
    }, 1000 * 60 * 5); // Check every 5 minutes

    return () => clearInterval(heartbeat);
  }, [currentUser, fetchProfile]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    console.log("AuthProvider: Starting login process for", identifier);
    
    try {
        let loginEmail = identifier;
        
        if (!identifier.includes('@')) {
            console.log("AuthProvider: Resolving email for username:", identifier);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', identifier)
                .single();
            
            if (profileError) {
                console.error("AuthProvider: Username resolution error:", profileError);
                if (profileError.code === 'PGRST116') {
                    throw new Error("Username not found. Please check your credentials.");
                }
                throw profileError;
            }
            if (profile) {
                loginEmail = profile.email;
                console.log("AuthProvider: Username resolved to", loginEmail);
            }
        }

        console.log("AuthProvider: Executing signInWithPassword for", loginEmail);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password,
        });

        if (authError) {
            console.error("AuthProvider: signInWithPassword error:", authError);
            throw authError;
        }

        if (authData.user) {
            console.log("AuthProvider: Auth successful, fetching profile for UID:", authData.user.id);
            const status = await fetchProfile(authData.user.id);
            if (status === 'MISSING') {
                throw new Error("Profile not found. Please contact your Administrator to activate your account.");
            } else if (status === 'ERROR') {
                throw new Error("Authentication succeeded, but profile sync failed. Please check your internet connection and try again.");
            }
        }
        return true;
    } catch (e: any) {
        console.error("AuthProvider: Login process exception:", e.message);
        throw e;
    }
  };

  const updateUser = async (updatedUser: User) => {
    const normalizedUnitId = String(updatedUser.unitId || '').trim().toUpperCase();
    const { error } = await supabase.from('profiles').update({
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        unit_id: normalizedUnitId
    }).eq('id', updatedUser.id);
    if (!error) setCurrentUser({ ...updatedUser, unitId: normalizedUnitId });
  };

  const authContextValue = useMemo(() => ({
    user: currentUser,
    login,
    logout,
    updateUser,
  }), [currentUser, logout]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fgbmfi-blue"></div>
        <div className="text-fgbmfi-blue font-semibold tracking-tight">Syncing Cloud Identity...</div>
        <button 
            onClick={() => window.location.reload()}
            className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-fgbmfi-blue transition-colors"
        >
            Taking too long? Click to refresh
        </button>
    </div>
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
