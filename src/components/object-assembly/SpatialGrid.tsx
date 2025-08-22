import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpatialSlot, ActivityItem, PlacedItem } from '@/hooks/useObjectAssemblyGame';
import { cn, formatTextWithLineBreaks } from '@/lib/utils';

interface SpatialGridProps {
  spatialSlots: SpatialSlot[];
  placedItems: PlacedItem[];
  activities: ActivityItem[];
  selectedActivity: string | null;
  accessibilityMode: boolean;
  onPlaceSelected: (spatialSlotId: string) => void;
  onRemoveItem: (activityId: string, type: 'spatial' | 'temporal') => void;
  placeItem: (activityId: string, spatialSlotId?: string, timeSlotId?: string) => void;
  onSpeak: (text: string) => void;
}

export const SpatialGrid: React.FC<SpatialGridProps> = ({
  spatialSlots,
  placedItems,
  activities,
  selectedActivity,
  accessibilityMode,
  onPlaceSelected,
  onRemoveItem,
  placeItem,
  onSpeak
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlot(slotId);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const activityId = e.dataTransfer.getData('text/plain');
    setDragOverSlot(null);
    
    if (activityId) {
      placeItem(activityId, slotId);
    }
  };

  const getPlacedActivity = (slotId: string): ActivityItem | null => {
    const placedItem = placedItems.find(item => item.spatialSlotId === slotId);
    if (!placedItem) return null;
    
    return activities.find(activity => activity.id === placedItem.activityId) || null;
  };

  const getGridStyle = () => {
    const maxX = Math.max(...spatialSlots.map(slot => slot.x_position), 0);
    const maxY = Math.max(...spatialSlots.map(slot => slot.y_position), 0);
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${maxX + 1}, minmax(80px, 1fr))`,
      gridTemplateRows: `repeat(${maxY + 1}, minmax(80px, auto))`,
      gap: '8px',
      justifyItems: 'center',
      alignItems: 'center',
    };
  };

  // Sort slots by position for consistent rendering
  const sortedSpatialSlots = [...spatialSlots].sort((a, b) => {
    if (a.y_position !== b.y_position) {
      return a.y_position - b.y_position;
    }
    return a.x_position - b.x_position;
  });

  if (spatialSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune zone de placement configurée
      </div>
    );
  }

  return (
    <div style={getGridStyle()} className="p-2">
      {sortedSpatialSlots.map((slot) => {
        const placedActivity = getPlacedActivity(slot.id);
        const isDraggedOver = dragOverSlot === slot.id;
        
        return (
          <Card
            key={slot.id}
            className={cn(
              "transition-all duration-200 border-2 border-dashed cursor-pointer relative",
              "flex flex-col items-center justify-center text-center",
              accessibilityMode ? "min-h-[80px] min-w-[80px] p-2" : "min-h-[60px] min-w-[60px] p-2",
              isDraggedOver && "border-primary bg-primary/10 scale-105",
              placedActivity && "border-solid border-success bg-success/10",
              selectedActivity && !placedActivity && "border-primary/50 hover:border-primary bg-primary/5",
              !placedActivity && !isDraggedOver && !selectedActivity && "border-muted-foreground/30 hover:border-primary/60",
              !placedActivity && !isDraggedOver && selectedActivity && "border-primary hover:border-primary bg-primary/10"
            )}
            style={{
              gridColumn: slot.x_position + 1,
              gridRow: slot.y_position + 1,
            }}
            onDragOver={(e) => handleDragOver(e, slot.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, slot.id)}
            onClick={() => {
              if (selectedActivity && !placedActivity) {
                onPlaceSelected(slot.id);
                onSpeak(`${activities.find(a => a.id === selectedActivity)?.name} placé dans ${slot.label}`);
              } else if (placedActivity) {
                onSpeak(`${placedActivity.name} placé dans ${slot.label}`);
              } else if (selectedActivity) {
                onSpeak(`${slot.label} est déjà occupé`);
              } else {
                onSpeak(`Zone ${slot.label} disponible. Sélectionnez un objet d'abord.`);
              }
            }}
          >
            <div className="text-lg mb-1">{slot.icon}</div>
            <p className={cn(
              "font-medium text-muted-foreground leading-tight",
              accessibilityMode ? "text-xs" : "text-xs"
            )}>
              {slot.label}
            </p>
            
            {placedActivity && (
              <div className="mt-1 p-1 bg-background rounded border animate-fade-in relative group">
                <div className="text-sm">{placedActivity.icon}</div>
                <p className="text-xs font-medium whitespace-pre-line text-center">{formatTextWithLineBreaks(placedActivity.name)}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(placedActivity.id, 'spatial');
                    onSpeak(`${placedActivity.name} retiré de ${slot.label}`);
                  }}
                >
                  <span className="text-xs">×</span>
                </Button>
              </div>
            )}
            
            {isDraggedOver && !placedActivity && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-primary animate-pulse">↓ Déposer ici</div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};