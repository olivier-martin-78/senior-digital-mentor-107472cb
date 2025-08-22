import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useObjectAssemblyGame, ActivityItem, PlacedItem } from '@/hooks/useObjectAssemblyGame';
import { cn, formatTextWithLineBreaks } from '@/lib/utils';

interface DraggableObjectsListProps {
  activities: ActivityItem[];
  placedItems: PlacedItem[];
  selectedActivity: string | null;
  accessibilityMode: boolean;
  adaptationLevel: number;
  onSelectActivity: (activityId: string | null) => void;
  onSpeak: (text: string) => void;
}

export const DraggableObjectsList: React.FC<DraggableObjectsListProps> = ({
  activities,
  placedItems,
  selectedActivity,
  accessibilityMode,
  adaptationLevel,
  onSelectActivity,
  onSpeak
}) => {

  const handleDragStart = (e: React.DragEvent, activityId: string) => {
    e.dataTransfer.setData('text/plain', activityId);
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      onSpeak(`Déplacement de ${activity.name}`);
    }
  };

  const handleActivityClick = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const status = getActivityStatus(activityId);
    if (status === 'fully-placed') {
      onSpeak(`${activity.name} est complètement placé`);
      return;
    }

    // Allow interaction with partially placed or not placed objects
    if (selectedActivity === activityId) {
      // Deselect if clicking on already selected activity
      onSelectActivity(null);
    } else {
      // Select the activity
      onSelectActivity(activityId);
      
      // Provide feedback about current placement status
      if (status === 'partially-placed') {
        const placedItem = placedItems.find(item => item.activityId === activityId);
        const spatialPlaced = placedItem?.spatialSlotId ? 'dans un lieu' : '';
        const temporalPlaced = placedItem?.timeSlotId ? 'dans un moment' : '';
        const currentPlacement = [spatialPlaced, temporalPlaced].filter(Boolean).join(' et ');
        onSpeak(`${activity.name} sélectionné. Déjà placé ${currentPlacement}. Vous pouvez le placer ailleurs.`);
      }
    }
  };

  const getActivityStatus = (activityId: string) => {
    const placedItem = placedItems.find(item => item.activityId === activityId);
    if (!placedItem) return 'not-placed';
    
    const hasSpatial = Boolean(placedItem.spatialSlotId);
    const hasTemporal = Boolean(placedItem.timeSlotId);
    
    if (hasSpatial && hasTemporal) return 'fully-placed';
    if (hasSpatial || hasTemporal) return 'partially-placed';
    return 'not-placed';
  };

  const getVisibleActivities = () => {
    // Show fewer items if adaptation level is high (user struggling)
    if (adaptationLevel > 2) {
      return activities.slice(0, Math.max(3, activities.length - adaptationLevel));
    }
    return activities;
  };

  const visibleActivities = getVisibleActivities();
  const placedCount = placedItems.length;
  const totalCount = activities.length;

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Progression :</span>
          <Badge variant={placedCount === totalCount ? "default" : "secondary"}>
            {placedCount} / {totalCount} placés
          </Badge>
        </div>
        
        {adaptationLevel > 0 && (
          <Badge variant="outline" className="text-xs">
            Mode simplifié activé
          </Badge>
        )}
      </div>

      {/* Objects Grid */}
      <div className={cn(
        "grid gap-2",
        accessibilityMode 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-4 sm:grid-cols-5 lg:grid-cols-8"
      )}>
        {visibleActivities.map((activity) => {
          const status = getActivityStatus(activity.id);
          const isFullyPlaced = status === 'fully-placed';
          const isSelected = selectedActivity === activity.id;
          
          return (
            <Card
              key={activity.id}
              className={cn(
                "transition-all duration-200 cursor-pointer",
                "flex flex-col items-center justify-center p-2 text-center",
                "hover:shadow-md hover:-translate-y-1",
                accessibilityMode ? "min-h-[80px]" : "min-h-[60px]",
                isFullyPlaced && "opacity-60 transform scale-95",
                isSelected && "ring-2 ring-primary bg-primary/10 scale-105",
                !isFullyPlaced && !isSelected && "cursor-grab active:cursor-grabbing hover:bg-accent/50",
                status === 'fully-placed' && "border-success bg-success/10",
                status === 'partially-placed' && "border-warning bg-warning/10 ring-1 ring-warning/50"
              )}
              draggable={!isFullyPlaced}
              onDragStart={(e) => handleDragStart(e, activity.id)}
              onClick={() => handleActivityClick(activity.id)}
            >
            <div className="text-lg mb-1">{activity.icon}</div>
            <p className={cn(
              "font-medium whitespace-pre-line text-center",
              accessibilityMode ? "text-xs" : "text-xs"
            )}>
              {formatTextWithLineBreaks(activity.name)}
            </p>
            
            {/* Status indicators */}
            <div className="mt-2 flex gap-1">
              {status === 'fully-placed' && (
                <Badge variant="default" className="text-xs px-1">✓ Complet</Badge>
              )}
              {status === 'partially-placed' && (
                <Badge variant="outline" className="text-xs px-1 border-warning text-warning">
                  ⚠ Partiel
                </Badge>
              )}
              {isSelected && (
                <Badge variant="default" className="text-xs px-1">📌</Badge>
              )}
            </div>
            
            {/* Visual indicators */}
            {status === 'fully-placed' && (
              <div className="absolute top-1 right-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
              </div>
            )}
            
            {status === 'partially-placed' && (
              <div className="absolute top-1 right-1">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
              </div>
            )}
            
            {isSelected && (
              <div className="absolute top-1 left-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              </div>
            )}
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="text-center space-y-2">
        <p className={cn(
          "text-muted-foreground",
          accessibilityMode ? "text-base" : "text-sm"
        )}>
          {selectedActivity && (() => {
            const selectedActivityData = activities.find(a => a.id === selectedActivity);
            const status = getActivityStatus(selectedActivity);
            const statusText = status === 'partially-placed' ? 
              ' (déjà partiellement placé - peut être placé ailleurs)' : '';
            return `📌 Objet sélectionné : ${selectedActivityData?.name}${statusText}. Cliquez sur une zone pour le placer.`;
          })()}
          {!selectedActivity && placedCount === 0 && "Cliquez sur un objet puis sur une zone, ou glissez les objets vers les zones appropriées"}
          {!selectedActivity && placedCount > 0 && placedCount < totalCount && "Continuez ! Les objets avec ⚠ peuvent être placés dans d'autres zones"}
          {!selectedActivity && placedCount === totalCount && "🎉 Tous les objets sont placés ! Vérifiez si le niveau est terminé"}
        </p>
        
        {adaptationLevel > 0 && (
          <p className="text-xs text-muted-foreground">
            💡 Moins d'objets sont affichés pour vous aider
          </p>
        )}
      </div>
    </div>
  );
};