
import heic2any from 'heic2any';

export const isHeicFile = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    console.log('🔄 Début conversion HEIC:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // Vérifier si le fichier est valide
    if (!file || file.size === 0) {
      throw new Error('Le fichier est vide ou invalide');
    }

    // Vérifier la taille du fichier (limite à 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 50MB)');
    }
    
    console.log('📱 Conversion HEIC en cours...');
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });
    
    console.log('✅ Conversion HEIC terminée:', typeof convertedBlob, Array.isArray(convertedBlob));
    
    // heic2any peut retourner un Blob ou un array de Blobs
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('La conversion a échoué - résultat invalide');
    }
    
    console.log('📄 Blob converti:', {
      size: blob.size,
      type: blob.type
    });
    
    // Créer un nouveau fichier avec le blob converti et s'assurer de l'extension .jpg
    const originalName = file.name.replace(/\.(heic|heif)$/i, '');
    const convertedFile = new File(
      [blob], 
      `${originalName}.jpg`, 
      { type: 'image/jpeg' }
    );
    
    console.log('🎯 Fichier HEIC converti avec succès:', {
      originalName: file.name,
      convertedName: convertedFile.name,
      originalSize: file.size,
      convertedSize: convertedFile.size,
      type: convertedFile.type
    });
    
    return convertedFile;
  } catch (error) {
    console.error('❌ Erreur détaillée lors de la conversion HEIC:', {
      error,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    // Messages d'erreur plus spécifiques selon le type d'erreur
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Erreur de réseau lors de la conversion. Vérifiez votre connexion internet.');
      }
      if (error.message.includes('memory') || error.message.includes('heap')) {
        throw new Error('Le fichier est trop volumineux pour être traité. Essayez avec une image plus petite.');
      }
      if (error.message.includes('format') || error.message.includes('invalid')) {
        throw new Error('Le format du fichier HEIC n\'est pas supporté ou le fichier est corrompu.');
      }
    }
    
    throw new Error('Impossible de convertir le fichier HEIC. Veuillez essayer avec un fichier JPEG ou PNG.');
  }
};

export const processImageFile = async (file: File): Promise<File> => {
  console.log('🔍 Traitement du fichier:', {
    name: file.name,
    type: file.type,
    size: file.size,
    isHeic: isHeicFile(file)
  });
  
  if (isHeicFile(file)) {
    console.log('📱 Fichier HEIC détecté, conversion nécessaire');
    return await convertHeicToJpeg(file);
  }
  
  console.log('✅ Fichier déjà au bon format, aucune conversion nécessaire');
  return file;
};
