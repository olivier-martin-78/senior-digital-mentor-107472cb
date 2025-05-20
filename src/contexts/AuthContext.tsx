
import React, { createContext, useContext, useState } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { AuthService } from '@/services/AuthService';
import { AuthContextType } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authUtils';

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
    hasRole, 
    authError,
    setAuthError 
  } = useAuthState();
  
  const { toast } = useToast();

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
    profile,
    roles,
    isLoading,
    hasRole,
    signIn,
    signUp,
    signOut
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
