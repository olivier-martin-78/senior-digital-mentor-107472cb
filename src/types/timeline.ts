
export interface TimelineEvent {
  id: string;
  name: string;
  imageUrl?: string;
  description: string;
  year: string;
  category: string;
  answerOptions?: string[]; // 3 options de réponse définies par le créateur
}

export interface TimelineData {
  creatorName: string;
  shareGlobally: boolean;
  timelineName: string;
  showYearOnCard: boolean;
  showDateOnCard?: boolean; // Nouveau champ optionnel pour rétrocompatibilité
  events: TimelineEvent[];
}

export interface TimelineGameState {
  placedEvents: TimelineEvent[];
  remainingEvents: TimelineEvent[];
  currentEvent: TimelineEvent | null;
  score: number;
  gameComplete: boolean;
}
