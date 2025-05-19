
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
    console.log(`Vérification de l'accès au bucket ${AUDIO_BUCKET_NAME}...`);
    
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (error) {
      console.error(`Erreur d'accès au bucket ${AUDIO_BUCKET_NAME}:`, error);
      return false;
    }
    
    console.log(`Accès au bucket ${AUDIO_BUCKET_NAME} réussi.`);
    return true;
  } catch (error) {
    console.error(`Exception lors de la vérification du bucket ${AUDIO_BUCKET_NAME}:`, error);
    return false;
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
  if (!blob) {
    onError("Aucun enregistrement audio à télécharger");
    onUploadEnd();
    return;
  }
  
  if (!userId) {
    onError("Identifiant utilisateur manquant");
    onUploadEnd();
    return;
  }
  
  try {
    onUploadStart();
    console.log(`Début du téléchargement audio pour la question ${questionId}...`);
    
    // Vérification de l'accès au bucket
    const bucketAccessible = await checkBucketAccess();
    if (!bucketAccessible) {
      throw new Error("Impossible d'accéder au service de stockage");
    }
    
    // Création d'un nom de fichier unique
    const fileName = `${userId}/${chapterId}_${questionId}_${Date.now()}.webm`;
    console.log(`Téléchargement du fichier audio vers ${AUDIO_BUCKET_NAME}/${fileName}...`);
    
    // Téléchargement du fichier audio avec vérification explicite des erreurs
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Erreur de téléchargement Supabase:', error);
      throw new Error(`Erreur de téléchargement: ${error.message}`);
    }
    
    console.log('Téléchargement réussi, récupération de l\'URL publique...');
    
    // Récupération de l'URL publique
    const publicUrl = getPublicUrl(fileName, AUDIO_BUCKET_NAME);
    console.log('URL publique obtenue:', publicUrl);
    
    onSuccess(publicUrl);
  } catch (error: any) {
    console.error('Erreur lors du téléchargement audio:', error);
    
    let errorMessage = "Impossible de sauvegarder l'enregistrement audio.";
    if (error.message) {
      errorMessage += ` Détail: ${error.message}`;
    }
    
    onError(errorMessage);
  } finally {
    console.log(`Fin du processus de téléchargement pour la question ${questionId}`);
    onUploadEnd();
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
    onError("URL audio non valide");
    return;
  }
  
  try {
    console.log('Tentative de suppression du fichier audio:', audioUrl);
    
    // Extraction du chemin du fichier à partir de l'URL
    const matches = audioUrl.match(/\/storage\/v1\/object\/public\/life-story-audios\/(.*?)(\?.*)?$/);
    
    if (!matches || !matches[1]) {
      console.error('Format d\'URL non reconnu:', audioUrl);
      throw new Error('Format d\'URL non reconnu');
    }
    
    const filePath = decodeURIComponent(matches[1]);
    console.log(`Suppression du fichier ${filePath} du bucket ${AUDIO_BUCKET_NAME}...`);
    
    // Suppression du fichier avec vérification explicite d'erreur
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
    
    console.log('Fichier supprimé avec succès');
    onSuccess();
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error);
    onError(`Impossible de supprimer l'audio. ${error.message || ''}`);
  }
};
