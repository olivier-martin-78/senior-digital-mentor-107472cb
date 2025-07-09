
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
  audioBlob?: Blob | null;
  audioUrl?: string | null;
}

export interface LifeStory {
  id?: string;
  user_id?: string;
  title: string;
  chapters: Chapter[];
  created_at?: string;
  updated_at?: string;
  last_edited_chapter?: string | null;
  last_edited_question?: string | null;
  shared_globally?: boolean;
}

export interface LifeStoryProgress {
  totalQuestions: number;
  answeredQuestions: number;
}
