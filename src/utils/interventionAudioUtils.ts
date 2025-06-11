
import { supabase } from '@/integrations/supabase/client';

// Nom du bucket Supabase pour stocker les fichiers audio d'intervention
export const INTERVENTION_AUDIO_BUCKET_NAME = 'intervention-audios';

/**
 * Vérifie si le bucket existe et est accessible
 */
export const checkInterventionBucketAccess = async (): Promise<boolean> => {
  try {
    console.log(`🪣 INTERVENTION - Vérification de l'accès au bucket ${INTERVENTION_AUDIO_BUCKET_NAME}...`);
    
    const { data, error } = await supabase.storage
      .from(INTERVENTION_AUDIO_BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (error) {
      console.error(`❌ INTERVENTION - Erreur d'accès au bucket ${INTERVENTION_AUDIO_BUCKET_NAME}:`, error);
      return false;
    }
    
    console.log(`✅ INTERVENTION - Accès au bucket ${INTERVENTION_AUDIO_BUCKET_NAME} réussi.`);
    return true;
  } catch (error) {
    console.error(`💥 INTERVENTION - Exception lors de la vérification du bucket ${INTERVENTION_AUDIO_BUCKET_NAME}:`, error);
    return false;
  }
};

/**
 * Génère une URL publique pour accéder au fichier audio
 */
export const getInterventionAudioUrl = (filePath: string): string | null => {
  try {
    console.log('🔗 INTERVENTION - Génération URL publique pour:', filePath);
    
    const { data } = supabase.storage
      .from(INTERVENTION_AUDIO_BUCKET_NAME)
      .getPublicUrl(filePath);
    
    if (data?.publicUrl) {
      console.log('✅ INTERVENTION - URL publique générée:', data.publicUrl);
      return data.publicUrl;
    }
    
    console.error('❌ INTERVENTION - Impossible de générer l\'URL publique pour:', filePath);
    return null;
  } catch (error) {
    console.error('💥 INTERVENTION - Exception lors de la génération d\'URL publique:', error);
    return null;
  }
};

/**
 * Télécharge un fichier audio d'intervention vers Supabase Storage
 */
export const uploadInterventionAudio = async (
  blob: Blob, 
  userId: string, 
  reportId: string,
  onSuccess: (url: string) => void,
  onError: (message: string) => void,
  onUploadStart: () => void,
  onUploadEnd: () => void
): Promise<void> => {
  // Validation des paramètres
  if (!blob || blob.size === 0) {
    console.log(`❌ INTERVENTION - Blob invalide pour le rapport ${reportId}:`, { hasBlob: !!blob, size: blob?.size });
    onError("Aucun enregistrement audio valide à télécharger");
    onUploadEnd();
    return;
  }
  
  if (!userId) {
    console.log(`❌ INTERVENTION - UserId manquant pour le rapport ${reportId}`);
    onError("Identifiant utilisateur manquant");
    onUploadEnd();
    return;
  }
  
  onUploadStart();
  console.log(`📤 INTERVENTION - Début du téléchargement audio pour le rapport ${reportId}...`, {
    blobSize: blob.size,
    blobType: blob.type,
    userId,
    reportId
  });
  
  try {
    // Vérification de l'accès au bucket
    const bucketAccessible = await checkInterventionBucketAccess();
    if (!bucketAccessible) {
      throw new Error(`Impossible d'accéder au service de stockage (bucket: ${INTERVENTION_AUDIO_BUCKET_NAME})`);
    }
    
    // Création d'un nom de fichier unique
    const timestamp = Date.now();
    const fileName = `${userId}/intervention_${reportId}_${timestamp}.webm`;
    console.log(`📁 INTERVENTION - Téléchargement du fichier audio vers ${INTERVENTION_AUDIO_BUCKET_NAME}/${fileName}...`);
    
    // Téléchargement du fichier audio
    const { data, error } = await supabase.storage
      .from(INTERVENTION_AUDIO_BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('💥 INTERVENTION - Erreur de téléchargement Supabase:', error);
      throw new Error(`Erreur de téléchargement: ${error.message}`);
    }
    
    console.log('✅ INTERVENTION - Téléchargement réussi, génération de l\'URL publique...');
    
    // Générer l'URL publique
    const publicUrl = getInterventionAudioUrl(fileName);
    if (!publicUrl) {
      throw new Error('Impossible de générer l\'URL publique');
    }
    
    console.log('📁 INTERVENTION - URL publique générée:', publicUrl);
    onSuccess(publicUrl);
  } catch (error: any) {
    console.error('💥 INTERVENTION - Erreur lors du téléchargement audio:', error);
    
    let errorMessage = "Impossible de sauvegarder l'enregistrement audio.";
    if (error.message) {
      errorMessage += ` Détail: ${error.message}`;
    }
    
    onError(errorMessage);
  } finally {
    console.log(`🏁 INTERVENTION - Fin du processus de téléchargement pour le rapport ${reportId}`);
    onUploadEnd();
  }
};
