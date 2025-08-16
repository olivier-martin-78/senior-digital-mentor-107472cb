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
        { id: 'cooking', name: 'Prendre ma douche', icon: '🚿', category: 'activity' },
        { id: 'cleaning', name: 'Préparer le déjeuner', icon: '🍳', category: 'activity' },
        { id: 'plants', name: 'Réparer mon lit', icon: '🔨', category: 'activity' },
        { id: 'laundry', name: 'Réparer la voiture à la nuit tombée', icon: '🔧', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'kitchen', label: 'Cuisine', icon: '🍳', x: 20, y: 30 },
        { id: 'living', label: 'Salle de bain', icon: '🚿', x: 60, y: 30 },
        { id: 'bedroom', label: 'Chambre', icon: '🛏️', x: 20, y: 70 },
        { id: 'garden', label: 'Garage', icon: '🚗', x: 60, y: 70 },
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
          description: 'J\'ai oublié mes clés ! Que dois-je faire ?',
          adaptationChoices: [
            {
              id: 'stay-home',
              description: 'Renoncer à sortir pour ne pas laisser la maison ouverte',
              effect: { moveActivity: 'cleaning' }
            },
            {
              id: 'call-helper',
              description: 'Appeler mon auxiliaire de vie pour qu\'elle m\'aide à chercher mes clés',
              effect: { moveActivity: 'cleaning' }
            },
            {
              id: 'search-everywhere',
              description: 'Je décide de les chercher partout dans la maison',
              effect: { moveActivity: 'cleaning' }
            },
            {
              id: 'neighbor-keys',
              description: 'Aller chercher mon double de clés chez la voisine',
              effect: { moveActivity: 'cleaning' }
            }
          ],
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
        { id: 'tv', name: 'Tartiner mes biscottes', icon: '📺', category: 'activity' },
        { id: 'reading', name: 'Ranger ma table de nuit', icon: '📚', category: 'activity' },
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
          description: 'Visiteur inattendu ! Comment réagissez-vous ?',
          adaptationChoices: [
            {
              id: 'welcome-visitor',
              description: 'Accueillir chaleureusement le visiteur avec un thé',
              effect: { addActivity: { id: 'tea', name: 'Thé avec voisin', icon: '☕', category: 'twist' } }
            },
            {
              id: 'quick-chat',
              description: 'Discuter rapidement à la porte puis reprendre mes activités',
              effect: { addActivity: { id: 'tea', name: 'Thé avec voisin', icon: '☕', category: 'twist' } }
            },
            {
              id: 'invite-later',
              description: 'Proposer de se voir plus tard quand j\'aurai fini',
              effect: { addActivity: { id: 'tea', name: 'Thé avec voisin', icon: '☕', category: 'twist' } }
            },
            {
              id: 'polite-decline',
              description: 'M\'excuser poliment car je suis occupé aujourd\'hui',
              effect: { addActivity: { id: 'tea', name: 'Thé avec voisin', icon: '☕', category: 'twist' } }
            }
          ],
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
        { id: 'library', name: 'Echanger mes livres à partir de 14h', icon: '📚', category: 'activity' },
        { id: 'pharmacy', name: 'Acheter des  médicaments vers 10h', icon: '💊', category: 'activity' },
        { id: 'bank', name: 'Aller au distributeur de billets à 12h', icon: '🏦', category: 'activity' },
        { id: 'grocery', name: 'Faire les courses pour le dîner à 18h', icon: '🥬', category: 'activity' },
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
          description: 'Embouteillages ! Que vais-je faire ?',
          adaptationChoices: [
            {
              id: 'postpone',
              description: 'Reporter ma sortie au lendemain',
              effect: { moveActivity: 'pharmacy', newTime: 'afternoon' }
            },
            {
              id: 'turn-back',
              description: 'Faire demi-tour et ressortir à une heure plus calme de la journée',
              effect: { moveActivity: 'pharmacy', newTime: 'afternoon' }
            },
            {
              id: 'wait-patiently',
              description: 'Prendre mon mal en patience et attendre dans les embouteillages',
              effect: { moveActivity: 'pharmacy', newTime: 'afternoon' }
            },
            {
              id: 'ask-helper',
              description: 'Rentrer à la maison et demander à mon auxiliaire de vie de m\'emmener',
              effect: { moveActivity: 'pharmacy', newTime: 'afternoon' }
            }
          ],
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
        { id: 'museum', name: 'Aller voir l\'exposition Picasso', icon: '🏛️', category: 'activity' },
        { id: 'restaurant', name: 'Aller dîner à la pizzeria', icon: '🍽️', category: 'activity' },
        { id: 'cinema', name: 'Acheter des croissants avant le PDJ', icon: '🥐', category: 'activity' },
        { id: 'gym', name: 'Déjeuner avec une amie', icon: '🍽️', category: 'activity' },
      ],
      spatialSlots: [
        { id: 'museum', label: 'Musée', icon: '🏛️', x: 20, y: 20 },
        { id: 'restaurant', label: 'Restaurant', icon: '🍽️', x: 70, y: 20 },
        { id: 'cinema', label: 'Boulangerie', icon: '🥐', x: 20, y: 70 },
        { id: 'gym', label: 'Brasserie', icon: '🍽️', x: 70, y: 70 },
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
          description: 'Pluie soudaine ! Comment vous adaptez-vous ?',
          adaptationChoices: [
            {
              id: 'wait-inside',
              description: 'Attendre dans un café en regardant un film',
              effect: { moveActivity: 'cinema', newLocation: 'restaurant', addActivity: { id: 'coffee', name: 'Café d\'attente', icon: '☕', category: 'twist' } }
            },
            {
              id: 'umbrella-continue',
              description: 'Continuer avec un parapluie, la pluie ne m\'arrête pas',
              effect: { moveActivity: 'cinema', newLocation: 'restaurant', addActivity: { id: 'coffee', name: 'Café d\'attente', icon: '☕', category: 'twist' } }
            },
            {
              id: 'indoor-activities',
              description: 'Changer pour des activités en intérieur seulement',
              effect: { moveActivity: 'cinema', newLocation: 'restaurant', addActivity: { id: 'coffee', name: 'Café d\'attente', icon: '☕', category: 'twist' } }
            },
            {
              id: 'postpone-outing',
              description: 'Reporter la sortie et rentrer chez moi',
              effect: { moveActivity: 'cinema', newLocation: 'restaurant', addActivity: { id: 'coffee', name: 'Café d\'attente', icon: '☕', category: 'twist' } }
            }
          ],
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