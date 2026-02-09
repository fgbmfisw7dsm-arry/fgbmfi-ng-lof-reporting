
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
      try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) {
              return false;
          }

          if (data) {
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
          return false;
      } catch (err) {
          return false;
      }
  }, []);

  useEffect(() => {
    const initSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const found = await fetchProfile(session.user.id);
                if (!found) {
                    setPendingProfileUser({ id: session.user.id, email: session.user.email || '' });
                }
            }
        } catch (err) {
            console.error("Session initialization failed:", err);
        } finally {
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

    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
        let loginEmail = identifier;
        if (!identifier.includes('@')) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', identifier)
                .single();
            if (profile) loginEmail = profile.email;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password,
        });

        if (authError) throw authError;

        if (authData.user) {
            const profileFound = await fetchProfile(authData.user.id);
            if (!profileFound) {
                setPendingProfileUser({ id: authData.user.id, email: authData.user.email || '' });
            }
        }
        return true;
    } catch (e: any) {
        console.error("Login process exception:", e.message);
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
