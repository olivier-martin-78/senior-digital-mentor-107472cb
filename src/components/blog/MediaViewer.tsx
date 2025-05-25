
import React, { useEffect, useCallback } from 'react';
import { BlogMedia } from '@/types/supabase';
import { Dialog, DialogContent, VisuallyHidden, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 bg-black/95">
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
          className="flex items-center justify-center w-full h-full p-4"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {currentMedia.media_type.startsWith('image/') ? (
            <img
              src={currentMedia.media_url}
              alt="Media en plein écran"
              className="max-w-full max-h-full object-contain"
            />
          ) : currentMedia.media_type.startsWith('video/') ? (
            <video
              src={currentMedia.media_url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
            />
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
