import React from 'react';
import { ActivityItem } from './ActivityItem';
import { ActivityItem as ActivityItemType, PlacedItem } from '@/types/cognitivePuzzle';

interface DragDropZoneProps {
  activities: ActivityItemType[];
  placedItems: PlacedItem[];
  accessibilityMode: boolean;
  onDragStart: (activity: ActivityItemType) => void;
  onDragEnd: () => void;
  onSpeak: (text: string) => void;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  activities,
  placedItems,
  accessibilityMode,
  onDragStart,
  onDragEnd,
  onSpeak,
}) => {
  const [draggedActivity, setDraggedActivity] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, activity: ActivityItemType) => {
    e.dataTransfer.setData('activityId', activity.id);
    setDraggedActivity(activity.id);
    onDragStart(activity);
    onSpeak(`Début du déplacement de ${activity.name}`);
  };

  const handleDragEnd = () => {
    setDraggedActivity(null);
    onDragEnd();
  };

  const isActivityPlaced = (activityId: string) => {
    return placedItems.some(item => 
      item.activityId === activityId && 
      (item.spatialSlotId || item.timeSlotId)
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-3xl">🎯</div>
        <h3 className={`font-bold text-foreground ${accessibilityMode ? 'text-2xl' : 'text-xl'}`}>
          Activités à organiser
        </h3>
      </div>

      {/* Activities Grid */}
      <div className={`
        grid gap-4 justify-items-center
        ${accessibilityMode ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}
      `}>
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isPlaced={isActivityPlaced(activity.id)}
            isDragging={draggedActivity === activity.id}
            accessibilityMode={accessibilityMode}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onSpeak={onSpeak}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center">
        <p className={`
          text-muted-foreground font-medium
          ${accessibilityMode ? 'text-base' : 'text-sm'}
        `}>
          💡 Glissez les activités vers les zones appropriées
        </p>
        
        {/* Progress Summary */}
        <div className="mt-3 flex justify-center gap-2">
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-sm">✓</span>
            <span className={accessibilityMode ? 'text-base' : 'text-sm'}>
              {placedItems.length} placées
            </span>
          </div>
          <div className="flex items-center gap-2 text-orange-600">
            <span className="text-sm">⏳</span>
            <span className={accessibilityMode ? 'text-base' : 'text-sm'}>
              {activities.length - placedItems.length} restantes
            </span>
          </div>
        </div>
      </div>

      {/* Completion Celebration */}
      {placedItems.length === activities.length && (
        <div className="mt-6 text-center animate-bounce">
          <div className="text-4xl mb-2">🎉</div>
          <p className={`
            font-bold text-green-600
            ${accessibilityMode ? 'text-lg' : 'text-base'}
          `}>
            Toutes les activités sont placées !
          </p>
        </div>
      )}
    </div>
  );
};