import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useObjectAssemblyGame, ActivityItem, PlacedItem } from '@/hooks/useObjectAssemblyGame';
import { cn } from '@/lib/utils';

interface DraggableObjectsListProps {
  activities: ActivityItem[];
  placedItems: PlacedItem[];
  accessibilityMode: boolean;
  adaptationLevel: number;
}

export const DraggableObjectsList: React.FC<DraggableObjectsListProps> = ({
  activities,
  placedItems,
  accessibilityMode,
  adaptationLevel
}) => {
  const { speak } = useObjectAssemblyGame();

  const handleDragStart = (e: React.DragEvent, activityId: string) => {
    e.dataTransfer.setData('text/plain', activityId);
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      speak(`Déplacement de ${activity.name}`);
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
        "grid gap-3",
        accessibilityMode 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
      )}>
        {visibleActivities.map((activity) => {
          const status = getActivityStatus(activity.id);
          const isPlaced = status !== 'not-placed';
          
          return (
            <Card
              key={activity.id}
              className={cn(
                "transition-all duration-200 cursor-grab active:cursor-grabbing",
                "flex flex-col items-center justify-center p-4 text-center",
                "hover:shadow-md hover:-translate-y-1",
                accessibilityMode ? "min-h-[100px]" : "min-h-[80px]",
                isPlaced && "opacity-60 transform scale-95",
                status === 'fully-placed' && "border-success bg-success/10",
                status === 'partially-placed' && "border-warning bg-warning/10"
              )}
              draggable={!isPlaced}
              onDragStart={(e) => handleDragStart(e, activity.id)}
              onClick={() => {
                speak(`Objet : ${activity.name}. ${isPlaced ? 'Déjà placé' : 'Glissez pour placer'}`);
              }}
            >
              <div className="text-2xl mb-2">{activity.icon}</div>
              <p className={cn(
                "font-medium",
                accessibilityMode ? "text-sm" : "text-xs"
              )}>
                {activity.name}
              </p>
              
              {/* Status indicators */}
              <div className="mt-2 flex gap-1">
                {status === 'fully-placed' && (
                  <Badge variant="default" className="text-xs px-1">✓</Badge>
                )}
                {status === 'partially-placed' && (
                  <Badge variant="secondary" className="text-xs px-1">½</Badge>
                )}
              </div>
              
              {isPlaced && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
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
          {placedCount === 0 && "Glissez les objets vers les zones appropriées pour commencer"}
          {placedCount > 0 && placedCount < totalCount && "Continuez ! Il reste encore des objets à placer"}
          {placedCount === totalCount && "🎉 Tous les objets sont placés ! Vérifiez si le niveau est terminé"}
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