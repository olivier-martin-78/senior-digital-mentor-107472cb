import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface IPhoneAudioFallbackProps {
  audioUrl: string;
  className?: string;
}

const IPhoneAudioFallback: React.FC<IPhoneAudioFallbackProps> = ({
  audioUrl,
  className = ""
}) => {
  const handleDownload = async () => {
    try {
      // Télécharger le fichier directement
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error('Impossible de télécharger le fichier audio');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `enregistrement_${new Date().toISOString().slice(0, 10)}.webm`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: "L'enregistrement a été téléchargé. Vous pouvez l'ouvrir avec une autre application.",
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger l'enregistrement.",
        variant: "destructive",
      });
    }
  };

  const handleOpenInBrowser = () => {
    window.open(audioUrl, '_blank');
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Lecture audio sur iPhone
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            Les enregistrements audio ne peuvent pas être lus directement sur iPhone. 
            Vous pouvez télécharger le fichier ou l'ouvrir dans une autre application.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger l'enregistrement
            </Button>
            <Button
              onClick={handleOpenInBrowser}
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir dans le navigateur
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPhoneAudioFallback;