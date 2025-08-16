import React from 'react';
import { ActivityItem } from './ActivityItem';
import { ActivityItem as ActivityItemType, PlacedItem } from '@/types/cognitivePuzzle';

interface DragDropZoneProps {
  activities: ActivityItemType[];
  placedItems: PlacedItem[];
  selectedActivity: string | null;
  accessibilityMode: boolean;
  enableTimeline: boolean;
  onDragStart: (activity: ActivityItemType) => void;
  onDragEnd: () => void;
  onSelectActivity: (activityId: string) => void;
  onSpeak: (text: string) => void;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  activities,
  placedItems,
  selectedActivity,
  accessibilityMode,
  enableTimeline,
  onDragStart,
  onDragEnd,
  onSelectActivity,
  onSpeak,
}) => {
  const [draggedActivity, setDraggedActivity] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, activity: ActivityItemType) => {
    e.dataTransfer.setData('activityId', activity.id);
    setDraggedActivity(activity.id);
    onDragStart(activity);
    // Removed automatic speech - now only on demand
  };

  const handleDragEnd = () => {
    setDraggedActivity(null);
    onDragEnd();
  };

  const getActivityPlacementStatus = (activityId: string) => {
    const item = placedItems.find(item => item.activityId === activityId);
    if (!item) return 'not-placed';
    
    const hasSpatial = !!item.spatialSlotId;
    const hasTemporal = !!item.timeSlotId;
    
    if (enableTimeline) {
      // Level requires both spatial and temporal placement
      if (hasSpatial && hasTemporal) return 'fully-placed';
      if (hasSpatial || hasTemporal) return 'partially-placed';
      return 'not-placed';
    } else {
      // Level only requires spatial placement
      return hasSpatial ? 'fully-placed' : 'not-placed';
    }
  };

  const isActivityPlaced = (activityId: string) => {
    return getActivityPlacementStatus(activityId) === 'fully-placed';
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
        {activities.map((activity) => {
          const placementStatus = getActivityPlacementStatus(activity.id);
          return (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isPlaced={placementStatus === 'fully-placed'}
              isPartiallyPlaced={placementStatus === 'partially-placed'}
              isDragging={draggedActivity === activity.id}
              isSelected={selectedActivity === activity.id}
              accessibilityMode={accessibilityMode}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onSelect={onSelectActivity}
              onSpeak={onSpeak}
            />
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center">
        <p className={`
          text-muted-foreground font-medium
          ${accessibilityMode ? 'text-base' : 'text-sm'}
        `}>
          💡 Glissez les activités ou cliquez puis cliquez sur une zone
        </p>
        
        {/* Progress Summary */}
        <div className="mt-3 flex justify-center gap-2">
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-sm">✓</span>
            <span className={accessibilityMode ? 'text-base' : 'text-sm'}>
              {activities.filter(a => isActivityPlaced(a.id)).length} complètes
            </span>
          </div>
          {enableTimeline && (
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-sm">⚡</span>
              <span className={accessibilityMode ? 'text-base' : 'text-sm'}>
                {activities.filter(a => getActivityPlacementStatus(a.id) === 'partially-placed').length} partielles
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-orange-600">
            <span className="text-sm">⏳</span>
            <span className={accessibilityMode ? 'text-base' : 'text-sm'}>
              {activities.filter(a => getActivityPlacementStatus(a.id) === 'not-placed').length} restantes
            </span>
          </div>
        </div>
      </div>

      {/* Completion Celebration */}
      {activities.every(a => isActivityPlaced(a.id)) && (
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