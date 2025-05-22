
import { Chapter } from '@/types/lifeStory';

export const initialChapters: Chapter[] = [
  {
    id: 'chapter-1',
    title: 'Enfance',
    questions: [
      { id: 'question-1-1', text: 'Quelle est votre première mémoire d\'enfance ?', answer: '' },
      { id: 'question-1-2', text: 'Décrivez votre famille pendant votre enfance.', answer: '' },
      { id: 'question-1-3', text: 'Quel était votre jeu préféré quand vous étiez enfant ?', answer: '' },
    ]
  },
  {
    id: 'chapter-2',
    title: 'Adolescence',
    questions: [
      { id: 'question-2-1', text: 'Comment était votre scolarité ?', answer: '' },
      { id: 'question-2-2', text: 'Quels amis vous ont marqué pendant cette période ?', answer: '' },
      { id: 'question-2-3', text: 'Quel était votre rêve à cette époque ?', answer: '' },
    ]
  },
  {
    id: 'chapter-3',
    title: 'Vie adulte',
    questions: [
      { id: 'question-3-1', text: 'Racontez votre parcours professionnel.', answer: '' },
      { id: 'question-3-2', text: 'Quels ont été les moments les plus marquants de votre vie d\'adulte ?', answer: '' },
      { id: 'question-3-3', text: 'Quelles personnes vous ont le plus influencé ?', answer: '' },
    ]
  },
  {
    id: 'chapter-4',
    title: 'Réflexions',
    questions: [
      { id: 'question-4-1', text: 'Quelles leçons avez-vous apprises au cours de votre vie ?', answer: '' },
      { id: 'question-4-2', text: 'Quels conseils aimeriez-vous transmettre aux générations futures ?', answer: '' },
      { id: 'question-4-3', text: 'Comment aimeriez-vous qu\'on se souvienne de vous ?', answer: '' },
    ]
  }
];
