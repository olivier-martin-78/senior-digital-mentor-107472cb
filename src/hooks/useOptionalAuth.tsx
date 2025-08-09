
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Profile, AppRole } from '@/types/supabase';

// Hook qui fonctionne même sans AuthProvider
export const useOptionalAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    console.log('🔥 [AUTH_DEBUG] useOptionalAuth hook démarré');
    
    const initAuth = async () => {
      try {
        console.log('🔥 [AUTH_DEBUG] Tentative import client Supabase');
        // Import dynamique pour éviter les erreurs sur les routes publiques
        const { supabase } = await import('@/integrations/supabase/client');
        console.log('🔥 [AUTH_DEBUG] Client Supabase importé avec succès');
        
        // Vérifier s'il y a une session existante
        console.log('🔥 [AUTH_DEBUG] Vérification session existante');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('🔥 [AUTH_DEBUG] Session récupérée:', !!currentSession);
        
        if (currentSession?.user) {
          console.log('🔥 [AUTH_DEBUG] Utilisateur trouvé, mise à jour states');
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Récupérer le profil si connecté
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            if (profileData) {
              setProfile(profileData);
            }
            
            // Récupérer les rôles
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', currentSession.user.id);
            
            if (rolesData) {
              setRoles(rolesData.map(r => r.role));
            }
          } catch (error) {
            console.log('🔥 [AUTH_DEBUG] Erreur lors de la récupération du profil:', error);
          }
        }
        
        // Écouter les changements d'auth
        console.log('🔥 [AUTH_DEBUG] Configuration listener auth state change');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('🔥 [AUTH_DEBUG] Auth state change:', event, !!session);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (!session?.user) {
              setProfile(null);
              setRoles([]);
            }
          }
        );
        
        console.log('🔥 [AUTH_DEBUG] Fin initialisation auth, loading = false');
        setIsLoading(false);
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.log('🔥 [AUTH_DEBUG] Auth non disponible sur cette route - erreur:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const signOut = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return {
    user,
    profile,
    roles,
    session,
    isLoading,
    hasRole,
    signOut
  };
};
