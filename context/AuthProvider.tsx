
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
  const [pendingProfileUser, setPendingProfileUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (id: string): Promise<boolean> => {
      console.log("AuthProvider: Fetching profile for ID:", id);
      
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Profile fetch timed out")), 8000);
      });

      try {
          const fetchPromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          
          // Race the fetch against the timeout
          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
          if (error) {
              console.error("AuthProvider: Profile fetch error:", error);
              return false;
          }

          if (data) {
              // BLOCK ARCHIVED USERS
              if (data.role === Role.FORMER_OFFICER || (data.email && data.email.toLowerCase().endsWith('@archived.lof'))) {
                  console.warn("AuthProvider: Access denied for archived/former officer:", data.email);
                  // Force sign out from Supabase Auth to clear session
                  await supabase.auth.signOut();
                  return false;
              }

              console.log("AuthProvider: Profile data found for", data.email);
              setCurrentUser({
                  id: data.id,
                  name: data.name,
                  username: data.username,
                  email: data.email,
                  phone: data.phone || '',
                  password: '', 
                  role: data.role as Role,
                  unitId: data.unit_id
              });
              setPendingProfileUser(null);
              return true;
          }
          console.warn("AuthProvider: No profile data returned for ID:", id);
          return false;
      } catch (err) {
          console.error("AuthProvider: fetchProfile exception:", err);
          return false;
      }
  }, []);

  const logout = useCallback(async () => {
    // Optimistic Update: Clear local state first to switch UI instantly
    setCurrentUser(null);
    setPendingProfileUser(null);
    
    try {
        // Non-blocking sign out call
        supabase.auth.signOut().catch(e => console.error("Async signOut error:", e));
    } catch (e) {
        console.error("Immediate signOut error:", e);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
        console.log("AuthProvider: Initializing session...");
        // Safety timeout: If cloud sync takes more than 5 seconds, proceed to login screen anyway
        const timeout = setTimeout(() => {
            console.warn("AuthProvider: Cloud sync timed out after 5s. Proceeding to login.");
            setLoading(false);
        }, 5000);

        try {
            console.log("AuthProvider: Fetching session from Supabase...");
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error("AuthProvider: getSession error:", sessionError);
                throw sessionError;
            }

            if (session?.user) {
                console.log("AuthProvider: Session found for user:", session.user.email);
                const found = await fetchProfile(session.user.id);
                if (!found) {
                    console.log("AuthProvider: Profile not found for user, setting pending state.");
                    setPendingProfileUser({ id: session.user.id, email: session.user.email || '' });
                } else {
                    console.log("AuthProvider: Profile successfully synced.");
                }
            } else {
                console.log("AuthProvider: No active session found.");
            }
        } catch (err) {
            console.error("AuthProvider: Session initialization failed:", err);
        } finally {
            console.log("AuthProvider: Initialization complete, clearing loading state.");
            clearTimeout(timeout);
            setLoading(false);
        }
    };
    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            const found = await fetchProfile(session.user.id);
            if (!found) {
                setPendingProfileUser({ id: session.user.id, email: session.user.email || '' });
            }
        } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setPendingProfileUser(null);
        }
    });

    // REAL-TIME PROFILE SYNC (For Promotions/Role Changes)
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
                console.log("AuthProvider: Profile update detected via real-time channel:", payload.new);
                const data = payload.new;
                
                // Check for deactivation/archival
                if (data.role === Role.FORMER_OFFICER || (data.email && data.email.toLowerCase().endsWith('@archived.lof'))) {
                    console.warn("AuthProvider: Access revoked in real-time.");
                    logout();
                    return;
                }

                // Update local state with new role/unit (Promotion handling)
                setCurrentUser({
                    id: data.id,
                    name: data.name,
                    username: data.username,
                    email: data.email,
                    phone: data.phone || '',
                    password: '', 
                    role: data.role as Role,
                    unitId: data.unit_id
                });
            })
            .subscribe();
    };

    if (currentUser?.id) {
        setupProfileSubscription(currentUser.id);
    }

    return () => {
        authListener.subscription.unsubscribe();
        if (profileSubscription) profileSubscription.unsubscribe();
    };
  }, [fetchProfile, currentUser?.id, logout]);

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
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Cloud authentication timed out. Please check your connection.")), 12000);
    });

    try {
        let loginEmail = identifier;
        if (!identifier.includes('@')) {
            console.log("AuthProvider: Resolving email for username:", identifier);
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', identifier)
                .single();
            if (profile) loginEmail = profile.email;
        }

        console.log("AuthProvider: Signing in with email:", loginEmail);
        const signInPromise = supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password,
        });

        const { data: authData, error: authError } = await Promise.race([signInPromise, timeoutPromise]) as any;

        if (authError) {
            console.error("AuthProvider: signInWithPassword error:", authError);
            throw authError;
        }

        if (authData.user) {
            console.log("AuthProvider: Auth successful, fetching profile...");
            const profileFound = await fetchProfile(authData.user.id);
            if (!profileFound) {
                console.log("AuthProvider: Profile not found, setting pending onboarding.");
                setPendingProfileUser({ id: authData.user.id, email: authData.user.email || '' });
            }
        }
        return true;
    } catch (e: any) {
        console.error("AuthProvider: Login process exception:", e.message);
        throw e;
    }
  };

  const completeProfile = async (details: Partial<User>) => {
    if (!pendingProfileUser) return;
    
    const newUser: User = {
        id: pendingProfileUser.id,
        email: pendingProfileUser.email,
        name: details.name || 'FGBMFI Officer',
        username: (details.username || pendingProfileUser.email.split('@')[0]).toLowerCase(),
        phone: details.phone || '',
        password: '',
        role: details.role || Role.CHAPTER_PRESIDENT,
        unitId: (details.unitId || '').trim().toUpperCase()
    };

    console.log("AuthProvider: Finalizing profile creation for user:", newUser.email);
    const status = await apiService.upsertUser(newUser);
    
    if (status === 'SUCCESS' || status === 'RLS_DELEGATED') {
        setCurrentUser(newUser);
        setPendingProfileUser(null);
    } else {
        throw new Error("Unable to sync profile with database. Contact your Admin.");
    }
  };

  const updateUser = async (updatedUser: User) => {
    const { error } = await supabase.from('profiles').update({
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        unit_id: updatedUser.unitId
    }).eq('id', updatedUser.id);
    if (!error) setCurrentUser(updatedUser);
  };

  const authContextValue = useMemo(() => ({
    user: currentUser,
    pendingProfileUser,
    login,
    logout,
    updateUser,
    completeProfile,
    clearPending: () => setPendingProfileUser(null)
  }), [currentUser, pendingProfileUser, logout]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fgbmfi-blue"></div>
        <div className="text-fgbmfi-blue font-semibold tracking-tight">Syncing Cloud Identity...</div>
    </div>
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
