
import { supabase } from "@/integrations/supabase/client";
import { getPublicUrl } from "./storageUtils";

// Nom du bucket pour les vignettes d'album
export const ALBUM_THUMBNAILS_BUCKET = 'album-thumbnails';

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
 * @param url URL de la vignette
 * @returns URL de prévisualisation ou image par défaut
 */
export const getThumbnailUrl = (url: string | null): string => {
  if (!url) {
    return '/placeholder.svg';
  }
  
  // Si c'est une URL de type blob, retourner l'image par défaut
  if (url.startsWith('blob:')) {
    console.log("URL blob détectée, utilisation de l'image par défaut:", url);
    return '/placeholder.svg';
  }
  
  return url;
};
