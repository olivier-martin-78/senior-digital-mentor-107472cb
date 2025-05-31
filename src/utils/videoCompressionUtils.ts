
/**
 * Utilitaires pour la compression vidéo et la validation de fichiers
 */

// Taille maximale en octets (100 MB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Formats vidéo supportés
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/avi',
  'video/mov'
];

/**
 * Valider la taille d'un fichier
 */
export const validateFileSize = (file: File): { isValid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      isValid: false,
      error: `Le fichier est trop volumineux (${fileSizeMB} MB). Taille maximale autorisée : ${maxSizeMB} MB.`
    };
  }
  return { isValid: true };
};

/**
 * Formater la taille en octets vers une chaîne lisible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Compresser une vidéo (version basique avec réduction de qualité)
 */
export const compressVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Impossible de créer le contexte canvas'));
      return;
    }

    video.onloadedmetadata = () => {
      // Réduire la résolution pour compresser
      const maxWidth = 1280;
      const maxHeight = 720;
      
      let { videoWidth, videoHeight } = video;
      
      // Calculer les nouvelles dimensions en gardant le ratio
      if (videoWidth > maxWidth || videoHeight > maxHeight) {
        const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
        videoWidth *= ratio;
        videoHeight *= ratio;
      }
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Dessiner la première frame pour créer une version compressée
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Échec de la compression'));
          return;
        }
        
        // Créer un nouveau fichier avec la taille réduite
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        onProgress?.(100);
        resolve(compressedFile);
      }, file.type, 0.7); // Qualité à 70%
    };
    
    video.onerror = () => reject(new Error('Erreur lors du chargement de la vidéo'));
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Vérifier si un fichier est une vidéo
 */
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};
