
/**
 * Utilitaires de sécurité pour l'application
 */

// Fonction pour nettoyer et valider les entrées utilisateur
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer les scripts
    .replace(/<[^>]*>/g, '') // Supprimer tous les tags HTML
    .replace(/javascript:/gi, '') // Supprimer les liens javascript
    .replace(/on\w+\s*=/gi, '') // Supprimer les événements HTML
    .trim()
    .substring(0, 1000); // Limiter la longueur
};

// Fonction pour valider les URLs
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Fonction pour valider les emails
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Fonction pour nettoyer les données avant stockage
export const sanitizeUserData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Fonction pour générer des tokens sécurisés
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Fonction pour valider les permissions
export const validatePermissions = (userRoles: string[], requiredRole: string): boolean => {
  const roleHierarchy = ['reader', 'editor', 'admin'];
  const userHighestRole = userRoles.reduce((highest, role) => {
    const currentIndex = roleHierarchy.indexOf(role);
    const highestIndex = roleHierarchy.indexOf(highest);
    return currentIndex > highestIndex ? role : highest;
  }, 'reader');
  
  const requiredIndex = roleHierarchy.indexOf(requiredRole);
  const userIndex = roleHierarchy.indexOf(userHighestRole);
  
  return userIndex >= requiredIndex;
};

// Fonction pour limiter le taux de requêtes (rate limiting côté client)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Nettoyer les anciennes tentatives
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    return true;
  }
}

// Fonction de validation renforcée pour les formulaires sensibles
export const validateFormInput = (
  fieldName: string, 
  value: any, 
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedValues?: string[];
  } = {}
): string | null => {
  const { required = false, minLength = 0, maxLength = 1000, pattern, allowedValues } = options;

  // Vérifier si requis
  if (required && (!value || value.toString().trim() === '')) {
    return `${fieldName} est requis`;
  }

  // Si pas de valeur et pas requis, c'est valide
  if (!value && !required) {
    return null;
  }

  const stringValue = value.toString();

  // Vérifier la longueur
  if (stringValue.length < minLength) {
    return `${fieldName} doit contenir au moins ${minLength} caractères`;
  }
  
  if (stringValue.length > maxLength) {
    return `${fieldName} ne doit pas dépasser ${maxLength} caractères`;
  }

  // Vérifier le pattern
  if (pattern && !pattern.test(stringValue)) {
    return `Format de ${fieldName} invalide`;
  }

  // Vérifier les valeurs autorisées
  if (allowedValues && !allowedValues.includes(stringValue)) {
    return `Valeur non autorisée pour ${fieldName}`;
  }

  return null;
};

export const rateLimiter = new RateLimiter();

// Fonction pour sécuriser le stockage local
export const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const sanitizedValue = sanitizeInput(value);
      localStorage.setItem(sanitizedKey, sanitizedValue);
    } catch (error) {
      console.error('Erreur lors du stockage sécurisé:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const sanitizedKey = sanitizeInput(key);
      return localStorage.getItem(sanitizedKey);
    } catch (error) {
      console.error('Erreur lors de la récupération sécurisée:', error);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      localStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Erreur lors de la suppression sécurisée:', error);
    }
  }
};
