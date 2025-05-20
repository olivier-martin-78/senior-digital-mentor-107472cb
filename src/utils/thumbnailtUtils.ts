import { supabase } from "@/integrations/supabase/client";

// Nom du bucket pour les vignettes d'album
export const ALBUM_THUMBNAILS_BUCKET = 'album-thumbnails';
// Nom du bucket pour les médias du journal
export const DIARY_MEDIA_BUCKET = 'diary_media';
// Nom du bucket pour les médias du blog
export const BLOG_MEDIA_BUCKET = 'blog-media';

/**
 * Télécharger une vignette pour un album ou un post
 * @param file Fichier d'image
 * @param idPrefix ID de l'élément (album, post, etc.)
 * @returns URL de la vignette téléchargée
 */
export const uploadAlbumThumbnail = async (file: File, idPrefix: string): Promise<string> => {
  try {
    // Vérifier que le fichier est une image
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }
    
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${idPrefix}-${Date.now()}.${fileExt}`;
    
    // Télécharger le fichier dans le bucket
    const { error: uploadError } = await supabase.storage
      .from(ALBUM_THUMBNAILS_BUCKET)
      .upload(fileName, file);
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Obtenir l'URL publique du fichier
    const { data } = supabase.storage
      .from(ALBUM_THUMBNAILS_BUCKET)
      .getPublicUrl(fileName);
      
    if (!data.publicUrl) {
      throw new Error("Impossible de générer l'URL publique");
    }
    
    console.log("URL publique générée:", data.publicUrl);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Erreur lors du téléchargement de la vignette:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw new Error(error.message || 'Erreur lors du téléchargement de la vignette');
  }
};

/**
 * Normaliser une URL de média pour s'assurer qu'elle est valide sur tous les appareils
 * @param url URL ou chemin du fichier média
 * @param bucket Bucket contenant le média
 * @returns URL normalisée
 */
export const normalizeMediaUrl = (url: string | null, bucket: string = ALBUM_THUMBNAILS_BUCKET): string | null => {
  if (!url) return null;
  
  // Si c'est une URL complète, la retourner
  if (url.startsWith('http')) return url;
  
  // Si c'est une URL de type blob, retourner null
  if (url.startsWith('blob:')) return null;
  
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(url);
      
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (error) {
    console.error('Erreur lors de la normalisation de l’URL média:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      bucket,
    });
  }
  
  return url;
};

/**
 * Obtenir l'URL de prévisualisation d'une vignette de manière synchrone
 * @param url URL ou chemin du fichier média
 * @param bucket Bucket contenant le média (par défaut: album-thumbnails)
 * @param useSignedUrl Si vrai, génère une URL signée (nécessite appel asynchrone)
 * @returns URL de prévisualisation ou image par défaut
 */
export const getThumbnailUrlSync = (
  url: string | null,
  bucket: string = ALBUM_THUMBNAILS_BUCKET,
  useSignedUrl: boolean = false
): string => {
  if (!url) {
    console.log("URL vide ou null, utilisation de l'image par défaut");
    return '/placeholder.svg';
  }
  
  // Si c'est une URL de type blob, retourner l'image par défaut
  if (url.startsWith('blob:')) {
    console.log("URL blob détectée, utilisation de l'image par défaut:", url);
    return '/placeholder.svg';
  }
  
  try {
    // Si l'URL est déjà complète, la retourner
    if (url.startsWith('http')) {
      console.log("URL déjà complète:", url);
      return url;
    }
    
    // Utiliser le bucket spécifié
    const actualBucket = bucket;
    console.log(`Génération d'URL pour bucket: ${actualBucket}, chemin: ${url}`);
    
    // Générer une URL publique
    const { data } = supabase.storage
      .from(actualBucket)
      .getPublicUrl(url);
      
    if (data?.publicUrl) {
      console.log('URL publique générée pour', actualBucket, ':', data.publicUrl);
      return data.publicUrl;
    }
    
    console.warn(`Impossible de générer l'URL publique pour ${url} dans ${actualBucket}`);
    return '/placeholder.svg';
  } catch (error) {
    console.error('Erreur lors de la génération de l’URL publique:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      bucket,
    });
    return '/placeholder.svg';
  }
};

/**
 * Obtenir l'URL de prévisualisation d'une vignette de manière asynchrone
 * @param url URL ou chemin du fichier média
 * @param bucket Bucket contenant le média (par défaut: album-thumbnails)
 * @returns Promise avec l'URL de prévisualisation ou image par défaut
 */
export const getThumbnailUrl = async (
  url: string | null,
  bucket: string = ALBUM_THUMBNAILS_BUCKET
): Promise<string> => {
  if (!url) {
    console.log("URL vide ou null, utilisation de l'image par défaut");
    return '/placeholder.svg';
  }
  
  // Si c'est une URL de type blob, retourner l'image par défaut
  if (url.startsWith('blob:')) {
    console.log("URL blob détectée, utilisation de l'image par défaut:", url);
    return '/placeholder.svg';
  }
  
  try {
    // Si l'URL est déjà complète, la retourner
    if (url.startsWith('http')) {
      console.log("URL déjà complète:", url);
      return url;
    }
    
    // Utiliser le bucket spécifié
    const actualBucket = bucket;
    console.log(`Génération d'URL pour bucket: ${actualBucket}, chemin: ${url}`);
    
    // Tenter de créer une URL signée pour les buckets potentiellement privés
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(actualBucket)
      .createSignedUrl(url, 3600); // URL valable 1 heure
        
    if (signedUrlData && !signedUrlError) {
      console.log("URL signée générée avec succès:", signedUrlData.signedUrl);
      return signedUrlData.signedUrl;
    } else {
      console.warn("Impossible de créer une URL signée:", signedUrlError?.message);
    }
    
    // Sinon, générer une URL publique
    const { data } = supabase.storage
      .from(actualBucket)
      .getPublicUrl(url);
      
    if (data?.publicUrl) {
      console.log('URL publique générée pour', actualBucket, ':', data.publicUrl);
      return data.publicUrl;
    }
    
    throw new Error("Impossible de générer l'URL publique ou signée");
  } catch (error) {
    console.error('Erreur lors de la génération de l’URL:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      bucket,
    });
    return '/placeholder.svg';
  }
};
