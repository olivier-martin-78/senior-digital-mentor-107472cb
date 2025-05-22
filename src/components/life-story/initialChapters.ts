// src/components/life-story/initialChapters.ts
import { Chapter } from '@/types/lifeStory';

export const initialChapters: Chapter[] = [
  {
    id: 'chapter-1',
    title: 'Enfance',
    description: 'Vos souvenirs d’enfance',
    questions: [
      {
        id: 'question-1',
        text: 'Quelle est votre première mémoire ?',
        answer: '',
        audioBlob: null,
        audioUrl: null,
      },
      {
        id: 'question-2',
        text: 'Quel était votre jeu préféré ?',
        answer: '',
        audioBlob: null,
        audioUrl: null,
      },
    ],
  },
  {
    id: 'chapter-2',
    title: 'Adolescence',
    description: 'Vos années d’adolescence',
    questions: [
      {
        id: 'question-3',
        text: 'Quel était votre rêve d’adolescent ?',
        answer: '',
        audioBlob: null,
        audioUrl: null,
      },
    ],
  },
];
