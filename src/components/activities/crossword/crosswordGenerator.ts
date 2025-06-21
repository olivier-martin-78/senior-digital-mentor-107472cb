
import { Grid, Cell, WordData, PlacedWord, Direction, IntersectionPoint, Difficulty } from './types';
import { wordsDatabase } from './wordsDatabase';

export const getGridSize = (level: Difficulty): number => {
  const sizes = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 13 };
  return sizes[level];
};

export const getTargetWordCount = (level: Difficulty): number => {
  const targets = { 1: 8, 2: 12, 3: 16, 4: 20, 5: 25 };
  return targets[level];
};

export const getWordsForLevel = (level: Difficulty): WordData[] => {
  let availableWords = wordsDatabase.filter(w => w.level === level);
  
  if (availableWords.length < 50 && level > 1) {
    const lowerLevelWords = wordsDatabase.filter(w => w.level === level - 1);
    availableWords = [...availableWords, ...lowerLevelWords];
    
    if (availableWords.length < 100 && level > 2) {
      const evenLowerWords = wordsDatabase.filter(w => w.level === level - 2);
      availableWords = [...availableWords, ...evenLowerWords];
    }
  }
  
  return availableWords;
};

export const createEmptyGrid = (size: number): Grid => {
  return Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({
      letter: '',
      correctLetter: '',
      isBlack: true,
      isEditable: false,
      wordIds: []
    }))
  );
};

export const copyGrid = (grid: Grid): Grid => {
  return grid.map(row => row.map(cell => ({ ...cell, wordIds: [...(cell.wordIds || [])] })));
};

export const findAllIntersections = (word1: string, word2: string): IntersectionPoint[] => {
  const intersections: IntersectionPoint[] = [];
  for (let i = 0; i < word1.length; i++) {
    for (let j = 0; j < word2.length; j++) {
      if (word1[i] === word2[j]) {
        const centerScore1 = Math.abs(i - word1.length / 2);
        const centerScore2 = Math.abs(j - word2.length / 2);
        const score = 10 - (centerScore1 + centerScore2);
        
        intersections.push({
          word1Index: i,
          word2Index: j,
          pos1: i,
          pos2: j,
          score: Math.max(1, score)
        });
      }
    }
  }
  return intersections.sort((a, b) => b.score - a.score);
};

export const isValidPlacement = (
  grid: Grid,
  word: string,
  row: number,
  col: number,
  direction: Direction,
  size: number
): boolean => {
  if (direction === 'horizontal') {
    if (col + word.length > size || row < 0 || row >= size || col < 0) return false;
  } else {
    if (row + word.length > size || col < 0 || col >= size || row < 0) return false;
  }

  for (let i = 0; i < word.length; i++) {
    const currentRow = direction === 'horizontal' ? row : row + i;
    const currentCol = direction === 'horizontal' ? col + i : col;
    
    if (currentRow < 0 || currentRow >= size || currentCol < 0 || currentCol >= size) {
      return false;
    }
    
    const cell = grid[currentRow][currentCol];
    if (!cell) return false;

    if (cell.correctLetter && cell.correctLetter !== word[i]) {
      return false;
    }
  }

  return true;
};

export const placeWord = (
  grid: Grid,
  word: string,
  row: number,
  col: number,
  direction: Direction,
  wordId: number
): void => {
  for (let i = 0; i < word.length; i++) {
    const currentRow = direction === 'horizontal' ? row : row + i;
    const currentCol = direction === 'horizontal' ? col + i : col;
    
    grid[currentRow][currentCol].correctLetter = word[i];
    grid[currentRow][currentCol].isBlack = false;
    grid[currentRow][currentCol].isEditable = true;
    
    if (!grid[currentRow][currentCol].wordIds) {
      grid[currentRow][currentCol].wordIds = [];
    }
    if (!grid[currentRow][currentCol].wordIds!.includes(wordId)) {
      grid[currentRow][currentCol].wordIds!.push(wordId);
    }
  }

  grid[row][col].hasArrow = true;
  grid[row][col].arrowDirection = direction;
  grid[row][col].wordNumber = wordId;
};

export const calculateGridDensity = (grid: Grid): number => {
  let filledCells = 0;
  let totalCells = grid.length * grid[0].length;
  
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (!grid[i][j].isBlack) filledCells++;
    }
  }
  
  return filledCells / totalCells;
};

export const generateCrosswordGrid = (level: Difficulty): { grid: Grid, placedWords: PlacedWord[] } => {
  const size = getGridSize(level);
  const availableWords = getWordsForLevel(level);
  const targetWords = getTargetWordCount(level);
  
  console.log(`🎯 Génération optimisée - Objectif: ${targetWords} mots pour une grille ${size}x${size} niveau ${level}`);
  console.log(`📚 Mots disponibles: ${availableWords.length} pour le niveau ${level}`);

  let bestResult = { grid: createEmptyGrid(size), placedWords: [] as PlacedWord[] };
  let maxWordsPlaced = 0;

  const maxAttempts = 35;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`🚀 Tentative ${attempt + 1}/${maxAttempts}`);
    
    const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);
    const sortedWords = shuffledWords.sort((a, b) => {
      const vowels = 'AEIOU';
      const aVowels = a.word.split('').filter(c => vowels.includes(c)).length;
      const bVowels = b.word.split('').filter(c => vowels.includes(c)).length;
      
      if (aVowels !== bVowels) return bVowels - aVowels;
      if (a.length !== b.length) return a.length - b.length;
      return 0;
    });
    
    const newGrid = createEmptyGrid(size);
    const placedWords: PlacedWord[] = [];

    if (sortedWords.length > 0) {
      const firstWord = sortedWords[0];
      const startRow = Math.floor(size / 2);
      const startCol = Math.floor((size - firstWord.length) / 2);

      if (isValidPlacement(newGrid, firstWord.word, startRow, startCol, 'horizontal', size)) {
        placeWord(newGrid, firstWord.word, startRow, startCol, 'horizontal', 1);
        placedWords.push({
          id: 1,
          word: firstWord.word,
          clue: firstWord.clue,
          startRow,
          startCol,
          direction: 'horizontal',
          length: firstWord.length
        });
        
        console.log(`✅ Premier mot placé: ${firstWord.word} (${firstWord.length} lettres)`);
      }
    }

    let wordIndex = 1;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 15;

    while (wordIndex < sortedWords.length && placedWords.length < targetWords && consecutiveFailures < maxConsecutiveFailures) {
      const currentWord = sortedWords[wordIndex];
      let wordPlaced = false;
      let bestPlacements: Array<{
        row: number;
        col: number;
        direction: Direction;
        score: number;
        intersections: number;
      }> = [];

      for (const existingWord of placedWords) {
        const intersections = findAllIntersections(existingWord.word, currentWord.word);
        
        for (const intersection of intersections) {
          const newDirection: Direction = existingWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
          
          let newRow, newCol;
          if (existingWord.direction === 'horizontal') {
            newRow = existingWord.startRow - intersection.pos2;
            newCol = existingWord.startCol + intersection.pos1;
          } else {
            newRow = existingWord.startRow + intersection.pos1;
            newCol = existingWord.startCol - intersection.pos2;
          }

          if (isValidPlacement(newGrid, currentWord.word, newRow, newCol, newDirection, size)) {
            let intersectionCount = 0;
            for (let i = 0; i < currentWord.word.length; i++) {
              const checkRow = newDirection === 'horizontal' ? newRow : newRow + i;
              const checkCol = newDirection === 'horizontal' ? newCol + i : newCol;
              if (newGrid[checkRow][checkCol].correctLetter) {
                intersectionCount++;
              }
            }
            
            const densityScore = calculateGridDensity(newGrid);
            const centerDistance = Math.abs(newRow - size/2) + Math.abs(newCol - size/2);
            const vowelBonus = currentWord.word.split('').filter(c => 'AEIOUAEIOUY'.includes(c)).length;
            const totalScore = intersection.score + intersectionCount * 5 + densityScore * 3 + vowelBonus * 2 - centerDistance * 0.1;

            bestPlacements.push({
              row: newRow,
              col: newCol,
              direction: newDirection,
              score: totalScore,
              intersections: intersectionCount
            });
          }
        }
      }

      bestPlacements.sort((a, b) => b.score - a.score);
      
      if (bestPlacements.length > 0) {
        const bestPlacement = bestPlacements[0];
        
        placeWord(newGrid, currentWord.word, bestPlacement.row, bestPlacement.col, bestPlacement.direction, placedWords.length + 1);
        placedWords.push({
          id: placedWords.length + 1,
          word: currentWord.word,
          clue: currentWord.clue,
          startRow: bestPlacement.row,
          startCol: bestPlacement.col,
          direction: bestPlacement.direction,
          length: currentWord.length
        });
        
        console.log(`✅ Mot ${placedWords.length} placé: ${currentWord.word} (score: ${bestPlacement.score.toFixed(1)}, intersections: ${bestPlacement.intersections})`);
        wordPlaced = true;
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
      }

      wordIndex++;
    }

    console.log(`📊 Tentative ${attempt + 1}: ${placedWords.length} mots placés (densité: ${(calculateGridDensity(newGrid) * 100).toFixed(1)}%)`);

    if (placedWords.length > maxWordsPlaced) {
      maxWordsPlaced = placedWords.length;
      bestResult = { 
        grid: copyGrid(newGrid), 
        placedWords: [...placedWords] 
      };
    }

    if (placedWords.length >= targetWords * 0.75) {
      console.log(`🎉 Objectif atteint: ${placedWords.length}/${targetWords} mots`);
      break;
    }
  }

  console.log(`🏆 Résultat final: ${bestResult.placedWords.length} mots (objectif: ${targetWords}) avec ${availableWords.length} mots disponibles`);
  return bestResult;
};
