import { GameScenario } from '@/types/cognitivePuzzle';

export const homeScenario: GameScenario = {
  id: 'home',
  name: 'Journée à la Maison',
  description: 'Organisez votre journée à domicile avec soin',
  thumbnail: '🏠',
  levels: [
    {
      id: 1,
      name: 'Débutant - Focus Spatial',
      description: 'Placez les activités dans les bons lieux de la maison',
      enableTimeline: false,
      activities: [
        { id: 'breakfast', name: 'Petit-déjeuner', icon: '🍳', category: 'activity' },
        { id: 'newspaper', name: 'Lecture du journal', icon: '📰', category: 'activity' },
        { id: 'nap', name: 'Sieste', icon: '😴', category: 'activity' },
        { id: 'dinner', name: 'Dîner', icon: '🍽️', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'kitchen', label: 'Cuisine', icon: '🍳', x: 20, y: 30 },
        { id: 'living', label: 'Salon', icon: '🛋️', x: 60, y: 30 },
        { id: 'bedroom', label: 'Chambre', icon: '🛏️', x: 20, y: 70 },
        { id: 'dining', label: 'Salle à manger', icon: '🍽️', x: 60, y: 70 },
      ],
      timeSlots: [],
      twistEvents: [
        {
          id: 'friend-call',
          type: 'call',
          description: 'Appel surprise d\'un ami !',
          effect: {
            moveActivity: 'newspaper',
            newLocation: 'living',
          },
        },
      ],
      successCriteria: {
        spatialRequired: 4,
        temporalRequired: 0,
      },
    },
    {
      id: 2,
      name: 'Intermédiaire - Ajout Temps',
      description: 'Connectez les activités aux lieux ET aux moments appropriés',
      enableTimeline: true,
      activities: [
        { id: 'breakfast', name: 'Petit-déjeuner', icon: '🍳', category: 'activity' },
        { id: 'newspaper', name: 'Lecture du journal', icon: '📰', category: 'activity' },
        { id: 'nap', name: 'Sieste', icon: '😴', category: 'activity' },
        { id: 'dinner', name: 'Dîner', icon: '🍽️', category: 'activity' },
        { id: 'plants', name: 'Arrosage des plantes', icon: '🪴', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'kitchen', label: 'Cuisine', icon: '🍳', x: 20, y: 30 },
        { id: 'living', label: 'Salon', icon: '🛋️', x: 60, y: 30 },
        { id: 'bedroom', label: 'Chambre', icon: '🛏️', x: 20, y: 70 },
        { id: 'garden', label: 'Jardin', icon: '🌱', x: 80, y: 50 },
        { id: 'dining', label: 'Salle à manger', icon: '🍽️', x: 60, y: 70 },
      ],
      timeSlots: [
        { id: 'morning', label: 'Matin', icon: '🌅', period: 'morning' },
        { id: 'noon', label: 'Midi', icon: '☀️', period: 'noon' },
        { id: 'afternoon', label: 'Après-midi', icon: '🌤️', period: 'afternoon' },
        { id: 'evening', label: 'Soir', icon: '🌙', period: 'evening' },
      ],
      twistEvents: [
        {
          id: 'lost-keys',
          type: 'call',
          description: 'Oubli des clés ! Adaptation nécessaire',
          effect: {
            moveActivity: 'nap',
          },
        },
      ],
      successCriteria: {
        spatialRequired: 5,
        temporalRequired: 5,
      },
    },
    {
      id: 3,
      name: 'Avancé - Séquence Complète',
      description: 'Construisez une journée parfaite malgré les imprévus',
      enableTimeline: true,
      activities: [
        { id: 'breakfast', name: 'Petit-déjeuner', icon: '🍳', category: 'activity' },
        { id: 'newspaper', name: 'Lecture du journal', icon: '📰', category: 'activity' },
        { id: 'nap', name: 'Sieste', icon: '😴', category: 'activity' },
        { id: 'dinner', name: 'Dîner', icon: '🍽️', category: 'activity' },
        { id: 'plants', name: 'Arrosage des plantes', icon: '🪴', category: 'activity' },
        { id: 'tv', name: 'Télévision', icon: '📺', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'kitchen', label: 'Cuisine', icon: '🍳', x: 20, y: 30 },
        { id: 'living', label: 'Salon', icon: '🛋️', x: 60, y: 30 },
        { id: 'bedroom', label: 'Chambre', icon: '🛏️', x: 20, y: 70 },
        { id: 'garden', label: 'Jardin', icon: '🌱', x: 80, y: 50 },
      ],
      timeSlots: [
        { id: 'morning', label: 'Matin', icon: '🌅', period: 'morning' },
        { id: 'noon', label: 'Midi', icon: '☀️', period: 'noon' },
        { id: 'afternoon', label: 'Après-midi', icon: '🌤️', period: 'afternoon' },
        { id: 'evening', label: 'Soir', icon: '🌙', period: 'evening' },
      ],
      twistEvents: [
        {
          id: 'unexpected-visitor',
          type: 'visitor',
          description: 'Visiteur inattendu ! Thé avec le voisin',
          effect: {
            addActivity: { id: 'tea', name: 'Thé avec voisin', icon: '☕', category: 'twist' },
          },
        },
      ],
      successCriteria: {
        spatialRequired: 6,
        temporalRequired: 6,
      },
    },
  ],
};

export const cityScenario: GameScenario = {
  id: 'city',
  name: 'Sortie en Ville',
  description: 'Planifiez votre sortie en ville avec plaisir',
  thumbnail: '🏙️',
  levels: [
    {
      id: 1,
      name: 'Débutant - Focus Spatial',
      description: 'Choisissez les bons lieux pour vos sorties',
      enableTimeline: false,
      activities: [
        { id: 'shopping', name: 'Courses au marché', icon: '🛒', category: 'activity' },
        { id: 'cafe', name: 'Café avec ami', icon: '☕', category: 'activity' },
        { id: 'dog-walk', name: 'Promenade du chien', icon: '🐕', category: 'activity' },
        { id: 'home-return', name: 'Retour à la maison', icon: '🏠', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'market', label: 'Marché', icon: '🏪', x: 20, y: 20 },
        { id: 'cafe-spot', label: 'Café', icon: '☕', x: 70, y: 20 },
        { id: 'park', label: 'Parc', icon: '🌳', x: 20, y: 70 },
        { id: 'home', label: 'Maison', icon: '🏠', x: 70, y: 70 },
      ],
      timeSlots: [],
      twistEvents: [
        {
          id: 'unexpected-meeting',
          type: 'meeting',
          description: 'Rencontre inattendue !',
          effect: {
            moveActivity: 'cafe',
          },
        },
      ],
      successCriteria: {
        spatialRequired: 4,
        temporalRequired: 0,
      },
    },
    {
      id: 2,
      name: 'Intermédiaire - Ajout Temps',
      description: 'Organisez votre sortie dans le temps',
      enableTimeline: true,
      activities: [
        { id: 'shopping', name: 'Courses au marché', icon: '🛒', category: 'activity' },
        { id: 'cafe', name: 'Café avec ami', icon: '☕', category: 'activity' },
        { id: 'dog-walk', name: 'Promenade du chien', icon: '🐕', category: 'activity' },
        { id: 'home-return', name: 'Retour à la maison', icon: '🏠', category: 'activity' },
        { id: 'post-office', name: 'Poste pour lettre', icon: '📮', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'market', label: 'Marché', icon: '🏪', x: 20, y: 20 },
        { id: 'cafe-spot', label: 'Café', icon: '☕', x: 70, y: 20 },
        { id: 'park', label: 'Parc', icon: '🌳', x: 20, y: 70 },
        { id: 'post', label: 'Bureau de poste', icon: '📮', x: 50, y: 50 },
        { id: 'home', label: 'Maison', icon: '🏠', x: 70, y: 70 },
      ],
      timeSlots: [
        { id: 'morning', label: 'Matin', icon: '🕘', period: 'morning' },
        { id: 'noon', label: 'Midi', icon: '🕛', period: 'noon' },
        { id: 'afternoon', label: 'Après-midi', icon: '🕐', period: 'afternoon' },
        { id: 'evening', label: 'Soir', icon: '🕕', period: 'evening' },
      ],
      twistEvents: [
        {
          id: 'traffic-jam',
          type: 'traffic',
          description: 'Embouteillages ! Retard prévu',
          effect: {
            moveActivity: 'cafe',
            newTime: 'afternoon',
          },
        },
      ],
      successCriteria: {
        spatialRequired: 5,
        temporalRequired: 5,
      },
    },
    {
      id: 3,
      name: 'Avancé - Séquence Complète',
      description: 'Maîtrisez une sortie complexe avec adaptations',
      enableTimeline: true,
      activities: [
        { id: 'shopping', name: 'Courses au marché', icon: '🛒', category: 'activity' },
        { id: 'cafe', name: 'Café avec ami', icon: '☕', category: 'activity' },
        { id: 'dog-walk', name: 'Promenade du chien', icon: '🐕', category: 'activity' },
        { id: 'home-return', name: 'Retour à la maison', icon: '🏠', category: 'activity' },
        { id: 'post-office', name: 'Poste pour lettre', icon: '📮', category: 'activity' },
        { id: 'pharmacy', name: 'Pharmacie', icon: '💊', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'market', label: 'Marché', icon: '🏪', x: 20, y: 20 },
        { id: 'cafe-spot', label: 'Café', icon: '☕', x: 70, y: 20 },
        { id: 'park', label: 'Parc', icon: '🌳', x: 20, y: 70 },
        { id: 'home', label: 'Maison', icon: '🏠', x: 70, y: 70 },
        { id: 'pharmacy', label: 'Pharmacie', icon: '💊', x: 50, y: 35 },
      ],
      timeSlots: [
        { id: 'morning', label: 'Matin', icon: '🕘', period: 'morning' },
        { id: 'noon', label: 'Midi', icon: '🕛', period: 'noon' },
        { id: 'afternoon', label: 'Après-midi', icon: '🕐', period: 'afternoon' },
        { id: 'evening', label: 'Soir', icon: '🕕', period: 'evening' },
      ],
      twistEvents: [
        {
          id: 'sudden-rain',
          type: 'rain',
          description: 'Pluie soudaine ! Adaptez-vous',
          effect: {
            moveActivity: 'dog-walk',
            newLocation: 'home',
            addActivity: { id: 'reading', name: 'Lecture à la maison', icon: '📚', category: 'twist' },
          },
        },
      ],
      successCriteria: {
        spatialRequired: 6,
        temporalRequired: 6,
      },
    },
  ],
};