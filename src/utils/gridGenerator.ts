import { GridCell, PlacedWord, WordIntersection } from '@/types/wordMagicGame';

export interface GridData {
  grid: GridCell[][];
  placedWords: PlacedWord[];
  intersections: WordIntersection[];
  gridWidth: number;
  gridHeight: number;
}

export class GridGenerator {
  static generateGrid(solutions: string[], bonusWords: string[] = []): GridData {
    const allWords = [...solutions, ...bonusWords];
    const placedWords: PlacedWord[] = [];
    const intersections: WordIntersection[] = [];
    
    // Simple grid generation - place first word horizontally, then try intersections
    if (allWords.length === 0) {
      return {
        grid: [[]],
        placedWords: [],
        intersections: [],
        gridWidth: 1,
        gridHeight: 1
      };
    }

    // Start with the longest word
    const sortedWords = allWords.sort((a, b) => b.length - a.length);
    const firstWord = sortedWords[0];
    
    let gridWidth = Math.max(15, firstWord.length + 4);
    let gridHeight = Math.max(15, Math.ceil(allWords.length * 1.5));
    
    // Place first word horizontally in the middle
    const startX = Math.floor((gridWidth - firstWord.length) / 2);
    const startY = Math.floor(gridHeight / 2);
    
    placedWords.push({
      id: firstWord,
      word: firstWord,
      startX,
      startY,
      direction: 'horizontal',
      isFound: false,
      isBonus: bonusWords.includes(firstWord)
    });

    // Try to place other words with intersections
    for (let i = 1; i < sortedWords.length && i < 8; i++) {
      const word = sortedWords[i];
      const placement = this.findBestPlacement(word, placedWords, gridWidth, gridHeight);
      
      if (placement) {
        placedWords.push({
          id: word,
          word: word,
          startX: placement.x,
          startY: placement.y,
          direction: placement.direction,
          isFound: false,
          isBonus: bonusWords.includes(word)
        });

        if (placement.intersection) {
          intersections.push(placement.intersection);
        }
      }
    }

    // Create grid
    const grid: GridCell[][] = [];
    for (let y = 0; y < gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < gridWidth; x++) {
        grid[y][x] = {
          letter: null,
          isRevealed: false,
          wordIds: [],
          x,
          y,
          isBlocked: true
        };
      }
    }

    // Place words in grid
    placedWords.forEach(placedWord => {
      for (let i = 0; i < placedWord.word.length; i++) {
        const x = placedWord.direction === 'horizontal' ? placedWord.startX + i : placedWord.startX;
        const y = placedWord.direction === 'vertical' ? placedWord.startY + i : placedWord.startY;
        
        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          grid[y][x].letter = placedWord.word[i];
          grid[y][x].isBlocked = false;
          grid[y][x].wordIds.push(placedWord.id);
        }
      }
    });

    return {
      grid,
      placedWords,
      intersections,
      gridWidth,
      gridHeight
    };
  }

  private static findBestPlacement(
    word: string, 
    existingWords: PlacedWord[], 
    gridWidth: number, 
    gridHeight: number
  ): { x: number; y: number; direction: 'horizontal' | 'vertical'; intersection?: WordIntersection } | null {
    
    // Try to find intersections with existing words
    for (const existingWord of existingWords) {
      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < existingWord.word.length; j++) {
          if (word[i] === existingWord.word[j]) {
            // Found a matching letter, try to place perpendicular
            const oppositeDirection = existingWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
            
            let newX, newY;
            if (oppositeDirection === 'horizontal') {
              newX = existingWord.startX + j - i;
              newY = existingWord.startY;
            } else {
              newX = existingWord.startX;
              newY = existingWord.startY + j - i;
            }

            // Check if placement is valid
            if (newX >= 0 && newY >= 0 && 
                newX + (oppositeDirection === 'horizontal' ? word.length : 1) <= gridWidth &&
                newY + (oppositeDirection === 'vertical' ? word.length : 1) <= gridHeight) {
              
              const intersectionX = oppositeDirection === 'horizontal' ? newX + i : newX;
              const intersectionY = oppositeDirection === 'vertical' ? newY + i : newY;
              
              return {
                x: newX,
                y: newY,
                direction: oppositeDirection,
                intersection: {
                  wordId1: existingWord.id,
                  wordId2: word,
                  x: intersectionX,
                  y: intersectionY,
                  letter: word[i]
                }
              };
            }
          }
        }
      }
    }

    // If no intersection found, place randomly (with some constraints)
    const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
    const maxX = direction === 'horizontal' ? gridWidth - word.length : gridWidth - 1;
    const maxY = direction === 'vertical' ? gridHeight - word.length : gridHeight - 1;
    
    if (maxX <= 0 || maxY <= 0) return null;
    
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    
    return { x, y, direction };
  }

  static updateGridWithFoundWords(
    gridData: GridData, 
    foundWords: string[]
  ): GridData {
    const updatedPlacedWords = gridData.placedWords.map(word => ({
      ...word,
      isFound: foundWords.includes(word.word.toUpperCase())
    }));

    const updatedGrid = gridData.grid.map(row => 
      row.map(cell => ({
        ...cell,
        isRevealed: cell.wordIds.some(wordId => 
          foundWords.includes(wordId.toUpperCase())
        )
      }))
    );

    return {
      ...gridData,
      grid: updatedGrid,
      placedWords: updatedPlacedWords
    };
  }

  static trimGrid(gridData: GridData): GridData {
    const { grid, placedWords } = gridData;
    
    // Find the bounds of actual content
    let minX = grid[0]?.length || 0;
    let maxX = 0;
    let minY = grid.length;
    let maxY = 0;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (!grid[y][x].isBlocked) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // Add padding
    minX = Math.max(0, minX - 1);
    minY = Math.max(0, minY - 1);
    maxX = Math.min(grid[0]?.length - 1 || 0, maxX + 1);
    maxY = Math.min(grid.length - 1, maxY + 1);

    const newWidth = maxX - minX + 1;
    const newHeight = maxY - minY + 1;

    // Create trimmed grid
    const trimmedGrid: GridCell[][] = [];
    for (let y = minY; y <= maxY; y++) {
      trimmedGrid[y - minY] = [];
      for (let x = minX; x <= maxX; x++) {
        trimmedGrid[y - minY][x - minX] = {
          ...grid[y][x],
          x: x - minX,
          y: y - minY
        };
      }
    }

    // Update placed words positions
    const updatedPlacedWords = placedWords.map(word => ({
      ...word,
      startX: word.startX - minX,
      startY: word.startY - minY
    }));

    // Update intersections positions
    const updatedIntersections = gridData.intersections.map(intersection => ({
      ...intersection,
      x: intersection.x - minX,
      y: intersection.y - minY
    }));

    return {
      grid: trimmedGrid,
      placedWords: updatedPlacedWords,
      intersections: updatedIntersections,
      gridWidth: newWidth,
      gridHeight: newHeight
    };
  }
}