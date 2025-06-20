
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, Lightbulb, Star, Puzzle, Trophy, ArrowRight, ArrowDown } from 'lucide-react';

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
  isBlack: boolean;
  isArrow?: boolean;
  arrowDirection?: Direction;
  wordId?: number;
  isEditable: boolean;
}

type Grid = Cell[][];

const CrosswordBoard = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('moyen');
  const [gameState, setGameState] = useState<'playing' | 'completed'>('playing');
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState(9);

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
      case 'très-facile': return { size: 7, wordsCount: 4 };
      case 'facile': return { size: 9, wordsCount: 5 };
      case 'moyen': return { size: 11, wordsCount: 6 };
      case 'difficile': return { size: 13, wordsCount: 7 };
      case 'expert': return { size: 15, wordsCount: 8 };
      default: return { size: 9, wordsCount: 5 };
    }
  };

  const createEmptyGrid = (size: number): Grid => {
    return Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        letter: '',
        isBlack: false,
        isEditable: false
      }))
    );
  };

  const placeWordsInGrid = (selectedWords: Word[], size: number): Grid => {
    const newGrid = createEmptyGrid(size);
    
    // Marquer les cases noires aléatoirement
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (Math.random() < 0.15) { // 15% de cases noires
          newGrid[i][j].isBlack = true;
        }
      }
    }

    // Placer les mots
    selectedWords.forEach((word, index) => {
      const { startRow, startCol, direction, word: wordText } = word;
      
      // Placer la flèche au début du mot
      if (startRow >= 0 && startRow < size && startCol >= 0 && startCol < size) {
        newGrid[startRow][startCol].isArrow = true;
        newGrid[startRow][startCol].arrowDirection = direction;
        newGrid[startRow][startCol].wordId = word.id;
        newGrid[startRow][startCol].isBlack = false;
      }

      // Placer les lettres du mot
      for (let i = 0; i < wordText.length; i++) {
        const row = direction === 'horizontal' ? startRow : startRow + i;
        const col = direction === 'horizontal' ? startCol + i : startCol;
        
        if (row >= 0 && row < size && col >= 0 && col < size) {
          newGrid[row][col].letter = '';
          newGrid[row][col].isBlack = false;
          newGrid[row][col].isEditable = true;
          newGrid[row][col].wordId = word.id;
        }
      }
    });

    return newGrid;
  };

  const generateRandomWords = (difficulty: Difficulty): Word[] => {
    const settings = getDifficultySettings(difficulty);
    const availableWords = wordSets[difficulty];
    const selectedWords = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, settings.wordsCount);

    return selectedWords.map((wordData, index) => {
      const isHorizontal = Math.random() > 0.5;
      const maxStartRow = isHorizontal ? settings.size - 1 : settings.size - wordData.length;
      const maxStartCol = isHorizontal ? settings.size - wordData.length : settings.size - 1;
      
      return {
        id: index + 1,
        word: wordData.word,
        definition: wordData.definition,
        startRow: Math.floor(Math.random() * Math.max(1, maxStartRow)),
        startCol: Math.floor(Math.random() * Math.max(1, maxStartCol)),
        direction: isHorizontal ? 'horizontal' : 'vertical',
        length: wordData.length
      };
    });
  };

  const generateNewGrid = () => {
    const settings = getDifficultySettings(difficulty);
    setGridSize(settings.size);
    
    const newWords = generateRandomWords(difficulty);
    setWords(newWords);
    
    const newGrid = placeWordsInGrid(newWords, settings.size);
    setGrid(newGrid);
    setGameState('playing');
    setSelectedWord(null);
  };

  const updateCell = (row: number, col: number, value: string) => {
    if (!grid[row][col].isEditable || value.length > 1) return;
    
    const newGrid = [...grid];
    newGrid[row][col].letter = value.toUpperCase();
    setGrid(newGrid);
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
          className="w-8 h-8 bg-gray-800 border border-gray-600"
        />
      );
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-8 h-8 border border-gray-400 relative flex items-center justify-center
          ${cell.isEditable ? 'bg-white' : 'bg-gray-100'}
          ${selectedWord === cell.wordId ? 'bg-blue-100' : ''}
        `}
        onClick={() => cell.wordId && setSelectedWord(cell.wordId)}
      >
        {cell.isArrow && (
          <div className="absolute top-0 left-0 text-xs text-blue-600">
            {cell.arrowDirection === 'horizontal' ? <ArrowRight className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          </div>
        )}
        {cell.isEditable ? (
          <Input
            type="text"
            value={cell.letter}
            onChange={(e) => updateCell(row, col, e.target.value)}
            className="w-full h-full border-0 text-center text-sm font-bold p-0 bg-transparent focus:ring-0 focus:outline-none"
            maxLength={1}
          />
        ) : (
          <span className="text-sm font-bold">{cell.letter}</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
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

          {/* Contrôles */}
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
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Grille de mots croisés */}
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
                    className="grid gap-0 border-2 border-gray-800 bg-white rounded-lg overflow-hidden shadow-lg"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
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
                      <div
                        key={word.id}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all duration-200
                          ${selectedWord === word.id 
                            ? 'bg-blue-100 border-blue-300 shadow-md' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }
                        `}
                        onClick={() => setSelectedWord(word.id)}
                      >
                        <div className="flex items-center mb-2">
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
                        <p className="text-sm font-medium text-gray-800">
                          {word.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Message de victoire */}
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
