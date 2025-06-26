
import { supabase } from '@/integrations/supabase/client';

export const uploadInterventionAudio = async (
  audioBlob: Blob,
  userId: string,
  reportId: string,
  onSuccess: (publicUrl: string) => void,
  onError: (error: string) => void,
  onUploadStart?: () => void,
  onUploadEnd?: () => void
) => {
  console.log('🔄 AUDIO_UTILS - Début upload:', {
    blobSize: audioBlob.size,
    userId,
    reportId,
    blobType: audioBlob.type
  });

  if (onUploadStart) onUploadStart();

  try {
    // Validation des paramètres
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Blob audio vide ou invalide');
    }

    if (!userId || !reportId) {
      throw new Error('Paramètres manquants (userId ou reportId)');
    }

    // Créer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `intervention-${reportId}-${timestamp}.webm`;
    const filePath = `${userId}/${fileName}`;

    console.log('🔄 AUDIO_UTILS - Upload vers:', filePath);

    // Upload du fichier avec retry
    let uploadAttempt = 0;
    const maxRetries = 3;
    let uploadError: any;

    while (uploadAttempt < maxRetries) {
      uploadAttempt++;
      console.log(`🔄 AUDIO_UTILS - Tentative d'upload ${uploadAttempt}/${maxRetries}`);

      const { data: uploadData, error } = await supabase.storage
        .from('intervention-audios')
        .upload(filePath, audioBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: audioBlob.type || 'audio/webm'
        });

      if (error) {
        console.error(`❌ AUDIO_UTILS - Erreur upload tentative ${uploadAttempt}:`, error);
        uploadError = error;
        
        if (uploadAttempt < maxRetries) {
          console.log('🔄 AUDIO_UTILS - Attente avant nouvelle tentative...');
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempt));
          continue;
        }
      } else {
        console.log('✅ AUDIO_UTILS - Upload réussi:', uploadData);
        uploadError = null;
        break;
      }
    }

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload après ${maxRetries} tentatives: ${uploadError.message}`);
    }

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('intervention-audios')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ AUDIO_UTILS - URL publique générée:', publicUrl);

    // Vérifier que l'URL est accessible
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn('⚠️ AUDIO_UTILS - URL pas immédiatement accessible, mais continue');
      } else {
        console.log('✅ AUDIO_UTILS - URL accessible vérifiée');
      }
    } catch (checkError) {
      console.warn('⚠️ AUDIO_UTILS - Impossible de vérifier l\'URL, mais continue:', checkError);
    }

    if (onSuccess) {
      onSuccess(publicUrl);
    }

  } catch (error) {
    console.error('💥 AUDIO_UTILS - Erreur lors de l\'upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload';
    
    if (onError) {
      onError(errorMessage);
    }
  } finally {
    if (onUploadEnd) onUploadEnd();
  }
};
