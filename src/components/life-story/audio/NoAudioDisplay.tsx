
import React from 'react';

interface NoAudioDisplayProps {
  audioUrl?: string;
  className?: string;
}

const NoAudioDisplay: React.FC<NoAudioDisplayProps> = ({
  audioUrl,
  className = ""
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
      <p className="text-sm text-gray-500">Aucun enregistrement audio disponible</p>
      {audioUrl && (
        <p className="text-xs text-gray-400 mt-1">URL originale: {audioUrl}</p>
      )}
    </div>
  );
};

export default NoAudioDisplay;
