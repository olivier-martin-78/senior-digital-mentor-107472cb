
import heic2any from 'heic2any';

export const isHeicFile = (file: File): boolean => {
  const hasHeicType = file.type === 'image/heic' || file.type === 'image/heif';
  const hasHeicExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
  
  console.log('🔍 Détection HEIC:', JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    hasHeicType,
    hasHeicExtension,
    isHeic: hasHeicType || hasHeicExtension
  }));
  
  return hasHeicType || hasHeicExtension;
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    console.log('🔄 Début conversion HEIC:', JSON.stringify({
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    }));
    
    // Vérifications préliminaires
    if (!file || file.size === 0) {
      throw new Error('Le fichier est vide ou invalide');
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 50MB)');
    }

    console.log('📱 Lancement de la conversion HEIC...');
    
    // Pour les captures d'écran iPhone, on essaie d'abord avec des paramètres plus permissifs
    let convertedBlob;
    
    try {
      // Première tentative avec des paramètres optimisés pour iPhone
      convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8,
      });
    } catch (firstError) {
      console.log('⚠️ Première tentative échouée, essai avec paramètres alternatifs');
      
      try {
        // Deuxième tentative avec des paramètres différents
        convertedBlob = await heic2any({
          blob: file,
          toType: 'image/png',
          quality: 0.9,
        });
      } catch (secondError) {
        console.error('❌ Toutes les tentatives de conversion ont échoué');
        throw new Error('Impossible de convertir ce fichier HEIC. Il pourrait être dans un format non supporté par votre navigateur.');
      }
    }
    
    console.log('✅ Conversion HEIC réussie:', JSON.stringify({
      resultType: typeof convertedBlob,
      isArray: Array.isArray(convertedBlob),
      blobSize: Array.isArray(convertedBlob) ? convertedBlob[0]?.size : convertedBlob?.size
    }));
    
    // Gestion du résultat de la conversion
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    if (!blob || !(blob instanceof Blob)) {
      console.error('❌ Blob invalide après conversion:', typeof blob);
      throw new Error('La conversion a échoué - résultat invalide');
    }
    
    // Création du fichier converti
    const originalName = file.name.replace(/\.(heic|heif)$/i, '');
    const fileExtension = blob.type === 'image/png' ? '.png' : '.jpg';
    const convertedFile = new File(
      [blob], 
      `${originalName}${fileExtension}`, 
      { 
        type: blob.type,
        lastModified: Date.now()
      }
    );
    
    console.log('🎯 Fichier HEIC converti avec succès:', JSON.stringify({
      originalName: file.name,
      originalSize: file.size,
      originalType: file.type,
      convertedName: convertedFile.name,
      convertedSize: convertedFile.size,
      convertedType: convertedFile.type
    }));
    
    return convertedFile;
  } catch (error) {
    console.error('💥 Erreur lors de la conversion HEIC:', JSON.stringify({
      errorName: error?.name || 'Unknown',
      errorMessage: error?.message || 'Unknown error',
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    }));
    
    // Messages d'erreur plus spécifiques basés sur le type d'erreur
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('load')) {
        throw new Error('Erreur de chargement de la librairie de conversion. Vérifiez votre connexion internet.');
      }
      
      if (errorMsg.includes('memory') || errorMsg.includes('heap') || errorMsg.includes('quota')) {
        throw new Error('Le fichier est trop volumineux pour être traité. Essayez avec une image plus petite.');
      }
      
      if (errorMsg.includes('format') || errorMsg.includes('invalid') || errorMsg.includes('corrupt')) {
        throw new Error('Le format du fichier n\'est pas valide. Essayez d\'enregistrer l\'image en JPEG depuis l\'iPhone.');
      }
      
      if (errorMsg.includes('timeout')) {
        throw new Error('La conversion a pris trop de temps. Essayez avec un fichier plus petit.');
      }
      
      // Erreur spécifique pour les captures d'écran iPhone
      if (errorMsg.includes('non supporté')) {
        throw new Error('Ce type de fichier HEIC n\'est pas supporté. Essayez de sauvegarder l\'image en format JPEG depuis l\'iPhone (Réglages > Appareil photo > Formats > Plus compatible).');
      }
    }
    
    // Erreur générique avec conseil spécifique iPhone
    throw new Error('Impossible de convertir le fichier HEIC. Sur iPhone, essayez de changer le format dans Réglages > Appareil photo > Formats > "Plus compatible" pour prendre des photos en JPEG.');
  }
};

export const processImageFile = async (file: File): Promise<File> => {
  console.log('🔍 Traitement du fichier:', JSON.stringify({
    name: file.name,
    type: file.type,
    size: Math.round(file.size / 1024) + 'KB',
    isHeicDetected: isHeicFile(file)
  }));
  
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
      console.error('❌ Échec de la conversion HEIC:', conversionError?.message || 'Erreur inconnue');
      throw conversionError;
    }
  }
  
  console.log('✅ Fichier standard, aucune conversion nécessaire');
  return file;
};
