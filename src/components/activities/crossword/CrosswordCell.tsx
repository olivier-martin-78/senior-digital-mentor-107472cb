
import React from 'react';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Cell } from './types';

interface CrosswordCellProps {
  cell: Cell;
  row: number;
  col: number;
  isHighlighted: boolean;
  isCurrent: boolean;
  showSolution: boolean;
  inputRef: React.RefObject<HTMLInputElement> | null;
  onInput: (row: number, col: number, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
  onFocus: (row: number, col: number) => void;
  onClick: (row: number, col: number) => void;
}

const CrosswordCell: React.FC<CrosswordCellProps> = ({
  cell,
  row,
  col,
  isHighlighted,
  isCurrent,
  showSolution,
  inputRef,
  onInput,
  onKeyDown,
  onFocus,
  onClick
}) => {
  if (cell.isBlack) {
    return (
      <div className="w-12 h-12 bg-gray-800 border border-gray-600" />
    );
  }

  return (
    <div
      className={`
        w-12 h-12 border border-gray-400 relative flex items-center justify-center cursor-pointer
        ${cell.isEditable ? 'bg-white' : 'bg-gray-100'}
        ${isHighlighted ? 'bg-yellow-200 border-yellow-400 border-2' : ''}
        ${isCurrent ? 'bg-blue-200 border-blue-500 border-2' : ''}
        ${showSolution && cell.letter === cell.correctLetter ? 'text-red-600' : ''}
      `}
      onClick={() => onClick(row, col)}
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
          ref={inputRef}
          type="text"
          value={cell.letter}
          onChange={(e) => onInput(row, col, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, row, col)}
          onFocus={() => onFocus(row, col)}
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

export default CrosswordCell;
