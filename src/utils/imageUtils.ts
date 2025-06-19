
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
  // Cette fonction est maintenant gérée côté serveur
  // Pour le moment, on retourne le fichier tel quel
  console.log('⚠️ Conversion HEIC locale désactivée - utilisation du serveur');
  
  // En attendant l'implémentation serveur complète, on suggère à l'utilisateur
  // de convertir le fichier avant l'upload
  throw new Error(
    'Les fichiers HEIC doivent être convertis avant l\'upload. ' +
    'Sur iPhone, activez "Plus compatible" dans Réglages > Appareil photo > Formats ' +
    'pour prendre des photos en JPEG.'
  );
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
  
  // Pour les fichiers HEIC, suggérer la conversion avant upload
  if (isHeicFile(file)) {
    console.log('📱 Fichier HEIC détecté - conversion requise avant upload');
    throw new Error(
      'Les fichiers HEIC ne sont pas supportés pour l\'upload. ' +
      'Veuillez convertir vos images en JPEG avant de les télécharger. ' +
      'Sur iPhone : Réglages > Appareil photo > Formats > "Plus compatible".'
    );
  }
  
  console.log('✅ Fichier standard, aucune conversion nécessaire');
  return file;
};
