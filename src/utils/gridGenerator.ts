import { GridCell, PlacedWord, WordIntersection } from '@/types/wordMagicGame';

export interface GridData {
  grid: GridCell[][];
  placedWords: PlacedWord[];
  intersections: WordIntersection[];
  gridWidth: number;
  gridHeight: number;
}

export class GridGenerator {
  // Convert existing grid_layout to GridData
  static fromGridLayout(gridLayout: any[][], solutions: string[], bonusWords: string[] = []): GridData {
    if (!gridLayout || gridLayout.length === 0) {
      return this.generateGrid(solutions, bonusWords);
    }

    const gridHeight = gridLayout.length;
    const gridWidth = gridLayout[0]?.length || 0;
    const grid: GridCell[][] = [];
    const placedWords: PlacedWord[] = [];
    const intersections: WordIntersection[] = [];
    const allWords = [...solutions, ...bonusWords];

    // Initialize grid
    for (let y = 0; y < gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < gridWidth; x++) {
        const cell = gridLayout[y][x];
        const hasLetter = cell?.letter && typeof cell.letter === 'string' && cell.letter.trim() !== '' && cell.letter !== '-';
        grid[y][x] = {
          letter: hasLetter ? cell.letter.trim().toUpperCase() : null,
          isRevealed: false,
          wordIds: [],
          x,
          y,
          isBlocked: !hasLetter
        };
      }
    }

    // Find words in the grid
    this.findWordsInGrid(grid, allWords, placedWords, intersections, bonusWords);

    return {
      grid,
      placedWords,
      intersections,
      gridWidth,
      gridHeight
    };
  }

  // Find words in an existing grid
  private static findWordsInGrid(
    grid: GridCell[][],
    allWords: string[],
    placedWords: PlacedWord[],
    intersections: WordIntersection[],
    bonusWords: string[]
  ) {
    const foundWords = new Set<string>();

    // Check horizontal words
    for (let y = 0; y < grid.length; y++) {
      let currentWord = '';
      let startX = -1;
      
      for (let x = 0; x <= grid[y].length; x++) {
        const cell = grid[y]?.[x];
        
        if (cell && !cell.isBlocked && cell.letter) {
          if (startX === -1) startX = x;
          currentWord += cell.letter;
        } else {
          if (currentWord.length > 1 && allWords.includes(currentWord) && !foundWords.has(currentWord)) {
            foundWords.add(currentWord);
            placedWords.push({
              id: currentWord,
              word: currentWord,
              startX,
              startY: y,
              direction: 'horizontal',
              isFound: false,
              isBonus: bonusWords.includes(currentWord)
            });
            
            // Mark cells as belonging to this word
            for (let i = 0; i < currentWord.length; i++) {
              grid[y][startX + i].wordIds.push(currentWord);
            }
          }
          currentWord = '';
          startX = -1;
        }
      }
    }

    // Check vertical words
    for (let x = 0; x < grid[0]?.length || 0; x++) {
      let currentWord = '';
      let startY = -1;
      
      for (let y = 0; y <= grid.length; y++) {
        const cell = grid[y]?.[x];
        
        if (cell && !cell.isBlocked && cell.letter) {
          if (startY === -1) startY = y;
          currentWord += cell.letter;
        } else {
          if (currentWord.length > 1 && allWords.includes(currentWord) && !foundWords.has(currentWord)) {
            foundWords.add(currentWord);
            placedWords.push({
              id: currentWord,
              word: currentWord,
              startX: x,
              startY,
              direction: 'vertical',
              isFound: false,
              isBonus: bonusWords.includes(currentWord)
            });
            
            // Mark cells as belonging to this word
            for (let i = 0; i < currentWord.length; i++) {
              grid[startY + i][x].wordIds.push(currentWord);
            }
          }
          currentWord = '';
          startY = -1;
        }
      }
    }

    // Find intersections
    this.findIntersections(placedWords, intersections);
  }

  // Find intersections between placed words
  private static findIntersections(placedWords: PlacedWord[], intersections: WordIntersection[]) {
    for (let i = 0; i < placedWords.length; i++) {
      for (let j = i + 1; j < placedWords.length; j++) {
        const word1 = placedWords[i];
        const word2 = placedWords[j];
        
        if (word1.direction !== word2.direction) {
          const intersection = this.findWordIntersection(word1, word2);
          if (intersection) {
            intersections.push(intersection);
          }
        }
      }
    }
  }

  // Find intersection point between two words
  private static findWordIntersection(word1: PlacedWord, word2: PlacedWord): WordIntersection | null {
    const horizontal = word1.direction === 'horizontal' ? word1 : word2;
    const vertical = word1.direction === 'vertical' ? word1 : word2;
    
    // Check if they intersect
    const hStartX = horizontal.startX;
    const hEndX = horizontal.startX + horizontal.word.length - 1;
    const hY = horizontal.startY;
    
    const vX = vertical.startX;
    const vStartY = vertical.startY;
    const vEndY = vertical.startY + vertical.word.length - 1;
    
    if (vX >= hStartX && vX <= hEndX && hY >= vStartY && hY <= vEndY) {
      const hCharIndex = vX - hStartX;
      const vCharIndex = hY - vStartY;
      
      if (horizontal.word[hCharIndex] === vertical.word[vCharIndex]) {
        return {
          wordId1: horizontal.id,
          wordId2: vertical.id,
          x: vX,
          y: hY,
          letter: horizontal.word[hCharIndex]
        };
      }
    }
    
    return null;
  }

  static generateGrid(solutions: string[], bonusWords: string[] = []): GridData {
    // Use intelligent algorithm for automatic generation
    return this.generateIntelligentGrid(solutions, bonusWords);
  }

  // New intelligent grid generation algorithm with parasitic word detection
  static generateIntelligentGrid(solutions: string[], bonusWords: string[] = []): GridData {
    const allWords = [...solutions, ...bonusWords];
    if (allWords.length === 0) {
      return {
        grid: [[]],
        placedWords: [],
        intersections: [],
        gridWidth: 1,
        gridHeight: 1
      };
    }

    // Sort words by length (longest first) and then by number of potential intersections
    const sortedWords = allWords.sort((a, b) => {
      const lengthDiff = b.length - a.length;
      if (lengthDiff !== 0) return lengthDiff;
      
      // Secondary sort by potential intersections
      const aIntersections = allWords.filter(w => w !== a && this.hasCommonLetters(a, w)).length;
      const bIntersections = allWords.filter(w => w !== b && this.hasCommonLetters(b, w)).length;
      return bIntersections - aIntersections;
    });

    const bestSolution = this.findBestGridSolution(sortedWords, bonusWords);
    const gridData = this.createGridFromSolution(bestSolution, bonusWords);
    
    // Detect and validate parasitic words
    const parasiticWords = this.detectParasiticWords(gridData, allWords);
    
    // If too many parasitic words, try again with different placement
    if (parasiticWords.length > Math.floor(allWords.length * 0.5)) {
      console.warn(`Detected ${parasiticWords.length} parasitic words:`, parasiticWords);
      return this.generateIntelligentGridWithConstraints(sortedWords, bonusWords, parasiticWords);
    }
    
    return gridData;
  }

  // Generate grid with constraints to avoid specific parasitic words
  static generateIntelligentGridWithConstraints(words: string[], bonusWords: string[], avoidWords: string[]): GridData {
    const maxAttempts = 50;
    let bestSolution: PlacedWord[] = [];
    let bestScore = -1;
    let fewestParasites = Infinity;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const solution = this.tryPlaceAllWordsWithConstraints(words, bonusWords, avoidWords);
      if (solution.length === 0) continue;
      
      const tempGrid = this.createGridFromSolution(solution, bonusWords);
      const parasites = this.detectParasiticWords(tempGrid, [...words, ...bonusWords]);
      const score = this.scoreSolution(solution);
      
      if (parasites.length < fewestParasites || (parasites.length === fewestParasites && score > bestScore)) {
        bestSolution = solution;
        bestScore = score;
        fewestParasites = parasites.length;
        
        // If we found a solution with no parasites, use it
        if (parasites.length === 0) break;
      }
    }

    return this.createGridFromSolution(bestSolution, bonusWords);
  }

  // Check if two words have common letters
  private static hasCommonLetters(word1: string, word2: string): boolean {
    for (const char of word1) {
      if (word2.includes(char)) return true;
    }
    return false;
  }

  // Find the best grid solution using backtracking
  private static findBestGridSolution(words: string[], bonusWords: string[]): PlacedWord[] {
    const maxAttempts = 100;
    let bestSolution: PlacedWord[] = [];
    let bestScore = -1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const solution = this.tryPlaceAllWords(words, bonusWords);
      const score = this.scoreSolution(solution);
      
      if (score > bestScore && solution.length >= Math.min(words.length, 8)) {
        bestSolution = solution;
        bestScore = score;
        
        // If we found a perfect solution, stop
        if (solution.length === words.length && score > 50) break;
      }
    }

    return bestSolution;
  }

  // Detect parasitic words in the grid (words that aren't in the target word list)
  static detectParasiticWords(gridData: GridData, targetWords: string[]): string[] {
    const targetWordsSet = new Set(targetWords.map(w => w.toUpperCase()));
    const foundWords = new Set<string>();
    const { grid, gridWidth, gridHeight } = gridData;

    // Check horizontal words
    for (let row = 0; row < gridHeight; row++) {
      let currentWord = '';
      for (let col = 0; col < gridWidth; col++) {
        const cell = grid[row][col];
        if (cell && cell.letter && !cell.isBlocked) {
          currentWord += cell.letter;
        } else {
          if (currentWord.length >= 2) {
            const word = currentWord.toUpperCase();
            if (!targetWordsSet.has(word)) {
              foundWords.add(word);
            }
          }
          currentWord = '';
        }
      }
      if (currentWord.length >= 2) {
        const word = currentWord.toUpperCase();
        if (!targetWordsSet.has(word)) {
          foundWords.add(word);
        }
      }
    }

    // Check vertical words
    for (let col = 0; col < gridWidth; col++) {
      let currentWord = '';
      for (let row = 0; row < gridHeight; row++) {
        const cell = grid[row][col];
        if (cell && cell.letter && !cell.isBlocked) {
          currentWord += cell.letter;
        } else {
          if (currentWord.length >= 2) {
            const word = currentWord.toUpperCase();
            if (!targetWordsSet.has(word)) {
              foundWords.add(word);
            }
          }
          currentWord = '';
        }
      }
      if (currentWord.length >= 2) {
        const word = currentWord.toUpperCase();
        if (!targetWordsSet.has(word)) {
          foundWords.add(word);
        }
      }
    }

    return Array.from(foundWords);
  }

  // Try to place words while avoiding specific parasitic words
  private static tryPlaceAllWordsWithConstraints(words: string[], bonusWords: string[], avoidWords: string[]): PlacedWord[] {
    const placedWords: PlacedWord[] = [];
    const availableWords = [...words];
    
    if (availableWords.length === 0) return placedWords;

    // Place the first word horizontally in the center
    const firstWord = availableWords.shift()!;
    const startX = Math.max(0, Math.floor((20 - firstWord.length) / 2));
    const startY = 10;
    
    placedWords.push({
      id: `word-${placedWords.length}`,
      word: firstWord,
      startX,
      startY,
      direction: 'horizontal',
      isFound: false,
      isBonus: bonusWords.includes(firstWord)
    });

    // Try to place remaining words
    for (const word of availableWords) {
      const placement = this.findBestWordPlacementWithConstraints(word, placedWords, avoidWords);
      if (placement) {
        placedWords.push({
          id: `word-${placedWords.length}`,
          word,
          ...placement,
          isFound: false,
          isBonus: bonusWords.includes(word)
        });
      }
    }

    return placedWords;
  }

  // Find best placement while avoiding parasitic words
  private static findBestWordPlacementWithConstraints(
    word: string,
    placedWords: PlacedWord[],
    avoidWords: string[]
  ): { startX: number; startY: number; direction: 'horizontal' | 'vertical' } | null {
    const placements = [];
    
    for (const placedWord of placedWords) {
      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < placedWord.word.length; j++) {
          if (word[i] === placedWord.word[j]) {
            // Try horizontal placement
            const hPlacement = {
              startX: placedWord.startX + j - i,
              startY: placedWord.direction === 'horizontal' ? placedWord.startY - 1 : placedWord.startY,
              direction: 'horizontal' as const
            };
            
            if (this.isValidPlacementWithConstraints(word, hPlacement, placedWords, avoidWords)) {
              placements.push(hPlacement);
            }
            
            // Try vertical placement
            const vPlacement = {
              startX: placedWord.direction === 'horizontal' ? placedWord.startX + j : placedWord.startX - 1,
              startY: placedWord.startY + (placedWord.direction === 'horizontal' ? 0 : j) - i,
              direction: 'vertical' as const
            };
            
            if (this.isValidPlacementWithConstraints(word, vPlacement, placedWords, avoidWords)) {
              placements.push(vPlacement);
            }
          }
        }
      }
    }
    
    return placements.length > 0 ? placements[Math.floor(Math.random() * placements.length)] : null;
  }

  // Validate placement while checking for parasitic words
  private static isValidPlacementWithConstraints(
    word: string,
    placement: { startX: number; startY: number; direction: 'horizontal' | 'vertical' },
    placedWords: PlacedWord[],
    avoidWords: string[]
  ): boolean {
    // First check basic validity
    if (!this.isValidPlacement(word, placement, placedWords)) {
      return false;
    }

    // Create temporary grid to check for parasitic words
    const tempPlacedWords = [...placedWords, {
      id: 'temp',
      word,
      ...placement,
      isFound: false,
      isBonus: false
    }];
    
    const tempGrid = this.createBasicGridFromWords(tempPlacedWords);
    const allTargetWords = [...new Set([...placedWords.map(w => w.word), word])];
    const parasites = this.detectParasiticWordsInBasicGrid(tempGrid, allTargetWords);
    
    // Check if this placement would create avoided parasitic words
    return !parasites.some(parasite => avoidWords.includes(parasite.toUpperCase()));
  }

  // Create a basic grid for testing purposes
  private static createBasicGridFromWords(placedWords: PlacedWord[]): string[][] {
    const minX = Math.min(...placedWords.map(w => w.startX));
    const maxX = Math.max(...placedWords.map(w => 
      w.direction === 'horizontal' ? w.startX + w.word.length - 1 : w.startX
    ));
    const minY = Math.min(...placedWords.map(w => w.startY));
    const maxY = Math.max(...placedWords.map(w => 
      w.direction === 'vertical' ? w.startY + w.word.length - 1 : w.startY
    ));
    
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(''));
    
    for (const word of placedWords) {
      for (let i = 0; i < word.word.length; i++) {
        const x = word.direction === 'horizontal' ? word.startX + i - minX : word.startX - minX;
        const y = word.direction === 'vertical' ? word.startY + i - minY : word.startY - minY;
        grid[y][x] = word.word[i];
      }
    }
    
    return grid;
  }

  // Detect parasitic words in a basic grid
  private static detectParasiticWordsInBasicGrid(grid: string[][], targetWords: string[]): string[] {
    const targetWordsSet = new Set(targetWords.map(w => w.toUpperCase()));
    const foundWords = new Set<string>();
    const height = grid.length;
    const width = grid[0]?.length || 0;

    // Check horizontal words
    for (let row = 0; row < height; row++) {
      let currentWord = '';
      for (let col = 0; col < width; col++) {
        if (grid[row][col] && grid[row][col] !== '') {
          currentWord += grid[row][col];
        } else {
          if (currentWord.length >= 2 && !targetWordsSet.has(currentWord.toUpperCase())) {
            foundWords.add(currentWord);
          }
          currentWord = '';
        }
      }
      if (currentWord.length >= 2 && !targetWordsSet.has(currentWord.toUpperCase())) {
        foundWords.add(currentWord);
      }
    }

    // Check vertical words
    for (let col = 0; col < width; col++) {
      let currentWord = '';
      for (let row = 0; row < height; row++) {
        if (grid[row][col] && grid[row][col] !== '') {
          currentWord += grid[row][col];
        } else {
          if (currentWord.length >= 2 && !targetWordsSet.has(currentWord.toUpperCase())) {
            foundWords.add(currentWord);
          }
          currentWord = '';
        }
      }
      if (currentWord.length >= 2 && !targetWordsSet.has(currentWord.toUpperCase())) {
        foundWords.add(currentWord);
      }
    }

    return Array.from(foundWords);
  }

  // Try to place all words using backtracking
  private static tryPlaceAllWords(words: string[], bonusWords: string[]): PlacedWord[] {
    const placedWords: PlacedWord[] = [];
    const maxGridSize = 20;

    // Place first word horizontally in the center
    const firstWord = words[0];
    const startX = Math.floor(maxGridSize / 2) - Math.floor(firstWord.length / 2);
    const startY = Math.floor(maxGridSize / 2);
    
    placedWords.push({
      id: firstWord,
      word: firstWord,
      startX,
      startY,
      direction: 'horizontal',
      isFound: false,
      isBonus: bonusWords.includes(firstWord)
    });

    // Try to place remaining words
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const placement = this.findBestWordPlacement(word, placedWords, maxGridSize);
      
      if (placement) {
        placedWords.push({
          id: word,
          word: word,
          startX: placement.startX,
          startY: placement.startY,
          direction: placement.direction,
          isFound: false,
          isBonus: bonusWords.includes(word)
        });
      }
    }

    return placedWords;
  }

  // Find best placement for a word with scoring
  private static findBestWordPlacement(
    word: string, 
    placedWords: PlacedWord[], 
    maxGridSize: number
  ): { startX: number; startY: number; direction: 'horizontal' | 'vertical'; score: number } | null {
    let bestPlacement: { startX: number; startY: number; direction: 'horizontal' | 'vertical'; score: number } | null = null;
    let bestScore = -1;

    // Try intersections with each placed word
    for (const placedWord of placedWords) {
      const intersectionPlacements = this.findIntersectionPlacements(word, placedWord, maxGridSize);
      
      for (const placement of intersectionPlacements) {
        const fullPlacement = { startX: placement.x, startY: placement.y, direction: placement.direction };
        if (this.isValidPlacement(word, fullPlacement, placedWords)) {
          const score = this.scorePlacement(word, placement, placedWords);
          if (score > bestScore) {
            bestScore = score;
            bestPlacement = { startX: placement.x, startY: placement.y, direction: placement.direction, score };
          }
        }
      }
    }

    return bestPlacement;
  }

  // Find all possible intersection placements between two words
  private static findIntersectionPlacements(
    newWord: string, 
    placedWord: PlacedWord, 
    maxGridSize: number
  ): { x: number; y: number; direction: 'horizontal' | 'vertical' }[] {
    const placements: { x: number; y: number; direction: 'horizontal' | 'vertical' }[] = [];
    const oppositeDirection = placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal';

    // Find common letters
    for (let i = 0; i < newWord.length; i++) {
      for (let j = 0; j < placedWord.word.length; j++) {
        if (newWord[i] === placedWord.word[j]) {
          let newX, newY;
          
          if (oppositeDirection === 'horizontal') {
            newX = placedWord.startX + j - i;
            newY = placedWord.startY;
          } else {
            newX = placedWord.startX;
            newY = placedWord.startY + j - i;
          }

          // Check bounds
          if (newX >= 0 && newY >= 0 && 
              newX + (oppositeDirection === 'horizontal' ? newWord.length : 1) <= maxGridSize &&
              newY + (oppositeDirection === 'vertical' ? newWord.length : 1) <= maxGridSize) {
            placements.push({ x: newX, y: newY, direction: oppositeDirection });
          }
        }
      }
    }

    return placements;
  }

  // Check if a placement is valid (no conflicts)
  private static isValidPlacement(
    word: string,
    placement: { startX: number; startY: number; direction: 'horizontal' | 'vertical' },
    placedWords: PlacedWord[]
  ): boolean {
    const maxGridSize = 20;
    
    // Check bounds
    if (placement.startX < 0 || placement.startY < 0) return false;
    if (placement.direction === 'horizontal' && placement.startX + word.length > maxGridSize) return false;
    if (placement.direction === 'vertical' && placement.startY + word.length > maxGridSize) return false;
    
    // Create a virtual grid to check conflicts
    const occupiedCells = new Set<string>();
    
    // Mark cells occupied by existing words
    placedWords.forEach(placedWord => {
      for (let i = 0; i < placedWord.word.length; i++) {
        const x = placedWord.direction === 'horizontal' ? placedWord.startX + i : placedWord.startX;
        const y = placedWord.direction === 'vertical' ? placedWord.startY + i : placedWord.startY;
        occupiedCells.add(`${x},${y}:${placedWord.word[i]}`);
      }
    });

    // Check if new word conflicts
    for (let i = 0; i < word.length; i++) {
      const x = placement.direction === 'horizontal' ? placement.startX + i : placement.startX;
      const y = placement.direction === 'vertical' ? placement.startY + i : placement.startY;
      const cellKey = `${x},${y}:${word[i]}`;
      const positionKey = `${x},${y}`;
      
      // Check if position is already occupied by a different letter
      for (const occupied of occupiedCells) {
        if (occupied.startsWith(positionKey + ':') && occupied !== cellKey) {
          return false;
        }
      }
    }

    return true;
  }

  // Score a placement (higher is better)
  private static scorePlacement(
    word: string,
    placement: { x: number; y: number; direction: 'horizontal' | 'vertical' },
    placedWords: PlacedWord[]
  ): number {
    let score = 0;
    
    // Bonus for intersections
    let intersectionCount = 0;
    for (let i = 0; i < word.length; i++) {
      const x = placement.direction === 'horizontal' ? placement.x + i : placement.x;
      const y = placement.direction === 'vertical' ? placement.y + i : placement.y;
      
      for (const placedWord of placedWords) {
        const intersects = this.wordIntersectsAtPosition(placedWord, x, y, word[i]);
        if (intersects) {
          intersectionCount++;
          score += 20; // Big bonus for intersections
        }
      }
    }
    
    // Bonus for word length
    score += word.length * 2;
    
    // Bonus for compact placement (closer to center)
    const centerX = 10;
    const centerY = 10;
    const distance = Math.abs(placement.x - centerX) + Math.abs(placement.y - centerY);
    score += Math.max(0, 20 - distance);
    
    return score;
  }

  // Check if a word intersects at a specific position
  private static wordIntersectsAtPosition(
    placedWord: PlacedWord, 
    x: number, 
    y: number, 
    letter: string
  ): boolean {
    for (let i = 0; i < placedWord.word.length; i++) {
      const wordX = placedWord.direction === 'horizontal' ? placedWord.startX + i : placedWord.startX;
      const wordY = placedWord.direction === 'vertical' ? placedWord.startY + i : placedWord.startY;
      
      if (wordX === x && wordY === y && placedWord.word[i] === letter) {
        return true;
      }
    }
    return false;
  }

  // Score a complete solution
  private static scoreSolution(placedWords: PlacedWord[]): number {
    let score = placedWords.length * 10; // Base score for placed words
    
    // Find intersections
    let intersectionCount = 0;
    for (let i = 0; i < placedWords.length; i++) {
      for (let j = i + 1; j < placedWords.length; j++) {
        if (this.findWordIntersection(placedWords[i], placedWords[j])) {
          intersectionCount++;
        }
      }
    }
    
    score += intersectionCount * 15; // Bonus for intersections
    
    // Calculate grid compactness
    const bounds = this.calculateBounds(placedWords);
    const area = (bounds.maxX - bounds.minX + 1) * (bounds.maxY - bounds.minY + 1);
    const efficiency = placedWords.reduce((sum, word) => sum + word.word.length, 0) / area;
    score += efficiency * 30;
    
    return score;
  }

  // Calculate bounds of placed words
  private static calculateBounds(placedWords: PlacedWord[]): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    placedWords.forEach(word => {
      const endX = word.direction === 'horizontal' ? word.startX + word.word.length - 1 : word.startX;
      const endY = word.direction === 'vertical' ? word.startY + word.word.length - 1 : word.startY;
      
      minX = Math.min(minX, word.startX);
      maxX = Math.max(maxX, endX);
      minY = Math.min(minY, word.startY);
      maxY = Math.max(maxY, endY);
    });
    
    return { minX, maxX, minY, maxY };
  }

  // Create final grid from solution
  private static createGridFromSolution(placedWords: PlacedWord[], bonusWords: string[]): GridData {
    if (placedWords.length === 0) {
      return {
        grid: [[]],
        placedWords: [],
        intersections: [],
        gridWidth: 1,
        gridHeight: 1
      };
    }

    // Calculate grid bounds
    const bounds = this.calculateBounds(placedWords);
    const gridWidth = bounds.maxX - bounds.minX + 1;
    const gridHeight = bounds.maxY - bounds.minY + 1;
    
    // Adjust word positions to start from (0,0)
    const adjustedWords = placedWords.map(word => ({
      ...word,
      startX: word.startX - bounds.minX,
      startY: word.startY - bounds.minY
    }));

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
    adjustedWords.forEach(placedWord => {
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

    // Find intersections
    const intersections: WordIntersection[] = [];
    this.findIntersections(adjustedWords, intersections);

    return {
      grid,
      placedWords: adjustedWords,
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

    // Create a set of found words for faster lookup
    const foundWordsSet = new Set(foundWords.map(word => word.toUpperCase()));

    const updatedGrid = gridData.grid.map(row => 
      row.map(cell => {
        // Check if any of the words this cell belongs to has been found
        const shouldBeRevealed = cell.wordIds.some(wordId => {
          // Handle both cases: wordId could be the word itself or a word ID
          if (foundWordsSet.has(wordId.toUpperCase())) {
            return true;
          }
          
          // Find the word by checking placedWords
          const matchingWord = updatedPlacedWords.find(word => 
            word.id === wordId || word.word.toUpperCase() === wordId.toUpperCase()
          );
          
          return matchingWord?.isFound || false;
        });

        return {
          ...cell,
          isRevealed: shouldBeRevealed
        };
      })
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