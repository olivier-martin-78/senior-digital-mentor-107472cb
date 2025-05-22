
import { toast } from '@/hooks/use-toast';
import { uploadAudio } from '@/utils/audioUploadUtils';

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const isStorageUrl = (url: string | null): boolean => {
  if (!url) return false;
  
  // Liste des domaines de stockage connus
  const storageDomains = [
    'storage.googleapis.com',
    'supabase',
    'cvcebcisijjmmmwuedcv.supabase.co'
  ];
  
  return storageDomains.some(domain => url.includes(domain));
};

export const getAudioFileExtension = (url: string | null): string => {
  if (!url) return '';
  
  const extensionMatch = url.match(/\.(mp3|wav|webm|aac|ogg)($|\?)/i);
  return extensionMatch ? extensionMatch[1].toLowerCase() : 'webm'; // Par défaut webm si non détecté
};

export const validateAudioUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // Vérifier que l'URL est complète et contient un protocole
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('URL audio invalide (manque protocole):', url);
    return null;
  }
  
  // Vérifier que l'URL contient un domaine
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname) {
      console.warn('URL audio invalide (pas de nom d\'hôte):', url);
      return null;
    }
  } catch (error) {
    console.error('URL audio invalide (format incorrect):', url, error);
    return null;
  }
  
  return url;
};

export const handleExportAudio = (audioUrl: string) => {
  try {
    if (!validateAudioUrl(audioUrl)) {
      throw new Error("URL audio invalide");
    }
    
    // Création d'un élément temporaire pour le téléchargement
    const downloadLink = document.createElement('a');
    downloadLink.href = audioUrl;
    downloadLink.download = `reponse_vocale_${new Date().toISOString().slice(0, 10)}.${getAudioFileExtension(audioUrl)}`;
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

// Fonction permettant de précharger l'audio pour vérifier sa validité
export const preloadAudio = (audioUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!validateAudioUrl(audioUrl)) {
      console.error("URL audio invalide lors du préchargement:", audioUrl);
      resolve(false);
      return;
    }
    
    console.log(`Préchargement de l'audio: ${audioUrl}`);
    const audio = new Audio();
    
    // Résoudre après un délai maximum pour éviter les blocages
    const timeoutId = setTimeout(() => {
      console.warn("Timeout du préchargement audio:", audioUrl);
      resolve(false);
    }, 5000);
    
    audio.onloadeddata = () => {
      clearTimeout(timeoutId);
      console.log("Audio préchargé avec succès:", audioUrl);
      resolve(true);
    };
    
    audio.onerror = () => {
      clearTimeout(timeoutId);
      console.error("Erreur lors du préchargement audio:", audioUrl);
      resolve(false);
    };
    
    // Ajouter un type MIME pour améliorer la compatibilité
    audio.src = audioUrl;
    audio.preload = "metadata";
    audio.load();
  });
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
    if (onError) onError("Utilisateur non authentifié");
    if (onUploadEnd) onUploadEnd();
    return;
  }
  
  if (!blob || blob.size === 0) {
    console.error("Blob audio invalide (taille nulle)");
    if (onError) onError("Enregistrement audio invalide");
    if (onUploadEnd) onUploadEnd();
    return;
  }
  
  console.log(`Préparation à l'upload du blob: ${blob.size} octets, type: ${blob.type}`);
  
  if (onUploadStart) {
    onUploadStart();
  }
  
  // Vérifions si le blob est de type audio avant de continuer
  if (!blob.type.startsWith('audio/')) {
    console.warn(`Type de blob non standard: ${blob.type}, tentative d'upload quand même`);
  }
  
  uploadAudio(
    blob,
    userId,
    chapterId,
    questionId,
    (url: string) => {
      console.log("Audio téléchargé avec succès:", url);
      // Vérifier que l'URL est valide avant de la retourner
      if (validateAudioUrl(url)) {
        onSuccess(url);
      } else {
        if (onError) onError("L'URL de l'audio téléchargé est invalide");
      }
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
