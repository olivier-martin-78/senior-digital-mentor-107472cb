
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authUtils';

/**
 * Détecte si l'authentification est désynchronisée
 * (client a une session mais auth.uid() retourne null)
 */
export const detectAuthDesync = async (): Promise<boolean> => {
  try {
    // Vérifier la session côté client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false; // Pas de session côté client, pas de désync
    }
    
    // Vérifier auth.uid() côté base
    const { data: authTest, error } = await supabase.auth.getUser();
    
    if (error || !authTest?.user) {
      console.log('🔧 Auth Recovery - Désynchronisation détectée:', {
        clientSession: !!session,
        dbAuth: !!authTest?.user,
        error: error?.message
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('🔧 Auth Recovery - Erreur lors de la détection:', error);
    return true; // En cas d'erreur, considérer comme désynchronisé
  }
};

/**
 * Force une reconnexion complète pour résoudre la désynchronisation
 */
export const forceAuthReconnection = async (): Promise<boolean> => {
  try {
    console.log('🔧 Auth Recovery - Début de la reconnexion forcée...');
    
    // 1. Nettoyer complètement l'état d'authentification
    cleanupAuthState();
    
    // 2. Forcer une déconnexion globale
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('🔧 Auth Recovery - Déconnexion globale effectuée');
    } catch (signOutError) {
      console.warn('🔧 Auth Recovery - Erreur lors de la déconnexion:', signOutError);
    }
    
    // 3. Attendre un peu pour que la déconnexion soit prise en compte
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Forcer une actualisation de session
    const { data: newSession, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('🔧 Auth Recovery - Échec du refresh de session:', refreshError);
      return false;
    }
    
    // 5. Vérifier que la reconnexion a fonctionné
    const isStillDesynced = await detectAuthDesync();
    
    if (!isStillDesynced) {
      console.log('🔧 Auth Recovery - Reconnexion réussie!');
      return true;
    } else {
      console.error('🔧 Auth Recovery - La reconnexion n\'a pas résolu le problème');
      return false;
    }
    
  } catch (error) {
    console.error('🔧 Auth Recovery - Erreur lors de la reconnexion forcée:', error);
    return false;
  }
};

/**
 * Redirige vers la page d'authentification en cas d'échec de récupération
 */
export const redirectToAuth = () => {
  console.log('🔧 Auth Recovery - Redirection vers /auth pour reconnexion manuelle');
  window.location.href = '/auth?recovery=true&timestamp=' + Date.now();
};
