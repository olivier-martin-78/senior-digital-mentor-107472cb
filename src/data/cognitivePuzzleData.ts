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
        { id: 'cooking', name: 'Préparation repas', icon: '👩‍🍳', category: 'activity' },
        { id: 'cleaning', name: 'Nettoyage maison', icon: '🧹', category: 'activity' },
        { id: 'plants', name: 'Arrosage des plantes', icon: '🪴', category: 'activity' },
        { id: 'laundry', name: 'Lessive', icon: '👕', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'kitchen', label: 'Cuisine', icon: '🍳', x: 20, y: 30 },
        { id: 'living', label: 'Salon', icon: '🛋️', x: 60, y: 30 },
        { id: 'bedroom', label: 'Chambre', icon: '🛏️', x: 20, y: 70 },
        { id: 'garden', label: 'Jardin', icon: '🌱', x: 60, y: 70 },
      ],
      timeSlots: [
        { id: 'morning', label: 'Matin', icon: '🌅', period: 'morning' },
        { id: 'noon', label: 'Midi', icon: '☀️', period: 'noon' },
        { id: 'afternoon', label: 'Après-midi', icon: '🌤️', period: 'afternoon' },
        { id: 'evening', label: 'Soir', icon: '🌙', period: 'evening' },
        { id: 'night', label: 'Fin de soirée', icon: '🌃', period: 'evening' },
      ],
      twistEvents: [
        {
          id: 'lost-keys',
          type: 'call',
          description: 'Oubli des clés ! Adaptation nécessaire',
          effect: {
            moveActivity: 'cleaning',
          },
        },
      ],
      successCriteria: {
        spatialRequired: 4,
        temporalRequired: 4,
      },
    },
    {
      id: 3,
      name: 'Avancé - Séquence Complète',
      description: 'Construisez une journée parfaite malgré les imprévus',
      enableTimeline: true,
      activities: [
        { id: 'tv', name: 'Télévision', icon: '📺', category: 'activity' },
        { id: 'reading', name: 'Lecture', icon: '📚', category: 'activity' },
        { id: 'music', name: 'Écoute musique', icon: '🎵', category: 'activity' },
        { id: 'crafts', name: 'Bricolage', icon: '🔨', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'kitchen', label: 'Cuisine', icon: '🍳', x: 20, y: 30 },
        { id: 'living', label: 'Salon', icon: '🛋️', x: 60, y: 30 },
        { id: 'bedroom', label: 'Chambre', icon: '🛏️', x: 20, y: 70 },
        { id: 'workshop', label: 'Atelier', icon: '🔨', x: 60, y: 70 },
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
        spatialRequired: 4,
        temporalRequired: 4,
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
        { id: 'library', name: 'Bibliothèque', icon: '📚', category: 'activity' },
        { id: 'pharmacy', name: 'Pharmacie', icon: '💊', category: 'activity' },
        { id: 'bank', name: 'Banque', icon: '🏦', category: 'activity' },
        { id: 'grocery', name: 'Épicerie', icon: '🥬', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'library', label: 'Bibliothèque', icon: '📚', x: 20, y: 20 },
        { id: 'pharmacy', label: 'Pharmacie', icon: '💊', x: 70, y: 20 },
        { id: 'bank', label: 'Banque', icon: '🏦', x: 20, y: 70 },
        { id: 'grocery', label: 'Épicerie', icon: '🥬', x: 70, y: 70 },
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
            moveActivity: 'pharmacy',
            newTime: 'afternoon',
          },
        },
      ],
      successCriteria: {
        spatialRequired: 4,
        temporalRequired: 4,
      },
    },
    {
      id: 3,
      name: 'Avancé - Séquence Complète',
      description: 'Maîtrisez une sortie complexe avec adaptations',
      enableTimeline: true,
      activities: [
        { id: 'museum', name: 'Musée', icon: '🏛️', category: 'activity' },
        { id: 'restaurant', name: 'Restaurant', icon: '🍽️', category: 'activity' },
        { id: 'cinema', name: 'Cinéma', icon: '🎬', category: 'activity' },
        { id: 'gym', name: 'Sport en salle', icon: '🏋️', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'museum', label: 'Musée', icon: '🏛️', x: 20, y: 20 },
        { id: 'restaurant', label: 'Restaurant', icon: '🍽️', x: 70, y: 20 },
        { id: 'cinema', label: 'Cinéma', icon: '🎬', x: 20, y: 70 },
        { id: 'gym', label: 'Salle de sport', icon: '🏋️', x: 70, y: 70 },
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
            moveActivity: 'cinema',
            newLocation: 'restaurant',
            addActivity: { id: 'coffee', name: 'Café d\'attente', icon: '☕', category: 'twist' },
          },
        },
      ],
      successCriteria: {
        spatialRequired: 4,
        temporalRequired: 4,
      },
    },
  ],
};