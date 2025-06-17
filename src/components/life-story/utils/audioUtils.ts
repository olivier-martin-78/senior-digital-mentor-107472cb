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
  
  // Sinon, construire l'URL complète pour Supabase Storage
  const supabaseUrl = 'https://cvcebcisijjmmmwuedcv.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/life-story-audio/${trimmedPath}`;
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

export const handleExportAudio = (audioUrl: string) => {
  try {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `enregistrement_${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors de l\'export audio:', error);
  }
};

export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
