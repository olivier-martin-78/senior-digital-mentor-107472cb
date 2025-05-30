
import { supabase } from '@/integrations/supabase/client';
import { getPublicUrl } from '@/utils/storageUtils';

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
    
    console.log('✅ Téléchargement réussi, récupération de l\'URL publique...');
    
    // Récupération de l'URL publique
    const publicUrl = getPublicUrl(fileName, AUDIO_BUCKET_NAME);
    console.log('🔗 URL publique obtenue:', publicUrl);
    console.log('🪣 Bucket utilisé:', AUDIO_BUCKET_NAME);
    
    safeCallback(onSuccess, publicUrl);
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
 * Supprime un fichier audio de Supabase Storage
 */
export const deleteAudio = async (
  audioUrl: string,
  onSuccess: () => void,
  onError: (message: string) => void
): Promise<void> => {
  if (!audioUrl) {
    console.log('❌ URL audio vide pour suppression');
    safeCallback(onError, "URL audio non valide");
    return;
  }
  
  try {
    console.log('🗑️ Tentative de suppression du fichier audio:', audioUrl);
    
    // Extraction du chemin du fichier à partir de l'URL
    const matches = audioUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.*?)(\?.*)?$/);
    
    if (!matches || !matches[1] || !matches[2]) {
      console.error('❌ Format d\'URL non reconnu:', audioUrl);
      throw new Error('Format d\'URL non reconnu');
    }
    
    const bucketName = matches[1];
    const filePath = decodeURIComponent(matches[2]);
    console.log(`🗂️ Suppression du fichier ${filePath} du bucket ${bucketName}...`);
    
    // Suppression du fichier
    const { error } = await supabase.storage
      .from(bucketName)
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
