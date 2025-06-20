
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertCircle, Star, Puzzle, Trophy } from 'lucide-react';

type Difficulty = 'très-facile' | 'facile' | 'moyen' | 'difficile' | 'expert';
type Cell = number | null;
type Grid = Cell[][];

const SudokuBoard = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [initialGrid, setInitialGrid] = useState<Grid>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('moyen');
  const [gameState, setGameState] = useState<'playing' | 'completed' | 'error'>('playing');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [errors, setErrors] = useState<{ row: number; col: number }[]>([]);

  // Générer une grille de Sudoku valide
  const generateValidGrid = (): Grid => {
    const grid: Grid = Array(9).fill(null).map(() => Array(9).fill(null));
    
    // Remplir la grille de manière récursive
    const fillGrid = (row: number, col: number): boolean => {
      if (row === 9) return true;
      if (col === 9) return fillGrid(row + 1, 0);
      
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      
      for (const num of numbers) {
        if (isValidMove(grid, row, col, num)) {
          grid[row][col] = num;
          if (fillGrid(row, col + 1)) return true;
          grid[row][col] = null;
        }
      }
      
      return false;
    };
    
    fillGrid(0, 0);
    return grid;
  };

  // Vérifier si un mouvement est valide
  const isValidMove = (grid: Grid, row: number, col: number, num: number): boolean => {
    // Vérifier la ligne
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num) return false;
    }
    
    // Vérifier la colonne
    for (let i = 0; i < 9; i++) {
      if (grid[i][col] === num) return false;
    }
    
    // Vérifier la sous-grille 3x3
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startCol; j < startCol + 3; j++) {
        if (grid[i][j] === num) return false;
      }
    }
    
    return true;
  };

  // Créer un puzzle en supprimant des cellules
  const createPuzzle = (completeGrid: Grid, difficulty: Difficulty): Grid => {
    const puzzle = completeGrid.map(row => [...row]);
    
    const cellsToRemove = {
      'très-facile': 30,
      'facile': 40,
      'moyen': 50,
      'difficile': 60,
      'expert': 70
    };
    
    const toRemove = cellsToRemove[difficulty];
    let removed = 0;
    
    while (removed < toRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (puzzle[row][col] !== null) {
        puzzle[row][col] = null;
        removed++;
      }
    }
    
    return puzzle;
  };

  // Générer une nouvelle grille
  const generateNewGrid = () => {
    const completeGrid = generateValidGrid();
    const puzzle = createPuzzle(completeGrid, difficulty);
    setGrid(puzzle);
    setInitialGrid(puzzle.map(row => [...row]));
    setGameState('playing');
    setErrors([]);
    setSelectedCell(null);
  };

  // Mettre à jour une cellule
  const updateCell = (row: number, col: number, value: string) => {
    if (initialGrid[row][col] !== null) return; // Ne pas modifier les cellules pré-remplies
    
    const num = value === '' ? null : parseInt(value);
    if (num !== null && (num < 1 || num > 9)) return;
    
    const newGrid = grid.map((r, i) => 
      r.map((c, j) => (i === row && j === col) ? num : c)
    );
    
    setGrid(newGrid);
    
    // Vérifier la validité
    if (num !== null && !isValidMove(grid, row, col, num)) {
      setErrors([...errors.filter(e => !(e.row === row && e.col === col)), { row, col }]);
    } else {
      setErrors(errors.filter(e => !(e.row === row && e.col === col)));
    }
  };

  // Vérifier si le puzzle est complété
  const checkCompletion = () => {
    // Vérifier que toutes les cellules sont remplies
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] === null) return false;
      }
    }
    
    // Vérifier la validité complète
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const num = grid[i][j];
        if (num === null) return false;
        
        // Créer une grille temporaire sans cette cellule pour la validation
        const tempGrid = grid.map(row => [...row]);
        tempGrid[i][j] = null;
        
        if (!isValidMove(tempGrid, i, j, num)) return false;
      }
    }
    
    return true;
  };

  // Vérifier la completion à chaque changement de grille
  useEffect(() => {
    if (grid.length > 0 && checkCompletion()) {
      setGameState('completed');
    }
  }, [grid]);

  // Initialiser la grille
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
    const value = grid[row][col];
    const isInitial = initialGrid[row][col] !== null;
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const hasError = errors.some(e => e.row === row && e.col === col);
    const isInSameRegion = selectedCell && 
      Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && 
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3);
    const isInSameRowOrCol = selectedCell && (selectedCell.row === row || selectedCell.col === col);

    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-10 h-10 border border-gray-300 flex items-center justify-center cursor-pointer
          transition-all duration-200 hover:bg-blue-50
          ${isSelected ? 'bg-blue-200 ring-2 ring-blue-400' : ''}
          ${isInSameRegion && !isSelected ? 'bg-blue-50' : ''}
          ${isInSameRowOrCol && !isSelected ? 'bg-yellow-50' : ''}
          ${hasError ? 'bg-red-100 text-red-700' : ''}
          ${isInitial ? 'bg-gray-100 font-bold text-gray-800' : 'bg-white'}
          ${(col + 1) % 3 === 0 && col < 8 ? 'border-r-2 border-r-gray-800' : ''}
          ${(row + 1) % 3 === 0 && row < 8 ? 'border-b-2 border-b-gray-800' : ''}
        `}
        onClick={() => !isInitial && setSelectedCell({ row, col })}
      >
        {isInitial ? (
          <span className="text-sm font-bold">{value}</span>
        ) : (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => updateCell(row, col, e.target.value)}
            className={`
              w-full h-full border-0 text-center text-sm font-medium p-0 bg-transparent
              focus:ring-0 focus:outline-none
              ${hasError ? 'text-red-700' : 'text-blue-700'}
            `}
            maxLength={1}
            onFocus={() => setSelectedCell({ row, col })}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <Puzzle className="w-8 h-8 text-blue-600 mr-3" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Sudoku
                </h1>
                <Trophy className="w-8 h-8 text-yellow-500 ml-3" />
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Remplissez la grille avec les chiffres de 1 à 9, sans répétition dans chaque ligne, colonne et carré 3x3.
              </p>
            </div>
          </div>

          {/* Contrôles */}
          <Card className="mb-8 overflow-hidden shadow-xl border-0">
            <div className={`h-2 ${getDifficultyColor(difficulty)}`}></div>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center justify-between text-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
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
                    <SelectTrigger className="w-48 border-2 border-blue-200 hover:border-blue-400 transition-colors">
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

          {/* Grille de Sudoku */}
          <Card className="shadow-2xl border-0 overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100">
              <CardTitle className="text-2xl text-gray-800 flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-3"></div>
                Grille de Sudoku
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white flex justify-center">
              <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 bg-white rounded-lg overflow-hidden shadow-lg">
                {grid.map((row, rowIndex) =>
                  row.map((_, colIndex) => renderCell(rowIndex, colIndex))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message de victoire */}
          {gameState === 'completed' && (
            <Card className="bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 border-0 shadow-2xl animate-scale-in">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="text-8xl mb-6 animate-bounce">🎉</div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                    Félicitations !
                  </h2>
                  <p className="text-green-700 text-lg font-medium mb-6">
                    Vous avez résolu le Sudoku avec succès !
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

          {/* Instructions */}
          <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-3"></div>
                Règles du jeu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  "Chaque ligne doit contenir les chiffres de 1 à 9 sans répétition",
                  "Chaque colonne doit contenir les chiffres de 1 à 9 sans répétition", 
                  "Chaque carré 3x3 doit contenir les chiffres de 1 à 9 sans répétition"
                ].map((rule, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SudokuBoard;
