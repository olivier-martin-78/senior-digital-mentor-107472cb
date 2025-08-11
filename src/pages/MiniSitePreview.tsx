import React, { useState, useEffect } from 'react';
import { MiniSiteData } from '@/hooks/useMiniSite';
import { PublicMiniSite } from './PublicMiniSite';

export const MiniSitePreview: React.FC = () => {
  const [previewData, setPreviewData] = useState<MiniSiteData | null>(null);

  useEffect(() => {
    const loadPreviewData = () => {
      try {
        // Get data from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        
        if (encodedData) {
          const decodedData = decodeURIComponent(atob(decodeURIComponent(encodedData)));
          const data = JSON.parse(decodedData);
          setPreviewData(data);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error loading preview data:', error);
        return false;
      }
    };

    loadPreviewData();
  }, []);

  if (!previewData) {
    console.log('🔍 [PREVIEW_DEBUG] PreviewData is null, showing error message');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Aperçu non disponible</h1>
          <p className="text-muted-foreground">
            Aucune donnée de prévisualisation trouvée. Veuillez retourner à l'éditeur.
          </p>
        </div>
      </div>
    );
  }

  console.log('🔍 [PREVIEW_DEBUG] Rendering preview with data:', {
    hasData: !!previewData,
    designStyle: previewData?.design_style
  });

  return (
    <div className="min-h-screen">
      <div className="bg-yellow-100 border-b border-yellow-200 p-3 text-center">
        <span className="text-yellow-800 font-medium">
          🔍 Mode Prévisualisation - Ce mini-site n'est pas encore publié
        </span>
      </div>
      <PublicMiniSite data={previewData} isPreview={true} />
    </div>
  );
};