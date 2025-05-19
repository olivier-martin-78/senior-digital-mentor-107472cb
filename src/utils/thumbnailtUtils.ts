
import { supabase } from "@/integrations/supabase/client";
import { getPublicUrl } from "./storageUtils";

// Nom du bucket pour les vignettes d'album
export const ALBUM_THUMBNAILS_BUCKET = 'album-thumbnails';
// Nom du bucket pour les médias du journal
export const DIARY_MEDIA_BUCKET = 'diary_media';

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
 * Obtenir l'URL de prévisualisation d'une vignette
 * @param url URL ou chemin du fichier média
 * @param bucket Bucket optionnel contenant le média (par défaut: album-thumbnails)
 * @returns URL de prévisualisation ou image par défaut
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
    
    // Créer une URL signée pour améliorer la compatibilité avec les navigateurs (évite les problèmes CORS)
    if (actualBucket === DIARY_MEDIA_BUCKET) {
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
