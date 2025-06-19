
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

// Détection si on est sur un appareil mobile (iPhone/iPad principalement)
const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Nouvelle fonction pour détecter si la conversion est nécessaire
export const needsHeicConversion = async (file: File): Promise<boolean> => {
  if (!isHeicFile(file)) {
    return false;
  }

  // Sur mobile (surtout iPhone), forcer la conversion car le support est incohérent
  if (isMobileDevice()) {
    console.log('📱 Appareil mobile détecté - conversion HEIC forcée pour:', file.name);
    return true;
  }

  // Sur desktop, tester si le navigateur peut afficher le fichier HEIC nativement
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    // Timeout plus court pour éviter d'attendre trop longtemps
    const timeout = setTimeout(() => {
      cleanup();
      console.log('⏱️ Timeout - conversion nécessaire pour:', file.name);
      resolve(true); // Si timeout, on assume qu'il faut convertir
    }, 1000); // Réduit de 2000ms à 1000ms
    
    const cleanup = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      img.onload = null;
      img.onerror = null;
    };
    
    img.onload = () => {
      cleanup();
      console.log('✅ HEIC supporté nativement pour:', file.name);
      resolve(false); // Le navigateur peut afficher le HEIC nativement
    };
    
    img.onerror = () => {
      cleanup();
      console.log('❌ HEIC non supporté - conversion nécessaire pour:', file.name);
      resolve(true); // Conversion nécessaire
    };
    
    img.src = url;
  });
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  console.log('🔄 Conversion HEIC locale avec heic2any pour:', file.name);
  
  try {
    // Dynamically import heic2any to avoid SSR issues
    const { default: heic2any } = await import('heic2any');

    // Convertir le fichier HEIC en JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });

    // heic2any peut retourner un blob ou un array de blobs
    const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Créer un nouveau fichier avec le blob converti
    const convertedFile = new File(
      [finalBlob as Blob], 
      file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    console.log('✅ Conversion HEIC locale réussie:', {
      originalName: file.name,
      convertedName: convertedFile.name,
      originalSize: file.size,
      convertedSize: convertedFile.size
    });

    return convertedFile;
  } catch (error) {
    console.error('❌ Erreur conversion HEIC locale:', error);
    throw new Error(
      'Impossible de convertir le fichier HEIC. ' +
      'Veuillez convertir vos images en JPEG avant de les télécharger.'
    );
  }
};

export interface ConversionProgress {
  totalFiles: number;
  processedFiles: number;
  currentFileName?: string;
  errors: string[];
  isComplete: boolean;
}

export const processImageFile = async (
  file: File, 
  onProgress?: (progress: ConversionProgress) => void
): Promise<File> => {
  console.log('🔍 Traitement du fichier:', {
    name: file.name,
    type: file.type,
    size: Math.round(file.size / 1024) + 'KB',
    isHeicDetected: isHeicFile(file),
    isMobile: isMobileDevice()
  });
  
  // Vérification de base
  if (!file) {
    throw new Error('Aucun fichier sélectionné');
  }
  
  // Pour les fichiers HEIC, vérifier si la conversion est nécessaire
  if (isHeicFile(file)) {
    console.log('📱 Fichier HEIC détecté - vérification de la compatibilité...');
    
    const conversionNeeded = await needsHeicConversion(file);
    
    if (conversionNeeded) {
      console.log('🔄 Conversion nécessaire pour:', file.name);
      if (onProgress) {
        onProgress({
          totalFiles: 1,
          processedFiles: 0,
          currentFileName: file.name,
          errors: [],
          isComplete: false
        });
      }
      
      const convertedFile = await convertHeicToJpeg(file);
      
      if (onProgress) {
        onProgress({
          totalFiles: 1,
          processedFiles: 1,
          currentFileName: file.name,
          errors: [],
          isComplete: true
        });
      }
      
      return convertedFile;
    } else {
      console.log('✅ HEIC supporté nativement, aucune conversion nécessaire');
    }
  }
  
  console.log('✅ Fichier standard, aucune conversion nécessaire');
  return file;
};

// Fonction pour traiter plusieurs fichiers avec progression
export const processMultipleImageFiles = async (
  files: File[],
  onProgress?: (progress: ConversionProgress) => void
): Promise<File[]> => {
  const processedFiles: File[] = [];
  const errors: string[] = [];

  // Identifier les fichiers HEIC qui nécessitent une conversion
  const heicFiles: File[] = [];
  const regularFiles: File[] = [];

  // Première passe: séparer les fichiers HEIC des autres
  for (const file of files) {
    if (isHeicFile(file)) {
      heicFiles.push(file);
    } else {
      regularFiles.push(file);
    }
  }

  console.log('📊 Analyse des fichiers:', {
    total: files.length,
    heicFiles: heicFiles.length,
    regularFiles: regularFiles.length,
    isMobile: isMobileDevice()
  });

  // Évaluation rapide: sur mobile, tous les HEIC seront convertis
  let totalFilesToConvert = heicFiles.length;
  if (!isMobileDevice()) {
    // Sur desktop, on doit tester chaque fichier HEIC
    const conversionTests = await Promise.all(
      heicFiles.map(file => needsHeicConversion(file))
    );
    totalFilesToConvert = conversionTests.filter(Boolean).length;
  }

  console.log('🔄 Fichiers HEIC à convertir:', totalFilesToConvert);

  // Si pas de fichiers à convertir, retourner directement
  if (totalFilesToConvert === 0) {
    return files;
  }

  // Démarrer la progression si nécessaire
  if (onProgress && totalFilesToConvert > 0) {
    onProgress({
      totalFiles: totalFilesToConvert,
      processedFiles: 0,
      errors,
      isComplete: false
    });
  }

  // Traiter d'abord les fichiers réguliers (rapide)
  processedFiles.push(...regularFiles);

  // Traiter les fichiers HEIC
  let convertedCount = 0;
  for (const file of heicFiles) {
    const needsConversion = isMobileDevice() || await needsHeicConversion(file);
    
    if (needsConversion) {
      if (onProgress) {
        onProgress({
          totalFiles: totalFilesToConvert,
          processedFiles: convertedCount,
          currentFileName: file.name,
          errors,
          isComplete: false
        });
      }

      try {
        const convertedFile = await convertHeicToJpeg(file);
        processedFiles.push(convertedFile);
        convertedCount++;
      } catch (error) {
        console.error('❌ Erreur lors de la conversion de', file.name, ':', error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        // Ajouter le fichier original en cas d'échec
        processedFiles.push(file);
      }
    } else {
      // Fichier HEIC supporté nativement, pas de conversion
      processedFiles.push(file);
    }
  }

  // Finaliser la progression
  if (onProgress && totalFilesToConvert > 0) {
    onProgress({
      totalFiles: totalFilesToConvert,
      processedFiles: convertedCount,
      errors,
      isComplete: true
    });
  }

  return processedFiles;
};

// Nouvelle fonction pour remplacer un fichier HEIC dans Supabase
export const replaceHeicInSupabase = async (
  originalUrl: string, 
  convertedFile: File,
  bucket: string = 'blog-media'
): Promise<string | null> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Extraire le chemin du fichier original depuis l'URL
    const urlParts = originalUrl.split('/');
    const originalPath = urlParts[urlParts.length - 1];
    
    console.log('🔄 Remplacement du fichier HEIC dans Supabase:', {
      originalUrl,
      originalPath,
      convertedFileName: convertedFile.name,
      bucket
    });
    
    // Supprimer l'ancien fichier HEIC
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([originalPath]);
    
    if (deleteError) {
      console.warn('⚠️ Erreur lors de la suppression du fichier original:', deleteError);
    }
    
    // Créer le nouveau nom de fichier (remplacer .heic par .jpg)
    const newPath = originalPath.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
    
    // Uploader le fichier converti avec le nouveau nom
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(newPath, convertedFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Erreur lors de l\'upload du fichier converti:', uploadError);
      return null;
    }
    
    // Obtenir la nouvelle URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(newPath);
    
    console.log('✅ Fichier HEIC remplacé avec succès:', {
      originalPath,
      newPath,
      newUrl: publicUrl
    });
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Erreur lors du remplacement du fichier HEIC:', error);
    return null;
  }
};
