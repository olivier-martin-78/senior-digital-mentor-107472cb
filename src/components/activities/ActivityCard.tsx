
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  canEdit = false
}) => {
  const getDisplayImage = () => {
    if (thumbnailUrl) {
      return thumbnailUrl;
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
    if (iframeCode) {
      try {
        // Essayer de parser le JSON pour les jeux Memory
        const gameData = JSON.parse(iframeCode);
        if (gameData.type === 'memory_game') {
          // Ouvrir le jeu Memory dans une nouvelle fenêtre
          const newWindow = window.open('', '_blank', 'width=1200,height=800');
          if (newWindow) {
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${title}</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      margin: 0; 
                      padding: 0; 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                      background: #f3f4f6; 
                    }
                    .memory-game-container {
                      padding: 20px;
                      max-width: 1000px;
                      margin: 0 auto;
                    }
                    .header {
                      text-align: center;
                      margin-bottom: 30px;
                    }
                    .header h1 {
                      color: #1f2937;
                      margin-bottom: 20px;
                    }
                    .game-info {
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      gap: 20px;
                      margin-bottom: 20px;
                    }
                    .moves {
                      font-size: 18px;
                      font-weight: 600;
                    }
                    .reset-btn {
                      padding: 8px 16px;
                      background: #6b7280;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                      font-size: 14px;
                    }
                    .reset-btn:hover {
                      background: #4b5563;
                    }
                    .game-grid {
                      display: grid;
                      gap: 12px;
                      max-width: 600px;
                      margin: 0 auto;
                      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    }
                    .card {
                      aspect-ratio: 1;
                      background: #3b82f6;
                      border-radius: 8px;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      position: relative;
                      overflow: hidden;
                    }
                    .card:hover:not(.flipped):not(.matched) {
                      background: #2563eb;
                      transform: scale(1.05);
                    }
                    .card.flipped, .card.matched {
                      background: white;
                    }
                    .card.matched {
                      border: 2px solid #10b981;
                    }
                    .card img {
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                      border-radius: 6px;
                    }
                    .card-back {
                      color: white;
                      font-size: 24px;
                      font-weight: bold;
                    }
                    .success-message {
                      background: #dcfce7;
                      border: 2px solid #16a34a;
                      padding: 20px;
                      border-radius: 8px;
                      text-align: center;
                      margin-bottom: 20px;
                      color: #15803d;
                      font-size: 18px;
                      font-weight: 600;
                    }
                  </style>
                </head>
                <body>
                  <div class="memory-game-container">
                    <div class="header">
                      <h1>${gameData.title}</h1>
                      <div class="game-info">
                        <div class="moves">Coups: <span id="moves">0</span></div>
                        <button class="reset-btn" onclick="resetGame()">🔄 Recommencer</button>
                      </div>
                    </div>
                    <div id="success-message" class="success-message" style="display: none;">
                      🏆 Félicitations ! Jeu terminé en <span id="final-moves"></span> coups !
                    </div>
                    <div id="game-grid" class="game-grid"></div>
                  </div>
                  
                  <script>
                    const gameData = ${JSON.stringify(gameData)};
                    let cards = [];
                    let flippedCards = [];
                    let moves = 0;
                    let gameComplete = false;
                    
                    function initializeGame() {
                      const pairs = [];
                      gameData.images.forEach((imageUrl, index) => {
                        pairs.push(
                          { id: index * 2, imageUrl, isFlipped: false, isMatched: false },
                          { id: index * 2 + 1, imageUrl, isFlipped: false, isMatched: false }
                        );
                      });
                      
                      cards = pairs.sort(() => Math.random() - 0.5);
                      flippedCards = [];
                      moves = 0;
                      gameComplete = false;
                      
                      document.getElementById('moves').textContent = moves;
                      document.getElementById('success-message').style.display = 'none';
                      renderCards();
                    }
                    
                    function renderCards() {
                      const grid = document.getElementById('game-grid');
                      const cols = Math.ceil(Math.sqrt(cards.length));
                      grid.style.gridTemplateColumns = \`repeat(\${cols}, 1fr)\`;
                      
                      grid.innerHTML = cards.map(card => \`
                        <div class="card \${card.isFlipped ? 'flipped' : ''} \${card.isMatched ? 'matched' : ''}" 
                             onclick="handleCardClick(\${card.id})">
                          \${card.isFlipped || card.isMatched ? 
                            \`<img src="\${card.imageUrl}" alt="Memory card">\` : 
                            '<div class="card-back">?</div>'
                          }
                        </div>
                      \`).join('');
                    }
                    
                    function handleCardClick(cardId) {
                      if (gameComplete) return;
                      if (flippedCards.length >= 2) return;
                      if (flippedCards.includes(cardId)) return;
                      
                      const card = cards.find(c => c.id === cardId);
                      if (card.isMatched) return;
                      
                      flippedCards.push(cardId);
                      card.isFlipped = true;
                      renderCards();
                      
                      if (flippedCards.length === 2) {
                        moves++;
                        document.getElementById('moves').textContent = moves;
                        
                        const [firstId, secondId] = flippedCards;
                        const firstCard = cards.find(c => c.id === firstId);
                        const secondCard = cards.find(c => c.id === secondId);
                        
                        if (firstCard.imageUrl === secondCard.imageUrl) {
                          setTimeout(() => {
                            firstCard.isMatched = true;
                            secondCard.isMatched = true;
                            flippedCards = [];
                            renderCards();
                            
                            if (cards.every(c => c.isMatched)) {
                              gameComplete = true;
                              document.getElementById('final-moves').textContent = moves;
                              document.getElementById('success-message').style.display = 'block';
                            }
                          }, 500);
                        } else {
                          setTimeout(() => {
                            firstCard.isFlipped = false;
                            secondCard.isFlipped = false;
                            flippedCards = [];
                            renderCards();
                          }, 1000);
                        }
                      }
                    }
                    
                    function resetGame() {
                      initializeGame();
                    }
                    
                    // Initialiser le jeu au chargement
                    initializeGame();
                  </script>
                </body>
              </html>
            `);
          }
          return;
        }
      } catch (e) {
        // Si ce n'est pas du JSON valide, traiter comme un iframe normal
      }
      
      // Code iframe normal
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { margin: 0; padding: 20px; background: #000; }
                iframe { width: 100%; height: 500px; }
              </style>
            </head>
            <body>
              <h2 style="color: white; text-align: center;">${title}</h2>
              ${iframeCode}
            </body>
          </html>
        `);
      }
    } else {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="relative">
        <img
          src={getDisplayImage()}
          alt={title}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            console.error('🖼️ IMAGE LOAD ERROR for activity:', {
              title,
              thumbnailUrl,
              iframeCode: !!iframeCode,
              videoId,
              isYouTube,
              finalUrl: getDisplayImage()
            });
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
          onLoad={() => {
            console.log('🖼️ SUCCESS image loaded for activity:', {
              title,
              url: getDisplayImage()
            });
          }}
        />
        {(isYouTube || iframeCode) && (
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
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
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
