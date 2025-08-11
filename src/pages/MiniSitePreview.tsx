import React, { useState, useEffect } from 'react';
import { MiniSiteData } from '@/hooks/useMiniSite';
import { PublicMiniSite } from './PublicMiniSite';

export const MiniSitePreview: React.FC = () => {
  const [previewData, setPreviewData] = useState<MiniSiteData | null>(null);

  useEffect(() => {
    // Load preview data from sessionStorage
    const storedData = sessionStorage.getItem('miniSitePreview');
    const timestamp = sessionStorage.getItem('miniSitePreviewTimestamp');
    
    console.log('🔍 [PREVIEW_DEBUG] Loading preview data...', { 
      timestamp,
      hasStoredData: !!storedData,
      storedDataLength: storedData?.length || 0
    });
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('🔍 [PREVIEW_DEBUG] Preview data parsed successfully:', {
          hasData: !!parsedData,
          designStyle: parsedData?.design_style,
          colorPalette: parsedData?.color_palette,
          hasReviews: parsedData?.reviews?.length || 0,
          dataKeys: Object.keys(parsedData || {})
        });
        
        // Force a small delay to ensure CSS is loaded
        setTimeout(() => {
          console.log('🔍 [PREVIEW_DEBUG] Setting preview data to state');
          setPreviewData(parsedData);
        }, 100);
      } catch (error) {
        console.error('🚨 [PREVIEW_DEBUG] Error parsing preview data:', error);
        console.log('🚨 [PREVIEW_DEBUG] Raw stored data:', storedData);
      }
    } else {
      console.log('🚨 [PREVIEW_DEBUG] No stored data found in sessionStorage');
    }
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