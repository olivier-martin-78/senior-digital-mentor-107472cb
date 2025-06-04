
import { supabase } from '@/integrations/supabase/client';

// Nom du bucket Supabase pour stocker les fichiers audio
export const AUDIO_BUCKET_NAME = 'life-story-audios';

/**
 * Vérifie si le bucket existe et est accessible
 * @returns {Promise<boolean>} Indique si le bucket est accessible
 */
export const checkBucketAccess = async (): Promise<boolean> => {
  try {
    console.log(`🪣 Vérification de l'accès au bucket ${AUDIO_BUCKET_NAME}...`);
    
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (error) {
      console.error(`❌ Erreur d'accès au bucket ${AUDIO_BUCKET_NAME}:`, error);
      return false;
    }
    
    console.log(`✅ Accès au bucket ${AUDIO_BUCKET_NAME} réussi.`);
    return true;
  } catch (error) {
    console.error(`💥 Exception lors de la vérification du bucket ${AUDIO_BUCKET_NAME}:`, error);
    return false;
  }
};

/**
 * Génère une URL signée pour accéder au fichier audio
 * @param filePath Chemin du fichier dans le bucket
 * @returns URL signée ou null en cas d'erreur
 */
export const getSignedAudioUrl = async (filePath: string): Promise<string | null> => {
  try {
    console.log('🔗 Génération URL signée pour:', filePath);
    
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // URL valide pendant 1 heure
    
    if (error) {
      console.error('❌ Erreur création URL signée:', error);
      return null;
    }
    
    console.log('✅ URL signée générée:', data.signedUrl);
    return data.signedUrl;
  } catch (error) {
    console.error('💥 Exception lors de la création de l\'URL signée:', error);
    return null;
  }
};

/**
 * Extraire le chemin du fichier à partir d'une URL
 * @param url URL complète du fichier
 * @returns Chemin du fichier dans le bucket
 */
export const extractFilePathFromUrl = (url: string): string | null => {
  try {
    console.log('🔍 Extraction du chemin depuis URL:', url);
    
    // Pattern amélioré pour les URLs publiques Supabase
    const patterns = [
      // Pattern pour URLs publiques: /storage/v1/object/public/bucket-name/path
      new RegExp(`/storage/v1/object/public/${AUDIO_BUCKET_NAME}/(.+)$`),
      // Pattern pour URLs signées: /storage/v1/object/sign/bucket-name/path
      new RegExp(`/storage/v1/object/sign/${AUDIO_BUCKET_NAME}/(.+)\\?`),
      // Pattern simple pour bucket dans l'URL
      new RegExp(`/${AUDIO_BUCKET_NAME}/(.+)$`)
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const extractedPath = decodeURIComponent(match[1]);
        console.log('✅ Chemin extrait:', extractedPath);
        return extractedPath;
      }
    }
    
    console.warn('❌ Aucun pattern reconnu pour URL:', url);
    return null;
  } catch (error) {
    console.error('💥 Erreur extraction chemin:', error);
    return null;
  }
};

/**
 * Assurez-vous que toutes les fonctions de callback sont appelées même en cas d'erreur
 */
const safeCallback = (callback: Function, ...args: any[]) => {
  try {
    callback(...args);
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution du callback:", error);
  }
};

/**
 * Télécharge un fichier audio vers Supabase Storage
 */
export const uploadAudio = async (
  blob: Blob, 
  userId: string, 
  chapterId: string, 
  questionId: string,
  onSuccess: (url: string) => void,
  onError: (message: string) => void,
  onUploadStart: () => void,
  onUploadEnd: () => void
): Promise<void> => {
  // Validation des paramètres
  if (!blob || blob.size === 0) {
    console.log(`❌ Blob invalide pour ${questionId}:`, { hasBlob: !!blob, size: blob?.size });
    safeCallback(onError, "Aucun enregistrement audio valide à télécharger");
    safeCallback(onUploadEnd);
    return;
  }
  
  if (!userId) {
    console.log(`❌ UserId manquant pour ${questionId}`);
    safeCallback(onError, "Identifiant utilisateur manquant");
    safeCallback(onUploadEnd);
    return;
  }
  
  safeCallback(onUploadStart);
  console.log(`📤 Début du téléchargement audio pour la question ${questionId}...`, {
    blobSize: blob.size,
    blobType: blob.type,
    userId,
    chapterId
  });
  
  try {
    // Vérification de l'accès au bucket
    const bucketAccessible = await checkBucketAccess();
    if (!bucketAccessible) {
      throw new Error(`Impossible d'accéder au service de stockage (bucket: ${AUDIO_BUCKET_NAME})`);
    }
    
    // Création d'un nom de fichier unique
    const timestamp = Date.now();
    const fileName = `${userId}/${chapterId}_${questionId}_${timestamp}.webm`;
    console.log(`📁 Téléchargement du fichier audio vers ${AUDIO_BUCKET_NAME}/${fileName}...`);
    
    // Téléchargement du fichier audio
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('💥 Erreur de téléchargement Supabase:', error);
      throw new Error(`Erreur de téléchargement: ${error.message}`);
    }
    
    console.log('✅ Téléchargement réussi, génération de l\'URL publique...');
    
    // CORRECTION CRITIQUE: Stocker le chemin relatif au lieu de l'URL publique
    // Cela permettra de régénérer l'URL à chaque fois pour éviter les problèmes d'expiration
    const relativePath = fileName;
    console.log('📁 Chemin relatif sauvegardé:', relativePath);
    
    safeCallback(onSuccess, relativePath);
  } catch (error: any) {
    console.error('💥 Erreur lors du téléchargement audio:', error);
    
    let errorMessage = "Impossible de sauvegarder l'enregistrement audio.";
    if (error.message) {
      errorMessage += ` Détail: ${error.message}`;
    }
    
    safeCallback(onError, errorMessage);
  } finally {
    console.log(`🏁 Fin du processus de téléchargement pour la question ${questionId}`);
    safeCallback(onUploadEnd);
  }
};

/**
 * NOUVELLE FONCTION: Génère une URL accessible pour un chemin stocké
 * @param audioPath Chemin du fichier stocké en base
 * @returns URL publique ou signée selon les permissions
 */
export const getAccessibleAudioUrl = async (audioPath: string): Promise<string | null> => {
  if (!audioPath || audioPath.trim() === '') {
    return null;
  }
  
  try {
    console.log('🎵 Génération d\'URL accessible pour:', audioPath);
    
    // D'abord essayer l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .getPublicUrl(audioPath);
    
    if (publicUrlData?.publicUrl) {
      console.log('✅ URL publique générée:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }
    
    // Si pas d'URL publique, essayer une URL signée
    const signedUrl = await getSignedAudioUrl(audioPath);
    if (signedUrl) {
      console.log('✅ URL signée générée:', signedUrl);
      return signedUrl;
    }
    
    console.error('❌ Impossible de générer une URL pour:', audioPath);
    return null;
  } catch (error) {
    console.error('💥 Erreur lors de la génération d\'URL:', error);
    return null;
  }
};

/**
 * Supprime un fichier audio de Supabase Storage
 */
export const deleteAudio = async (
  audioPath: string,
  onSuccess: () => void,
  onError: (message: string) => void
): Promise<void> => {
  if (!audioPath) {
    console.log('❌ Chemin audio vide pour suppression');
    safeCallback(onError, "Chemin audio non valide");
    return;
  }
  
  try {
    console.log('🗑️ Tentative de suppression du fichier audio:', audioPath);
    
    // Si c'est une URL complète, extraire le chemin
    let filePath = audioPath;
    if (audioPath.includes('/storage/v1/object/')) {
      filePath = extractFilePathFromUrl(audioPath);
      if (!filePath) {
        throw new Error('Format d\'URL non reconnu');
      }
    }
    
    console.log(`🗂️ Suppression du fichier ${filePath} du bucket ${AUDIO_BUCKET_NAME}...`);
    
    // Suppression du fichier
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('💥 Erreur lors de la suppression:', error);
      throw error;
    }
    
    console.log('✅ Fichier supprimé avec succès');
    safeCallback(onSuccess);
  } catch (error: any) {
    console.error('💥 Erreur lors de la suppression:', error);
    safeCallback(onError, `Impossible de supprimer l'audio. ${error.message || ''}`);
  }
};
