import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw } from 'lucide-react';

interface MemoryGamePlayerProps {
  gameData: {
    title: string;
    images: string[];
    type: string;
  };
}

interface GameCard {
  id: string;
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGamePlayer: React.FC<MemoryGamePlayerProps> = ({ gameData }) => {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [selectedPairs, setSelectedPairs] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialiser le jeu
  useEffect(() => {
    if (selectedPairs !== null) {
      initializeGame();
    }
  }, [selectedPairs]);

  const initializeGame = () => {
    if (selectedPairs === null) return;
    
    // Utiliser seulement le nombre de paires sélectionnées
    const selectedImages = gameData.images.slice(0, selectedPairs);
    
    // Créer des paires d'images avec des IDs uniques
    const imagePairs = selectedImages.flatMap((image, index) => [
      { id: `${index}-a`, imageUrl: image, isFlipped: false, isMatched: false },
      { id: `${index}-b`, imageUrl: image, isFlipped: false, isMatched: false }
    ]);

    // Mélanger les cartes
    const shuffledCards = [...imagePairs].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setIsGameComplete(false);
    setGameStarted(true);
  };

  const handleCardClick = (cardId: string) => {
    // Trouver la carte par son ID
    const clickedCard = cards.find(card => card.id === cardId);
    
    // Ne pas permettre de cliquer si 2 cartes sont déjà retournées ou si la carte est déjà retournée/appariée
    if (flippedCards.length === 2 || clickedCard?.isFlipped || clickedCard?.isMatched) {
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
          if (matchedPairs + 1 === selectedPairs) {
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

  const startNewGame = () => {
    setSelectedPairs(null);
    setGameStarted(false);
  };

  // Écran de sélection de difficulté
  if (!gameStarted) {
    const maxPairs = gameData.images.length;
    
    // Générer les options : commence à 2 paires (4 cartes) et s'incrémente de 2 en 2
    const pairOptions = [];
    for (let pairs = 2; pairs <= maxPairs; pairs += 2) {
      pairOptions.push({
        value: pairs.toString(),
        label: `${pairs * 2} cartes (${pairs} paires)`
      });
    }

    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">{gameData.title}</h1>
          <p className="text-muted-foreground mb-6">Choisissez le nombre de cartes à retourner</p>
          
          <div className="max-w-xs mx-auto mb-6">
            <Select onValueChange={(value) => setSelectedPairs(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez la difficulté" />
              </SelectTrigger>
              <SelectContent>
                {pairOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* En-tête du jeu */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">{gameData.title}</h1>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>Paires trouvées: {matchedPairs} / {selectedPairs}</span>
          <span>Cartes: {selectedPairs * 2}</span>
          <span>Coups joués: {moves}</span>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <Button 
            onClick={initializeGame} 
            variant="outline" 
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Recommencer
          </Button>
          <Button 
            onClick={startNewGame} 
            variant="outline" 
            size="sm"
          >
            Changer difficulté
          </Button>
        </div>
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
        {cards.map((card) => (
          <Card
            key={card.id}
            className={`aspect-square cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              card.isFlipped || card.isMatched 
                ? 'bg-white dark:bg-card' 
                : 'bg-primary/10 hover:bg-primary/20'
            }`}
            onClick={() => handleCardClick(card.id)}
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