
import { supabase } from '@/integrations/supabase/client';

export const uploadInterventionAudio = async (
  audioBlob: Blob,
  userId: string,
  reportId: string,
  onSuccess: (publicUrl: string) => void,
  onError: (error: string) => void,
  onUploadStart: () => void,
  onUploadEnd: () => void
) => {
  console.log("🔧 AUDIO_UTILS - Starting upload:", {
    blobSize: audioBlob.size,
    userId,
    reportId
  });

  onUploadStart();

  try {
    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `intervention-audio-${reportId}-${timestamp}.webm`;
    const filePath = `interventions/${userId}/${fileName}`;

    console.log("🔧 AUDIO_UTILS - Upload path:", filePath);

    // Upload vers Supabase Storage - CORRECTION: bucket "intervention-audios" avec un "s"
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('intervention-audios')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: true
      });

    if (uploadError) {
      console.error("🔧 AUDIO_UTILS - Upload error:", uploadError);
      throw uploadError;
    }

    console.log("🔧 AUDIO_UTILS - Upload successful:", uploadData);

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('intervention-audios')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("🔧 AUDIO_UTILS - Public URL:", publicUrl);

    // Mettre à jour le rapport avec l'URL audio
    const { error: updateError } = await supabase
      .from('intervention_reports')
      .update({ audio_url: publicUrl })
      .eq('id', reportId);

    if (updateError) {
      console.error("🔧 AUDIO_UTILS - Update error:", updateError);
      throw updateError;
    }

    console.log("🔧 AUDIO_UTILS - Report updated successfully");
    onSuccess(publicUrl);

  } catch (error) {
    console.error("🔧 AUDIO_UTILS - Upload failed:", error);
    
    let errorMessage = "Erreur lors de l'upload de l'audio";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    onError(errorMessage);
  } finally {
    onUploadEnd();
  }
};
