
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AudioUploadOptions {
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
}: AudioUploadOptions) => {
  console.log("🔧 AUDIO_UPLOAD - Starting upload:", {
    blobSize: audioBlob.size,
    userId,
    reportId
  });

  onUploadStart();

  try {
    const fileName = `intervention_${reportId}_${Date.now()}.webm`;
    const filePath = `interventions/${userId}/${fileName}`;
    
    console.log("🔧 AUDIO_UPLOAD - Upload path:", filePath);

    const { data, error } = await supabase.storage
      .from('intervention-audios')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: false
      });

    if (error) {
      console.error("🔧 AUDIO_UPLOAD - Upload error:", error);
      throw error;
    }

    console.log("🔧 AUDIO_UPLOAD - Upload successful:", data);

    const { data: urlData } = supabase.storage
      .from('intervention-audios')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("🔧 AUDIO_UPLOAD - Public URL:", publicUrl);

    const { error: updateError } = await supabase
      .from('intervention_reports')
      .update({ audio_url: publicUrl })
      .eq('id', reportId);

    if (updateError) {
      console.error("🔧 AUDIO_UPLOAD - Update error:", updateError);
      throw updateError;
    }

    console.log("🔧 AUDIO_UPLOAD - Report updated with permanent audio URL");
    onSuccess(publicUrl);

    toast({
      title: "Succès",
      description: "Enregistrement sauvegardé",
    });

  } catch (error) {
    console.error("🔧 AUDIO_UPLOAD - Error during upload:", error);
    onError(error instanceof Error ? error.message : "Erreur inconnue");
    
    toast({
      title: "Erreur",
      description: "Impossible de sauvegarder l'enregistrement",
      variant: "destructive",
    });
  } finally {
    onUploadEnd();
  }
};

export const deleteInterventionAudio = async (
  reportId: string,
  audioUrl: string,
  userId: string
) => {
  try {
    // Mettre à jour le rapport pour enlever l'URL audio
    const { error: updateError } = await supabase
      .from('intervention_reports')
      .update({ audio_url: null })
      .eq('id', reportId);

    if (updateError) {
      console.error("🔧 AUDIO_DELETE - Error clearing audio URL:", updateError);
    } else {
      console.log("🔧 AUDIO_DELETE - Audio URL cleared from report");
    }

    // Supprimer le fichier du storage si c'est une URL Supabase
    if (audioUrl.includes('intervention-audios')) {
      const urlParts = audioUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `interventions/${userId}/${fileName}`;
      
      const { error: deleteError } = await supabase.storage
        .from('intervention-audios')
        .remove([filePath]);

      if (deleteError) {
        console.error("🔧 AUDIO_DELETE - Error deleting file:", deleteError);
      } else {
        console.log("🔧 AUDIO_DELETE - File deleted from storage");
      }
    }
  } catch (error) {
    console.error("🔧 AUDIO_DELETE - Error during cleanup:", error);
  }
};
