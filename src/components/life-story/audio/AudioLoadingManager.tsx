
import React from 'react';

interface AudioLoadingManagerProps {
  isLoading: boolean;
  isIPad: boolean;
  isIOS: boolean;
  className?: string;
}

const AudioLoadingManager: React.FC<AudioLoadingManagerProps> = ({
  isLoading,
  isIPad,
  isIOS,
  className = ""
}) => {
  if (!isLoading) return null;

  return (
    <div className={`text-center py-2 ${className}`}>
      <p className="text-sm text-gray-500">
        {isIPad ? "Vérification de la compatibilité audio..." : 
         isIOS ? "Préparation de l'audio..." : "Chargement de l'audio..."}
      </p>
      {isIPad && (
        <p className="text-xs text-gray-400 mt-1">Patientez un instant...</p>
      )}
    </div>
  );
};

export default AudioLoadingManager;
