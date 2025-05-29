
/**
 * Générer une vignette à partir d'une vidéo
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
    
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      // Définir la taille du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Aller au moment spécifié
      video.currentTime = Math.min(timeInSeconds, video.duration);
    };
    
    video.onseeked = () => {
      try {
        // Dessiner la frame actuelle sur le canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir le canvas en blob puis en file
        canvas.toBlob((blob) => {
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
        }, 'image/jpeg', 0.8);
      } catch (error) {
        reject(error);
      } finally {
        // Nettoyer
        video.remove();
        canvas.remove();
      }
    };
    
    video.onerror = () => {
      reject(new Error('Erreur lors du chargement de la vidéo'));
    };
    
    // Charger la vidéo
    video.src = URL.createObjectURL(videoFile);
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
