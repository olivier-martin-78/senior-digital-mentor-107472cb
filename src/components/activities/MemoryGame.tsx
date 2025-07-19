import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Trophy } from 'lucide-react';

interface MemoryGameProps {
  gameData: {
    title: string;
    images: string[];
    created_at: string;
    type: string;
  };
}

interface CardData {
  id: number;
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ gameData }) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [numberOfPairs, setNumberOfPairs] = useState<number>(Math.min(6, gameData.images.length));

  // Initialiser le jeu
  useEffect(() => {
    initializeGame();
  }, [gameData, numberOfPairs]);

  const initializeGame = () => {
    // Utiliser seulement le nombre d'images sélectionné
    const selectedImages = gameData.images.slice(0, numberOfPairs);
    
    // Créer des paires à partir des images sélectionnées
    const pairs: CardData[] = [];
    selectedImages.forEach((imageUrl, index) => {
      pairs.push(
        { id: index * 2, imageUrl, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, imageUrl, isFlipped: false, isMatched: false }
      );
    });

    // Mélanger les cartes
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setIsGameComplete(false);
    setGameStarted(false);
  };

  const handleNumberOfPairsChange = (value: string) => {
    const newNumberOfPairs = parseInt(value);
    setNumberOfPairs(newNumberOfPairs);
  };

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (flippedCards.length >= 2) return;
    if (flippedCards.includes(cardId)) return;
    if (cards.find(card => card.id === cardId)?.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Retourner la carte
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    // Si on a retourné 2 cartes
    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === secondCardId);

      if (firstCard && secondCard && firstCard.imageUrl === secondCard.imageUrl) {
        // Paire trouvée !
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstCardId || card.id === secondCardId
                ? { ...card, isMatched: true }
                : card
            )
          );
          setFlippedCards([]);
          
          // Vérifier si le jeu est terminé
          const updatedCards = cards.map(card =>
            card.id === firstCardId || card.id === secondCardId
              ? { ...card, isMatched: true }
              : card
          );
          
          if (updatedCards.every(card => card.isMatched)) {
            setIsGameComplete(true);
          }
        }, 500);
      } else {
        // Pas de paire, retourner les cartes
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstCardId || card.id === secondCardId
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    initializeGame();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">{gameData.title}</h1>
        
        <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
          <div className="text-lg">
            Coups: <span className="font-semibold">{moves}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Nombre de paires:</label>
            <Select value={numberOfPairs.toString()} onValueChange={handleNumberOfPairsChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <SelectItem 
                    key={num} 
                    value={num.toString()} 
                    disabled={num > gameData.images.length}
                  >
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Recommencer
          </Button>
        </div>
      </div>

      {isGameComplete && (
        <div className="mb-6 text-center">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Trophy className="h-6 w-6" />
                <span className="text-lg font-semibold">
                  Félicitations ! Jeu terminé en {moves} coups !
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div 
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, 1fr)`,
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        {cards.map((card) => (
          <Card
            key={card.id}
            className={`
              aspect-square cursor-pointer transition-all duration-300 hover:scale-105
              ${card.isFlipped || card.isMatched ? 'bg-white' : 'bg-blue-500 hover:bg-blue-600'}
              ${card.isMatched ? 'ring-2 ring-green-500' : ''}
            `}
            onClick={() => handleCardClick(card.id)}
          >
            <CardContent className="p-2 h-full">
              <div className="h-full flex items-center justify-center">
                {card.isFlipped || card.isMatched ? (
                  <img
                    src={card.imageUrl}
                    alt="Memory card"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="text-white text-2xl font-bold">?</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};