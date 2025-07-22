import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface MemoryGamePlayerProps {
  gameData: {
    title: string;
    images: string[];
    type: string;
  };
}

interface GameCard {
  id: number;
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGamePlayer: React.FC<MemoryGamePlayerProps> = ({ gameData }) => {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Initialiser le jeu
  useEffect(() => {
    initializeGame();
  }, [gameData]);

  const initializeGame = () => {
    // Créer des paires d'images
    const imagePairs = gameData.images.flatMap((image, index) => [
      { id: index * 2, imageUrl: image, isFlipped: false, isMatched: false },
      { id: index * 2 + 1, imageUrl: image, isFlipped: false, isMatched: false }
    ]);

    // Mélanger les cartes
    const shuffledCards = [...imagePairs].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setIsGameComplete(false);
  };

  const handleCardClick = (cardId: number) => {
    // Ne pas permettre de cliquer si 2 cartes sont déjà retournées ou si la carte est déjà retournée/appariée
    if (flippedCards.length === 2 || cards[cardId]?.isFlipped || cards[cardId]?.isMatched) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Retourner la carte
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    // Si deux cartes sont retournées
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === secondCardId);

      // Vérifier si c'est une paire
      if (firstCard && secondCard && firstCard.imageUrl === secondCard.imageUrl) {
        // C'est une paire !
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstCardId || card.id === secondCardId
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatchedPairs(matchedPairs + 1);
          setFlippedCards([]);

          // Vérifier si le jeu est terminé
          if (matchedPairs + 1 === gameData.images.length) {
            setIsGameComplete(true);
          }
        }, 1000);
      } else {
        // Pas une paire, retourner les cartes
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* En-tête du jeu */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">{gameData.title}</h1>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>Paires trouvées: {matchedPairs} / {gameData.images.length}</span>
          <span>Coups joués: {moves}</span>
        </div>
        <Button 
          onClick={initializeGame} 
          variant="outline" 
          size="sm" 
          className="mt-4"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Recommencer
        </Button>
      </div>

      {/* Message de victoire */}
      {isGameComplete && (
        <div className="text-center mb-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
            Félicitations ! 🎉
          </h2>
          <p className="text-green-700 dark:text-green-300">
            Vous avez trouvé toutes les paires en {moves} coups !
          </p>
        </div>
      )}

      {/* Grille de cartes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cards.map((card, index) => (
          <Card
            key={`${card.id}-${index}`}
            className={`aspect-square cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              card.isFlipped || card.isMatched 
                ? 'bg-white dark:bg-card' 
                : 'bg-primary/10 hover:bg-primary/20'
            }`}
            onClick={() => handleCardClick(index)}
          >
            <div className="h-full w-full p-2">
              {card.isFlipped || card.isMatched ? (
                <img
                  src={card.imageUrl}
                  alt="Carte mémoire"
                  className={`w-full h-full object-cover rounded transition-opacity duration-300 ${
                    card.isMatched ? 'opacity-75' : 'opacity-100'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/60 rounded flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};