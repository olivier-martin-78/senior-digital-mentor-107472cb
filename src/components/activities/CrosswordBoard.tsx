import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye, Puzzle, Trophy, ArrowRight, ArrowDown, HelpCircle } from 'lucide-react';

type Difficulty = 1 | 2 | 3 | 4 | 5;
type Direction = 'horizontal' | 'vertical';

interface WordData {
  word: string;
  clue: string;
  length: number;
  level: number;
}

interface PlacedWord {
  id: number;
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  length: number;
}

interface Cell {
  letter: string;
  correctLetter: string;
  isBlack: boolean;
  isEditable: boolean;
  hasArrow?: boolean;
  arrowDirection?: Direction;
  wordNumber?: number;
  wordIds?: number[];
}

type Grid = Cell[][];

const CrosswordBoard = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [words, setWords] = useState<PlacedWord[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{row: number, col: number} | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const gridRefs = useRef<(React.RefObject<HTMLInputElement> | null)[][]>([]);

  // Base de données de mots organisée par niveau
  const wordsDatabase: WordData[] = [
    // Niveau 1 - Mots simples 2-3 lettres
    { word: 'SOL', clue: 'Surface terrestre', length: 3, level: 1 },
    { word: 'MER', clue: 'Étendue d\'eau salée', length: 3, level: 1 },
    { word: 'ROI', clue: 'Souverain d\'un royaume', length: 3, level: 1 },
    { word: 'VIE', clue: 'Existence', length: 3, level: 1 },
    { word: 'LOI', clue: 'Règle juridique', length: 3, level: 1 },
    { word: 'FOI', clue: 'Croyance religieuse', length: 3, level: 1 },
    { word: 'ART', clue: 'Expression créative', length: 3, level: 1 },
    { word: 'AIR', clue: 'Gaz que l\'on respire', length: 3, level: 1 },
    { word: 'EAU', clue: 'Liquide H2O', length: 3, level: 1 },
    { word: 'FEU', clue: 'Combustion', length: 3, level: 1 },
    { word: 'OR', clue: 'Métal précieux jaune', length: 2, level: 1 },
    { word: 'LIT', clue: 'Meuble pour dormir', length: 3, level: 1 },
    { word: 'NEZ', clue: 'Organe de l\'odorat', length: 3, level: 1 },
    { word: 'DOS', clue: 'Partie arrière du corps', length: 3, level: 1 },
    { word: 'COU', clue: 'Partie entre tête et corps', length: 3, level: 1 },
    
    // Niveau 2 - Mots de 3-4 lettres
    { word: 'CHAT', clue: 'Animal domestique qui miaule', length: 4, level: 2 },
    { word: 'PAIN', clue: 'Aliment fait de farine', length: 4, level: 2 },
    { word: 'LUNE', clue: 'Satellite naturel de la Terre', length: 4, level: 2 },
    { word: 'MAIN', clue: 'Extrémité du bras', length: 4, level: 2 },
    { word: 'JOUR', clue: 'Période de 24 heures', length: 4, level: 2 },
    { word: 'NUIT', clue: 'Période d\'obscurité', length: 4, level: 2 },
    { word: 'YEUX', clue: 'Organes de la vue', length: 4, level: 2 },
    { word: 'PIED', clue: 'Extrémité de la jambe', length: 4, level: 2 },
    { word: 'TOIT', clue: 'Couverture d\'une maison', length: 4, level: 2 },
    { word: 'VOIX', clue: 'Son émis par la gorge', length: 4, level: 2 },
    { word: 'BRAS', clue: 'Membre supérieur', length: 4, level: 2 },
    { word: 'COIN', clue: 'Angle d\'un lieu', length: 4, level: 2 },
    { word: 'ROSE', clue: 'Fleur parfumée', length: 4, level: 2 },
    { word: 'FILS', clue: 'Descendant mâle', length: 4, level: 2 },
    { word: 'PAIX', clue: 'Absence de guerre', length: 4, level: 2 },
    
    // Niveau 3 - Mots de 3-5 lettres
    { word: 'CHIEN', clue: 'Meilleur ami de l\'homme', length: 5, level: 3 },
    { word: 'FLEUR', clue: 'Partie colorée d\'une plante', length: 5, level: 3 },
    { word: 'LIVRE', clue: 'Objet fait de pages reliées', length: 5, level: 3 },
    { word: 'TABLE', clue: 'Meuble avec un plateau', length: 5, level: 3 },
    { word: 'MONDE', clue: 'Planète Terre', length: 5, level: 3 },
    { word: 'TEMPS', clue: 'Durée des événements', length: 5, level: 3 },
    { word: 'VILLE', clue: 'Grande agglomération urbaine', length: 5, level: 3 },
    { word: 'ROUGE', clue: 'Couleur du sang', length: 5, level: 3 },
    { word: 'BLANC', clue: 'Couleur de la neige', length: 5, level: 3 },
    { word: 'VERT', clue: 'Couleur de l\'herbe', length: 4, level: 3 },
    { word: 'BLEU', clue: 'Couleur du ciel', length: 4, level: 3 },
    { word: 'GRAND', clue: 'De grande taille', length: 5, level: 3 },
    { word: 'PETIT', clue: 'De petite taille', length: 5, level: 3 },
    { word: 'COURT', clue: 'De faible longueur', length: 5, level: 3 },
    { word: 'LONG', clue: 'De grande longueur', length: 4, level: 3 },
    { word: 'BEAU', clue: 'Agréable à voir', length: 4, level: 3 },
    { word: 'LAID', clue: 'Désagréable à voir', length: 4, level: 3 },
    { word: 'RICHE', clue: 'Qui a beaucoup d\'argent', length: 5, level: 3 },
    
    // Niveau 4 - Mots de 4-6 lettres
    { word: 'MUSIQUE', clue: 'Art des sons organisés', length: 7, level: 4 },
    { word: 'SCIENCE', clue: 'Connaissance rationnelle', length: 7, level: 4 },
    { word: 'VOYAGE', clue: 'Déplacement vers un lieu lointain', length: 6, level: 4 },
    { word: 'FAMILLE', clue: 'Groupe de personnes apparentées', length: 7, level: 4 },
    { word: 'BONHEUR', clue: 'État de satisfaction complète', length: 7, level: 4 },
    { word: 'NATURE', clue: 'Environnement naturel', length: 6, level: 4 },
    { word: 'SOLEIL', clue: 'Étoile qui éclaire la Terre', length: 6, level: 4 },
    { word: 'AMOUR', clue: 'Sentiment d\'affection profonde', length: 5, level: 4 },
    { word: 'ESPOIR', clue: 'Sentiment d\'attente confiante', length: 6, level: 4 },
    { word: 'RÊVE', clue: 'Pensées pendant le sommeil', length: 4, level: 4 },
    { word: 'ÉCOLE', clue: 'Établissement d\'enseignement', length: 5, level: 4 },
    { word: 'TRAVAIL', clue: 'Activité professionnelle', length: 7, level: 4 },
    { word: 'MAISON', clue: 'Lieu d\'habitation', length: 6, level: 4 },
    { word: 'JARDIN', clue: 'Espace cultivé de verdure', length: 6, level: 4 },
    { word: 'ENFANT', clue: 'Jeune être humain', length: 6, level: 4 },
    { word: 'PARENT', clue: 'Père ou mère', length: 6, level: 4 },
    { word: 'FRÈRE', clue: 'Fils des mêmes parents', length: 5, level: 4 },
    { word: 'SŒUR', clue: 'Fille des mêmes parents', length: 4, level: 4 },
    { word: 'ONCLE', clue: 'Frère du père ou de la mère', length: 5, level: 4 },
    { word: 'TANTE', clue: 'Sœur du père ou de la mère', length: 5, level: 4 },
    { word: 'COUSIN', clue: 'Fils de l\'oncle ou de la tante', length: 6, level: 4 },
    
    // Niveau 5 - Mots de 4-7 lettres
    { word: 'PARADOXE', clue: 'Contradiction apparente', length: 8, level: 5 },
    { word: 'MYSTÈRE', clue: 'Chose inexpliquée', length: 7, level: 5 },
    { word: 'SAGESSE', clue: 'Qualité de celui qui est sage', length: 7, level: 5 },
    { word: 'LIBERTÉ', clue: 'État de celui qui n\'est pas contraint', length: 7, level: 5 },
    { word: 'JUSTICE', clue: 'Respect du droit et de l\'équité', length: 7, level: 5 },
    { word: 'VÉRITÉ', clue: 'Conformité à la réalité', length: 6, level: 5 },
    { word: 'BEAUTÉ', clue: 'Qualité de ce qui est beau', length: 6, level: 5 },
    { word: 'COURAGE', clue: 'Qualité de celui qui brave le danger', length: 7, level: 5 },
    { word: 'PASSION', clue: 'Émotion intense et durable', length: 7, level: 5 },
    { word: 'ÉTERNITÉ', clue: 'Durée sans fin', length: 8, level: 5 },
    { word: 'LUMIÈRE', clue: 'Rayonnement visible', length: 7, level: 5 },
    { word: 'OMBRE', clue: 'Zone non éclairée', length: 5, level: 5 },
    { word: 'SILENCE', clue: 'Absence de bruit', length: 7, level: 5 },
    { word: 'MÉMOIRE', clue: 'Faculté de se souvenir', length: 7, level: 5 },
    { word: 'OUBLI', clue: 'Perte de mémoire', length: 5, level: 5 },
    { word: 'DESTIN', clue: 'Sort fixé d\'avance', length: 6, level: 5 },
    { word: 'HASARD', clue: 'Ce qui arrive par chance', length: 6, level: 5 },
    { word: 'FORTUNE', clue: 'Grande richesse', length: 7, level: 5 },
    { word: 'PAUVRETÉ', clue: 'État de celui qui est pauvre', length: 8, level: 5 },
    { word: 'RICHESSE', clue: 'Abondance de biens', length: 8, level: 5 },
    { word: 'GLOIRE', clue: 'Renommée éclatante', length: 6, level: 5 },
    { word: 'HONNEUR', clue: 'Sentiment de dignité', length: 7, level: 5 },
    { word: 'HONTE', clue: 'Sentiment de déshonneur', length: 5, level: 5 },
    { word: 'FIERTÉ', clue: 'Sentiment de satisfaction', length: 6, level: 5 }
  ];

  const getGridSize = (level: Difficulty): number => {
    const sizes = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 13 };
    return sizes[level];
  };

  const getWordsForLevel = (level: Difficulty): WordData[] => {
    return wordsDatabase.filter(w => w.level === level);
  };

  const createEmptyGrid = (size: number): Grid => {
    const newGrid = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        letter: '',
        correctLetter: '',
        isBlack: true,
        isEditable: false,
        wordIds: []
      }))
    );

    // Initialiser les références
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

  const canPlaceWord = (grid: Grid, word: string, row: number, col: number, direction: Direction, size: number): boolean => {
    // Vérifier les limites
    if (direction === 'horizontal') {
      if (col + word.length > size || row >= size) return false;
    } else {
      if (row + word.length > size || col >= size) return false;
    }

    // Vérifier chaque position
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'horizontal' ? row : row + i;
      const currentCol = direction === 'horizontal' ? col + i : col;

      if (grid[currentRow][currentCol].correctLetter && 
          grid[currentRow][currentCol].correctLetter !== word[i]) {
        return false;
      }
    }

    return true;
  };

  const generateGrid = (level: Difficulty): { grid: Grid, placedWords: PlacedWord[] } => {
    const size = getGridSize(level);
    const availableWords = getWordsForLevel(level);
    // Tripler le nombre de mots à placer
    const wordsToPlace = Math.min((6 + level * 2) * 3, availableWords.length);
    
    const selectedWords = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, wordsToPlace);

    const newGrid = createEmptyGrid(size);
    const placedWords: PlacedWord[] = [];

    // Placer le premier mot au centre
    if (selectedWords.length > 0) {
      const firstWord = selectedWords[0];
      const startRow = Math.floor(size / 2);
      const startCol = Math.floor((size - firstWord.length) / 2);

      const placedWord: PlacedWord = {
        id: 1,
        word: firstWord.word,
        clue: firstWord.clue,
        startRow,
        startCol,
        direction: 'horizontal',
        length: firstWord.length
      };

      // Placer dans la grille
      for (let i = 0; i < firstWord.length; i++) {
        newGrid[startRow][startCol + i].correctLetter = firstWord.word[i];
        newGrid[startRow][startCol + i].isBlack = false;
        newGrid[startRow][startCol + i].isEditable = true;
        newGrid[startRow][startCol + i].wordIds = [1];
      }

      // Marquer la flèche
      newGrid[startRow][startCol].hasArrow = true;
      newGrid[startRow][startCol].arrowDirection = 'horizontal';
      newGrid[startRow][startCol].wordNumber = 1;

      placedWords.push(placedWord);
    }

    // Placer les autres mots
    for (let wordIndex = 1; wordIndex < selectedWords.length; wordIndex++) {
      const currentWord = selectedWords[wordIndex];
      let wordPlaced = false;

      // Essayer de placer en intersection
      for (const placedWord of placedWords) {
        if (wordPlaced) break;

        const intersections = findIntersections(currentWord.word, placedWord.word);
        
        for (const intersection of intersections) {
          if (wordPlaced) break;

          const newDirection: Direction = placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
          let newStartRow, newStartCol;

          if (placedWord.direction === 'horizontal') {
            newStartRow = placedWord.startRow - intersection.pos1;
            newStartCol = placedWord.startCol + intersection.pos2;
          } else {
            newStartRow = placedWord.startRow + intersection.pos2;
            newStartCol = placedWord.startCol - intersection.pos1;
          }

          if (newStartRow >= 0 && newStartCol >= 0 && 
              canPlaceWord(newGrid, currentWord.word, newStartRow, newStartCol, newDirection, size)) {
            
            const newPlacedWord: PlacedWord = {
              id: wordIndex + 1,
              word: currentWord.word,
              clue: currentWord.clue,
              startRow: newStartRow,
              startCol: newStartCol,
              direction: newDirection,
              length: currentWord.length
            };

            // Placer dans la grille
            for (let i = 0; i < currentWord.length; i++) {
              const row = newDirection === 'horizontal' ? newStartRow : newStartRow + i;
              const col = newDirection === 'horizontal' ? newStartCol + i : newStartCol;
              
              newGrid[row][col].correctLetter = currentWord.word[i];
              newGrid[row][col].isBlack = false;
              newGrid[row][col].isEditable = true;
              
              if (!newGrid[row][col].wordIds) {
                newGrid[row][col].wordIds = [];
              }
              newGrid[row][col].wordIds!.push(wordIndex + 1);
            }

            // Marquer la flèche
            newGrid[newStartRow][newStartCol].hasArrow = true;
            newGrid[newStartRow][newStartCol].arrowDirection = newDirection;
            newGrid[newStartRow][newStartCol].wordNumber = wordIndex + 1;

            placedWords.push(newPlacedWord);
            wordPlaced = true;
          }
        }
      }
    }

    return { grid: newGrid, placedWords };
  };

  const generateNewGame = () => {
    const { grid: newGrid, placedWords } = generateGrid(difficulty);
    setGrid(newGrid);
    setWords(placedWords);
    setGameCompleted(false);
    setShowSolution(false);
    setSelectedWord(null);
    setCurrentPosition(null);
  };

  const handleCellInput = (row: number, col: number, value: string) => {
    if (!grid[row][col].isEditable || showSolution) return;
    
    const letter = value.toUpperCase().replace(/[^A-Z]/g, '');
    if (letter.length > 1) return;

    const newGrid = [...grid];
    newGrid[row][col].letter = letter;
    setGrid(newGrid);

    // Navigation automatique
    if (letter && selectedWord) {
      const word = words.find(w => w.id === selectedWord);
      if (word) {
        moveToNextCell(row, col, word.direction);
      }
    }

    checkCompletion(newGrid);
  };

  const moveToNextCell = (currentRow: number, currentCol: number, direction: Direction) => {
    const nextRow = direction === 'horizontal' ? currentRow : currentRow + 1;
    const nextCol = direction === 'horizontal' ? currentCol + 1 : currentCol;

    if (nextRow < grid.length && nextCol < grid[0].length && 
        grid[nextRow][nextCol].isEditable) {
      setCurrentPosition({ row: nextRow, col: nextCol });
      setTimeout(() => {
        const inputRef = gridRefs.current[nextRow][nextCol];
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.wordIds && cell.wordIds.length > 0) {
      setSelectedWord(cell.wordIds[0]);
      setCurrentPosition({ row, col });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveWithArrow(row, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveWithArrow(row, col + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveWithArrow(row - 1, col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveWithArrow(row + 1, col);
        break;
    }
  };

  const moveWithArrow = (newRow: number, newCol: number) => {
    if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length && 
        grid[newRow][newCol].isEditable) {
      setCurrentPosition({ row: newRow, col: newCol });
      setTimeout(() => {
        const inputRef = gridRefs.current[newRow][newCol];
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const checkCompletion = (currentGrid: Grid) => {
    const allCorrect = words.every(word => {
      for (let i = 0; i < word.length; i++) {
        const row = word.direction === 'horizontal' ? word.startRow : word.startRow + i;
        const col = word.direction === 'horizontal' ? word.startCol + i : word.startCol;
        if (currentGrid[row][col].letter !== currentGrid[row][col].correctLetter) {
          return false;
        }
      }
      return true;
    });

    if (allCorrect && words.length > 0) {
      setGameCompleted(true);
    }
  };

  const revealSolution = () => {
    const newGrid = [...grid];
    for (let i = 0; i < newGrid.length; i++) {
      for (let j = 0; j < newGrid[i].length; j++) {
        if (newGrid[i][j].isEditable) {
          newGrid[i][j].letter = newGrid[i][j].correctLetter;
        }
      }
    }
    setGrid(newGrid);
    setShowSolution(true);
    setGameCompleted(true);
  };

  const renderCell = (row: number, col: number) => {
    const cell = grid[row][col];
    
    if (cell.isBlack) {
      return (
        <div
          key={`${row}-${col}`}
          className="w-12 h-12 bg-gray-800 border border-gray-600"
        />
      );
    }

    const isHighlighted = selectedWord && cell.wordIds && cell.wordIds.includes(selectedWord);
    const isCurrent = currentPosition?.row === row && currentPosition?.col === col;

    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-12 h-12 border border-gray-400 relative flex items-center justify-center cursor-pointer
          ${cell.isEditable ? 'bg-white' : 'bg-gray-100'}
          ${isHighlighted ? 'bg-yellow-200 border-yellow-400 border-2' : ''}
          ${isCurrent ? 'bg-blue-200 border-blue-500 border-2' : ''}
          ${showSolution && cell.letter === cell.correctLetter ? 'text-red-600' : ''}
        `}
        onClick={() => handleCellClick(row, col)}
      >
        {cell.hasArrow && (
          <div className="absolute top-0 left-0 text-xs font-bold text-blue-600">
            {cell.wordNumber}
            {cell.arrowDirection === 'horizontal' ? (
              <ArrowRight className="w-3 h-3 inline ml-1" />
            ) : (
              <ArrowDown className="w-3 h-3 inline ml-1" />
            )}
          </div>
        )}
        {cell.isEditable ? (
          <Input
            ref={gridRefs.current[row] ? gridRefs.current[row][col] : null}
            type="text"
            value={cell.letter}
            onChange={(e) => handleCellInput(row, col, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, row, col)}
            onFocus={() => setCurrentPosition({ row, col })}
            className="w-full h-full border-0 text-center text-sm font-bold p-0 bg-transparent focus:ring-0 focus:outline-none"
            maxLength={1}
            disabled={showSolution}
          />
        ) : (
          <span className="text-sm font-bold">{cell.letter}</span>
        )}
      </div>
    );
  };

  const horizontalWords = words.filter(w => w.direction === 'horizontal');
  const verticalWords = words.filter(w => w.direction === 'vertical');

  useEffect(() => {
    generateNewGame();
  }, [difficulty]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <Puzzle className="w-8 h-8 text-indigo-600 mr-3" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Mots Fléchés
                </h1>
                <Trophy className="w-8 h-8 text-yellow-500 ml-3" />
              </div>
              <p className="text-gray-600 text-lg">
                Remplissez la grille en suivant les flèches et les définitions
              </p>
            </div>
          </div>

          {/* Controls */}
          <Card className="mb-8 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
              <CardTitle className="text-2xl text-gray-800 flex items-center justify-between">
                <span>Contrôles</span>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Niveau {difficulty}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-bold text-gray-700">Difficulté :</label>
                  <Select value={difficulty.toString()} onValueChange={(value) => setDifficulty(parseInt(value) as Difficulty)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Niveau 1 - Très facile</SelectItem>
                      <SelectItem value="2">Niveau 2 - Facile</SelectItem>
                      <SelectItem value="3">Niveau 3 - Moyen</SelectItem>
                      <SelectItem value="4">Niveau 4 - Difficile</SelectItem>
                      <SelectItem value="5">Niveau 5 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={generateNewGame} className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Nouveau jeu</span>
                </Button>

                <Button onClick={revealSolution} variant="outline" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Afficher solution</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Grille */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
                  <CardTitle className="text-xl text-center">
                    Grille {getGridSize(difficulty)}×{getGridSize(difficulty)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 flex justify-center">
                  <div 
                    className="grid gap-1 border-2 border-gray-800 bg-white rounded-lg overflow-hidden"
                    style={{ gridTemplateColumns: `repeat(${getGridSize(difficulty)}, minmax(0, 1fr))` }}
                  >
                    {grid.map((row, rowIndex) =>
                      row.map((_, colIndex) => renderCell(rowIndex, colIndex))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Définitions */}
            <div>
              <Card className="shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
                  <CardTitle className="text-xl flex items-center">
                    <HelpCircle className="w-5 h-5 mr-2" />
                    Définitions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {horizontalWords.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center">
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Horizontaux
                        </h3>
                        <div className="space-y-2">
                          {horizontalWords.map((word) => (
                            <div
                              key={word.id}
                              className={`p-2 rounded cursor-pointer transition-colors ${
                                selectedWord === word.id ? 'bg-yellow-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedWord(word.id)}
                            >
                              <span className="font-bold text-blue-600">{word.id}.</span> {word.clue}
                              <span className="text-xs text-gray-500 ml-2">({word.length} lettres)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {verticalWords.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center">
                          <ArrowDown className="w-4 h-4 mr-1" />
                          Verticaux
                        </h3>
                        <div className="space-y-2">
                          {verticalWords.map((word) => (
                            <div
                              key={word.id}
                              className={`p-2 rounded cursor-pointer transition-colors ${
                                selectedWord === word.id ? 'bg-yellow-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedWord(word.id)}
                            >
                              <span className="font-bold text-blue-600">{word.id}.</span> {word.clue}
                              <span className="text-xs text-gray-500 ml-2">({word.length} lettres)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Message de victoire */}
          {gameCompleted && !showSolution && (
            <Card className="mt-8 bg-gradient-to-r from-green-100 to-emerald-100 shadow-2xl">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-4">
                    Félicitations !
                  </h2>
                  <p className="text-green-700 text-lg">
                    Vous avez résolu tous les mots fléchés !
                  </p>
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
