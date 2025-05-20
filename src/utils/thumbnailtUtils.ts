
import { supabase } from "@/integrations/supabase/client";
import { getPublicUrl } from "./storageUtils";

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
    console.error('Erreur lors du téléchargement de la vignette:', error);
    throw new Error(error.message || 'Erreur lors du téléchargement de la vignette');
  }
};

/**
 * Normaliser une URL de média pour s'assurer qu'elle est valide sur tous les appareils
 * @param url URL ou chemin du fichier média
 * @returns URL normalisée
 */
export const normalizeMediaUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // Si c'est déjà une URL complète, la retourner
  if (url.startsWith('http')) return url;
  
  // Si c'est une URL de type blob (générée par un mobile), retourner null
  if (url.startsWith('blob:')) return null;
  
  // Sinon, il s'agit probablement d'un chemin relatif dans un bucket
  // On va déterminer le bucket en fonction de la structure du chemin
  let bucket = BLOG_MEDIA_BUCKET;
  
  if (url.includes('/')) {
    bucket = DIARY_MEDIA_BUCKET; // Les chemins avec '/' sont typiquement pour diary_media
  }
  
  return url;
};

/**
 * Obtenir l'URL de prévisualisation d'une vignette de manière synchrone
 * Cette fonction ne génère pas d'URL signée et est conçue pour un usage direct dans les attributs JSX
 * @param url URL ou chemin du fichier média
 * @param bucket Bucket optionnel contenant le média (par défaut: album-thumbnails)
 * @returns URL de prévisualisation ou image par défaut
 */
export const getThumbnailUrlSync = (url: string | null, bucket: string = ALBUM_THUMBNAILS_BUCKET): string => {
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
    // Déterminer automatiquement le bucket en fonction de l'URL ou du chemin
    let actualBucket = bucket;
    
    // Si l'URL contient un identifiant utilisateur (chemin standard pour diary_media)
    if (url.includes('/')) {
      actualBucket = DIARY_MEDIA_BUCKET;
      console.log(`URL de type chemin détectée (${url}), utilisation du bucket ${actualBucket}`);
    }
    
    // Si l'URL est déjà une URL complète, la retourner
    if (url.startsWith('http')) {
      console.log("URL déjà complète:", url);
      return url;
    }
    
    // Si l'URL commence par un nom de fichier sans extension ou avec une extension courte (1-4 caractères)
    // et ne contient pas de slash, c'est probablement un fichier du bucket blog-media
    const isLikelyBlogMedia = !url.includes('/') && 
      (/^[^.]+$/.test(url) || /\.[a-zA-Z0-9]{1,4}$/.test(url));
    
    if (isLikelyBlogMedia && actualBucket === ALBUM_THUMBNAILS_BUCKET) {
      actualBucket = BLOG_MEDIA_BUCKET;
      console.log(`URL détectée comme fichier blog-media: ${url}`);
    }
    
    // Construire l'URL publique standard à partir du chemin dans le bucket
    const { data } = supabase.storage
      .from(actualBucket)
      .getPublicUrl(url);
      
    if (data && data.publicUrl) {
      console.log('URL publique générée pour', actualBucket, ':', data.publicUrl);
      return data.publicUrl;
    }
    
    return '/placeholder.svg';
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL publique:", error, "pour l'URL:", url, "et bucket:", bucket);
    // Retourner une image placeholder en cas d'erreur
    return '/placeholder.svg';
  }
};

/**
 * Obtenir l'URL de prévisualisation d'une vignette de manière asynchrone
 * Cette fonction peut générer des URL signées pour diary_media bucket
 * @param url URL ou chemin du fichier média
 * @param bucket Bucket optionnel contenant le média (par défaut: album-thumbnails)
 * @returns Promise avec l'URL de prévisualisation ou image par défaut
 */
export const getThumbnailUrl = async (url: string | null, bucket: string = ALBUM_THUMBNAILS_BUCKET): Promise<string> => {
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
    // Déterminer automatiquement le bucket en fonction de l'URL ou du chemin
    let actualBucket = bucket;
    
    // Si l'URL contient un identifiant utilisateur (chemin standard pour diary_media)
    if (url.includes('/')) {
      actualBucket = DIARY_MEDIA_BUCKET;
      console.log(`URL de type chemin détectée (${url}), utilisation du bucket ${actualBucket}`);
    }
    
    // Si l'URL est déjà une URL complète, la retourner
    if (url.startsWith('http')) {
      console.log("URL déjà complète:", url);
      return url;
    }
    
    // Si l'URL commence par un nom de fichier sans extension ou avec une extension courte (1-4 caractères)
    // et ne contient pas de slash, c'est probablement un fichier du bucket blog-media
    const isLikelyBlogMedia = !url.includes('/') && 
      (/^[^.]+$/.test(url) || /\.[a-zA-Z0-9]{1,4}$/.test(url));
    
    if (isLikelyBlogMedia && actualBucket === ALBUM_THUMBNAILS_BUCKET) {
      actualBucket = BLOG_MEDIA_BUCKET;
      console.log(`URL détectée comme fichier blog-media: ${url}`);
    }
    
    // Créer une URL signée pour améliorer la compatibilité avec les navigateurs (évite les problèmes CORS)
    if (actualBucket === DIARY_MEDIA_BUCKET || actualBucket === BLOG_MEDIA_BUCKET) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(actualBucket)
        .createSignedUrl(url, 3600); // URL valable 1 heure
        
      if (signedUrlData && !signedUrlError) {
        console.log("URL signée générée avec succès:", signedUrlData.signedUrl);
        return signedUrlData.signedUrl;
      } else {
        console.warn("Impossible de créer une URL signée, retour à l'URL publique standard");
      }
    }
    
    // Construire l'URL publique standard à partir du chemin dans le bucket
    const { data } = supabase.storage
      .from(actualBucket)
      .getPublicUrl(url);
      
    if (data && data.publicUrl) {
      console.log('URL publique générée pour', actualBucket, ':', data.publicUrl);
      return data.publicUrl;
    }
    
    throw new Error("Impossible de générer l'URL publique");
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL publique:", error, "pour l'URL:", url, "et bucket:", bucket);
    // Retourner une image placeholder en cas d'erreur
    return '/placeholder.svg';
  }
};
