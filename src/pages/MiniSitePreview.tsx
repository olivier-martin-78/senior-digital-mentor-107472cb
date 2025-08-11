import React, { useState, useEffect } from 'react';
import { MiniSiteData } from '@/hooks/useMiniSite';
import { PublicMiniSite } from './PublicMiniSite';

export const MiniSitePreview: React.FC = () => {
  const [previewData, setPreviewData] = useState<MiniSiteData | null>(null);

  useEffect(() => {
    // Load preview data from sessionStorage
    const storedData = sessionStorage.getItem('miniSitePreview');
    const timestamp = sessionStorage.getItem('miniSitePreviewTimestamp');
    
    console.log('Loading preview data...', { timestamp });
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('Preview data loaded:', parsedData);
        console.log('Design style from preview:', parsedData.design_style);
        console.log('Color palette from preview:', parsedData.color_palette);
        
        // Force a small delay to ensure CSS is loaded
        setTimeout(() => {
          setPreviewData(parsedData);
        }, 100);
      } catch (error) {
        console.error('Error parsing preview data:', error);
      }
    }
  }, []);

  if (!previewData) {
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