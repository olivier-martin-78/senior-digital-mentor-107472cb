
import { supabase } from "@/integrations/supabase/client";

export const ALBUM_THUMBNAILS_BUCKET = 'album-thumbnails';
export const DIARY_MEDIA_BUCKET = 'diary_media';
export const BLOG_MEDIA_BUCKET = 'blog-media';

/**
 * Resolve a blob URL to a permanent URL by querying the database
 * @param blobUrl The blob URL to resolve
 * @returns Permanent URL or null if resolution fails
 */
async function resolveBlobUrl(blobUrl: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('permanent_url')
      .eq('blob_url', blobUrl)
      .single();

    if (error || !data?.permanent_url) {
      console.error('Failed to resolve blob URL:', { blobUrl, error });
      return null;
    }

    console.log('Resolved blob URL:', { blobUrl, permanentUrl: data.permanent_url });
    return data.permanent_url;
  } catch (error) {
    console.error('Error resolving blob URL:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      blobUrl,
    });
    return null;
  }
}

/**
 * Upload a thumbnail for an album or post
 */
export const uploadAlbumThumbnail = async (file: File, idPrefix: string): Promise<string> => {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${idPrefix}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(ALBUM_THUMBNAILS_BUCKET)
      .upload(fileName, file);
      
    if (uploadError) {
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from(ALBUM_THUMBNAILS_BUCKET)
      .getPublicUrl(fileName);
      
    if (!data.publicUrl) {
      throw new Error("Impossible de générer l'URL publique");
    }
    
    // Store the mapping of blob URL (if provided) to permanent URL
    const blobUrl = `blob:${idPrefix}-${Date.now()}`; // Adjust based on how blob URLs are generated
    await supabase
      .from('media')
      .insert({ blob_url: blobUrl, permanent_url: data.publicUrl });
    
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
 * Normalize a media URL to ensure it's valid across devices
 */
export const normalizeMediaUrl = (url: string | null, bucket: string = ALBUM_THUMBNAILS_BUCKET): string | null => {
  if (!url) return null;
  
  if (url.startsWith('http')) return url;
  
  if (url.startsWith('blob:')) {
    console.warn('Blob URL detected, resolution required:', url);
    return null; // Handled in getThumbnailUrl
  }
  
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(url);
      
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (error) {
    console.error('Erreur lors de la normalisation de l\'URL média:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      bucket,
    });
  }
  
  return null;
};

/**
 * Get a thumbnail preview URL synchronously
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
  
  if (url.startsWith('blob:')) {
    console.warn("Blob URL detected, cannot resolve synchronously:", url);
    return '/placeholder.svg';
  }
  
  try {
    if (url.startsWith('http')) {
      return url;
    }
    
    const actualBucket = bucket;
    console.log(`Génération d'URL pour bucket: ${actualBucket}, chemin: ${url}`);
    
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
    console.error('Erreur lors de la génération de l\'URL publique:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      bucket,
    });
    return '/placeholder.svg';
  }
};

/**
 * Get a thumbnail preview URL asynchronously with improved error handling
 */
export const getThumbnailUrl = async (
  url: string | null,
  bucket: string = ALBUM_THUMBNAILS_BUCKET
): Promise<string> => {
  if (!url) {
    console.log("URL vide ou null, utilisation de l'image par défaut");
    return '/placeholder.svg';
  }
  
  if (url.startsWith('blob:')) {
    console.log("Blob URL detected, attempting to resolve:", url);
    const resolvedUrl = await resolveBlobUrl(url);
    if (resolvedUrl) {
      return resolvedUrl;
    }
    console.warn("Failed to resolve blob URL, using default image:", url);
    return '/placeholder.svg';
  }
  
  try {
    if (url.startsWith('http')) {
      console.log("URL already complete:", url);
      return url;
    }
    
    const actualBucket = bucket;
    console.log(`🔗 Génération d'URL pour bucket: ${actualBucket}, chemin: ${url}`);
    
    // Vérifier d'abord l'existence du fichier
    const { data: fileData, error: fileError } = await supabase.storage
      .from(actualBucket)
      .list(url.split('/')[0] || '', {
        search: url.split('/').pop() || ''
      });
    
    if (fileError) {
      console.warn('Error checking file existence:', fileError);
    } else if (!fileData || fileData.length === 0) {
      console.warn('File not found in storage:', url);
      return '/placeholder.svg';
    }
    
    // Essayer de créer une URL signée d'abord
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(actualBucket)
      .createSignedUrl(url, 3600);
        
    if (signedUrlData?.signedUrl && !signedUrlError) {
      console.log("✅ URL signée générée avec succès:", signedUrlData.signedUrl);
      return signedUrlData.signedUrl;
    }
    
    // Fallback vers l'URL publique
    const { data } = supabase.storage
      .from(actualBucket)
      .getPublicUrl(url);
      
    if (data?.publicUrl) {
      console.log('✅ URL publique générée pour', actualBucket, ':', data.publicUrl);
      return data.publicUrl;
    }
    
    throw new Error("Impossible de générer l'URL publique ou signée");
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'URL:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      bucket,
    });
    return '/placeholder.svg';
  }
};
