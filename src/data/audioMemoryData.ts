import { GameSound, DifficultyLevel, SoundInSequence } from '@/types/audioMemoryGame';

export const AUDIO_MEMORY_SOUNDS: GameSound[] = [
  // Animaux
  {
    id: 'dog_bark',
    name: 'Aboiement de chien',
    file_url: '/sounds/animals/dog_bark.mp3',
    category: 'animals',
    type: 'original',
    description: 'Wouf wouf ! Un aboiement de chien énergique'
  },
  {
    id: 'cat_meow',
    name: 'Miaulement de chat',
    file_url: '/sounds/animals/cat_meow.mp3',
    category: 'animals',
    type: 'original',
    description: 'Miaou ! Un miaulement de chat doux et mélodieux'
  },
  {
    id: 'lion_roar',
    name: 'Rugissement de lion',
    file_url: '/sounds/animals/lion_roar.mp3',
    category: 'animals',
    type: 'original',
    description: 'Rooooaaarrr ! Le rugissement puissant du roi des animaux'
  },
  {
    id: 'bird_chirp',
    name: 'Chant d\'oiseau',
    file_url: '/sounds/animals/bird_chirp.mp3',
    category: 'animals',
    type: 'original',
    description: 'Cui cui cui ! Le chant joyeux d\'un petit oiseau'
  },
  {
    id: 'cow_moo',
    name: 'Meuglement de vache',
    file_url: '/sounds/animals/cow_moo.mp3',
    category: 'animals',
    type: 'original',
    description: 'Meuuuuh ! Le meuglement grave d\'une vache dans les prés'
  },

  // Variants d'animaux pour tromper
  {
    id: 'dog_bark_high',
    name: 'Aboiement aigu',
    file_url: '/sounds/animals/dog_bark_high.mp3',
    category: 'animals',
    type: 'variant',
    base_sound_id: 'dog_bark',
    description: 'Ouaf ouaf ! Un aboiement plus aigu et rapide'
  },
  {
    id: 'cat_purr',
    name: 'Ronronnement de chat',
    file_url: '/sounds/animals/cat_purr.mp3',
    category: 'animals',
    type: 'variant',
    base_sound_id: 'cat_meow',
    description: 'Ronron ronron... Le ronronnement doux d\'un chat satisfait'
  },

  // Onomatopées
  {
    id: 'boom',
    name: 'Boom',
    file_url: '/sounds/onomatopoeia/boom.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'BOOM ! Une explosion sonore retentissante'
  },
  {
    id: 'splash',
    name: 'Splash',
    file_url: '/sounds/onomatopoeia/splash.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'Splash ! Le bruit d\'une éclaboussure dans l\'eau'
  },
  {
    id: 'click',
    name: 'Clic',
    file_url: '/sounds/onomatopoeia/click.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'Clic ! Un petit bruit sec et net'
  },
  {
    id: 'whoosh',
    name: 'Whoosh',
    file_url: '/sounds/onomatopoeia/whoosh.mp3',
    category: 'onomatopoeia',
    type: 'original',
    description: 'Whoooosh ! Le sifflement du vent qui passe'
  },

  // Instruments
  {
    id: 'piano_c',
    name: 'Note de piano',
    file_url: '/sounds/instruments/piano_c.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Ding ! Une belle note Do jouée au piano'
  },
  {
    id: 'guitar_strum',
    name: 'Accord de guitare',
    file_url: '/sounds/instruments/guitar_strum.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Strum ! Un accord gratté sur une guitare acoustique'
  },
  {
    id: 'drum_beat',
    name: 'Battement de batterie',
    file_url: '/sounds/instruments/drum_beat.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Bam ! Un coup sec sur une caisse claire'
  },
  {
    id: 'violin_note',
    name: 'Note de violon',
    file_url: '/sounds/instruments/violin_note.mp3',
    category: 'instruments',
    type: 'original',
    description: 'Une note soutenue et mélodieuse au violon'
  },

  // Variants d'instruments
  {
    id: 'piano_c_sharp',
    name: 'Note de piano dièse',
    file_url: '/sounds/instruments/piano_c_sharp.mp3',
    category: 'instruments',
    type: 'variant',
    base_sound_id: 'piano_c',
    description: 'Ding ! Une note Do dièse plus aiguë au piano'
  },

  // Nature
  {
    id: 'thunder',
    name: 'Tonnerre',
    file_url: '/sounds/nature/thunder.mp3',
    category: 'nature',
    type: 'original',
    description: 'Grooooonde ! Le grondement puissant du tonnerre'
  },
  {
    id: 'rain',
    name: 'Pluie',
    file_url: '/sounds/nature/rain.mp3',
    category: 'nature',
    type: 'original',
    description: 'Plic ploc plic ploc... Le bruit apaisant de la pluie qui tombe'
  },
  {
    id: 'wind',
    name: 'Vent',
    file_url: '/sounds/nature/wind.mp3',
    category: 'nature',
    type: 'original',
    description: 'Houuuuu... Le souffle mystérieux du vent dans les arbres'
  },
  {
    id: 'waves',
    name: 'Vagues',
    file_url: '/sounds/nature/waves.mp3',
    category: 'nature',
    type: 'original',
    description: 'Chhhhhh... Le va-et-vient relaxant des vagues sur la plage'
  },

  // Transport
  {
    id: 'car_engine',
    name: 'Moteur de voiture',
    file_url: '/sounds/transport/car_engine.mp3',
    category: 'transport',
    type: 'original',
    description: 'Vrooom vrooom ! Le ronronnement d\'un moteur de voiture'
  },
  {
    id: 'train_horn',
    name: 'Klaxon de train',
    file_url: '/sounds/transport/train_horn.mp3',
    category: 'transport',
    type: 'original',
    description: 'Tchou tchoooou ! Le sifflet caractéristique d\'une locomotive'
  },
  {
    id: 'plane_takeoff',
    name: 'Décollage d\'avion',
    file_url: '/sounds/transport/plane_takeoff.mp3',
    category: 'transport',
    type: 'original',
    description: 'Wroooooosh ! Le rugissement des réacteurs au décollage'
  },

  // Musique (courts refrains)
  {
    id: 'happy_birthday',
    name: 'Joyeux anniversaire',
    file_url: '/sounds/music/happy_birthday.mp3',
    category: 'music',
    type: 'original',
    description: 'Joyeux anniversaire, joyeux anniversaire ! La mélodie festive'
  },
  {
    id: 'twinkle_star',
    name: 'Ah vous dirai-je maman',
    file_url: '/sounds/music/twinkle_star.mp3',
    category: 'music',
    type: 'original',
    description: 'Ah vous dirai-je maman, ce qui cause mon tourment... La mélodie classique'
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