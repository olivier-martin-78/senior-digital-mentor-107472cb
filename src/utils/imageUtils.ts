
import heic2any from 'heic2any';

export const isHeicFile = (file: File): boolean => {
  const hasHeicType = file.type === 'image/heic' || file.type === 'image/heif';
  const hasHeicExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
  
  console.log('🔍 Détection HEIC:', {
    fileName: file.name,
    fileType: file.type,
    hasHeicType,
    hasHeicExtension,
    isHeic: hasHeicType || hasHeicExtension
  });
  
  return hasHeicType || hasHeicExtension;
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    console.log('🔄 Début conversion HEIC:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // Vérifications préliminaires
    if (!file || file.size === 0) {
      throw new Error('Le fichier est vide ou invalide');
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 50MB)');
    }

    // Tenter la conversion avec des paramètres optimisés
    console.log('📱 Lancement de la conversion HEIC...');
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9, // Augmentation de la qualité
    });
    
    console.log('✅ Conversion HEIC réussie:', {
      resultType: typeof convertedBlob,
      isArray: Array.isArray(convertedBlob),
      blobSize: Array.isArray(convertedBlob) ? convertedBlob[0]?.size : convertedBlob?.size
    });
    
    // Gestion du résultat de la conversion
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    if (!blob || !(blob instanceof Blob)) {
      console.error('❌ Blob invalide après conversion:', blob);
      throw new Error('La conversion a échoué - résultat invalide');
    }
    
    // Création du fichier converti
    const originalName = file.name.replace(/\.(heic|heif)$/i, '');
    const convertedFile = new File(
      [blob], 
      `${originalName}.jpg`, 
      { 
        type: 'image/jpeg',
        lastModified: Date.now()
      }
    );
    
    console.log('🎯 Fichier HEIC converti avec succès:', {
      originalName: file.name,
      originalSize: file.size,
      originalType: file.type,
      convertedName: convertedFile.name,
      convertedSize: convertedFile.size,
      convertedType: convertedFile.type
    });
    
    return convertedFile;
  } catch (error) {
    console.error('💥 Erreur lors de la conversion HEIC:', {
      error,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });
    
    // Messages d'erreur plus spécifiques
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('load')) {
        throw new Error('Erreur de chargement de la librairie de conversion. Vérifiez votre connexion internet.');
      }
      
      if (errorMsg.includes('memory') || errorMsg.includes('heap') || errorMsg.includes('quota')) {
        throw new Error('Le fichier est trop volumineux pour être traité. Essayez avec une image plus petite.');
      }
      
      if (errorMsg.includes('format') || errorMsg.includes('invalid') || errorMsg.includes('corrupt')) {
        throw new Error('Le format du fichier n\'est pas valide ou le fichier est corrompu.');
      }
      
      if (errorMsg.includes('timeout')) {
        throw new Error('La conversion a pris trop de temps. Essayez avec un fichier plus petit.');
      }
    }
    
    // Erreur générique si aucune correspondance
    throw new Error('Impossible de convertir le fichier HEIC. Le fichier pourrait être corrompu ou dans un format non supporté.');
  }
};

export const processImageFile = async (file: File): Promise<File> => {
  console.log('🔍 Traitement du fichier:', {
    name: file.name,
    type: file.type,
    size: `${Math.round(file.size / 1024)}KB`,
    isHeicDetected: isHeicFile(file)
  });
  
  // Vérification de base
  if (!file) {
    throw new Error('Aucun fichier sélectionné');
  }
  
  if (isHeicFile(file)) {
    console.log('📱 Fichier HEIC détecté, conversion nécessaire');
    try {
      const convertedFile = await convertHeicToJpeg(file);
      console.log('✅ Conversion HEIC terminée avec succès');
      return convertedFile;
    } catch (conversionError) {
      console.error('❌ Échec de la conversion HEIC:', conversionError);
      throw conversionError;
    }
  }
  
  console.log('✅ Fichier standard, aucune conversion nécessaire');
  return file;
};
