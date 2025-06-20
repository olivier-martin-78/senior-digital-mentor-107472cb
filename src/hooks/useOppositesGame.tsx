
import { useState, useEffect } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'playing' | 'completed';

interface WordPair {
  word1: string;
  word2: string;
}

const WORD_PAIRS: WordPair[] = [
  { word1: 'Étroit', word2: 'Large' },
  { word1: 'Brûlant', word2: 'Glacé' },
  { word1: 'Bas', word2: 'Haut' },
  { word1: 'Murmurer', word2: 'Crier' },
  { word1: 'Prudent', word2: 'Intrépide' },
  { word1: 'Intelligent', word2: 'Absurde' },
  { word1: 'Muet', word2: 'Loquace' },
  { word1: 'Froid', word2: 'Chaud' },
  { word1: 'Désobéir', word2: 'Écouter' },
  { word1: 'Inéquitable', word2: 'Juste' },
  { word1: 'Humble', word2: 'Fier' },
  { word1: 'Grossier', word2: 'Gentil' },
  { word1: 'Curieuse', word2: 'Indifférente' },
  { word1: 'Dormir', word2: 'Veiller' },
  { word1: 'Court', word2: 'Long' },
  { word1: 'Sécher', word2: 'Arroser' },
  { word1: 'Dur', word2: 'Tendre' },
  { word1: 'Puant', word2: 'Parfumé' },
  { word1: 'Grave', word2: 'Aigu' },
  { word1: 'Fin', word2: 'Épais' },
  { word1: 'Méchant', word2: 'Bienveillant' }
];

export const useOppositesGame = () => {
  const [words, setWords] = useState<string[]>([]);
  const [correctPairs, setCorrectPairs] = useState<WordPair[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [gameState, setGameState] = useState<GameState>('playing');
  const [errors, setErrors] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const getDifficultyCount = (diff: Difficulty): number => {
    switch (diff) {
      case 'easy': return 6;
      case 'medium': return 10;
      case 'hard': return 15;
      default: return 10;
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateNewGrid = () => {
    const pairCount = getDifficultyCount(difficulty);
    const selectedPairs = shuffleArray(WORD_PAIRS).slice(0, pairCount);
    
    // Créer un tableau avec tous les mots mélangés
    const allWords: string[] = [];
    selectedPairs.forEach(pair => {
      allWords.push(pair.word1, pair.word2);
    });
    
    const shuffledWords = shuffleArray(allWords);
    
    setWords(shuffledWords);
    setCorrectPairs(selectedPairs);
    setUserAnswers({});
    setGameState('playing');
    setErrors([]);
  };

  const updateAnswer = (wordIndex: number, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [wordIndex]: value
    }));
  };

  const checkAnswers = () => {
    const newErrors: number[] = [];
    const pairMap = new Map<string, string>();
    
    // Créer une map des paires correctes
    correctPairs.forEach(pair => {
      pairMap.set(pair.word1, pair.word2);
      pairMap.set(pair.word2, pair.word1);
    });

    // Regrouper les réponses par numéro
    const answerGroups = new Map<string, number[]>();
    Object.entries(userAnswers).forEach(([wordIndex, answer]) => {
      if (answer && answer.trim() !== '') {
        const indices = answerGroups.get(answer) || [];
        indices.push(parseInt(wordIndex));
        answerGroups.set(answer, indices);
      }
    });

    // Vérifier chaque groupe
    answerGroups.forEach((indices, answer) => {
      if (indices.length === 2) {
        const word1 = words[indices[0]];
        const word2 = words[indices[1]];
        
        // Vérifier si les deux mots forment une paire correcte
        if (pairMap.get(word1) !== word2) {
          newErrors.push(...indices);
        }
      } else {
        // Si un numéro est utilisé pour plus ou moins de 2 mots
        newErrors.push(...indices);
      }
    });

    // Vérifier que tous les mots ont une réponse
    words.forEach((_, index) => {
      if (!userAnswers[index] || userAnswers[index].trim() === '') {
        newErrors.push(index);
      }
    });

    setErrors([...new Set(newErrors)]);
    setGameState('completed');
  };

  const resetGame = () => {
    setUserAnswers({});
    setGameState('playing');
    setErrors([]);
  };

  // Générer une nouvelle grille quand la difficulté change
  useEffect(() => {
    generateNewGrid();
  }, [difficulty]);

  // Générer la grille initiale
  useEffect(() => {
    generateNewGrid();
  }, []);

  return {
    words,
    userAnswers,
    gameState,
    errors,
    correctPairs,
    difficulty,
    generateNewGrid,
    setDifficulty,
    updateAnswer,
    checkAnswers,
    resetGame
  };
};
