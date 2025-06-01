
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { AuthService } from '@/services/AuthService';
import { AuthContextType } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authUtils';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { rateLimiter, secureStorage } from '@/utils/securityUtils';

// Re-export the cleanup function for use in other components
export { cleanupAuthState } from '@/utils/authUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    session, 
    user, 
    profile, 
    roles, 
    isLoading,
    setIsLoading, 
    hasRole: originalHasRole, 
    authError,
    setAuthError 
  } = useAuthState();
  
  const { toast } = useToast();

  // SIMPLIFICATION: Fonction pour obtenir l'état d'impersonnation
  const getImpersonationState = () => {
    try {
      const impersonationState = secureStorage.getItem('impersonation_state');
      if (impersonationState) {
        const parsedState = JSON.parse(impersonationState);
        console.log('🎭 AuthContext.getImpersonationState - État récupéré:', {
          isImpersonating: parsedState.isImpersonating,
          impersonatedUser: parsedState.impersonatedUser?.email,
          impersonatedRoles: parsedState.impersonatedRoles
        });
        return parsedState;
      }
    } catch (error) {
      console.error('❌ AuthContext.getImpersonationState - Erreur:', error);
      secureStorage.removeItem('impersonation_state');
    }
    return null;
  };

  // SIMPLIFICATION: Fonction hasRole modifiée pour prendre en compte l'impersonnation
  const hasRole = (role: AppRole) => {
    const impersonationState = getImpersonationState();
    
    if (impersonationState?.isImpersonating && impersonationState.impersonatedRoles) {
      console.log('🎭 AuthContext.hasRole - Mode impersonnation:', {
        requestedRole: role,
        impersonatedRoles: impersonationState.impersonatedRoles,
        hasRequestedRole: impersonationState.impersonatedRoles.includes(role),
        impersonatedUser: impersonationState.impersonatedUser?.email
      });
      return impersonationState.impersonatedRoles.includes(role);
    }

    // Mode normal
    const normalResult = originalHasRole(role);
    console.log('👤 AuthContext.hasRole - Mode normal:', {
      requestedRole: role,
      userRoles: roles,
      hasRequestedRole: normalResult,
      userEmail: user?.email
    });
    return normalResult;
  };

  // SIMPLIFICATION: Fonction pour obtenir l'utilisateur effectif
  const getEffectiveUser = () => {
    const impersonationState = getImpersonationState();
    
    if (impersonationState?.isImpersonating && impersonationState.impersonatedUser) {
      console.log('🎭 AuthContext.getEffectiveUser - Utilisateur impersonné:', {
        originalUser: user?.email,
        impersonatedUser: impersonationState.impersonatedUser?.email
      });
      return impersonationState.impersonatedUser;
    }

    console.log('👤 AuthContext.getEffectiveUser - Utilisateur normal:', user?.email);
    return profile;
  };

  // SIMPLIFICATION: Fonction pour obtenir l'ID utilisateur effectif
  const getEffectiveUserId = () => {
    const impersonationState = getImpersonationState();
    
    if (impersonationState?.isImpersonating && impersonationState.impersonatedUser) {
      const effectiveUserId = impersonationState.impersonatedUser.id;
      console.log('🎭 AuthContext.getEffectiveUserId - ID utilisateur impersonné:', {
        effectiveUserId,
        impersonatedUserEmail: impersonationState.impersonatedUser.email,
        originalUserId: user?.id,
        originalUserEmail: user?.email
      });
      return effectiveUserId;
    }

    const effectiveUserId = user?.id;
    console.log('👤 AuthContext.getEffectiveUserId - ID utilisateur normal:', {
      effectiveUserId,
      userEmail: user?.email
    });
    return effectiveUserId;
  };

  // Vérification initiale de session et configuration du listener d'événements d'authentification
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext - Initial session:', session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext - Auth state changed:', session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Vérifier le rate limiting
    if (!rateLimiter.isAllowed(`signin_${email}`)) {
      const error = new Error('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
      setAuthError(error);
      toast({
        title: "Trop de tentatives",
        description: "Veuillez attendre avant de réessayer.",
        variant: "destructive"
      });
      throw error;
    }

    try {
      setAuthError(null);
      setIsLoading(true);
      
      // Nettoyer l'état d'impersonnation lors de la connexion
      secureStorage.removeItem('impersonation_state');
      
      await AuthService.signIn(email, password);
      
      toast({ 
        title: "Connexion réussie", 
        description: "Vous êtes maintenant connecté."
      });
    } catch (error: any) {
      setAuthError(error);
      toast({ 
        title: "Erreur de connexion", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    // Vérifier le rate limiting
    if (!rateLimiter.isAllowed(`signup_${email}`)) {
      const error = new Error('Trop de tentatives d\'inscription. Veuillez réessayer plus tard.');
      setAuthError(error);
      toast({
        title: "Trop de tentatives",
        description: "Veuillez attendre avant de réessayer.",
        variant: "destructive"
      });
      throw error;
    }

    try {
      setAuthError(null);
      setIsLoading(true);
      
      await AuthService.signUp(email, password, displayName);
      
      toast({ 
        title: "Inscription réussie", 
        description: "Veuillez vérifier votre email pour confirmer votre compte."
      });
    } catch (error: any) {
      setAuthError(error);
      toast({ 
        title: "Erreur d'inscription", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      setIsLoading(true);
      
      // Nettoyer l'état d'impersonnation lors de la déconnexion
      secureStorage.removeItem('impersonation_state');
      
      await AuthService.signOut();
      
      toast({ 
        title: "Déconnexion réussie", 
        description: "Vous êtes maintenant déconnecté."
      });
      
      // Force page reload for a clean state
      window.location.href = '/auth';
    } catch (error: any) {
      setAuthError(error);
      toast({ 
        title: "Erreur", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    profile: getEffectiveUser(),
    roles,
    isLoading,
    hasRole,
    signIn,
    signUp,
    signOut,
    getEffectiveUserId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
