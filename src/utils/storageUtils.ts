
import { supabase } from '@/integrations/supabase/client';

// Nom du bucket pour les médias du journal
export const DIARY_MEDIA_BUCKET = 'diary_media';

/**
 * Obtenir l'URL publique d'un fichier
 * @param path Chemin du fichier dans le bucket
 * @param bucket Nom du bucket (par défaut: diary_media)
 * @returns URL publique du fichier
 */
export const getPublicUrl = (path: string, bucket: string = DIARY_MEDIA_BUCKET) => {
  // Vérifier si le chemin est vide ou null
  if (!path) {
    console.error('Chemin de fichier vide ou null');
    return '/placeholder.svg';
  }

  // Vérifier si le chemin est déjà une URL complète
  if (path.startsWith('http')) {
    return path;
  }
  
  try {
    // Construire l'URL à partir du chemin dans le bucket
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    
    // Vérifier si l'URL a été générée correctement
    if (data && data.publicUrl) {
      console.log('URL publique générée:', data.publicUrl);
      return data.publicUrl;
    }
    
    throw new Error("Impossible de générer l'URL publique");
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL publique:', error);
    // Retourner une image placeholder en cas d'erreur
    return '/placeholder.svg';
  }
};

/**
 * Extraire le chemin du fichier à partir d'une URL complète
 * @param url URL complète du fichier
 * @returns Chemin du fichier dans le bucket
 */
export const getPathFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // Si c'est déjà juste un chemin (sans http/https), le retourner tel quel
    if (!url.startsWith('http')) {
      return url;
    }
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Trouver l'index du nom du bucket dans le chemin
    const bucketIndex = pathParts.findIndex(part => part === DIARY_MEDIA_BUCKET);
    
    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
      // Retourner le chemin relatif après le nom du bucket
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin depuis l'URL:", error);
    return null;
  }
};

/**
 * Vérifier si une URL est valide
 * @param url URL à vérifier
 * @returns Booléen indiquant si l'URL est valide
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};
