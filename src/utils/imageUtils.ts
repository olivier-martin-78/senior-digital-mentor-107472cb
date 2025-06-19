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

// Nouvelle fonction pour détecter si la conversion est nécessaire
export const needsHeicConversion = async (file: File): Promise<boolean> => {
  if (!isHeicFile(file)) {
    return false;
  }

  // Sur Windows avec des navigateurs modernes, certains fichiers HEIC peuvent s'afficher sans conversion
  // Tester si le navigateur peut afficher le fichier HEIC nativement
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    // Timeout pour éviter d'attendre trop longtemps
    const timeout = setTimeout(() => {
      cleanup();
      console.log('⏱️ Timeout - conversion nécessaire pour:', file.name);
      resolve(true); // Si timeout, on assume qu'il faut convertir
    }, 2000);
    
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
    isHeicDetected: isHeicFile(file)
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
  let processedCount = 0;

  // Identifier les fichiers HEIC qui nécessitent une conversion
  const heicFiles: File[] = [];
  const regularFiles: File[] = [];

  for (const file of files) {
    if (isHeicFile(file)) {
      const conversionNeeded = await needsHeicConversion(file);
      if (conversionNeeded) {
        heicFiles.push(file);
      } else {
        regularFiles.push(file);
      }
    } else {
      regularFiles.push(file);
    }
  }

  const totalHeicFiles = heicFiles.length;
  const totalFiles = files.length;

  console.log('📊 Analyse des fichiers:', {
    total: totalFiles,
    heicNeedingConversion: heicFiles.length,
    regularFiles: regularFiles.length
  });

  // Traiter d'abord les fichiers réguliers (rapide)
  for (const file of regularFiles) {
    processedFiles.push(file);
    processedCount++;
    
    if (onProgress) {
      onProgress({
        totalFiles: totalHeicFiles, // On ne compte que les HEIC dans la progression
        processedFiles: 0, // Pas encore de HEIC traités
        errors,
        isComplete: false
      });
    }
  }

  // Traiter les fichiers HEIC nécessitant une conversion
  for (let i = 0; i < heicFiles.length; i++) {
    const file = heicFiles[i];
    
    if (onProgress) {
      onProgress({
        totalFiles: totalHeicFiles,
        processedFiles: i,
        currentFileName: file.name,
        errors,
        isComplete: false
      });
    }

    try {
      const convertedFile = await convertHeicToJpeg(file);
      processedFiles.push(convertedFile);
    } catch (error) {
      console.error('❌ Erreur lors de la conversion de', file.name, ':', error);
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      // Ajouter le fichier original en cas d'échec
      processedFiles.push(file);
    }
  }

  // Finaliser la progression
  if (onProgress) {
    onProgress({
      totalFiles: totalHeicFiles,
      processedFiles: heicFiles.length,
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
