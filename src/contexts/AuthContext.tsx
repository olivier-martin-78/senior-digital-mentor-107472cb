
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { AuthService } from '@/services/AuthService';
import { AuthContextType } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authUtils';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonationContext } from '@/contexts/ImpersonationContext';

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

  // Fonction hasRole modifiée pour prendre en compte l'impersonnation
  const hasRole = (role: string) => {
    // Vérifier si nous sommes dans le contexte d'impersonnation
    try {
      const impersonationState = localStorage.getItem('impersonation_state');
      if (impersonationState) {
        const parsedState = JSON.parse(impersonationState);
        if (parsedState.isImpersonating && parsedState.impersonatedRoles) {
          return parsedState.impersonatedRoles.includes(role);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des rôles d\'impersonnation:', error);
    }

    // Sinon, utiliser la logique normale
    return originalHasRole(role);
  };

  // Fonction pour obtenir l'utilisateur effectif (impersonné ou réel)
  const getEffectiveUser = () => {
    try {
      const impersonationState = localStorage.getItem('impersonation_state');
      if (impersonationState) {
        const parsedState = JSON.parse(impersonationState);
        if (parsedState.isImpersonating && parsedState.impersonatedUser) {
          return parsedState.impersonatedUser;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur effectif:', error);
    }

    return profile;
  };

  // Fonction pour obtenir l'ID utilisateur effectif
  const getEffectiveUserId = () => {
    const effectiveUser = getEffectiveUser();
    return effectiveUser?.id || user?.id;
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
    try {
      setAuthError(null);
      setIsLoading(true);
      
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
      localStorage.removeItem('impersonation_state');
      
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
