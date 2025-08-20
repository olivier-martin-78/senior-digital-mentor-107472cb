import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useObjectAssemblyGame, TimeSlot, ActivityItem, PlacedItem } from '@/hooks/useObjectAssemblyGame';
import { cn } from '@/lib/utils';

interface TemporalTimelineProps {
  timeSlots: TimeSlot[];
  placedItems: PlacedItem[];
  activities: ActivityItem[];
  accessibilityMode: boolean;
}

export const TemporalTimeline: React.FC<TemporalTimelineProps> = ({
  timeSlots,
  placedItems,
  activities,
  accessibilityMode
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
      placeItem(activityId, undefined, slotId);
    }
  };

  const getPlacedActivity = (slotId: string): ActivityItem | null => {
    const placedItem = placedItems.find(item => item.timeSlotId === slotId);
    if (!placedItem) return null;
    
    return activities.find(activity => activity.id === placedItem.activityId) || null;
  };

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune étape temporelle configurée
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <div className="h-px bg-border flex-1"></div>
        <span className="text-sm font-medium">Chronologie des étapes</span>
        <div className="h-px bg-border flex-1"></div>
      </div>

      {/* Timeline Slots */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4">
        {timeSlots.map((slot, index) => {
          const placedActivity = getPlacedActivity(slot.id);
          const isDraggedOver = dragOverSlot === slot.id;
          
          return (
            <React.Fragment key={slot.id}>
              <Card
                className={cn(
                  "transition-all duration-200 border-2 border-dashed cursor-pointer flex-shrink-0",
                  "flex flex-col items-center justify-center p-4 text-center",
                  accessibilityMode ? "min-w-[140px] min-h-[120px]" : "min-w-[120px] min-h-[100px]",
                  isDraggedOver && "border-primary bg-primary/10 scale-105",
                  placedActivity && "border-solid border-success bg-success/10",
                  !placedActivity && !isDraggedOver && "border-muted-foreground/30 hover:border-primary/60"
                )}
                onDragOver={(e) => handleDragOver(e, slot.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slot.id)}
                onClick={() => {
                  if (placedActivity) {
                    speak(`${placedActivity.name} programmé pour ${slot.label}`);
                  } else {
                    speak(`Étape ${slot.label} disponible`);
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
                <p className="text-xs text-muted-foreground/70 capitalize">
                  {slot.period}
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

              {/* Arrow between slots */}
              {index < timeSlots.length - 1 && (
                <div className="flex items-center text-muted-foreground">
                  <div className="text-2xl">→</div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>
          Étapes complétées : {placedItems.filter(item => item.timeSlotId).length} / {timeSlots.length}
        </span>
      </div>
    </div>
  );
};