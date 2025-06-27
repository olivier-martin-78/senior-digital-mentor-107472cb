
import { supabase } from '@/integrations/supabase/client';

interface UploadCallbacks {
  onSuccess: (publicUrl: string) => void;
  onError: (errorMessage: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export const uploadAdaptiveAudio = async (
  audioBlob: Blob,
  userId: string,
  chapterId: string,
  questionId: string,
  callbacks: UploadCallbacks
) => {
  const { onSuccess, onError, onStart, onEnd } = callbacks;
  
  try {
    onStart();
    console.log('🎤 📤 Début upload audio adaptatif:', {
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      userId,
      chapterId,
      questionId
    });

    // Détecter l'extension en fonction du type MIME
    let fileExtension = 'webm'; // défaut
    if (audioBlob.type.includes('mp4')) {
      fileExtension = 'mp4';
    } else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) {
      fileExtension = 'mp3';
    } else if (audioBlob.type.includes('webm')) {
      fileExtension = 'webm';
    }
    
    console.log('🎵 Extension détectée:', fileExtension, 'pour type MIME:', audioBlob.type);

    // Créer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${chapterId}_${questionId}_${timestamp}.${fileExtension}`;
    const filePath = `life-stories/${userId}/${fileName}`;

    console.log('📁 Chemin d\'upload:', filePath);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('life-story-audios')
      .upload(filePath, audioBlob, {
        contentType: audioBlob.type,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase:', uploadError);
      throw new Error(`Erreur upload: ${uploadError.message}`);
    }

    console.log('✅ Upload réussi:', uploadData);

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('life-story-audios')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('🌐 URL publique générée:', publicUrl);

    onSuccess(publicUrl);
    
  } catch (error) {
    console.error('💥 Erreur générale upload audio adaptatif:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload';
    onError(errorMessage);
  } finally {
    onEnd();
  }
};

// Fonction pour l'upload d'intervention avec support adaptatif
export const uploadInterventionAdaptiveAudio = async (
  audioBlob: Blob,
  userId: string,
  reportId: string,
  callbacks: UploadCallbacks
) => {
  const { onSuccess, onError, onStart, onEnd } = callbacks;
  
  try {
    onStart();
    console.log('🎤 📤 Début upload audio intervention adaptatif:', {
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      userId,
      reportId
    });

    // Détecter l'extension en fonction du type MIME
    let fileExtension = 'webm'; // défaut
    if (audioBlob.type.includes('mp4')) {
      fileExtension = 'mp4';
    } else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) {
      fileExtension = 'mp3';
    } else if (audioBlob.type.includes('webm')) {
      fileExtension = 'webm';
    }
    
    console.log('🎵 Extension détectée:', fileExtension, 'pour type MIME:', audioBlob.type);

    // Créer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `intervention_${reportId}_${timestamp}.${fileExtension}`;
    const filePath = `interventions/${userId}/${fileName}`;

    console.log('📁 Chemin d\'upload:', filePath);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('intervention-audios')
      .upload(filePath, audioBlob, {
        contentType: audioBlob.type,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase:', uploadError);
      throw new Error(`Erreur upload: ${uploadError.message}`);
    }

    console.log('✅ Upload réussi:', uploadData);

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('intervention-audios')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('🌐 URL publique générée:', publicUrl);

    onSuccess(publicUrl);
    
  } catch (error) {
    console.error('💥 Erreur générale upload audio intervention adaptatif:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload';
    onError(errorMessage);
  } finally {
    onEnd();
  }
};
