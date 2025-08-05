export interface ReverseDictionaryWord {
  definition: string;
  word: string;
}

export interface ReverseDictionaryData {
  type: 'reverse_dictionary';
  title: string;
  timerDuration: number;
  words: ReverseDictionaryWord[];
  thumbnailUrl?: string;
}

export interface ReverseDictionaryGameSession {
  score: number;
  total: number;
  date: string;
  gameTitle: string;
}