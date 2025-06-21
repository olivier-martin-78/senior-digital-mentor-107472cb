
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type Direction = 'horizontal' | 'vertical';

export interface WordData {
  word: string;
  clue: string;
  length: number;
  level: number;
}

export interface PlacedWord {
  id: number;
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  length: number;
}

export interface Cell {
  letter: string;
  correctLetter: string;
  isBlack: boolean;
  isEditable: boolean;
  hasArrow?: boolean;
  arrowDirection?: Direction;
  wordNumber?: number;
  wordIds?: number[];
}

export interface GridState {
  grid: Grid;
  placedWords: PlacedWord[];
}

export interface IntersectionPoint {
  word1Index: number;
  word2Index: number;
  pos1: number;
  pos2: number;
  score: number;
}

export type Grid = Cell[][];
