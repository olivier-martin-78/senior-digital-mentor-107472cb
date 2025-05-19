
// Définition des types pour Histoire d'une vie

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  answer?: string;
  audioUrl?: string; // URL de l'enregistrement audio
}

export interface LifeStory {
  id?: string;
  user_id?: string;
  title: string;
  chapters: Chapter[];
  created_at?: string;
  updated_at?: string;
  last_edited_chapter?: string;
  last_edited_question?: string;
}

export interface LifeStoryProgress {
  totalQuestions: number;
  answeredQuestions: number;
}

// Définition du contexte pour la transcription audio
export interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}
