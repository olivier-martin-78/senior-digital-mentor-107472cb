
import { toast } from '@/hooks/use-toast';
import { uploadAudio } from '@/utils/audioUploadUtils';

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const isStorageUrl = (url: string | null): boolean => {
  return url ? url.includes('storage.googleapis.com') || url.includes('supabase') : false;
};

export const handleExportAudio = (audioUrl: string) => {
  try {
    // Create a temporary anchor element to trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = audioUrl;
    downloadLink.download = `reponse_vocale_${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast({
      title: "Téléchargement réussi",
      description: "L'enregistrement audio a été téléchargé sur votre appareil",
      duration: 3000
    });
  } catch (error) {
    console.error("Erreur lors de l'export audio:", error);
    toast({
      title: "Erreur d'export",
      description: "Impossible d'exporter l'enregistrement audio",
      variant: "destructive",
    });
  }
};

export const uploadRecording = (
  blob: Blob, 
  userId: string | undefined, 
  chapterId: string, 
  questionId: string,
  callbacks: {
    onSuccess: (url: string) => void;
    onError?: (errorMessage: string) => void;
    onUploadStart?: () => void;
    onUploadEnd?: () => void;
  }
) => {
  const { onSuccess, onError, onUploadStart, onUploadEnd } = callbacks;
  
  if (!userId) {
    console.error("Impossible de télécharger sans utilisateur authentifié");
    return;
  }
  
  if (onUploadStart) {
    onUploadStart();
  }
  
  uploadAudio(
    blob,
    userId,
    chapterId,
    questionId,
    (url: string) => {
      console.log("Audio téléchargé avec succès:", url);
      onSuccess(url);
    },
    (errorMessage: string) => {
      console.error("Erreur de téléchargement:", errorMessage);
      if (onError) {
        onError(errorMessage);
      } else {
        toast({
          title: "Erreur de téléchargement",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    () => { if (onUploadStart) onUploadStart(); },
    () => { if (onUploadEnd) onUploadEnd(); }
  );
};
