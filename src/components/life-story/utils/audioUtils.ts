
export const validateAudioUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Accepter les URLs Supabase Storage et les blob URLs
  const isSupabaseUrl = url.includes('/storage/v1/object/public/');
  const isBlobUrl = url.startsWith('blob:');
  const isDataUrl = url.startsWith('data:audio/');
  
  return isSupabaseUrl || isBlobUrl || isDataUrl;
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
