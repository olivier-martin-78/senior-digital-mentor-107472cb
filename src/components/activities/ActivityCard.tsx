import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isIOS } from '@/utils/platformDetection';
import { Activity } from '@/hooks/useActivities';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface ActivityCardProps {
  title: string;
  link: string;
  isYouTube: boolean;
  videoId?: string;
  thumbnailUrl?: string;
  activityDate?: string;
  showEditButton?: boolean;
  onEdit?: () => void;
  subActivityName?: string;
  iframeCode?: string;
  activityId?: string;
  canEdit?: boolean;
  audioUrl?: string;
  activity?: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  link,
  isYouTube,
  videoId,
  thumbnailUrl,
  activityDate,
  showEditButton = false,
  onEdit,
  subActivityName,
  iframeCode,
  activityId,
  canEdit = false,
  audioUrl,
  activity
}) => {
  const navigate = useNavigate();

  // Fonction pour nettoyer le titre des jeux Memory
  const getCleanTitle = () => {
    if (title.startsWith('Jeu Memory: ')) {
      return title.replace('Jeu Memory: ', '');
    }
    return title;
  };

  const getDisplayImage = () => {
    console.log('ActivityCard getDisplayImage debug:', {
      title: title,
      thumbnailUrl: thumbnailUrl,
      activity: activity ? {
        id: activity.id,
        thumbnail_url: activity.thumbnail_url,
        iframe_code: activity.iframe_code ? 'has iframe_code' : 'no iframe_code'
      } : 'no activity'
    });

    // Priorité 1: thumbnailUrl passé en prop
    if (thumbnailUrl) {
      console.log('Using thumbnailUrl prop:', thumbnailUrl);
      return thumbnailUrl;
    }
    
    // Priorité 2: thumbnail_url de l'activité
    if (activity?.thumbnail_url) {
      console.log('Using activity thumbnail_url:', activity.thumbnail_url);
      return activity.thumbnail_url;
    }
    
    // Priorité 3: Vérifier si c'est un jeu Timeline et récupérer sa vignette personnalisée
    if (activity && activity.iframe_code) {
      try {
        const gameData = JSON.parse(activity.iframe_code);
        console.log('Parsed game data:', {
          timelineName: gameData.timelineName,
          thumbnailUrl: gameData.thumbnailUrl
        });
        
        if (gameData.timelineName && gameData.thumbnailUrl) {
          console.log('Using Timeline custom thumbnail:', gameData.thumbnailUrl);
          return gameData.thumbnailUrl;
        } else if (gameData.timelineName) {
          // Utiliser la vignette par défaut si pas de vignette personnalisée
          console.log('Using default Timeline thumbnail');
          return '/timeline-game-thumbnail.jpg';
        }
      } catch (error) {
        console.log('Error parsing iframe_code as JSON:', error);
        // Pas un JSON valide, continuer avec la logique normale
      }
    }
    
    // Si on a un code iframe, extraire l'ID de la vidéo depuis le code
    if (iframeCode) {
      const srcMatch = iframeCode.match(/src="https:\/\/www\.youtube\.com\/embed\/([^"?]+)/);
      if (srcMatch && srcMatch[1]) {
        return `https://img.youtube.com/vi/${srcMatch[1]}/maxresdefault.jpg`;
      }
    }
    
    // Si on a un videoId directement fourni
    if (isYouTube && videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    // Fallback sur l'image par défaut
    return '/placeholder.svg';
  };

  const handleClick = () => {
    // Check if it's a game stored in iframe_code (priority to activity.iframe_code, then fallback to iframeCode prop)
    const gameCodeToCheck = (activity && activity.iframe_code) ? activity.iframe_code : iframeCode;
    
    if (gameCodeToCheck) {
      try {
        const gameData = JSON.parse(gameCodeToCheck);
        
        // Timeline game - use React Router navigation
        if (gameData.timelineName) {
          console.log('🎮 ActivityCard - Timeline game data mapping:', {
            originalGameData: gameData,
            showDateOnCard: gameData.showDateOnCard,
            showYearOnCard: gameData.showYearOnCard,
            showDateOnCardUndefined: gameData.showDateOnCard === undefined,
            finalShowDateOnCard: gameData.showDateOnCard !== undefined ? gameData.showDateOnCard : false
          });
          
          navigate('/activities/timeline/play', { 
            state: { 
              timelineData: {
                ...gameData,
                showDateOnCard: gameData.showDateOnCard !== undefined ? gameData.showDateOnCard : false
              }
            }
          });
          return;
        }
        
        // Music Quiz - use React Router navigation
        if (gameData.type === 'music_quiz') {
          navigate('/activities/music-quiz/play', { 
            state: { 
              quizData: gameData
            }
          });
          return;
        }
        
        // Memory Game - navigate to memory game page
        if (gameData.type === 'memory_game') {
          navigate('/activities/memory-game/play', { 
            state: { 
              gameData: gameData
            }
          });
          return;
        }
        
        // Dictation Game - navigate to dictation game page
        if (gameData.type === 'dictation') {
          navigate(`/activities/dictation/${activityId}`, { replace: false });
          return;
        }
        
      } catch (error) {
        console.error('Error parsing game data:', error);
        // If JSON parsing fails, check if it's a YouTube iframe
        if (gameCodeToCheck.includes('youtube.com/embed/')) {
          // Extract YouTube video ID from iframe
          const srcMatch = gameCodeToCheck.match(/src="https:\/\/www\.youtube\.com\/embed\/([^"?]+)/);
          if (srcMatch && srcMatch[1]) {
            // Open YouTube video directly
            window.open(`https://www.youtube.com/watch?v=${srcMatch[1]}`, '_blank', 'noopener,noreferrer');
            return;
          }
        }
        
        // For other iframe content, create a proper HTML page
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title}</title>
                <style>
                  body { margin: 0; padding: 20px; background: #f5f5f5; }
                  iframe { width: 100%; height: 500px; border: none; }
                </style>
              </head>
              <body>
                <h2 style="color: black; text-align: center;">${title}</h2>
                ${gameCodeToCheck}
              </body>
            </html>
          `);
          newWindow.document.close();
        }
        return;
      }
    }
    
    // Fallback: if it's iframe content but not JSON parseable
    if (iframeCode && !gameCodeToCheck) {
      try {
        const gameData = JSON.parse(iframeCode);
        
        // Music Quiz from iframeCode prop
        if (gameData.type === 'music_quiz') {
          navigate('/activities/music-quiz/play', { 
            state: { 
              quizData: gameData
            }
          });
          return;
        }
        
        // Memory Game from iframeCode prop
        if (gameData.type === 'memory_game') {
          navigate('/activities/memory-game/play', { 
            state: { 
              gameData: gameData
            }
          });
          return;
        }
        
      } catch (error) {
        // If JSON parsing fails, check if it's a YouTube iframe
        if (iframeCode.includes('youtube.com/embed/')) {
          // Extract YouTube video ID from iframe
          const srcMatch = iframeCode.match(/src="https:\/\/www\.youtube\.com\/embed\/([^"?]+)/);
          if (srcMatch && srcMatch[1]) {
            // Open YouTube video directly
            window.open(`https://www.youtube.com/watch?v=${srcMatch[1]}`, '_blank', 'noopener,noreferrer');
            return;
          }
        }
        
        // For other iframe content, create a proper HTML page
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title}</title>
                <style>
                  body { margin: 0; padding: 20px; background: #f5f5f5; }
                  iframe { width: 100%; height: 500px; border: none; }
                </style>
              </head>
              <body>
                <h2 style="color: black; text-align: center;">${title}</h2>
                ${iframeCode}
              </body>
            </html>
          `);
          newWindow.document.close();
        }
        return;
      }
    }
    
    // Regular link
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  // Déterminer si on doit afficher un avertissement iOS
  const shouldShowIOSWarning = () => {
    if (!iframeCode) return false;
    
    try {
      const gameData = JSON.parse(iframeCode);
      if (gameData.type === 'music_quiz') {
        return !audioUrl && !gameData.questions.some((q: any) => q.audioUrl);
      }
    } catch (e) {
      // Pas un JSON valide
    }
    
    return false;
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="relative">
        <img
          src={getDisplayImage()}
          alt={getCleanTitle()}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        {(isYouTube || (iframeCode && !iframeCode.includes('"type":"memory_game"'))) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-t-lg">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
            </div>
          </div>
        )}
        

        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEditClick}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {showEditButton && onEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{getCleanTitle()}</CardTitle>
        {subActivityName && (
          <Badge variant="secondary" className="w-fit">
            {subActivityName}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          {activityDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(activityDate).toLocaleDateString('fr-FR')}
            </div>
          )}
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
