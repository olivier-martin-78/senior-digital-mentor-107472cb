
export interface GameWord {
  Francais: string;
  Anglais: string;
}

export interface GameSession {
  score: number;
  total: number;
  mode: 'fr-to-en' | 'en-to-fr';
  date: string;
}

export type GameMode = 'fr-to-en' | 'en-to-fr' | null;
