import { GameSound, DifficultyLevel, SoundInSequence } from '@/types/audioMemoryGame';

export const AUDIO_MEMORY_SOUNDS: GameSound[] = [
  // Animaux
  {
    id: 'dog_bark',
    name: 'Aboiement de chien',
    file_url: '/sounds/animals/dog_bark.mp3',
    category: 'animals',
    type: 'original',
    description: 'Aboiement classique de chien'
  },
  {
    id: 'cat_meow',
    name: 'Miaulement de chat',
    file_url: '/sounds/animals/cat_meow.mp3',
    category: 'animals',
    type: 'original',
    description: 'Miaulement doux de chat'
  },
  {
    id: 'lion_roar',
    name: 'Rugissement de lion',
    file_url: '/sounds/animals/lion_roar.mp3',
    category: 'animals',
    type: 'original',
    description: 'Rugissement puissant de lion'
  },
  {
    id: 'bird_chirp',
    name: 'Chant d\'oiseau',
    file_url: '/sounds/animals/bird_chirp.mp3',
    category: 'animals',
    type: 'original',
    description: 'Chant mélodieux d\'oiseau'
  },
  {
    id: 'cow_moo',
    name: 'Meuglement de vache',
    file_url: '/sounds/animals/cow_moo.mp3',
    category: 'animals',
    type: 'original',
    description: 'Meuglement grave de vache'
  },

  // Variants d'animaux pour tromper
  {
    id: 'dog_bark_high',
    name: 'Aboiement aigu',
    file_url: '/sounds/animals/dog_bark_high.mp3',
    category: 'animals',
    type: 'variant',
    base_sound_id: 'dog_bark',
    description: 'Aboiement plus aigu'
  },
  {
    id: 'cat_purr',
    name: 'Ronronnement de chat',
    file_url: '/sounds/animals/cat_purr.mp3',
    category: 'animals',
    type: 'variant',
    base_sound_id: 'cat_meow',
    description: 'Ronronnement au lieu de miaulement'
  },

  // Onomatopées
  {
    id: 'boom',
    name: 'Boom',
    file_url: '/sounds/onomatopoeia/boom.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'Explosion sonore'
  },
  {
    id: 'splash',
    name: 'Splash',
    file_url: '/sounds/onomatopoeia/splash.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'Éclaboussure d\'eau'
  },
  {
    id: 'click',
    name: 'Clic',
    file_url: '/sounds/onomatopoeia/click.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'Clic sec'
  },
  {
    id: 'whoosh',
    name: 'Whoosh',
    file_url: '/sounds/onomatopoeia/whoosh.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'Sifflement du vent'
  },

  // Instruments
  {
    id: 'piano_c',
    name: 'Note de piano',
    file_url: '/sounds/instruments/piano_c.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Note Do au piano'
  },
  {
    id: 'guitar_strum',
    name: 'Accord de guitare',
    file_url: '/sounds/instruments/guitar_strum.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Accord gratté à la guitare'
  },
  {
    id: 'drum_beat',
    name: 'Battement de batterie',
    file_url: '/sounds/instruments/drum_beat.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Coup de caisse claire'
  },
  {
    id: 'violin_note',
    name: 'Note de violon',
    file_url: '/sounds/instruments/violin_note.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Note soutenue au violon'
  },

  // Variants d'instruments
  {
    id: 'piano_c_sharp',
    name: 'Note de piano dièse',
    file_url: '/sounds/instruments/piano_c_sharp.mp3',
    category: 'instruments',
    type: 'variant',
    base_sound_id: 'piano_c',
    description: 'Note Do# au piano'
  },

  // Nature
  {
    id: 'thunder',
    name: 'Tonnerre',
    file_url: '/sounds/nature/thunder.mp3',
    category: 'nature',
    type: 'original',
    description: 'Grondement de tonnerre'
  },
  {
    id: 'rain',
    name: 'Pluie',
    file_url: '/sounds/nature/rain.mp3',
    category: 'nature',
    type: 'original',
    description: 'Bruit de pluie qui tombe'
  },
  {
    id: 'wind',
    name: 'Vent',
    file_url: '/sounds/nature/wind.mp3',
    category: 'nature',
    type: 'original',
    description: 'Souffle du vent'
  },
  {
    id: 'waves',
    name: 'Vagues',
    file_url: '/sounds/nature/waves.mp3',
    category: 'nature',
    type: 'original',
    description: 'Bruit des vagues sur la plage'
  },

  // Transport
  {
    id: 'car_engine',
    name: 'Moteur de voiture',
    file_url: '/sounds/transport/car_engine.mp3',
    category: 'transport',
    type: 'original',
    description: 'Ronronnement de moteur'
  },
  {
    id: 'train_horn',
    name: 'Klaxon de train',
    file_url: '/sounds/transport/train_horn.mp3',
    category: 'transport',
    type: 'original',
    description: 'Sifflet de locomotive'
  },
  {
    id: 'plane_takeoff',
    name: 'Décollage d\'avion',
    file_url: '/sounds/transport/plane_takeoff.mp3',
    category: 'transport',
    type: 'original',
    description: 'Bruit de réacteurs au décollage'
  },

  // Musique (courts refrains)
  {
    id: 'happy_birthday',
    name: 'Joyeux anniversaire',
    file_url: '/sounds/music/happy_birthday.mp3',
    category: 'music',
    type: 'original',
    description: 'Refrain de Joyeux anniversaire'
  },
  {
    id: 'twinkle_star',
    name: 'Ah vous dirai-je maman',
    file_url: '/sounds/music/twinkle_star.mp3',
    category: 'music',
    type: 'original',
    description: 'Mélodie classique'
  }
];

export const getDifficultySoundCount = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case 'beginner': return 4;
    case 'intermediate': return 6;
    case 'advanced': return 8;
    default: return 4;
  }
};

export const getRandomSounds = (count: number): GameSound[] => {
  const originalSounds = AUDIO_MEMORY_SOUNDS.filter(sound => sound.type === 'original');
  const shuffled = [...originalSounds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const generateSoundSequence = (difficulty: DifficultyLevel): SoundInSequence[] => {
  const soundCount = getDifficultySoundCount(difficulty);
  const selectedSounds = getRandomSounds(soundCount);
  
  return selectedSounds.map((sound, index) => ({
    sound,
    position: index
  }));
};

export const generatePhase4Sounds = (originalSequence: SoundInSequence[]): GameSound[] => {
  const originalSounds = originalSequence.map(item => item.sound);
  const originalCount = originalSounds.length;
  
  // Générer autant de sons faux que de sons vrais
  const remainingSounds = AUDIO_MEMORY_SOUNDS.filter(
    sound => !originalSounds.some(orig => orig.id === sound.id) && sound.type === 'original'
  );
  
  const falseSounds = remainingSounds
    .sort(() => Math.random() - 0.5)
    .slice(0, originalCount);
  
  // Mélanger tous les sons (vrais + faux)
  const allSounds = [...originalSounds, ...falseSounds];
  return allSounds.sort(() => Math.random() - 0.5);
};

export const getSoundVariant = (sound: GameSound): GameSound | null => {
  const variant = AUDIO_MEMORY_SOUNDS.find(s => 
    s.type === 'variant' && s.base_sound_id === sound.id
  );
  return variant || null;
};

export const generateDecoySounds = (excludeSounds: GameSound[], count: number = 3): GameSound[] => {
  const availableSounds = AUDIO_MEMORY_SOUNDS.filter(
    sound => !excludeSounds.some(excl => excl.id === sound.id) && sound.type === 'original'
  );
  
  return availableSounds
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
};