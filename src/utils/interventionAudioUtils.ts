
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
  console.log('🔄 INTERVENTION_AUDIO_UTILS - Début upload:', {
    blobSize: audioBlob.size,
    userId,
    reportId
  });

  if (onUploadStart) onUploadStart();

  try {
    // Créer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `intervention-${reportId}-${timestamp}.webm`;
    const filePath = `${userId}/${fileName}`;

    console.log('🔄 INTERVENTION_AUDIO_UTILS - Upload vers:', filePath);

    // Créer le bucket s'il n'existe pas
    const { data: buckets } = await supabase.storage.listBuckets();
    const interventionBucketExists = buckets?.some(bucket => bucket.name === 'intervention-audios');

    if (!interventionBucketExists) {
      console.log('🔄 INTERVENTION_AUDIO_UTILS - Création du bucket intervention-audios');
      const { error: bucketError } = await supabase.storage.createBucket('intervention-audios', {
        public: true,
        allowedMimeTypes: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });

      if (bucketError) {
        console.error('❌ INTERVENTION_AUDIO_UTILS - Erreur création bucket:', bucketError);
        throw new Error(`Erreur lors de la création du bucket: ${bucketError.message}`);
      }
    }

    // Upload du fichier
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('intervention-audios')
      .upload(filePath, audioBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: audioBlob.type || 'audio/webm'
      });

    if (uploadError) {
      console.error('❌ INTERVENTION_AUDIO_UTILS - Erreur upload:', uploadError);
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    console.log('✅ INTERVENTION_AUDIO_UTILS - Upload réussi:', uploadData);

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('intervention-audios')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ INTERVENTION_AUDIO_UTILS - URL publique générée:', publicUrl);

    if (onSuccess) {
      onSuccess(publicUrl);
    }

  } catch (error) {
    console.error('💥 INTERVENTION_AUDIO_UTILS - Erreur lors de l\'upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload';
    
    if (onError) {
      onError(errorMessage);
    }
  } finally {
    if (onUploadEnd) onUploadEnd();
  }
};
