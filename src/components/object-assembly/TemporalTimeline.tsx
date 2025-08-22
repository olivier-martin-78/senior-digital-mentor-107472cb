import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeSlot, ActivityItem, PlacedItem } from '@/hooks/useObjectAssemblyGame';
import { cn, formatTextWithLineBreaks } from '@/lib/utils';

interface TemporalTimelineProps {
  timeSlots: TimeSlot[];
  placedItems: PlacedItem[];
  activities: ActivityItem[];
  selectedActivity: string | null;
  accessibilityMode: boolean;
  onPlaceSelected: (timeSlotId: string) => void;
  onRemoveItem: (activityId: string, type: 'spatial' | 'temporal') => void;
  placeItem: (activityId: string, spatialSlotId?: string, timeSlotId?: string) => void;
  onSpeak: (text: string) => void;
}

export const TemporalTimeline: React.FC<TemporalTimelineProps> = ({
  timeSlots,
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
                  "transition-all duration-200 border-2 border-dashed cursor-pointer flex-shrink-0 relative",
                  "flex flex-col items-center justify-center p-3 text-center",
                  accessibilityMode ? "min-w-[120px] min-h-[100px]" : "min-w-[100px] min-h-[80px]",
                  isDraggedOver && "border-primary bg-primary/10 scale-105",
                  placedActivity && "border-solid border-success bg-success/10",
                  selectedActivity && !placedActivity && "border-primary/50 hover:border-primary bg-primary/5",
                  !placedActivity && !isDraggedOver && !selectedActivity && "border-muted-foreground/30 hover:border-primary/60",
                  !placedActivity && !isDraggedOver && selectedActivity && "border-primary hover:border-primary bg-primary/10"
                )}
                onDragOver={(e) => handleDragOver(e, slot.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slot.id)}
                onClick={() => {
                  if (selectedActivity && !placedActivity) {
                    onPlaceSelected(slot.id);
                    onSpeak(`${activities.find(a => a.id === selectedActivity)?.name} programmé pour ${slot.label}`);
                  } else if (placedActivity) {
                    onSpeak(`${placedActivity.name} programmé pour ${slot.label}`);
                  } else if (selectedActivity) {
                    onSpeak(`${slot.label} est déjà occupé`);
                  } else {
                    onSpeak(`Étape ${slot.label} disponible. Sélectionnez un objet d'abord.`);
                  }
                }}
                >
                <div className="text-xl mb-1">{slot.icon}</div>
                <p className={cn(
                  "font-medium text-muted-foreground",
                  accessibilityMode ? "text-sm" : "text-xs"
                )}>
                  {slot.label}
                </p>
                <p className="text-xs text-muted-foreground/70 capitalize">
                  {slot.period}
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
                        onRemoveItem(placedActivity.id, 'temporal');
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