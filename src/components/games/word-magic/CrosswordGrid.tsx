import React, { useMemo } from 'react';
import { WordMagicLevel } from '@/types/wordMagicGame';
import { GridGenerator } from '@/utils/gridGenerator';
import GridCellComponent from './GridCellComponent';

interface CrosswordGridProps {
  level: WordMagicLevel;
  foundWords: string[];
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({ level, foundWords }) => {
  // Generate interactive crossword grid - use existing grid_layout if available
  const gridData = useMemo(() => {
    let generated;
    
    // Prioritize existing grid_layout
    if (level.grid_layout && level.grid_layout.length > 0) {
      generated = GridGenerator.fromGridLayout(level.grid_layout, level.solutions, level.bonus_words);
    } else {
      // Fallback to intelligent generation
      generated = GridGenerator.generateGrid(level.solutions, level.bonus_words);
      const trimmed = GridGenerator.trimGrid(generated);
      generated = trimmed;
    }
    
    return GridGenerator.updateGridWithFoundWords(generated, foundWords);
  }, [level.solutions, level.bonus_words, level.grid_layout, foundWords]);
  
  const renderInteractiveGrid = () => {
    if (!gridData.grid.length) {
      return <div className="text-center text-muted-foreground">Aucune grille disponible</div>;
    }

    return (
      <div className="space-y-6">
        {/* Interactive Crossword Grid */}
        <div 
          className="grid gap-1 mx-auto w-fit p-4 bg-muted/20 rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${gridData.gridWidth}, 1fr)`
          }}
        >
          {gridData.grid.flat().map((cell, index) => (
            <GridCellComponent
              key={`${cell.x}-${cell.y}`}
              cell={cell}
            />
          ))}
        </div>
        
        {/* Word Progress Overview */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-center">Progression des mots</h4>
          
          {/* Main Words */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {level.solutions.map((word) => {
              const isFound = foundWords.includes(word.toUpperCase());
              const wordData = gridData.placedWords.find(p => p.word.toUpperCase() === word.toUpperCase());
              
              return (
                <div
                  key={word}
                  className={`
                    p-2 rounded text-center font-mono text-sm transition-all duration-300
                    ${isFound 
                      ? 'bg-success/20 text-success-foreground border border-success/30 animate-fade-in' 
                      : 'bg-background border border-border hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isFound ? (
                      <span>{word}</span>
                    ) : (
                      <span className="flex gap-0.5">
                        {Array.from({ length: word.length }).map((_, i) => (
                          <span key={i} className="inline-block w-2 h-2 bg-muted-foreground/30 rounded-full" />
                        ))}
                      </span>
                    )}
                    {wordData?.direction && (
                      <span className="text-xs text-muted-foreground ml-1">
                        {wordData.direction === 'horizontal' ? '→' : '↓'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Bonus Words */}
          {level.bonus_words.length > 0 && (
            <>
              <h4 className="font-semibold mb-3 text-center mt-6 flex items-center justify-center gap-1">
                <span>Mots bonus</span> 
                <span className="text-yellow-500">⭐</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {level.bonus_words.map((word) => {
                  const isFound = foundWords.includes(word.toUpperCase());
                  const wordData = gridData.placedWords.find(p => p.word.toUpperCase() === word.toUpperCase());
                  
                  return (
                    <div
                      key={word}
                      className={`
                        p-2 rounded text-center font-mono text-sm transition-all duration-300
                        ${isFound 
                          ? 'bg-warning/20 text-warning-foreground border border-warning/30 animate-fade-in' 
                          : 'bg-background border border-dashed border-warning/50 hover:bg-warning/10'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isFound ? (
                          <span>{word}</span>
                        ) : (
                          <span className="flex gap-0.5">
                            {Array.from({ length: word.length }).map((_, i) => (
                              <span key={i} className="inline-block w-2 h-2 bg-warning/30 rounded-full" />
                            ))}
                          </span>
                        )}
                        {wordData?.direction && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {wordData.direction === 'horizontal' ? '→' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderInteractiveGrid()}
    </div>
  );
};

export default CrosswordGrid;