
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogMedia } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

interface MediaDownloaderProps {
  media: BlogMedia[];
  postTitle: string;
}

const MediaDownloader: React.FC<MediaDownloaderProps> = ({ media, postTitle }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const downloadAllMedia = async () => {
    if (media.length === 0) {
      toast({
        title: "Aucun média",
        description: "Il n'y a aucun média à télécharger pour cet article.",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Dynamically import JSZip only when needed
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Download all media files and add them to the zip
      const downloadPromises = media.map(async (mediaItem, index) => {
        try {
          const response = await fetch(mediaItem.media_url);
          if (!response.ok) {
            throw new Error(`Échec du téléchargement: ${response.statusText}`);
          }

          const blob = await response.blob();
          
          // Extract file extension from URL or use media type
          const urlParts = mediaItem.media_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          let fileExtension = '';
          
          if (fileName.includes('.')) {
            fileExtension = fileName.split('.').pop() || '';
          } else {
            // Fallback to media type
            const mediaType = mediaItem.media_type;
            if (mediaType.startsWith('image/')) {
              fileExtension = mediaType.split('/')[1];
            } else if (mediaType.startsWith('video/')) {
              fileExtension = mediaType.split('/')[1];
            } else {
              fileExtension = 'bin'; // fallback
            }
          }

          const finalFileName = `media-${index + 1}.${fileExtension}`;
          zip.file(finalFileName, blob);
        } catch (error) {
          console.error(`Erreur lors du téléchargement du média ${index + 1}:`, error);
          toast({
            title: "Erreur de téléchargement",
            description: `Impossible de télécharger le média ${index + 1}`,
            variant: "destructive"
          });
        }
      });

      await Promise.all(downloadPromises);

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean post title for filename
      const cleanTitle = postTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
      link.download = `medias-${cleanTitle}.zip`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement réussi",
        description: `${media.length} média(s) téléchargé(s) dans le fichier ZIP.`
      });

    } catch (error) {
      console.error('Erreur lors de la création du ZIP:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du fichier ZIP.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (media.length === 0) return null;

  return (
    <Button
      onClick={downloadAllMedia}
      disabled={isDownloading}
      variant="outline"
      size="sm"
      className="mb-4"
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? 'Téléchargement...' : `Télécharger tous les médias (${media.length})`}
    </Button>
  );
};

export default MediaDownloader;
