
import { Chapter } from '@/types/lifeStory';

// Définition des chapitres et questions
export const initialChapters: Chapter[] = [
  {
    id: 'ch1',
    title: 'Enfance et Famille',
    description: 'Souvenirs et relations familiales',
    questions: [
      { id: 'q1_1', text: 'Quel est votre tout premier souvenir d\'enfance ?' },
      { id: 'q1_2', text: 'Comment décririez-vous vos parents ? Quels traits de caractère ou valeurs vous ont-ils transmis ?' },
      { id: 'q1_3', text: 'Avez-vous des frères et sœurs ? Quelle était votre relation avec eux (complicité, rivalité, etc.) ?' },
      { id: 'q1_4', text: 'Quels sont les moments marquants de votre enfance (vacances, traditions familiales, jeux, etc.) ?' },
      { id: 'q1_5', text: 'Comment était votre maison d\'enfance et votre quartier ? Y a-t-il des anecdotes liées à cet environnement ?' },
      { id: 'q1_6', text: 'Y a-t-il des figures familiales élargies (grands-parents, oncles, tantes) qui ont joué un rôle important ?' },
    ],
  },
  {
    id: 'ch2',
    title: 'Éducation et Formation',
    description: 'Parcours scolaire et apprentissages',
    questions: [
      { id: 'q2_1', text: 'Quelle était votre école préférée et pourquoi ? Y a-t-il des enseignants qui vous ont particulièrement marqué ?' },
      { id: 'q2_2', text: 'Quelles étaient vos matières favorites et celles que vous aimiez le moins ?' },
      { id: 'q2_3', text: 'Avez-vous des souvenirs marquants de vos années d\'études (amitiés, événements scolaires, réussites, échecs) ?' },
      { id: 'q2_4', text: 'Avez-vous poursuivi des études supérieures ? Si oui, comment avez-vous choisi votre domaine ?' },
      { id: 'q2_5', text: 'Y a-t-il des mentors ou des figures inspirantes qui ont influencé votre parcours éducatif ?' },
    ],
  },
  {
    id: 'ch3',
    title: 'Adolescence et Jeunesse',
    description: 'Période de découvertes et transformations',
    questions: [
      { id: 'q3_1', text: 'Comment avez-vous vécu votre adolescence (rébellions, explorations, premières fois) ?' },
      { id: 'q3_2', text: 'Quels étaient vos passe-temps, passions ou rêves à cette époque ?' },
      { id: 'q3_3', text: 'Avez-vous eu des expériences qui ont façonné votre personnalité ou vos valeurs (voyages, rencontres, etc.) ?' },
      { id: 'q3_4', text: 'Quels sont les événements marquants de cette période (premier amour, premier emploi, déménagement, etc.) ?' },
      { id: 'q3_5', text: 'Y a-t-il des anecdotes amusantes ou embarrassantes de votre jeunesse que vous aimeriez partager ?' },
    ],
  },
  {
    id: 'ch4',
    title: 'Vie Professionnelle',
    description: 'Carrière et accomplissements professionnels',
    questions: [
      { id: 'q4_1', text: 'Quel a été votre premier emploi et comment l\'avez-vous obtenu ?' },
      { id: 'q4_2', text: 'Quelles ont été les étapes clés de votre carrière (promotions, changements de poste, reconversions) ?' },
      { id: 'q4_3', text: 'Avez-vous des anecdotes ou des leçons apprises dans votre vie professionnelle (collègues, projets, échecs, succès) ?' },
      { id: 'q4_4', text: 'Comment votre carrière a-t-elle influencé votre vie personnelle (équilibre travail-vie, sacrifices, opportunités) ?' },
      { id: 'q4_5', text: 'Y a-t-il un moment où vous avez senti que vous aviez atteint un sommet professionnel ou réalisé un rêve ?' },
    ],
  },
  {
    id: 'ch5',
    title: 'Relations et Vie Sociale',
    description: 'Amitiés et relations importantes',
    questions: [
      { id: 'q5_1', text: 'Qui sont les personnes les plus importantes dans votre vie (amis, mentors, partenaires) et pourquoi ?' },
      { id: 'q5_2', text: 'Comment avez-vous rencontré votre conjoint/partenaire, si applicable ? Quelle est l\'histoire de votre relation ?' },
      { id: 'q5_3', text: 'Quelles sont les amitiés ou relations amoureuses qui ont eu un impact significatif sur vous ?' },
      { id: 'q5_4', text: 'Avez-vous des anecdotes sur des moments partagés avec des proches (fêtes, voyages, disputes, réconciliations) ?' },
      { id: 'q5_5', text: 'Y a-t-il des personnes que vous avez perdues et qui vous manquent particulièrement ?' },
    ],
  },
  {
    id: 'ch6',
    title: 'Défis et Obstacles',
    description: 'Difficultés et résilience',
    questions: [
      { id: 'q6_1', text: 'Quels ont été les plus grands défis que vous avez affrontés (personnels, professionnels, de santé, etc.) ?' },
      { id: 'q6_2', text: 'Comment avez-vous surmonté ces obstacles ? Qui ou quoi vous a aidé ?' },
      { id: 'q6_3', text: 'Quelles leçons avez-vous tirées de ces expériences difficiles ?' },
      { id: 'q6_4', text: 'Y a-t-il des regrets ou des choses que vous auriez aimé faire différemment ?' },
      { id: 'q6_5', text: 'Comment ces défis ont-ils façonné la personne que vous êtes aujourd\'hui ?' },
    ],
  },
  {
    id: 'ch7',
    title: 'Réalisations et Moments de Fierté',
    description: 'Succès personnels et accomplissements',
    questions: [
      { id: 'q7_1', text: 'Quelles sont vos plus grandes réalisations personnelles et professionnelles ?' },
      { id: 'q7_2', text: 'Quels sont les moments où vous vous êtes senti le plus fier (diplômes, projets, actes de générosité, etc.) ?' },
      { id: 'q7_3', text: 'Comment ces succès ont-ils influencé votre vie ou celle des autres ?' },
      { id: 'q7_4', text: 'Y a-t-il des reconnaissances ou des récompenses qui ont une signification particulière pour vous ?' },
    ],
  },
  {
    id: 'ch8',
    title: 'Voyages et Aventures',
    description: 'Exploration et découvertes',
    questions: [
      { id: 'q8_1', text: 'Quels sont les voyages qui vous ont le plus marqué et pourquoi ?' },
      { id: 'q8_2', text: 'Avez-vous des anecdotes amusantes, surprenantes ou significatives de vos aventures ?' },
      { id: 'q8_3', text: 'Comment les voyages ont-ils élargi votre perspective sur le monde ou sur vous-même ?' },
      { id: 'q8_4', text: 'Y a-t-il un lieu que vous considérez comme votre « chez-vous » loin de chez vous ?' },
    ],
  },
  {
    id: 'ch9',
    title: 'Passions et Loisirs',
    description: 'Hobbies et intérêts personnels',
    questions: [
      { id: 'q9_1', text: 'Quelles sont vos passions et hobbies (sports, arts, collections, etc.) ?' },
      { id: 'q9_2', text: 'Comment avez-vous découvert ces intérêts et comment ont-ils évolué au fil du temps ?' },
      { id: 'q9_3', text: 'Quels sont les moments marquants liés à ces activités (compétitions, créations, rencontres) ?' },
      { id: 'q9_4', text: 'Y a-t-il une passion que vous avez abandonnée et que vous regrettez ?' },
    ],
  },
  {
    id: 'ch10',
    title: 'Réflexions et Leçons de Vie',
    description: 'Sagesse et regards sur le parcours',
    questions: [
      { id: 'q10_1', text: 'Quelles sont les leçons les plus importantes que vous avez apprises au cours de votre vie ?' },
      { id: 'q10_2', text: 'Quels conseils donneriez-vous à votre jeune-moi si vous le pouviez ?' },
      { id: 'q10_3', text: 'Comment voyez-vous votre vie dans son ensemble ? Quels sont les fils conducteurs ou les thèmes récurrents ?' },
      { id: 'q10_4', text: 'Quels sont vos espoirs, rêves ou projets pour l\'avenir ?' },
      { id: 'q10_5', text: 'Y a-t-il un message ou une sagesse que vous aimeriez transmettre à vos lecteurs ou à vos proches ?' },
    ],
  },
];
