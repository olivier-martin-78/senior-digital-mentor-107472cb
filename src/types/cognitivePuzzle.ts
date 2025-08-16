export interface ActivityItem {
  id: string;
  name: string;
  icon: string;
  category: 'activity' | 'twist';
}

export interface TimeSlot {
  id: string;
  label: string;
  icon: string;
  period: 'morning' | 'noon' | 'afternoon' | 'evening';
}

export interface SpatialSlot {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
}

export interface PlacedItem {
  activityId: string;
  spatialSlotId?: string;
  timeSlotId?: string;
}

export interface TwistEvent {
  id: string;
  type: 'call' | 'visitor' | 'rain' | 'traffic' | 'meeting';
  description: string;
  effect: {
    moveActivity?: string;
    newLocation?: string;
    newTime?: string;
    addActivity?: ActivityItem;
  };
}

export interface GameLevel {
  id: number;
  name: string;
  description: string;
  activities: ActivityItem[];
  spatialSlots: SpatialSlot[];
  timeSlots: TimeSlot[];
  enableTimeline: boolean;
  twistEvents: TwistEvent[];
  successCriteria: {
    spatialRequired: number;
    temporalRequired: number;
  };
}

export interface GameScenario {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  levels: GameLevel[];
}

export interface GameState {
  currentScenario: string | null;
  currentLevel: number;
  placedItems: PlacedItem[];
  score: number;
  completedLevels: string[];
  activeTwist: TwistEvent | null;
  gamePhase: 'menu' | 'playing' | 'success' | 'instructions';
  accessibilityMode: boolean;
  voiceEnabled: boolean;
}