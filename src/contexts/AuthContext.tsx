
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { AuthService } from '@/services/AuthService';
import { AuthContextType } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authUtils';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { rateLimiter, secureStorage } from '@/utils/securityUtils';
import { detectAuthDesync, forceAuthReconnection, redirectToAuth } from '@/utils/authRecovery';

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
  const [isRecovering, setIsRecovering] = useState(false);

  // Fonction pour obtenir l'état d'impersonnation (optimisée)
  const getImpersonationState = () => {
    try {
      const impersonationState = secureStorage.getItem('impersonation_state');
      if (impersonationState) {
        return JSON.parse(impersonationState);
      }
    } catch (error) {
      console.error('❌ AuthContext.getImpersonationState - Erreur:', error);
      secureStorage.removeItem('impersonation_state');
    }
    return null;
  };

  // Fonction hasRole avec logique d'impersonnation optimisée
  const hasRole = (role: AppRole) => {
    const impersonationState = getImpersonationState();
    
    if (impersonationState?.isImpersonating && impersonationState.impersonatedRoles) {
      return impersonationState.impersonatedRoles.includes(role);
    }

    return originalHasRole(role);
  };

  // Fonction pour obtenir l'utilisateur effectif (optimisée)
  const getEffectiveUser = () => {
    const impersonationState = getImpersonationState();
    
    if (impersonationState?.isImpersonating && impersonationState.impersonatedUser) {
      return impersonationState.impersonatedUser;
    }

    return profile;
  };

  // Fonction pour obtenir l'ID utilisateur effectif (optimisée)
  const getEffectiveUserId = () => {
    const impersonationState = getImpersonationState();
    
    if (impersonationState?.isImpersonating && impersonationState.impersonatedUser) {
      return impersonationState.impersonatedUser.id;
    }

    return user?.id;
  };

  // Détection et récupération automatique des problèmes d'authentification
  useEffect(() => {
    const checkAndRecoverAuth = async () => {
      // Ne vérifier que si on a une session et qu'on ne récupère pas déjà
      if (!session || isRecovering || isLoading) return;
      
      console.log('🔧 Auth Recovery - Vérification de la synchronisation...');
      
      const isDesynced = await detectAuthDesync();
      
      if (isDesynced) {
        setIsRecovering(true);
        
        toast({
          title: "Problème d'authentification détecté",
          description: "Tentative de reconnexion automatique...",
          variant: "default"
        });
        
        const recoverySuccess = await forceAuthReconnection();
        
        if (recoverySuccess) {
          toast({
            title: "Reconnexion réussie",
            description: "Votre session a été restaurée.",
            variant: "default"
          });
          
          // Recharger la page pour s'assurer que tout fonctionne
          window.location.reload();
        } else {
          toast({
            title: "Reconnexion nécessaire",
            description: "Veuillez vous reconnecter manuellement.",
            variant: "destructive"
          });
          
          // Rediriger vers la page d'auth après un délai
          setTimeout(redirectToAuth, 2000);
        }
        
        setIsRecovering(false);
      }
    };
    
    // Vérifier au chargement et périodiquement
    checkAndRecoverAuth();
    
    // Vérifier toutes les 30 secondes si l'utilisateur est connecté
    const interval = setInterval(() => {
      if (session && !isRecovering) {
        checkAndRecoverAuth();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [session, isRecovering, isLoading, toast]);

  // Vérification initiale de session et configuration du listener d'événements d'authentification
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthContext - Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔍 AuthContext - Auth state changed:', {
        event: _event,
        hasSession: !!session,
        userId: session?.user?.id
      });
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
    isLoading: isLoading || isRecovering,
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
