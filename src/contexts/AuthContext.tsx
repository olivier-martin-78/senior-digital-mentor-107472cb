
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Profile, AppRole } from '@/types/supabase';
import { useAuthState } from '@/hooks/useAuthState';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  checkEmailConfirmation: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, profile, roles, isLoading, hasRole } = useAuthState();
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);

  const signOut = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const checkEmailConfirmation = async (): Promise<boolean> => {
    if (!user) return false;
    
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) return false;
    
    const isConfirmed = !!data.user.email_confirmed_at;
    setEmailConfirmed(isConfirmed);
    return isConfirmed;
  };

  // Vérifier la confirmation d'email au chargement
  useEffect(() => {
    if (user) {
      checkEmailConfirmation();
    }
  }, [user]);

  const value = {
    session,
    user,
    profile,
    roles,
    isLoading,
    hasRole,
    signOut,
    checkEmailConfirmation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
