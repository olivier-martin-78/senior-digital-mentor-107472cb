
export interface GameWord {
  Francais: string;
  Anglais: string;
}

export interface GameSession {
  score: number;
  total: number;
  mode: 'fr-to-en' | 'en-to-fr';
  date: string;
  words?: GameWord[]; // Ajouter les mots utilisés dans la session
}

export type GameMode = 'fr-to-en' | 'en-to-fr' | null;
