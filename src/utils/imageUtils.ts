
import heic2any from 'heic2any';

export const isHeicFile = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    console.log('Converting HEIC file:', file.name);
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });
    
    // heic2any peut retourner un Blob ou un array de Blobs
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Créer un nouveau fichier avec le blob converti et s'assurer de l'extension .jpg
    const originalName = file.name.replace(/\.(heic|heif)$/i, '');
    const convertedFile = new File(
      [blob], 
      `${originalName}.jpg`, 
      { type: 'image/jpeg' }
    );
    
    console.log('HEIC file converted successfully:', convertedFile.name, 'Type:', convertedFile.type);
    return convertedFile;
  } catch (error) {
    console.error('Error converting HEIC file:', error);
    throw new Error('Impossible de convertir le fichier HEIC. Veuillez essayer avec un autre format.');
  }
};

export const processImageFile = async (file: File): Promise<File> => {
  if (isHeicFile(file)) {
    return await convertHeicToJpeg(file);
  }
  return file;
};
