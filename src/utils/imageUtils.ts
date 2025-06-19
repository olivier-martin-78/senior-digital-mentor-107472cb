
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
  
  // Pour les fichiers HEIC, tenter la conversion
  if (isHeicFile(file)) {
    console.log('📱 Fichier HEIC détecté - conversion en cours...');
    return await convertHeicToJpeg(file);
  }
  
  console.log('✅ Fichier standard, aucune conversion nécessaire');
  return file;
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
