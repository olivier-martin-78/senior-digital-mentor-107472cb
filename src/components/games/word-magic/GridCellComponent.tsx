import React from 'react';
import { GridCell } from '@/types/wordMagicGame';

interface GridCellComponentProps {
  cell: GridCell;
  onClick?: () => void;
}

const GridCellComponent: React.FC<GridCellComponentProps> = ({ cell, onClick }) => {
  if (cell.isBlocked) {
    return (
      <div className="w-8 h-8 bg-card/30" />
    );
  }

  return (
    <div
      className={`
        w-8 h-8 border-2 border-border flex items-center justify-center text-sm font-bold
        cursor-pointer transition-all duration-300 hover:shadow-md
        ${cell.isRevealed 
          ? 'bg-primary/10 border-primary/30 text-foreground animate-scale-in' 
          : 'bg-background border-muted-foreground/30 text-transparent hover:bg-muted/50'
        }
      `}
      onClick={onClick}
    >
      {cell.isRevealed && cell.letter}
    </div>
  );
};

export default GridCellComponent;