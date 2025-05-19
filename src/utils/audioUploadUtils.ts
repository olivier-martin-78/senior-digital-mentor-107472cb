import { supabase } from '@/integrations/supabase/client';
import { getPublicUrl } from '@/utils/storageUtils';

// Nom du bucket Supabase pour stocker les fichiers audio
export const AUDIO_BUCKET_NAME = 'life-story-audios';

// Fonction simplifiée pour vérifier si le bucket existe et est accessible
export const checkBucketAccess = async (): Promise<boolean> => {
  try {
    console.log(`Vérification de l'accès au bucket ${AUDIO_BUCKET_NAME}...`);
    
    // Essayer d'obtenir une liste vide du bucket (juste pour vérifier l'accès)
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

// Fonction pour télécharger l'audio vers Supabase
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
  if (!blob || !userId) {
    console.error("Blob ou utilisateur non défini");
    onError("Blob ou utilisateur non défini");
    onUploadEnd(); // S'assurer que onUploadEnd est appelé même en cas d'erreur
    return;
  }
  
  try {
    onUploadStart();
    
    // Vérifier si le bucket est accessible
    const bucketAccessible = await checkBucketAccess();
    
    if (!bucketAccessible) {
      console.error("Impossible d'accéder au service de stockage");
      onError(`Impossible d'accéder au service de stockage. Veuillez réessayer plus tard.`);
      onUploadEnd(); // S'assurer que onUploadEnd est appelé même en cas d'erreur
      return;
    }
    
    // Créer un nom de fichier unique avec l'ID de l'utilisateur, de la question et un timestamp
    const fileName = `${userId}/${chapterId}_${questionId}_${Date.now()}.webm`;
    
    console.log(`Téléchargement du fichier audio vers ${AUDIO_BUCKET_NAME}/${fileName}...`);
    
    // Télécharger le fichier
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Erreur détaillée lors du téléchargement:', error);
      throw error;
    }
    
    console.log('Téléchargement réussi, récupération de l\'URL publique...');
    
    // Obtenir l'URL publique
    const publicUrl = getPublicUrl(fileName, AUDIO_BUCKET_NAME);
    console.log('URL publique obtenue:', publicUrl);
    
    onSuccess(publicUrl);
    
  } catch (error: any) {
    console.error('Erreur lors du téléchargement de l\'audio:', error);
    let errorMessage = 'Impossible de sauvegarder l\'enregistrement audio.';
    
    if (error.statusCode === 403) {
      errorMessage += ' Problème d\'autorisation avec le bucket de stockage.';
    } else if (error.message) {
      errorMessage += ` Erreur: ${error.message}`;
    }
    
    onError(errorMessage);
  } finally {
    // S'assurer que onUploadEnd est toujours appelé pour réinitialiser l'état de chargement
    onUploadEnd();
  }
};

// Fonction pour supprimer un fichier audio
export const deleteAudio = async (
  audioUrl: string,
  onSuccess: () => void,
  onError: (message: string) => void
): Promise<void> => {
  if (!audioUrl) return;
  
  try {
    console.log('Tentative de suppression du fichier audio:', audioUrl);
    
    // Extraire le chemin du fichier à partir de l'URL
    // Format typique: https://[project-ref].supabase.co/storage/v1/object/public/life-story-audios/[user-id]/[chapterId]_[questionId]_[timestamp].webm
    
    const matches = audioUrl.match(/\/storage\/v1\/object\/public\/life-story-audios\/(.*?)(\?.*)?$/);
    
    if (!matches || !matches[1]) {
      console.error('Format d\'URL non reconnu:', audioUrl);
      throw new Error('Format d\'URL non reconnu');
    }
    
    const filePath = decodeURIComponent(matches[1]);
    console.log(`Suppression du fichier ${filePath} du bucket ${AUDIO_BUCKET_NAME}...`);
    
    // Supprimer le fichier de Supabase Storage
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
    console.error('Erreur lors de la suppression de l\'audio:', error);
    onError(`Impossible de supprimer l\'enregistrement audio. ${error.message || ''}`);
  }
};
