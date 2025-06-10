
import heic2any from 'heic2any';

export const isHeicFile = (file: File): boolean => {
  const hasHeicType = file.type === 'image/heic' || file.type === 'image/heif';
  const hasHeicExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
  
  console.log('🔍 Détection HEIC:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
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

    console.log('📱 Lancement de la conversion HEIC...');
    
    // Tentatives multiples avec différents paramètres pour les captures iPhone
    let convertedBlob;
    
    try {
      // Première tentative : JPEG avec qualité optimisée pour iPhone
      console.log('🔄 Tentative 1: Conversion en JPEG qualité 0.9');
      convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
    } catch (firstError) {
      console.log('⚠️ Tentative 1 échouée, essai avec qualité réduite');
      
      try {
        // Deuxième tentative : JPEG avec qualité plus basse
        console.log('🔄 Tentative 2: Conversion en JPEG qualité 0.7');
        convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.7,
        });
      } catch (secondError) {
        console.log('⚠️ Tentative 2 échouée, essai en PNG');
        
        try {
          // Troisième tentative : PNG (sans compression)
          console.log('🔄 Tentative 3: Conversion en PNG');
          convertedBlob = await heic2any({
            blob: file,
            toType: 'image/png',
          });
        } catch (thirdError) {
          console.log('⚠️ Tentative 3 échouée, essai avec paramètres de base');
          
          try {
            // Quatrième tentative : paramètres minimaux
            console.log('🔄 Tentative 4: Conversion avec paramètres minimaux');
            convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
            });
          } catch (fourthError) {
            console.error('❌ Toutes les tentatives de conversion ont échoué');
            console.error('Erreur finale:', fourthError);
            throw new Error('Impossible de convertir ce fichier HEIC. Le fichier pourrait être corrompu ou dans un format HEIC non standard. Essayez de sauvegarder l\'image en JPEG depuis l\'iPhone (Réglages > Appareil photo > Formats > "Plus compatible").');
          }
        }
      }
    }
    
    console.log('✅ Conversion HEIC réussie:', {
      resultType: typeof convertedBlob,
      isArray: Array.isArray(convertedBlob),
      blobSize: Array.isArray(convertedBlob) ? convertedBlob[0]?.size : convertedBlob?.size
    });
    
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
      errorName: error?.name || 'Unknown',
      errorMessage: error?.message || 'Unknown error',
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      stack: error?.stack
    });
    
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
      
      // Pour les erreurs de conversion HEIC spécifiques
      if (errorMsg.includes('heic') || errorMsg.includes('unable') || errorMsg.includes('failed')) {
        throw new Error('Ce fichier HEIC ne peut pas être converti. Sur iPhone, activez "Plus compatible" dans Réglages > Appareil photo > Formats pour prendre des photos en JPEG.');
      }
    }
    
    // Erreur générique avec conseil spécifique iPhone
    throw new Error('Impossible de convertir le fichier HEIC. Sur iPhone, essayez de changer le format dans Réglages > Appareil photo > Formats > "Plus compatible" pour prendre des photos en JPEG.');
  }
};

export const processImageFile = async (file: File): Promise<File> => {
  console.log('🔍 Traitement du fichier:', {
    name: file.name,
    type: file.type,
    size: Math.round(file.size / 1024) + 'KB',
    isHeicDetected: isHeicFile(file)
  });
  
  // Vérification de base
  if (!file) {
    throw new Error('Aucun fichier sélectionné');
  }
  
  // Pour les fichiers HEIC, essayer une approche alternative si la conversion échoue
  if (isHeicFile(file)) {
    console.log('📱 Fichier HEIC détecté, conversion nécessaire');
    try {
      const convertedFile = await convertHeicToJpeg(file);
      console.log('✅ Conversion HEIC terminée avec succès');
      return convertedFile;
    } catch (conversionError) {
      console.error('❌ Échec de la conversion HEIC:', conversionError?.message || 'Erreur inconnue');
      
      // Fallback : suggérer à l'utilisateur de changer le format depuis l'iPhone
      throw new Error('Impossible de convertir le fichier HEIC. Le fichier pourrait être corrompu ou dans un format non supporté. Pour éviter ce problème, activez "Plus compatible" dans Réglages > Appareil photo > Formats sur votre iPhone.');
    }
  }
  
  console.log('✅ Fichier standard, aucune conversion nécessaire');
  return file;
};
