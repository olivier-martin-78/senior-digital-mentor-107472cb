import React, { useState, useEffect } from 'react';
import { MiniSiteData } from '@/hooks/useMiniSite';
import { PublicMiniSite } from './PublicMiniSite';

export const MiniSitePreview: React.FC = () => {
  const [previewData, setPreviewData] = useState<MiniSiteData | null>(null);

  useEffect(() => {
    const loadPreviewData = () => {
      console.log('🔍 [PREVIEW_DEBUG] Starting preview data load process');
      console.log('🔍 [PREVIEW_DEBUG] localStorage available:', typeof(Storage) !== "undefined");
      console.log('🔍 [PREVIEW_DEBUG] All localStorage keys:', Object.keys(localStorage));
      
      const storedData = localStorage.getItem('miniSitePreview');
      const timestamp = localStorage.getItem('miniSitePreviewTimestamp');
      
      console.log('🔍 [PREVIEW_DEBUG] Raw retrieval results:', { 
        timestamp,
        hasStoredData: !!storedData,
        storedDataLength: storedData?.length || 0,
        storedDataType: typeof storedData,
        firstChars: storedData?.substring(0, 100) || 'none'
      });
      
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log('🔍 [PREVIEW_DEBUG] Preview data parsed successfully:', {
            hasData: !!parsedData,
            designStyle: parsedData?.design_style,
            colorPalette: parsedData?.color_palette,
            hasReviews: parsedData?.reviews?.length || 0,
            dataKeys: Object.keys(parsedData || {}),
            parsedType: typeof parsedData
          });
          
          if (parsedData && typeof parsedData === 'object') {
            console.log('✅ [PREVIEW_DEBUG] Setting valid preview data to state');
            setPreviewData(parsedData);
            return;
          } else {
            console.error('🚨 [PREVIEW_DEBUG] Parsed data is not a valid object:', parsedData);
          }
        } catch (error) {
          console.error('🚨 [PREVIEW_DEBUG] Error parsing preview data:', error);
          console.log('🚨 [PREVIEW_DEBUG] Raw stored data:', storedData);
        }
      } else {
        console.log('🚨 [PREVIEW_DEBUG] No stored data found in localStorage');
      }
      
      // If we get here, no valid data was found
      console.log('🚨 [PREVIEW_DEBUG] No valid preview data found, will show error message');
    };

    // Try loading immediately
    loadPreviewData();
    
    // Retry mechanism - try again after a short delay
    const retryTimeout = setTimeout(() => {
      console.log('🔄 [PREVIEW_DEBUG] Retrying data load after delay...');
      loadPreviewData();
    }, 500);
    
    // Cleanup timeout
    return () => clearTimeout(retryTimeout);
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