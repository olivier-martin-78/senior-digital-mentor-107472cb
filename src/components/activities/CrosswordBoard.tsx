import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, Lightbulb, Star, Puzzle, Trophy, ArrowRight, ArrowDown, HelpCircle, Eye } from 'lucide-react';

type Difficulty = 'très-facile' | 'facile' | 'moyen' | 'difficile' | 'expert';
type Direction = 'horizontal' | 'vertical';

interface Word {
  id: number;
  word: string;
  definition: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  length: number;
}

interface Cell {
  letter: string;
  correctLetter: string;
  isBlack: boolean;
  isArrow?: boolean;
  arrowDirection?: Direction;
  wordId?: number;
  isEditable: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  wordIds?: number[];
}

type Grid = Cell[][];

const CrosswordBoard = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('moyen');
  const [gameState, setGameState] = useState<'playing' | 'completed'>('playing');
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState(9);
  const [showHint, setShowHint] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{row: number, col: number} | null>(null);
  const [currentDirection, setCurrentDirection] = useState<Direction>('horizontal');
  const gridRefs = useRef<(React.RefObject<HTMLInputElement> | null)[][]>([]);

  const wordSets = {
    'très-facile': [
      { word: 'CHAT', definition: 'Animal domestique qui miaule', length: 4 },
      { word: 'EAU', definition: 'Liquide transparent H2O', length: 3 },
      { word: 'PAIN', definition: 'Aliment fait de farine', length: 4 },
      { word: 'ROUGE', definition: 'Couleur du sang', length: 5 },
      { word: 'SOLEIL', definition: 'Étoile qui éclaire la Terre', length: 6 },
      { word: 'MAIN', definition: 'Extrémité du bras', length: 4 },
      { word: 'BLEU', definition: 'Couleur du ciel', length: 4 },
      { word: 'LUNE', definition: 'Satellite naturel de la Terre', length: 4 }
    ],
    'facile': [
      { word: 'CHIEN', definition: 'Meilleur ami de l\'homme', length: 5 },
      { word: 'FLEUR', definition: 'Partie colorée d\'une plante', length: 5 },
      { word: 'LIVRE', definition: 'Objet fait de pages reliées', length: 5 },
      { word: 'TABLE', definition: 'Meuble avec un plateau', length: 5 },
      { word: 'MONDE', definition: 'Planète Terre', length: 5 },
      { word: 'TEMPS', definition: 'Durée des événements', length: 5 },
      { word: 'VILLE', definition: 'Grande agglomération urbaine', length: 5 },
      { word: 'NATURE', definition: 'Environnement naturel', length: 6 }
    ],
    'moyen': [
      { word: 'ORDINATEUR', definition: 'Machine électronique de traitement', length: 10 },
      { word: 'MUSIQUE', definition: 'Art des sons organisés', length: 7 },
      { word: 'HISTOIRE', definition: 'Science du passé', length: 8 },
      { word: 'CULTURE', definition: 'Ensemble des connaissances', length: 7 },
      { word: 'SCIENCE', definition: 'Connaissance exacte et rationnelle', length: 7 },
      { word: 'VOYAGE', definition: 'Déplacement vers un lieu lointain', length: 6 },
      { word: 'FAMILLE', definition: 'Groupe de personnes apparentées', length: 7 },
      { word: 'BONHEUR', definition: 'État de satisfaction complète', length: 7 }
    ],
    'difficile': [
      { word: 'PHILOSOPHIE', definition: 'Recherche de la sagesse', length: 11 },
      { word: 'METAPHORE', definition: 'Figure de style par analogie', length: 9 },
      { word: 'NOSTALGIE', definition: 'Mélancolie du passé', length: 9 },
      { word: 'PARADOXE', definition: 'Contradiction apparente', length: 8 },
      { word: 'EPISTEME', definition: 'Connaissance scientifique', length: 8 },
      { word: 'DIALECTE', definition: 'Variante régionale d\'une langue', length: 8 },
      { word: 'SYNECDOQUE', definition: 'Figure prenant la partie pour le tout', length: 10 },
      { word: 'EUPHEMISME', definition: 'Expression atténuée d\'une réalité', length: 10 }
    ],
    'expert': [
      { word: 'EPIPHENOMENE', definition: 'Phénomène accessoire et sans influence', length: 12 },
      { word: 'ESCHATOLOGIE', definition: 'Doctrine des fins dernières', length: 12 },
      { word: 'HERMENEUTIQUE', definition: 'Art d\'interpréter les textes', length: 13 },
      { word: 'PHENOMENOLOGIE', definition: 'Étude des phénomènes de conscience', length: 14 },
      { word: 'EPISTEMOLOGIE', definition: 'Théorie de la connaissance', length: 13 },
      { word: 'PSYCHANALYSE', definition: 'Méthode d\'investigation de l\'inconscient', length: 12 },
      { word: 'STRUCTURALISME', definition: 'Méthode d\'analyse par structures', length: 14 },
      { word: 'EXISTENTIALISME', definition: 'Philosophie de l\'existence', length: 15 }
    ]
  };

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case 'très-facile': return { size: 9, wordsCount: 4 };
      case 'facile': return { size: 11, wordsCount: 5 };
      case 'moyen': return { size: 13, wordsCount: 6 };
      case 'difficile': return { size: 15, wordsCount: 7 };
      case 'expert': return { size: 17, wordsCount: 8 };
      default: return { size: 11, wordsCount: 5 };
    }
  };

  const createEmptyGrid = (size: number): Grid => {
    const newGrid = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        letter: '',
        correctLetter: '',
        isBlack: true, // Commencer avec toutes les cases noires
        isEditable: false,
        wordIds: []
      }))
    );

    // Initialize refs for each cell
    gridRefs.current = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => React.createRef<HTMLInputElement>())
    );

    return newGrid;
  };

  const findIntersections = (word1: string, word2: string): Array<{pos1: number, pos2: number}> => {
    const intersections = [];
    for (let i = 0; i < word1.length; i++) {
      for (let j = 0; j < word2.length; j++) {
        if (word1[i] === word2[j]) {
          intersections.push({ pos1: i, pos2: j });
        }
      }
    }
    return intersections;
  };

  const canPlaceWord = (grid: Grid, word: string, startRow: number, startCol: number, direction: Direction, size: number): boolean => {
    // Vérifier les limites
    if (direction === 'horizontal') {
      if (startCol + word.length > size || startRow >= size) return false;
    } else {
      if (startRow + word.length > size || startCol >= size) return false;
    }

    // Vérifier chaque position du mot
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;

      // Si la case a déjà une lettre, elle doit correspondre
      if (grid[row][col].correctLetter && grid[row][col].correctLetter !== word[i]) {
        return false;
      }
    }

    return true;
  };

  const placeWordsInGrid = (selectedWords: Word[], size: number): { grid: Grid, placedWords: Word[] } => {
    const newGrid = createEmptyGrid(size);
    const placedWords: Word[] = [];

    // Mélanger les mots
    const shuffledWords = [...selectedWords].sort(() => Math.random() - 0.5);

    // Placer le premier mot au centre horizontalement
    if (shuffledWords.length > 0) {
      const firstWord = shuffledWords[0];
      const startRow = Math.floor(size / 2);
      const startCol = Math.floor((size - firstWord.word.length) / 2);

      const placedWord: Word = {
        ...firstWord,
        startRow,
        startCol,
        direction: 'horizontal'
      };

      // Placer le mot dans la grille
      for (let i = 0; i < firstWord.word.length; i++) {
        newGrid[startRow][startCol + i].correctLetter = firstWord.word[i];
        newGrid[startRow][startCol + i].isBlack = false;
        newGrid[startRow][startCol + i].isEditable = true;
        newGrid[startRow][startCol + i].wordIds = [firstWord.id];
      }

      placedWords.push(placedWord);
    }

    // Placer les autres mots en cherchant des intersections
    for (let wordIndex = 1; wordIndex < shuffledWords.length; wordIndex++) {
      const currentWord = shuffledWords[wordIndex];
      let wordPlaced = false;

      // Essayer de placer le mot en intersection avec les mots déjà placés
      for (const placedWord of placedWords) {
        if (wordPlaced) break;

        const intersections = findIntersections(currentWord.word, placedWord.word);
        
        for (const intersection of intersections) {
          if (wordPlaced) break;

          // Calculer la position du nouveau mot
          let newStartRow, newStartCol;
          const newDirection: Direction = placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal';

          if (placedWord.direction === 'horizontal') {
            // Le mot placé est horizontal, le nouveau sera vertical
            newStartRow = placedWord.startRow - intersection.pos1;
            newStartCol = placedWord.startCol + intersection.pos2;
          } else {
            // Le mot placé est vertical, le nouveau sera horizontal
            newStartRow = placedWord.startRow + intersection.pos2;
            newStartCol = placedWord.startCol - intersection.pos1;
          }

          // Vérifier si on peut placer le mot à cette position
          if (newStartRow >= 0 && newStartCol >= 0 && 
              canPlaceWord(newGrid, currentWord.word, newStartRow, newStartCol, newDirection, size)) {
            
            const newPlacedWord: Word = {
              ...currentWord,
              startRow: newStartRow,
              startCol: newStartCol,
              direction: newDirection
            };

            // Placer le mot dans la grille
            for (let i = 0; i < currentWord.word.length; i++) {
              const row = newDirection === 'horizontal' ? newStartRow : newStartRow + i;
              const col = newDirection === 'horizontal' ? newStartCol + i : newStartCol;
              
              newGrid[row][col].correctLetter = currentWord.word[i];
              newGrid[row][col].isBlack = false;
              newGrid[row][col].isEditable = true;
              
              if (!newGrid[row][col].wordIds) {
                newGrid[row][col].wordIds = [];
              }
              newGrid[row][col].wordIds!.push(currentWord.id);
            }

            placedWords.push(newPlacedWord);
            wordPlaced = true;
          }
        }
      }

      // Si on n'a pas pu placer le mot par intersection, essayer une placement libre
      if (!wordPlaced) {
        let attempts = 0;
        while (!wordPlaced && attempts < 100) {
          const direction: Direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          const maxRow = direction === 'horizontal' ? size : size - currentWord.word.length;
          const maxCol = direction === 'horizontal' ? size - currentWord.word.length : size;
          
          const startRow = Math.floor(Math.random() * maxRow);
          const startCol = Math.floor(Math.random() * maxCol);

          if (canPlaceWord(newGrid, currentWord.word, startRow, startCol, direction, size)) {
            const newPlacedWord: Word = {
              ...currentWord,
              startRow,
              startCol,
              direction
            };

            // Placer le mot dans la grille
            for (let i = 0; i < currentWord.word.length; i++) {
              const row = direction === 'horizontal' ? startRow : startRow + i;
              const col = direction === 'horizontal' ? startCol + i : startCol;
              
              newGrid[row][col].correctLetter = currentWord.word[i];
              newGrid[row][col].isBlack = false;
              newGrid[row][col].isEditable = true;
              
              if (!newGrid[row][col].wordIds) {
                newGrid[row][col].wordIds = [];
              }
              newGrid[row][col].wordIds!.push(currentWord.id);
            }

            placedWords.push(newPlacedWord);
            wordPlaced = true;
          }
          attempts++;
        }
      }
    }

    // Marquer les positions de départ des mots avec des flèches
    for (const word of placedWords) {
      const startCell = newGrid[word.startRow][word.startCol];
      startCell.isArrow = true;
      startCell.arrowDirection = word.direction;
      startCell.wordId = word.id;
    }

    return { grid: newGrid, placedWords };
  };

  const generateRandomWords = (difficulty: Difficulty): Word[] => {
    const settings = getDifficultySettings(difficulty);
    const availableWords = wordSets[difficulty];
    const selectedWords = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, settings.wordsCount);

    return selectedWords.map((wordData, index) => ({
      id: index + 1,
      word: wordData.word,
      definition: wordData.definition,
      startRow: 0,
      startCol: 0,
      direction: 'horizontal',
      length: wordData.length
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveToCell(row, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveToCell(row, col + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveToCell(row - 1, col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveToCell(row + 1, col);
        break;
    }
  };

  const moveToCell = (newRow: number, newCol: number) => {
    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize && !grid[newRow][newCol].isBlack) {
      setCurrentPosition({ row: newRow, col: newCol });
      setTimeout(() => {
        const inputRef = gridRefs.current[newRow][newCol];
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const moveToNextCell = (currentRow: number, currentCol: number, direction: Direction) => {
    if (!selectedWord) return;

    const word = words.find(w => w.id === selectedWord);
    if (!word) return;

    let nextRow = currentRow;
    let nextCol = currentCol;

    if (direction === 'horizontal') {
      nextCol++;
    } else {
      nextRow++;
    }

    // Check if the next position is within the word bounds
    const isWithinWord = direction === 'horizontal' 
      ? nextCol <= word.startCol + word.length - 1
      : nextRow <= word.startRow + word.length - 1;

    if (isWithinWord && nextRow < gridSize && nextCol < gridSize) {
      setCurrentPosition({ row: nextRow, col: nextCol });
      setTimeout(() => {
        const inputRef = gridRefs.current[nextRow][nextCol];
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const updateCell = (row: number, col: number, value: string, moveNext: boolean = true) => {
    if (!grid[row][col].isEditable || value.length > 1) return;
    
    const newGrid = [...grid];
    newGrid[row][col].letter = value.toUpperCase();
    setGrid(newGrid);
    setCurrentPosition({ row, col });
    
    if (moveNext && value && selectedWord) {
      const word = words.find(w => w.id === selectedWord);
      if (word) {
        moveToNextCell(row, col, word.direction);
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.wordIds && cell.wordIds.length > 0 && !cell.isBlack) {
      // Si la cellule appartient à plusieurs mots, choisir le premier
      setSelectedWord(cell.wordIds[0]);
      setCurrentPosition({ row, col });
      const word = words.find(w => w.id === cell.wordIds![0]);
      if (word) {
        setCurrentDirection(word.direction);
      }
    }
  };

  const revealSolution = () => {
    const newGrid = [...grid];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (newGrid[i][j].isEditable && !newGrid[i][j].isBlack) {
          newGrid[i][j].letter = newGrid[i][j].correctLetter;
        }
      }
    }
    setGrid(newGrid);
    setGameState('completed');
  };

  const generateNewGrid = () => {
    const settings = getDifficultySettings(difficulty);
    setGridSize(settings.size);
    
    const newWords = generateRandomWords(difficulty);
    const { grid: newGrid, placedWords } = placeWordsInGrid(newWords, settings.size);
    
    setWords(placedWords);
    setGrid(newGrid);
    setGameState('playing');
    setSelectedWord(null);
    setShowHint(null);
    setCurrentPosition(null);
  };

  const checkCompletion = () => {
    return words.every(word => {
      const wordLetters = [];
      for (let i = 0; i < word.length; i++) {
        const row = word.direction === 'horizontal' ? word.startRow : word.startRow + i;
        const col = word.direction === 'horizontal' ? word.startCol + i : word.startCol;
        if (row < gridSize && col < gridSize) {
          wordLetters.push(grid[row][col].letter);
        }
      }
      return wordLetters.join('') === word.word;
    });
  };

  useEffect(() => {
    if (grid.length > 0 && checkCompletion()) {
      setGameState('completed');
    }
  }, [grid]);

  useEffect(() => {
    generateNewGrid();
  }, [difficulty]);

  const getAdditionalHint = (word: string) => {
    const hints: { [key: string]: string } = {
      // Très facile
      'CHAT': 'Animal qui ronronne et chasse les souris',
      'EAU': 'Indispensable à la vie, H2O',
      'PAIN': 'Se mange avec du beurre au petit-déjeuner',
      'ROUGE': 'Couleur des tomates mûres',
      'SOLEIL': 'Astre qui brille le jour',
      'MAIN': 'Organe avec cinq doigts',
      'BLEU': 'Couleur de l\'océan',
      'LUNE': 'Visible la nuit dans le ciel',
      
      // Facile
      'CHIEN': 'Animal de compagnie qui aboie',
      'FLEUR': 'Rose, tulipe ou marguerite par exemple',
      'LIVRE': 'Roman, dictionnaire ou manuel',
      'TABLE': 'Meuble où l\'on mange',
      'MONDE': 'Notre planète et ses habitants',
      'TEMPS': 'Passé, présent, futur',
      'VILLE': 'Paris, Lyon ou Marseille',
      'NATURE': 'Forêts, montagnes et rivières',
      
      // Moyen
      'ORDINATEUR': 'Machine pour naviguer sur internet',
      'MUSIQUE': 'Mozart, Beethoven ou rock',
      'HISTOIRE': 'Napoléon, Louis XIV, événements passés',
      'CULTURE': 'Art, littérature et traditions',
      'SCIENCE': 'Physique, chimie et biologie',
      'VOYAGE': 'Partir en vacances loin de chez soi',
      'FAMILLE': 'Parents, enfants, grands-parents',
      'BONHEUR': 'Joie profonde et durable',
      
      // Difficile
      'PHILOSOPHIE': 'Socrate, Platon, amour de la sagesse',
      'METAPHORE': 'Comparaison sans "comme"',
      'NOSTALGIE': 'Regret du temps qui passe',
      'PARADOXE': 'Affirmation contradictoire mais vraie',
      'EPISTEME': 'Savoir scientifique d\'Aristote',
      'DIALECTE': 'Patois ou langue régionale',
      'SYNECDOQUE': 'Dire "voile" pour "bateau"',
      'EUPHEMISME': 'Dire "disparaître" pour "mourir"',
      
      // Expert
      'EPIPHENOMENE': 'Phénomène secondaire sans cause',
      'ESCHATOLOGIE': 'Étude de la fin des temps',
      'HERMENEUTIQUE': 'Science de l\'interprétation',
      'PHENOMENOLOGIE': 'Husserl et l\'étude de la conscience',
      'EPISTEMOLOGIE': 'Philosophie de la connaissance',
      'PSYCHANALYSE': 'Freud et l\'analyse de l\'inconscient',
      'STRUCTURALISME': 'Lévi-Strauss et les structures',
      'EXISTENTIALISME': 'Sartre et la liberté humaine'
    };
    
    return hints[word] || 'Indice supplémentaire non disponible';
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'très-facile': return 'bg-gradient-to-r from-green-400 to-emerald-500';
      case 'facile': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      case 'moyen': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'difficile': return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'expert': return 'bg-gradient-to-r from-red-500 to-purple-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'très-facile': return '🟢 Très Facile';
      case 'facile': return '🔵 Facile';
      case 'moyen': return '🟡 Moyen';
      case 'difficile': return '🟠 Difficile';
      case 'expert': return '🔴 Expert';
      default: return '';
    }
  };

  const renderCell = (row: number, col: number) => {
    const cell = grid[row][col];
    
    if (cell.isBlack) {
      return (
        <div
          key={`${row}-${col}`}
          className="w-16 h-16 bg-gray-800 border border-gray-600"
        />
      );
    }

    const isHighlighted = selectedWord && cell.wordIds && cell.wordIds.includes(selectedWord);
    const isCurrent = currentPosition?.row === row && currentPosition?.col === col;

    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-16 h-16 border border-gray-400 relative flex items-center justify-center
          ${cell.isEditable ? 'bg-white' : 'bg-gray-100'}
          ${isHighlighted ? 'bg-yellow-200 border-yellow-400 border-2' : ''}
          ${isCurrent ? 'bg-blue-200 border-blue-500 border-2' : ''}
          transition-all duration-200 cursor-pointer
        `}
        onClick={() => handleCellClick(row, col)}
      >
        {cell.isArrow && (
          <div className="absolute top-1 left-1 text-xs text-blue-600">
            {cell.arrowDirection === 'horizontal' ? <ArrowRight className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          </div>
        )}
        {cell.isEditable ? (
          <Input
            ref={gridRefs.current[row] ? gridRefs.current[row][col] : null}
            type="text"
            value={cell.letter}
            onChange={(e) => updateCell(row, col, e.target.value)}
            onFocus={() => setCurrentPosition({ row, col })}
            onKeyDown={(e) => handleKeyDown(e, row, col)}
            className="w-full h-full border-0 text-center text-lg font-bold p-0 bg-transparent focus:ring-0 focus:outline-none"
            maxLength={1}
          />
        ) : (
          <span className="text-lg font-bold">{cell.letter}</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <Puzzle className="w-8 h-8 text-purple-600 mr-3" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Mots Croisés Fléchés
                </h1>
                <Trophy className="w-8 h-8 text-yellow-500 ml-3" />
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Remplissez la grille en trouvant les mots correspondant aux définitions. Suivez les flèches !
              </p>
            </div>
          </div>

          {/* Controls */}
          <Card className="mb-8 overflow-hidden shadow-xl border-0">
            <div className={`h-2 ${getDifficultyColor(difficulty)}`}></div>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center justify-between text-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-800">Paramètres</span>
                </div>
                <Badge className={`${getDifficultyColor(difficulty)} text-white border-0 px-4 py-2 text-sm font-bold shadow-lg`}>
                  {getDifficultyLabel(difficulty)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-bold text-gray-700">Difficulté :</label>
                  <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
                    <SelectTrigger className="w-48 border-2 border-purple-200 hover:border-purple-400 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="très-facile">🟢 Très Facile</SelectItem>
                      <SelectItem value="facile">🔵 Facile</SelectItem>
                      <SelectItem value="moyen">🟡 Moyen</SelectItem>
                      <SelectItem value="difficile">🟠 Difficile</SelectItem>
                      <SelectItem value="expert">🔴 Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={generateNewGrid} 
                  variant="outline"
                  className="flex items-center space-x-2 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Nouvelle grille</span>
                </Button>

                <Button 
                  onClick={revealSolution} 
                  variant="outline"
                  className="flex items-center space-x-2 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                  <span>Révéler la solution</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Crossword grid */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100">
                  <CardTitle className="text-2xl text-gray-800 flex items-center justify-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse mr-3"></div>
                    Grille {gridSize}x{gridSize}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white flex justify-center">
                  <div 
                    className="grid gap-1 border-2 border-gray-800 bg-white rounded-lg overflow-hidden shadow-lg"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                  >
                    {grid.map((row, rowIndex) =>
                      row.map((_, colIndex) => renderCell(rowIndex, colIndex))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Definitions */}
            <div>
              <Card className="shadow-2xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100">
                  <CardTitle className="text-xl text-gray-800 flex items-center">
                    <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                    Définitions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-white max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {words.map((word) => (
                      <div key={word.id}>
                        <div
                          className={`
                            p-3 rounded-lg border cursor-pointer transition-all duration-200
                            ${selectedWord === word.id 
                              ? 'bg-yellow-100 border-yellow-300 shadow-md' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }
                          `}
                          onClick={() => setSelectedWord(selectedWord === word.id ? null : word.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">
                                {word.id}
                              </Badge>
                              <div className="flex items-center text-xs text-gray-500">
                                {word.direction === 'horizontal' ? (
                                  <ArrowRight className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 mr-1" />
                                )}
                                <span>{word.length} lettres</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHint(showHint === word.id ? null : word.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <HelpCircle className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-medium text-gray-800 mb-2">
                            {word.definition}
                          </p>
                          {showHint === word.id && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                              <p className="text-xs text-blue-700 font-medium">
                                💡 Indice supplémentaire : {getAdditionalHint(word.word)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Victory message */}
          {gameState === 'completed' && (
            <Card className="mt-8 bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 border-0 shadow-2xl animate-scale-in">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="text-8xl mb-6 animate-bounce">🎉</div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                    Félicitations !
                  </h2>
                  <p className="text-green-700 text-lg font-medium mb-6">
                    Vous avez résolu tous les mots croisés !
                  </p>
                  <div className="flex justify-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-8 h-8 text-yellow-500 animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrosswordBoard;
