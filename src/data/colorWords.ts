export const COLOR_WORDS = [
  'Rouge',
  'Bleu', 
  'Vert',
  'Jaune',
  'Orange',
  'Violet',
  'Rose',
  'Noir',
  'Blanc',
  'Gris'
];

export const COLORS = {
  'Rouge': '#ef4444',
  'Bleu': '#3b82f6',
  'Vert': '#22c55e',
  'Jaune': '#eab308',
  'Orange': '#f97316',
  'Violet': '#8b5cf6',
  'Rose': '#ec4899',
  'Noir': '#1f2937',
  'Blanc': '#f9fafb',
  'Gris': '#6b7280'
};

export const getRandomColor = (excludeColor?: string): string => {
  const colorNames = Object.keys(COLORS).filter(color => color !== excludeColor);
  const randomIndex = Math.floor(Math.random() * colorNames.length);
  return colorNames[randomIndex];
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};