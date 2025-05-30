import { supabase } from '@/integrations/supabase/client';
import { DIARY_MEDIA_BUCKET, BLOG_MEDIA_BUCKET, ALBUM_THUMBNAILS_BUCKET } from './thumbnailtUtils';

// Re-export the bucket constants so they can be imported from either file
export { DIARY_MEDIA_BUCKET, BLOG_MEDIA_BUCKET, ALBUM_THUMBNAILS_BUCKET };

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
    console.log('URL déjà complète:', path);
    return path;
  }
  
  try {
    // DEBUG: Log du bucket utilisé
    console.log('🔗 getPublicUrl - Utilisation du bucket:', bucket, 'pour le chemin:', path);
    
    // Utiliser directement le bucket fourni en paramètre
    const actualBucket = bucket;
    
    // Gestion des cas où le chemin contient le nom d'utilisateur
    const cleanPath = path;
    
    // Construire l'URL à partir du chemin dans le bucket
    const { data } = supabase.storage.from(actualBucket).getPublicUrl(cleanPath);
    
    // Vérifier si l'URL a été générée correctement
    if (data && data.publicUrl) {
      console.log('🔗 URL publique générée:', data.publicUrl, 'depuis le bucket:', actualBucket);
      return data.publicUrl;
    }
    
    throw new Error("Impossible de générer l'URL publique");
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL publique:', error, 'pour le chemin:', path);
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
    const buckets = [DIARY_MEDIA_BUCKET, BLOG_MEDIA_BUCKET, 'object', 'public'];
    const bucketIndex = pathParts.findIndex(part => buckets.includes(part));
    
    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
      // Retourner le chemin relatif après le nom du bucket
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    
    // Si on ne trouve pas le pattern standard, essayer de récupérer la partie après la dernière occurrence de /
    const lastSlashIndex = url.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      return url.substring(lastSlashIndex + 1);
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

/**
 * Détecter le bucket approprié pour un fichier média en fonction de son chemin ou URL
 * @param path Chemin ou URL du fichier
 * @returns Nom du bucket approprié
 */
export const detectMediaBucket = (path: string | null): string => {
  if (!path) return DIARY_MEDIA_BUCKET;
  
  if (path.includes('/')) {
    return DIARY_MEDIA_BUCKET;
  }
  
  // Pour les chemins simples sans extension ou avec extension courte
  const isLikelyBlogMedia = /^[^.]+$/.test(path) || /\.[a-zA-Z0-9]{1,4}$/.test(path);
  if (isLikelyBlogMedia) {
    return BLOG_MEDIA_BUCKET;
  }
  
  return DIARY_MEDIA_BUCKET;
};
