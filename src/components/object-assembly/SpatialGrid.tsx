import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useObjectAssemblyGame, SpatialSlot, ActivityItem, PlacedItem } from '@/hooks/useObjectAssemblyGame';
import { cn } from '@/lib/utils';

interface SpatialGridProps {
  spatialSlots: SpatialSlot[];
  placedItems: PlacedItem[];
  activities: ActivityItem[];
  selectedActivity: string | null;
  accessibilityMode: boolean;
  onPlaceSelected: (spatialSlotId: string) => void;
  onSpeak: (text: string) => void;
}

export const SpatialGrid: React.FC<SpatialGridProps> = ({
  spatialSlots,
  placedItems,
  activities,
  selectedActivity,
  accessibilityMode,
  onPlaceSelected,
  onSpeak
}) => {
  const { placeItem, speak } = useObjectAssemblyGame();
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
      gridTemplateColumns: `repeat(${maxX + 1}, 1fr)`,
      gridTemplateRows: `repeat(${maxY + 1}, 1fr)`,
      gap: accessibilityMode ? '16px' : '12px',
      minHeight: accessibilityMode ? '400px' : '300px',
    };
  };

  if (spatialSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune zone de placement configurée
      </div>
    );
  }

  return (
    <div style={getGridStyle()} className="p-4">
      {spatialSlots.map((slot) => {
        const placedActivity = getPlacedActivity(slot.id);
        const isDraggedOver = dragOverSlot === slot.id;
        
        return (
          <Card
            key={slot.id}
            className={cn(
              "transition-all duration-200 border-2 border-dashed cursor-pointer",
              "flex flex-col items-center justify-center p-4 text-center",
              accessibilityMode ? "min-h-[100px]" : "min-h-[80px]",
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
            <div className="text-2xl mb-2">{slot.icon}</div>
            <p className={cn(
              "font-medium text-muted-foreground",
              accessibilityMode ? "text-base" : "text-sm"
            )}>
              {slot.label}
            </p>
            
            {placedActivity && (
              <div className="mt-2 p-2 bg-background rounded-md border animate-fade-in">
                <div className="text-lg">{placedActivity.icon}</div>
                <p className="text-xs font-medium">{placedActivity.name}</p>
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