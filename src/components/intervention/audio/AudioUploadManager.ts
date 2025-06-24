
import { supabase } from '@/integrations/supabase/client';

interface UploadAudioParams {
  audioBlob: Blob;
  reportId: string;
  userId: string;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onSuccess: (publicUrl: string) => void;
  onError: (error: string) => void;
}

export const uploadInterventionAudio = async ({
  audioBlob,
  reportId,
  userId,
  onUploadStart,
  onUploadEnd,
  onSuccess,
  onError
}: UploadAudioParams) => {
  console.log("🔧 AUDIO_UPLOAD_MANAGER - Starting upload:", {
    blobSize: audioBlob.size,
    userId,
    reportId
  });

  onUploadStart();

  try {
    // Créer un nom de fichier unique
    const fileName = `intervention_${reportId}_${Date.now()}.webm`;
    const filePath = `interventions/${userId}/${fileName}`;

    console.log("🔧 AUDIO_UPLOAD_MANAGER - Upload path:", filePath);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('intervention-audios')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: true
      });

    if (uploadError) {
      console.error("🔧 AUDIO_UPLOAD_MANAGER - Upload error:", uploadError);
      throw uploadError;
    }

    console.log("🔧 AUDIO_UPLOAD_MANAGER - Upload successful:", uploadData);

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('intervention-audios')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("🔧 AUDIO_UPLOAD_MANAGER - Public URL generated:", publicUrl);

    // Mettre à jour le rapport avec l'URL audio
    console.log("🔧 AUDIO_UPLOAD_MANAGER - Updating report with audio URL...");
    const { data: updateData, error: updateError } = await supabase
      .from('intervention_reports')
      .update({ audio_url: publicUrl })
      .eq('id', reportId)
      .select('audio_url');

    if (updateError) {
      console.error("🔧 AUDIO_UPLOAD_MANAGER - Update error:", updateError);
      throw updateError;
    }

    console.log("🔧 AUDIO_UPLOAD_MANAGER - Report updated successfully:", updateData);
    
    // Vérifier que la mise à jour a bien eu lieu
    if (updateData && updateData.length > 0) {
      console.log("🔧 AUDIO_UPLOAD_MANAGER - Verified audio_url in database:", updateData[0].audio_url);
    } else {
      console.warn("🔧 AUDIO_UPLOAD_MANAGER - No data returned from update, checking manually...");
      
      // Vérification manuelle
      const { data: checkData, error: checkError } = await supabase
        .from('intervention_reports')
        .select('audio_url')
        .eq('id', reportId)
        .single();
        
      if (checkError) {
        console.error("🔧 AUDIO_UPLOAD_MANAGER - Check error:", checkError);
      } else {
        console.log("🔧 AUDIO_UPLOAD_MANAGER - Manual check result:", checkData);
      }
    }

    onSuccess(publicUrl);

  } catch (error) {
    console.error("🔧 AUDIO_UPLOAD_MANAGER - Upload failed:", error);
    
    let errorMessage = "Erreur lors de l'upload de l'audio";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    onError(errorMessage);
  } finally {
    onUploadEnd();
  }
};

export const deleteInterventionAudio = async (
  reportId: string,
  audioUrl: string,
  userId: string
) => {
  console.log("🔧 AUDIO_UPLOAD_MANAGER - Deleting audio:", { reportId, audioUrl, userId });

  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = audioUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `interventions/${userId}/${fileName}`;

    console.log("🔧 AUDIO_UPLOAD_MANAGER - Delete path:", filePath);

    // Supprimer le fichier du storage
    const { error: deleteError } = await supabase.storage
      .from('intervention-audios')
      .remove([filePath]);

    if (deleteError) {
      console.error("🔧 AUDIO_UPLOAD_MANAGER - Delete error:", deleteError);
    } else {
      console.log("🔧 AUDIO_UPLOAD_MANAGER - File deleted successfully");
    }

    // Mettre à jour le rapport pour supprimer l'URL audio
    const { error: updateError } = await supabase
      .from('intervention_reports')
      .update({ audio_url: null })
      .eq('id', reportId);

    if (updateError) {
      console.error("🔧 AUDIO_UPLOAD_MANAGER - Update error:", updateError);
    } else {
      console.log("🔧 AUDIO_UPLOAD_MANAGER - Report updated, audio_url cleared");
    }

  } catch (error) {
    console.error("🔧 AUDIO_UPLOAD_MANAGER - Delete failed:", error);
  }
};
