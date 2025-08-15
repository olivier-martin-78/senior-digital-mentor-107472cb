import { GameImage } from '@/types/memoryCountGame';

export const MEMORY_IMAGES: GameImage[] = [
  { id: 'house', emoji: '🏠', name: 'Maison' },
  { id: 'car', emoji: '🚗', name: 'Voiture' },
  { id: 'tree', emoji: '🌳', name: 'Arbre' },
  { id: 'cat', emoji: '🐱', name: 'Chat' },
  { id: 'sun', emoji: '☀️', name: 'Soleil' },
  { id: 'star', emoji: '⭐', name: 'Étoile' },
  { id: 'balloon', emoji: '🎈', name: 'Ballon' },
  { id: 'apple', emoji: '🍎', name: 'Pomme' },
  { id: 'flower', emoji: '🌸', name: 'Fleur' },
  { id: 'rocket', emoji: '🚀', name: 'Fusée' },
  { id: 'book', emoji: '📚', name: 'Livre' },
  { id: 'music', emoji: '🎵', name: 'Musique' },
  { id: 'heart', emoji: '❤️', name: 'Cœur' },
  { id: 'cake', emoji: '🎂', name: 'Gâteau' },
  { id: 'bicycle', emoji: '🚲', name: 'Vélo' }
];

export const getRandomImages = (count: number): GameImage[] => {
  const shuffled = [...MEMORY_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const generateImageSequence = (images: GameImage[], totalDisplays: number) => {
  const sequence: Array<{ image: GameImage; order: number }> = [];
  const counts: Record<string, number> = {};
  
  // Initialize counts
  images.forEach(img => {
    counts[img.id] = 0;
  });
  
  // Ensure each image appears at least once
  images.forEach((img, index) => {
    sequence.push({ image: img, order: index });
    counts[img.id] = 1;
  });
  
  // Fill remaining displays randomly
  const remainingDisplays = totalDisplays - images.length;
  for (let i = 0; i < remainingDisplays; i++) {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    
    // Limit to max 5 occurrences per image
    if (counts[randomImage.id] < 5) {
      sequence.push({ image: randomImage, order: images.length + i });
      counts[randomImage.id]++;
    } else {
      // Find an image with fewer than 5 occurrences
      const availableImage = images.find(img => counts[img.id] < 5);
      if (availableImage) {
        sequence.push({ image: availableImage, order: images.length + i });
        counts[availableImage.id]++;
      }
    }
  }
  
  // Shuffle the sequence
  return {
    sequence: sequence.sort(() => Math.random() - 0.5),
    counts
  };
};