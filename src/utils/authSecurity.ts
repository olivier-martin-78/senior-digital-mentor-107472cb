/**
 * Utilitaires de sécurité pour l'authentification
 */

import { supabase } from '@/integrations/supabase/client';

// Configuration sécurisée pour l'inscription
export const secureSignUp = async (email: string, password: string, displayName?: string) => {
  // Validation côté client
  if (!email || !password) {
    throw new Error('Email et mot de passe requis');
  }

  if (password.length < 8) {
    throw new Error('Le mot de passe doit contenir au moins 8 caractères');
  }

  // Vérification de la force du mot de passe
  const passwordStrength = checkPasswordStrength(password);
  if (passwordStrength.score < 3) {
    throw new Error(`Mot de passe trop faible: ${passwordStrength.feedback.join(', ')}`);
  }

  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        display_name: displayName || ''
      }
    }
  });

  return { data, error };
};

// Vérification de la force du mot de passe
export const checkPasswordStrength = (password: string) => {
  const feedback: string[] = [];
  let score = 0;

  // Longueur
  if (password.length >= 8) score++;
  else feedback.push('au moins 8 caractères');

  // Majuscules
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('une majuscule');

  // Minuscules
  if (/[a-z]/.test(password)) score++;
  else feedback.push('une minuscule');

  // Chiffres
  if (/\d/.test(password)) score++;
  else feedback.push('un chiffre');

  // Caractères spéciaux
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('un caractère spécial');

  return {
    score,
    feedback,
    strength: score <= 2 ? 'Faible' : score <= 3 ? 'Moyen' : score <= 4 ? 'Fort' : 'Très fort'
  };
};

// Nettoyage sécurisé de session lors de changement de rôle
export const cleanupSessionOnRoleChange = async () => {
  try {
    // Nettoyer le localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Nettoyer le sessionStorage
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });

    // Déconnexion globale
    await supabase.auth.signOut({ scope: 'global' });
    
    // Forcer le rechargement de la page
    window.location.href = '/auth';
  } catch (error) {
    console.error('Erreur lors du nettoyage de session:', error);
  }
};

// Validation de l'URL de redirection
export const validateRedirectUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const allowedDomains = [
      'localhost',
      'lovableproject.com',
      window.location.hostname
    ];
    
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};