
export const validateAudioUrl = (audioUrl: string | null): boolean => {
  if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.trim() === '') {
    return false;
  }
  
  const trimmedUrl = audioUrl.trim();
  
  // Si c'est un chemin relatif (pas d'http/https), le considérer comme valide
  // car il sera converti en URL complète par getAudioUrl
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('blob:')) {
    // C'est probablement un chemin de stockage Supabase relatif
    return trimmedUrl.length > 0;
  }
  
  // Pour les URLs complètes, vérifier qu'elles sont valides
  try {
    new URL(trimmedUrl);
    return true;
  } catch {
    return false;
  }
};

export const getAudioUrl = (audioPath: string | null): string | null => {
  if (!validateAudioUrl(audioPath)) {
    return null;
  }
  
  const trimmedPath = audioPath!.trim();
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://') || trimmedPath.startsWith('blob:')) {
    return trimmedPath;
  }
  
  // Sinon, construire l'URL complète pour Supabase Storage avec le bon nom de bucket
  const supabaseUrl = 'https://cvcebcisijjmmmwuedcv.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/life-story-audios/${trimmedPath}`;
};

export const preloadAudio = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    
    const onLoad = () => {
      cleanup();
      resolve(true);
    };
    
    const onError = () => {
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      audio.removeEventListener('loadeddata', onLoad);
      audio.removeEventListener('error', onError);
      audio.src = '';
    };
    
    audio.addEventListener('loadeddata', onLoad);
    audio.addEventListener('error', onError);
    
    // Timeout pour éviter les attentes infinies
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
    
    audio.src = url;
    audio.load();
  });
};

export const handleExportAudio = async (audioUrl: string) => {
  try {
    // Télécharger le fichier audio depuis l'URL
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error('Impossible de télécharger le fichier audio');
    }
    
    // Créer un blob à partir de la réponse
    const blob = await response.blob();
    
    // Créer une URL temporaire pour le blob
    const blobUrl = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement et le déclencher
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `enregistrement_${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Erreur lors de l\'export audio:', error);
    throw error;
  }
};

export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
