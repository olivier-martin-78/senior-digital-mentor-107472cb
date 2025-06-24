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

const ensureAudioBucketExists = async () => {
  try {
    console.log("🔧 AUDIO_UPLOAD - Checking bucket existence...");
    
    // Simplement tester l'accès au bucket en listant les objets
    const { data, error } = await supabase.storage
      .from('intervention-audios')
      .list('', { limit: 1 });
    
    if (error) {
      console.error("🔧 AUDIO_UPLOAD - Bucket access failed:", error);
      
      // Si l'erreur indique que le bucket n'existe pas, on l'accepte
      // car le bucket sera créé automatiquement lors du premier upload
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log("🔧 AUDIO_UPLOAD - Bucket will be created on first upload");
        return true;
      }
      
      return false;
    }
    
    console.log("🔧 AUDIO_UPLOAD - Bucket is accessible");
    return true;
    
  } catch (error) {
    console.error("🔧 AUDIO_UPLOAD - Unexpected error checking bucket:", error);
    // En cas d'erreur inattendue, on continue quand même l'upload
    return true;
  }
};

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
    // Vérifier l'accès au bucket (mais ne pas le créer automatiquement)
    const bucketReady = await ensureAudioBucketExists();
    if (!bucketReady) {
      throw new Error("Le bucket de stockage audio n'est pas accessible");
    }

    const fileName = `intervention_${reportId}_${Date.now()}.webm`;
    const filePath = `interventions/${userId}/${fileName}`;
    
    console.log("🔧 AUDIO_UPLOAD - Upload path:", filePath);

    // Vérifier la taille du blob
    if (audioBlob.size === 0) {
      throw new Error("L'enregistrement audio est vide");
    }

    if (audioBlob.size > 10485760) { // 10MB
      throw new Error("L'enregistrement audio est trop volumineux (max 10MB)");
    }

    console.log("🔧 AUDIO_UPLOAD - Starting Supabase upload...");
    
    const { data, error } = await supabase.storage
      .from('intervention-audios')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: false
      });

    if (error) {
      console.error("🔧 AUDIO_UPLOAD - Upload error details:", {
        message: error.message,
        statusCode: error.statusCode,
        error: error
      });
      
      // Messages d'erreur plus spécifiques
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        throw new Error("Le bucket de stockage n'existe pas. Contactez l'administrateur.");
      } else if (error.message.includes('policy')) {
        throw new Error("Permissions insuffisantes pour l'upload audio");
      } else {
        throw new Error(`Erreur d'upload: ${error.message}`);
      }
    }

    console.log("🔧 AUDIO_UPLOAD - Upload successful:", data);

    const { data: urlData } = supabase.storage
      .from('intervention-audios')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("🔧 AUDIO_UPLOAD - Public URL:", publicUrl);

    // Vérifier que l'URL est valide
    if (!publicUrl || publicUrl.includes('undefined')) {
      throw new Error("URL publique invalide générée");
    }

    console.log("🔧 AUDIO_UPLOAD - Updating intervention report...");
    
    const { error: updateError } = await supabase
      .from('intervention_reports')
      .update({ audio_url: publicUrl })
      .eq('id', reportId);

    if (updateError) {
      console.error("🔧 AUDIO_UPLOAD - Update error:", updateError);
      // Nettoyer le fichier uploadé en cas d'erreur
      await supabase.storage
        .from('intervention-audios')
        .remove([filePath]);
      throw new Error(`Erreur de mise à jour: ${updateError.message}`);
    }

    console.log("🔧 AUDIO_UPLOAD - Report updated with permanent audio URL");
    onSuccess(publicUrl);

    toast({
      title: "Succès",
      description: "Enregistrement sauvegardé de manière permanente",
    });

  } catch (error) {
    console.error("🔧 AUDIO_UPLOAD - Error during upload:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    onError(errorMessage);
    
    toast({
      title: "Erreur de sauvegarde",
      description: `Impossible de sauvegarder l'enregistrement: ${errorMessage}`,
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
    console.log("🔧 AUDIO_DELETE - Starting deletion:", { reportId, audioUrl });

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
      try {
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
      } catch (error) {
        console.error("🔧 AUDIO_DELETE - Error parsing URL for deletion:", error);
      }
    }

    toast({
      title: "Succès",
      description: "Enregistrement supprimé",
    });

  } catch (error) {
    console.error("🔧 AUDIO_DELETE - Error during cleanup:", error);
    toast({
      title: "Erreur",
      description: "Erreur lors de la suppression de l'enregistrement",
      variant: "destructive",
    });
  }
};
