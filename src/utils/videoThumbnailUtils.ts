
/**
 * Générer une vignette à partir d'une vidéo avec compatibilité iOS améliorée
 * @param videoFile Le fichier vidéo
 * @param timeInSeconds Le moment où capturer la vignette (par défaut: 1 seconde)
 * @returns Promise<File> Le fichier image de la vignette
 */
export const generateVideoThumbnail = (videoFile: File, timeInSeconds: number = 1): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Impossible de créer le contexte canvas'));
      return;
    }
    
    // Configuration spécifique pour iOS
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';
    
    // Timeout pour éviter les blocages
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout lors de la génération de la vignette'));
    }, 30000);
    
    const cleanup = () => {
      clearTimeout(timeout);
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
      video.remove();
    };
    
    video.onloadedmetadata = () => {
      try {
        // Définir la taille du canvas avec des dimensions raisonnables
        const maxSize = 800;
        const aspectRatio = video.videoWidth / video.videoHeight;
        
        if (video.videoWidth > video.videoHeight) {
          canvas.width = Math.min(maxSize, video.videoWidth);
          canvas.height = canvas.width / aspectRatio;
        } else {
          canvas.height = Math.min(maxSize, video.videoHeight);
          canvas.width = canvas.height * aspectRatio;
        }
        
        // Aller au moment spécifié (limité à la durée de la vidéo)
        const seekTime = Math.min(timeInSeconds, video.duration * 0.1); // Maximum 10% de la durée
        video.currentTime = seekTime;
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    
    video.onseeked = () => {
      try {
        // Attendre un peu pour s'assurer que la frame est chargée
        setTimeout(() => {
          try {
            // Dessiner la frame actuelle sur le canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir le canvas en blob puis en file avec une qualité réduite pour iOS
            canvas.toBlob((blob) => {
              cleanup();
              if (blob) {
                const thumbnailFile = new File(
                  [blob], 
                  `thumbnail-${videoFile.name.replace(/\.[^/.]+$/, '')}.jpg`,
                  { type: 'image/jpeg' }
                );
                resolve(thumbnailFile);
              } else {
                reject(new Error('Impossible de générer la vignette'));
              }
            }, 'image/jpeg', 0.7); // Qualité réduite pour la compatibilité
          } catch (error) {
            cleanup();
            reject(error);
          }
        }, 100);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    
    video.onerror = (error) => {
      cleanup();
      reject(new Error('Erreur lors du chargement de la vidéo: ' + (error instanceof Event ? 'Erreur de chargement' : error)));
    };
    
    video.onabort = () => {
      cleanup();
      reject(new Error('Chargement de la vidéo interrompu'));
    };
    
    // Charger la vidéo
    try {
      video.src = URL.createObjectURL(videoFile);
      video.load(); // Force le chargement sur iOS
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
};

/**
 * Vérifier si un fichier est une vidéo
 * @param file Le fichier à vérifier
 * @returns boolean
 */
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * Détecter si nous sommes sur un appareil iOS
 * @returns boolean
 */
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Vérifier si la génération de vignettes est supportée sur l'appareil
 * @returns boolean
 */
export const isThumbnailGenerationSupported = (): boolean => {
  // Vérifier la disponibilité des API nécessaires
  const hasCanvas = !!document.createElement('canvas').getContext;
  const hasCreateObjectURL = !!URL.createObjectURL;
  const hasVideoElement = !!document.createElement('video');
  
  return hasCanvas && hasCreateObjectURL && hasVideoElement;
};
