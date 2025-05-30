
import React, { createContext, useContext, useEffect } from 'react';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Profile, AppRole } from '@/types/supabase';

interface ImpersonationContextType {
  isImpersonating: boolean;
  originalUser: Profile | null;
  impersonatedUser: Profile | null;
  impersonatedRoles: AppRole[];
  startImpersonation: (targetUser: Profile) => Promise<boolean>;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    impersonationState, 
    startImpersonation, 
    stopImpersonation, 
    initializeImpersonation 
  } = useImpersonation();

  useEffect(() => {
    initializeImpersonation();
  }, []);

  const value = {
    isImpersonating: impersonationState.isImpersonating,
    originalUser: impersonationState.originalUser,
    impersonatedUser: impersonationState.impersonatedUser,
    impersonatedRoles: impersonationState.impersonatedRoles,
    startImpersonation,
    stopImpersonation
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonationContext = () => {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonationContext must be used within an ImpersonationProvider');
  }
  return context;
};
