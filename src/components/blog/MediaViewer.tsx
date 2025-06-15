
import React, { useEffect, useCallback, useState } from 'react';
import { BlogMedia } from '@/types/supabase';
import { Dialog, DialogContent, VisuallyHidden, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Play, Download, AlertCircle, Smartphone, Monitor } from 'lucide-react';

interface MediaViewerProps {
  media: BlogMedia[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  media,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const currentMedia = media[currentIndex];
  const [videoError, setVideoError] = useState(false);
  const [videoRetryCount, setVideoRetryCount] = useState(0);
  const [manualPlayMode, setManualPlayMode] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isQuickTimeVideo, setIsQuickTimeVideo] = useState(false);

  // Détecter si c'est une vidéo QuickTime/iPhone
  const isQuickTime = currentMedia.media_type === 'video/quicktime' || 
                     currentMedia.media_type === 'video/mov' ||
                     currentMedia.media_url.toLowerCase().includes('.mov');

  // Détecter si on est sur mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Navigation par clavier
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      onNavigate('prev');
    } else if (event.key === 'ArrowRight') {
      onNavigate('next');
    } else if (event.key === 'Escape') {
      onClose();
    }
  }, [onNavigate, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Gestion du swipe sur mobile
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onNavigate('next');
    } else if (isRightSwipe) {
      onNavigate('prev');
    }
  };

  useEffect(() => {
    // Reset states when media changes
    setVideoError(false);
    setVideoRetryCount(0);
    setManualPlayMode(false);
    setIsVideoLoading(false);
    setIsQuickTimeVideo(isQuickTime);

    // Si c'est une vidéo QuickTime sur desktop, proposer directement le mode manuel
    if (isQuickTime && !isMobile) {
      setManualPlayMode(true);
    }
  }, [currentIndex, isQuickTime, isMobile]);

  const handleVideoError = useCallback((error: any) => {
    console.error('Erreur vidéo détectée:', {
      mediaUrl: currentMedia.media_url,
      mediaType: currentMedia.media_type,
      error: error?.target?.error,
      readyState: error?.target?.readyState,
      networkState: error?.target?.networkState,
      isQuickTime,
      isMobile
    });
    
    setIsVideoLoading(false);
    
    // Pour les vidéos QuickTime, passer directement au téléchargement
    if (isQuickTime) {
      setVideoError(true);
      return;
    }
    
    if (videoRetryCount < 2) {
      setVideoRetryCount(prev => prev + 1);
      setTimeout(() => {
        if (videoRetryCount === 0) {
          setManualPlayMode(true);
        } else {
          setVideoError(true);
        }
      }, 1000);
    } else {
      setVideoError(true);
    }
  }, [currentMedia.media_url, currentMedia.media_type, videoRetryCount, isQuickTime, isMobile]);

  const handleManualPlay = () => {
    setIsVideoLoading(true);
    setVideoError(false);
    setManualPlayMode(false);
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false);
    setVideoError(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentMedia.media_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const urlParts = currentMedia.media_url.split('/');
      const fileName = urlParts[urlParts.length - 1] || `video-${Date.now()}.mov`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  // Composant pour l'interface QuickTime spécifique
  const QuickTimeInterface = () => (
    <div className="flex flex-col items-center justify-center bg-black/80 text-white p-8 rounded max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="h-12 w-12 text-blue-400" />
        <X className="h-6 w-6 text-gray-400" />
        <Monitor className="h-12 w-12 text-orange-400" />
      </div>
      <h3 className="text-xl font-bold mb-2">Vidéo iPhone (.mov)</h3>
      <p className="text-sm text-gray-300 mb-4 text-center">
        Ce format n'est pas toujours compatible avec les navigateurs desktop.
      </p>
      <div className="text-xs text-gray-400 mb-6 text-center bg-gray-800 p-2 rounded">
        Format : {currentMedia.media_type}
      </div>
      
      <div className="flex flex-col gap-3 w-full">
        {!isMobile && (
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-300 mb-2">
              <Smartphone className="h-4 w-4" />
              <span>Recommandé : Ouvrir sur mobile</span>
            </div>
          </div>
        )}
        
        {!manualPlayMode && !videoError && (
          <Button 
            onClick={handleManualPlay}
            className="bg-blue-600 hover:bg-blue-700 w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Essayer de lire
          </Button>
        )}
        
        <Button 
          onClick={handleDownload}
          variant="outline"
          className="text-white border-white hover:bg-white/10 w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger la vidéo
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Les vidéos iPhone (.mov) sont mieux supportées sur les appareils mobiles
      </p>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 bg-black/95 border-none">
        <VisuallyHidden>
          <DialogTitle>Visualisation des médias</DialogTitle>
        </VisuallyHidden>
        
        {/* Bouton fermer */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Compteur */}
        <div className="absolute top-4 left-4 z-50 text-white bg-black/50 px-3 py-1 rounded">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Boutons de navigation (desktop) */}
        {media.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 hidden md:flex"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 hidden md:flex"
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Contenu média */}
        <div 
          className="flex items-center justify-center w-full h-full md:p-8"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {currentMedia.media_type.startsWith('image/') ? (
            <img
              src={currentMedia.media_url}
              alt="Media en plein écran"
              className="w-full h-auto max-h-full object-contain md:max-w-full md:w-auto"
              style={{ 
                maxWidth: '100vw',
                maxHeight: '100vh'
              }}
            />
          ) : currentMedia.media_type.startsWith('video/') ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Interface spéciale pour QuickTime sur desktop */}
              {isQuickTime && !isMobile && (manualPlayMode || videoError) ? (
                <QuickTimeInterface />
              ) : !videoError && !manualPlayMode ? (
                <video
                  key={`${currentMedia.id}-${videoRetryCount}`}
                  src={currentMedia.media_url}
                  controls
                  autoPlay={videoRetryCount === 0 && !isQuickTime}
                  muted={videoRetryCount === 0}
                  playsInline
                  className="w-full h-auto max-h-full object-contain md:max-w-full md:w-auto"
                  style={{ 
                    maxWidth: '100vw',
                    maxHeight: '100vh'
                  }}
                  onError={handleVideoError}
                  onCanPlay={handleVideoCanPlay}
                  onLoadStart={() => setIsVideoLoading(true)}
                />
              ) : manualPlayMode && !isQuickTime ? (
                <div className="flex flex-col items-center justify-center bg-black/80 text-white p-8 rounded max-w-md mx-auto">
                  <Play className="h-16 w-16 mb-4 text-blue-400" />
                  <h3 className="text-xl font-bold mb-2">Lecture manuelle</h3>
                  <p className="text-sm text-gray-300 mb-6 text-center">
                    Cliquez pour lancer la lecture de la vidéo
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleManualPlay}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Lire la vidéo
                    </Button>
                    <Button 
                      onClick={handleDownload}
                      variant="outline"
                      className="text-white border-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-black/80 text-white p-8 rounded max-w-md mx-auto">
                  <AlertCircle className="h-16 w-16 mb-4 text-red-400" />
                  <h3 className="text-xl font-bold mb-2">Erreur de lecture</h3>
                  <p className="text-sm text-gray-300 mb-4 text-center">
                    La vidéo ne peut pas être lue dans votre navigateur.
                  </p>
                  <div className="text-xs text-gray-400 mb-6 text-center">
                    Format : {currentMedia.media_type}
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    <Button 
                      onClick={() => setManualPlayMode(true)}
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Essayer à nouveau
                    </Button>
                    <Button 
                      onClick={handleDownload}
                      variant="outline"
                      className="text-white border-white hover:bg-white/10 w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le fichier
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Vous pouvez télécharger le fichier et le lire avec un lecteur externe
                  </p>
                </div>
              )}
              
              {isVideoLoading && !videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center text-white">
              <p>Fichier non prévisualisable</p>
            </div>
          )}
        </div>

        {/* Indicateurs de swipe pour mobile */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white text-sm bg-black/50 px-3 py-1 rounded md:hidden">
            Glissez pour naviguer
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;
