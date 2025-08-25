import { GameImage, DifficultyLevel, ImageInSequence } from '@/types/visualMemoryGame';

export const VISUAL_MEMORY_IMAGES: GameImage[] = [
  {
    id: 'apple',
    emoji: '🍎',
    name: 'Pomme',
    color: 'red',
    colorVariants: ['🍏', '🟢'] // Pomme verte pour tromper
  },
  {
    id: 'banana',
    emoji: '🍌',
    name: 'Banane',
    color: 'yellow',
    colorVariants: ['🟡', '🟨'] // Variations jaunes
  },
  {
    id: 'car',
    emoji: '🚗',
    name: 'Voiture',
    color: 'blue',
    colorVariants: ['🚙', '🚕'] // Voitures différentes
  },
  {
    id: 'house',
    emoji: '🏠',
    name: 'Maison',
    color: 'brown',
    colorVariants: ['🏡', '🏘️'] // Variations de maisons
  },
  {
    id: 'tree',
    emoji: '🌳',
    name: 'Arbre',
    color: 'green',
    colorVariants: ['🌲', '🎋'] // Autres arbres
  },
  {
    id: 'sun',
    emoji: '☀️',
    name: 'Soleil',
    color: 'yellow',
    colorVariants: ['🌞', '🔆'] // Variations soleil
  },
  {
    id: 'flower',
    emoji: '🌸',
    name: 'Fleur',
    color: 'pink',
    colorVariants: ['🌺', '🌻'] // Autres fleurs
  },
  {
    id: 'cat',
    emoji: '🐱',
    name: 'Chat',
    color: 'orange',
    colorVariants: ['🐈', '🐈‍⬛'] // Autres chats
  },
  {
    id: 'star',
    emoji: '⭐',
    name: 'Étoile',
    color: 'yellow',
    colorVariants: ['🌟', '✨'] // Variations étoiles
  },
  {
    id: 'heart',
    emoji: '❤️',
    name: 'Cœur',
    color: 'red',
    colorVariants: ['💙', '💚'] // Cœurs colorés
  },
  {
    id: 'book',
    emoji: '📚',
    name: 'Livre',
    color: 'blue',
    colorVariants: ['📖', '📝'] // Variations livres
  },
  {
    id: 'ball',
    emoji: '⚽',
    name: 'Ballon',
    color: 'black',
    colorVariants: ['🏀', '🏈'] // Autres ballons
  },
  {
    id: 'cake',
    emoji: '🎂',
    name: 'Gâteau',
    color: 'pink',
    colorVariants: ['🧁', '🍰'] // Autres desserts
  },
  {
    id: 'guitar',
    emoji: '🎸',
    name: 'Guitare',
    color: 'brown',
    colorVariants: ['🎵', '🎶'] // Notes de musique
  },
  {
    id: 'butterfly',
    emoji: '🦋',
    name: 'Papillon',
    color: 'blue',
    colorVariants: ['🐛', '🪲'] // Autres insectes
  },
  {
    id: 'umbrella',
    emoji: '☂️',
    name: 'Parapluie',
    color: 'blue',
    colorVariants: ['🌂', '☔'] // Variations parapluie
  },
  {
    id: 'pizza',
    emoji: '🍕',
    name: 'Pizza',
    color: 'red',
    colorVariants: ['🍔', '🌭'] // Autres nourritures
  },
  {
    id: 'bicycle',
    emoji: '🚴',
    name: 'Vélo',
    color: 'green',
    colorVariants: ['🚲', '🛴'] // Autres véhicules
  },
  {
    id: 'clock',
    emoji: '🕐',
    name: 'Horloge',
    color: 'white',
    colorVariants: ['⏰', '⏲️'] // Autres horloges
  },
  {
    id: 'rainbow',
    emoji: '🌈',
    name: 'Arc-en-ciel',
    color: 'multicolor',
    colorVariants: ['🌤️', '⛅'] // Autres météo
  }
];

export const getDifficultyImageCount = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case 'beginner': return 4;
    case 'intermediate': return 7;
    case 'advanced': return 10;
    default: return 4;
  }
};

export const getRandomImages = (count: number): GameImage[] => {
  const shuffled = [...VISUAL_MEMORY_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const generateImageSequence = (difficulty: DifficultyLevel): ImageInSequence[] => {
  const imageCount = getDifficultyImageCount(difficulty);
  const selectedImages = getRandomImages(imageCount);
  
  return selectedImages.map((image, index) => ({
    image,
    position: index,
    originalColor: image.color
  }));
};

export const generatePhase4Images = (originalSequence: ImageInSequence[]): GameImage[] => {
  const originalImages = originalSequence.map(item => item.image);
  const originalCount = originalImages.length;
  
  // Générer autant d'images fausses que d'images vraies
  const remainingImages = VISUAL_MEMORY_IMAGES.filter(
    img => !originalImages.some(orig => orig.id === img.id)
  );
  
  const falseImages = remainingImages
    .sort(() => Math.random() - 0.5)
    .slice(0, originalCount);
  
  // Mélanger toutes les images (vraies + fausses)
  const allImages = [...originalImages, ...falseImages];
  return allImages.sort(() => Math.random() - 0.5);
};

export const getImageVariant = (image: GameImage): string => {
  if (image.colorVariants.length === 0) return image.emoji;
  const randomIndex = Math.floor(Math.random() * image.colorVariants.length);
  return image.colorVariants[randomIndex];
};

export const generateDecoyImages = (excludeImages: GameImage[], count: number = 3): GameImage[] => {
  const availableImages = VISUAL_MEMORY_IMAGES.filter(
    img => !excludeImages.some(excl => excl.id === img.id)
  );
  
  return availableImages
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
};