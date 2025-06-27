
import React from 'react';
import { Download } from 'lucide-react';

interface IPadAudioFallbackProps {
  audioUrl: string;
  className?: string;
}

const IPadAudioFallback: React.FC<IPadAudioFallbackProps> = ({
  audioUrl,
  className = ""
}) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Lecture audio sur iPad
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            Le format de cet enregistrement audio n'est pas compatible avec iPad. 
            Vous pouvez télécharger le fichier pour l'écouter avec une autre application.
          </p>
          <a
            href={audioUrl}
            download
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger l'enregistrement
          </a>
          <p className="text-xs text-blue-600 mt-2">
            Conseil : Utilisez l'application "Fichiers" ou "VLC" pour écouter le fichier téléchargé.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IPadAudioFallback;
