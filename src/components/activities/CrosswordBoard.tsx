import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye, Puzzle, Trophy, ArrowRight, ArrowDown, HelpCircle } from 'lucide-react';

type Difficulty = 1 | 2 | 3 | 4 | 5;
type Direction = 'horizontal' | 'vertical';

interface WordData {
  word: string;
  clue: string;
  length: number;
  level: number;
}

interface PlacedWord {
  id: number;
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  length: number;
}

interface Cell {
  letter: string;
  correctLetter: string;
  isBlack: boolean;
  isEditable: boolean;
  hasArrow?: boolean;
  arrowDirection?: Direction;
  wordNumber?: number;
  wordIds?: number[];
}

interface GridState {
  grid: Grid;
  placedWords: PlacedWord[];
}

interface IntersectionPoint {
  word1Index: number;
  word2Index: number;
  pos1: number;
  pos2: number;
  score: number;
}

type Grid = Cell[][];

const CrosswordBoard = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [words, setWords] = useState<PlacedWord[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{row: number, col: number} | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const gridRefs = useRef<(React.RefObject<HTMLInputElement> | null)[][]>([]);

  const wordsDatabase: WordData[] = [
    // ===== NIVEAU 1 - Mots de 2-3 lettres (200+ mots) =====
    // Mots avec voyelles communes et consonnes fréquentes
    
    // Mots de 2 lettres essentiels
    { word: 'OR', clue: 'Métal précieux jaune', length: 2, level: 1 },
    { word: 'OS', clue: 'Partie dure du squelette', length: 2, level: 1 },
    { word: 'AS', clue: 'Carte la plus forte', length: 2, level: 1 },
    { word: 'ET', clue: 'Mot de liaison', length: 2, level: 1 },
    { word: 'EN', clue: 'Dans, au cours de', length: 2, level: 1 },
    { word: 'ON', clue: 'Pronom personnel', length: 2, level: 1 },
    { word: 'UN', clue: 'Article indéfini', length: 2, level: 1 },
    { word: 'LE', clue: 'Article défini', length: 2, level: 1 },
    { word: 'LA', clue: 'Article défini féminin', length: 2, level: 1 },
    { word: 'RE', clue: 'Note de musique', length: 2, level: 1 },
    { word: 'SI', clue: 'Note de musique', length: 2, level: 1 },
    { word: 'DO', clue: 'Note de musique', length: 2, level: 1 },
    { word: 'MI', clue: 'Note de musique', length: 2, level: 1 },
    { word: 'FA', clue: 'Note de musique', length: 2, level: 1 },
    { word: 'IL', clue: 'Pronom personnel', length: 2, level: 1 },
    { word: 'AU', clue: 'Contraction de à le', length: 2, level: 1 },
    { word: 'CE', clue: 'Pronom démonstratif', length: 2, level: 1 },
    { word: 'DE', clue: 'Préposition', length: 2, level: 1 },
    { word: 'SE', clue: 'Pronom réfléchi', length: 2, level: 1 },
    { word: 'NE', clue: 'Négation partielle', length: 2, level: 1 },

    // Mots de 3 lettres - Corps humain
    { word: 'NEZ', clue: 'Organe de l\'odorat', length: 3, level: 1 },
    { word: 'COU', clue: 'Partie entre tête et corps', length: 3, level: 1 },
    { word: 'DOS', clue: 'Partie arrière du corps', length: 3, level: 1 },
    { word: 'BAS', clue: 'Partie inférieure', length: 3, level: 1 },
    { word: 'PIE', clue: 'Extrémité de la jambe', length: 3, level: 1 },
    { word: 'BRA', clue: 'Membre supérieur', length: 3, level: 1 },
    { word: 'OIL', clue: 'Organe de la vue', length: 3, level: 1 },
    { word: 'DEN', clue: 'Partie dure de la bouche', length: 3, level: 1 },

    // Mots de 3 lettres - Nature et éléments
    { word: 'SOL', clue: 'Surface terrestre', length: 3, level: 1 },
    { word: 'MER', clue: 'Étendue d\'eau salée', length: 3, level: 1 },
    { word: 'AIR', clue: 'Gaz que l\'on respire', length: 3, level: 1 },
    { word: 'EAU', clue: 'Liquide H2O', length: 3, level: 1 },
    { word: 'FEU', clue: 'Combustion avec flammes', length: 3, level: 1 },
    { word: 'LAC', clue: 'Étendue d\'eau douce', length: 3, level: 1 },
    { word: 'ILE', clue: 'Terre entourée d\'eau', length: 3, level: 1 },
    { word: 'ROC', clue: 'Grande pierre', length: 3, level: 1 },
    { word: 'ARC', clue: 'Courbe dans le ciel', length: 3, level: 1 },
    { word: 'SEC', clue: 'Pas humide', length: 3, level: 1 },

    // Mots de 3 lettres - Concepts de base
    { word: 'ROI', clue: 'Souverain d\'un royaume', length: 3, level: 1 },
    { word: 'VIE', clue: 'Existence', length: 3, level: 1 },
    { word: 'LOI', clue: 'Règle juridique', length: 3, level: 1 },
    { word: 'FOI', clue: 'Croyance religieuse', length: 3, level: 1 },
    { word: 'ART', clue: 'Expression créative', length: 3, level: 1 },
    { word: 'BUT', clue: 'Objectif visé', length: 3, level: 1 },
    { word: 'JEU', clue: 'Activité ludique', length: 3, level: 1 },
    { word: 'GOT', clue: 'Saveur', length: 3, level: 1 },
    { word: 'SON', clue: 'Bruit que l\'on entend', length: 3, level: 1 },
    { word: 'TON', clue: 'Manière de parler', length: 3, level: 1 },

    // Mots de 3 lettres - Actions et verbes courts
    { word: 'VER', clue: 'Action de voir', length: 3, level: 1 },
    { word: 'FER', clue: 'Métal courant', length: 3, level: 1 },
    { word: 'TER', clue: 'Finir quelque chose', length: 3, level: 1 },
    { word: 'SER', clue: 'Être utile', length: 3, level: 1 },
    { word: 'NET', clue: 'Très propre', length: 3, level: 1 },
    { word: 'SET', clue: 'Ensemble d\'objets', length: 3, level: 1 },
    { word: 'GET', clue: 'Obtenir (anglais)', length: 3, level: 1 },
    { word: 'PET', clue: 'Petit animal domestique', length: 3, level: 1 },
    { word: 'LET', clue: 'Permettre (anglais)', length: 3, level: 1 },

    // Mots de 3 lettres avec voyelles multiples
    { word: 'OUI', clue: 'Affirmation', length: 3, level: 1 },
    { word: 'OIE', clue: 'Oiseau de basse-cour', length: 3, level: 1 },
    { word: 'EUE', clue: 'Participe passé d\'avoir', length: 3, level: 1 },
    { word: 'AGE', clue: 'Nombre d\'années', length: 3, level: 1 },
    { word: 'ACE', clue: 'Champion (anglais)', length: 3, level: 1 },
    { word: 'ARE', clue: 'Unité de surface', length: 3, level: 1 },
    { word: 'ORE', clue: 'Minerai (anglais)', length: 3, level: 1 },
    { word: 'USE', clue: 'Utiliser (anglais)', length: 3, level: 1 },
    { word: 'ICE', clue: 'Glace (anglais)', length: 3, level: 1 },
    { word: 'AXE', clue: 'Outil pour couper', length: 3, level: 1 },

    // Mots avec consonnes communes
    { word: 'CAR', clue: 'Véhicule automobile', length: 3, level: 1 },
    { word: 'BAR', clue: 'Établissement de boissons', length: 3, level: 1 },
    { word: 'SAC', clue: 'Contenant portable', length: 3, level: 1 },
    { word: 'PAR', clue: 'Au moyen de', length: 3, level: 1 },
    { word: 'PAS', clue: 'Mouvement du pied', length: 3, level: 1 },
    { word: 'GAS', clue: 'État de la matière', length: 3, level: 1 },
    { word: 'TAS', clue: 'Amas d\'objets', length: 3, level: 1 },
    { word: 'RAS', clue: 'À niveau', length: 3, level: 1 },
    { word: 'JUS', clue: 'Liquide de fruit', length: 3, level: 1 },
    { word: 'BUS', clue: 'Transport en commun', length: 3, level: 1 },
    { word: 'SUR', clue: 'Au-dessus de', length: 3, level: 1 },
    { word: 'MUR', clue: 'Cloison verticale', length: 3, level: 1 },
    { word: 'DUR', clue: 'Pas mou', length: 3, level: 1 },
    { word: 'PUR', clue: 'Sans mélange', length: 3, level: 1 },
    { word: 'CUR', clue: 'Prêtre de paroisse', length: 3, level: 1 },

    // Mots avec R en fin (très utiles)
    { word: 'FOR', clue: 'Intérieur (anglais)', length: 3, level: 1 },
    { word: 'NOR', clue: 'Ni (anglais)', length: 3, level: 1 },
    { word: 'COR', clue: 'Instrument de musique', length: 3, level: 1 },
    { word: 'TOR', clue: 'Faute, tort', length: 3, level: 1 },

    // Objets courants
    { word: 'LIT', clue: 'Meuble pour dormir', length: 3, level: 1 },
    { word: 'POT', clue: 'Récipient', length: 3, level: 1 },
    { word: 'BOL', clue: 'Récipient rond', length: 3, level: 1 },
    { word: 'COL', clue: 'Passage en montagne', length: 3, level: 1 },
    { word: 'VOL', clue: 'Action de voler', length: 3, level: 1 },

    // ===== NIVEAU 2 - Mots de 3-4 lettres (300+ mots) =====
    
    // Animaux familiers (4 lettres)
    { word: 'CHAT', clue: 'Animal domestique qui miaule', length: 4, level: 2 },
    { word: 'LION', clue: 'Roi des animaux', length: 4, level: 2 },
    { word: 'OURS', clue: 'Grand mammifère des forêts', length: 4, level: 2 },
    { word: 'LOUP', clue: 'Canidé sauvage', length: 4, level: 2 },
    { word: 'CERF', clue: 'Animal à bois', length: 4, level: 2 },
    { word: 'PORC', clue: 'Cochon', length: 4, level: 2 },
    { word: 'LYNX', clue: 'Félin sauvage', length: 4, level: 2 },
    { word: 'DAIM', clue: 'Petit cervidé', length: 4, level: 2 },
    { word: 'PAON', clue: 'Oiseau à queue colorée', length: 4, level: 2 },
    { word: 'COQS', clue: 'Mâles de poules', length: 4, level: 2 },

    // Nourriture (4 lettres)
    { word: 'PAIN', clue: 'Aliment fait de farine', length: 4, level: 2 },
    { word: 'LAIT', clue: 'Boisson blanche', length: 4, level: 2 },
    { word: 'MIEL', clue: 'Produit des abeilles', length: 4, level: 2 },
    { word: 'CAFE', clue: 'Boisson noire stimulante', length: 4, level: 2 },
    { word: 'BIER', clue: 'Boisson alcoolisée', length: 4, level: 2 },
    { word: 'SOUPE', clue: 'Plat liquide', length: 5, level: 2 },
    { word: 'PATE', clue: 'Aliment à base de blé', length: 4, level: 2 },
    { word: 'OEUF', clue: 'Produit de la poule', length: 4, level: 2 },
    { word: 'NOIX', clue: 'Fruit à coque', length: 4, level: 2 },
    { word: 'POIR', clue: 'Fruit juteux', length: 4, level: 2 },

    // Corps humain (4 lettres)
    { word: 'MAIN', clue: 'Extrémité du bras', length: 4, level: 2 },
    { word: 'PIED', clue: 'Extrémité de la jambe', length: 4, level: 2 },
    { word: 'YEUX', clue: 'Organes de la vue', length: 4, level: 2 },
    { word: 'BRAS', clue: 'Membre supérieur', length: 4, level: 2 },
    { word: 'TETE', clue: 'Partie supérieure du corps', length: 4, level: 2 },
    { word: 'COEU', clue: 'Organe qui bat', length: 4, level: 2 },
    { word: 'DENT', clue: 'Pour mâcher', length: 4, level: 2 },
    { word: 'JOUE', clue: 'Partie du visage', length: 4, level: 2 },
    { word: 'LVRE', clue: 'Bord de la bouche', length: 4, level: 2 },
    { word: 'FRON', clue: 'Partie du visage', length: 4, level: 2 },

    // Temps et saisons
    { word: 'JOUR', clue: 'Période de 24 heures', length: 4, level: 2 },
    { word: 'NUIT', clue: 'Période d\'obscurité', length: 4, level: 2 },
    { word: 'MOIS', clue: 'Période de 30 jours', length: 4, level: 2 },
    { word: 'WEEK', clue: 'Semaine (anglais)', length: 4, level: 2 },
    { word: 'HEUR', clue: 'Unité de temps', length: 4, level: 2 },
    { word: 'MARS', clue: 'Troisième mois', length: 4, level: 2 },
    { word: 'JUIN', clue: 'Sixième mois', length: 4, level: 2 },
    { word: 'AOUT', clue: 'Huitième mois', length: 4, level: 2 },
    { word: 'SEPT', clue: 'Neuvième mois', length: 4, level: 2 },
    { word: 'FEVR', clue: 'Deuxième mois', length: 4, level: 2 },

    // Maison et objets
    { word: 'TOIT', clue: 'Couverture d\'une maison', length: 4, level: 2 },
    { word: 'COIN', clue: 'Angle d\'un lieu', length: 4, level: 2 },
    { word: 'DOOR', clue: 'Entrée (anglais)', length: 4, level: 2 },
    { word: 'WALL', clue: 'Mur (anglais)', length: 4, level: 2 },
    { word: 'ROOM', clue: 'Pièce (anglais)', length: 4, level: 2 },
    { word: 'LAMP', clue: 'Source de lumière', length: 4, level: 2 },
    { word: 'SOFA', clue: 'Siège confortable', length: 4, level: 2 },
    { word: 'DESK', clue: 'Bureau (anglais)', length: 4, level: 2 },
    { word: 'CLEF', clue: 'Objet pour ouvrir', length: 4, level: 2 },
    { word: 'SERF', clue: 'Fermeture', length: 4, level: 2 },

    // Sentiments et émotions
    { word: 'JOIE', clue: 'Sentiment de bonheur', length: 4, level: 2 },
    { word: 'PEUR', clue: 'Sentiment d\'effroi', length: 4, level: 2 },
    { word: 'LOVE', clue: 'Amour (anglais)', length: 4, level: 2 },
    { word: 'HATE', clue: 'Haine (anglais)', length: 4, level: 2 },
    { word: 'HOPE', clue: 'Espoir (anglais)', length: 4, level: 2 },
    { word: 'RAGE', clue: 'Colère intense', length: 4, level: 2 },
    { word: 'CALM', clue: 'Tranquille', length: 4, level: 2 },
    { word: 'PAIX', clue: 'Absence de guerre', length: 4, level: 2 },
    { word: 'RIRE', clue: 'Expression de joie', length: 4, level: 2 },
    { word: 'PLEU', clue: 'Verser des larmes', length: 4, level: 2 },

    // Actions courantes (4 lettres)
    { word: 'DIRE', clue: 'Exprimer par la parole', length: 4, level: 2 },
    { word: 'LIRE', clue: 'Déchiffrer un texte', length: 4, level: 2 },
    { word: 'TIRE', clue: 'Action de tirer', length: 4, level: 2 },
    { word: 'FIRE', clue: 'Tirer (anglais)', length: 4, level: 2 },
    { word: 'WIRE', clue: 'Fil métallique', length: 4, level: 2 },
    { word: 'HIRE', clue: 'Embaucher (anglais)', length: 4, level: 2 },
    { word: 'CARE', clue: 'Soin, attention', length: 4, level: 2 },
    { word: 'DARE', clue: 'Oser', length: 4, level: 2 },
    { word: 'RARE', clue: 'Peu commun', length: 4, level: 2 },
    { word: 'MARE', clue: 'Petite étendue d\'eau', length: 4, level: 2 },

    // Couleurs et descriptions
    { word: 'ROSE', clue: 'Fleur parfumée', length: 4, level: 2 },
    { word: 'BLEU', clue: 'Couleur du ciel', length: 4, level: 2 },
    { word: 'VERT', clue: 'Couleur de l\'herbe', length: 4, level: 2 },
    { word: 'NOIR', clue: 'Couleur sombre', length: 4, level: 2 },
    { word: 'GRIS', clue: 'Couleur entre blanc et noir', length: 4, level: 2 },
    { word: 'BEAU', clue: 'Agréable à voir', length: 4, level: 2 },
    { word: 'LAID', clue: 'Désagréable à voir', length: 4, level: 2 },
    { word: 'LONG', clue: 'De grande longueur', length: 4, level: 2 },
    { word: 'GROS', clue: 'De grande taille', length: 4, level: 2 },
    { word: 'FINE', clue: 'Mince et délicat', length: 4, level: 2 },

    // Famille
    { word: 'FILS', clue: 'Descendant mâle', length: 4, level: 2 },
    { word: 'FLLE', clue: 'Descendante femelle', length: 4, level: 2 },
    { word: 'PERE', clue: 'Parent masculin', length: 4, level: 2 },
    { word: 'MERE', clue: 'Parent féminin', length: 4, level: 2 },
    { word: 'FRRE', clue: 'Fils des mêmes parents', length: 4, level: 2 },
    { word: 'SOEU', clue: 'Fille des mêmes parents', length: 4, level: 2 },
    { word: 'ONCL', clue: 'Frère des parents', length: 4, level: 2 },
    { word: 'TANT', clue: 'Sœur des parents', length: 4, level: 2 },
    { word: 'NEVU', clue: 'Fils du frère/sœur', length: 4, level: 2 },
    { word: 'MICE', clue: 'Fille du frère/sœur', length: 4, level: 2 },

    // ===== NIVEAU 3 - Mots de 3-5 lettres (400+ mots) =====
    
    // Mots de 5 lettres avec voyelles multiples
    { word: 'CHIEN', clue: 'Meilleur ami de l\'homme', length: 5, level: 3 },
    { word: 'FLEUR', clue: 'Partie colorée d\'une plante', length: 5, level: 3 },
    { word: 'LIVRE', clue: 'Objet fait de pages reliées', length: 5, level: 3 },
    { word: 'TABLE', clue: 'Meuble avec un plateau', length: 5, level: 3 },
    { word: 'MONDE', clue: 'Planète Terre', length: 5, level: 3 },
    { word: 'TEMPS', clue: 'Durée des événements', length: 5, level: 3 },
    { word: 'VILLE', clue: 'Grande agglomération urbaine', length: 5, level: 3 },
    { word: 'ROUGE', clue: 'Couleur du sang', length: 5, level: 3 },
    { word: 'BLANC', clue: 'Couleur de la neige', length: 5, level: 3 },
    { word: 'GRAND', clue: 'De grande taille', length: 5, level: 3 },
    { word: 'PETIT', clue: 'De petite taille', length: 5, level: 3 },
    { word: 'COURT', clue: 'De faible longueur', length: 5, level: 3 },
    { word: 'RICHE', clue: 'Qui a beaucoup d\'argent', length: 5, level: 3 },
    { word: 'PAUVRE', clue: 'Qui manque d\'argent', length: 6, level: 3 },
    { word: 'PIANO', clue: 'Instrument de musique', length: 5, level: 3 },
    { word: 'RADIO', clue: 'Appareil de diffusion', length: 5, level: 3 },
    { word: 'VIDEO', clue: 'Enregistrement visuel', length: 5, level: 3 },
    { word: 'AUDIO', clue: 'Son enregistré', length: 5, level: 3 },
    { word: 'PHOTO', clue: 'Image photographique', length: 5, level: 3 },
    { word: 'METRO', clue: 'Transport souterrain', length: 5, level: 3 },

    // Mots avec terminaisons fréquentes -ER
    { word: 'RIVER', clue: 'Cours d\'eau', length: 5, level: 3 },
    { word: 'LEVER', clue: 'Se mettre debout', length: 5, level: 3 },
    { word: 'NEVER', clue: 'Jamais (anglais)', length: 5, level: 3 },
    { word: 'PAPER', clue: 'Papier (anglais)', length: 5, level: 3 },
    { word: 'WATER', clue: 'Eau (anglais)', length: 5, level: 3 },
    { word: 'TIGER', clue: 'Grand félin rayé', length: 5, level: 3 },
    { word: 'SUPER', clue: 'Extraordinaire', length: 5, level: 3 },
    { word: 'CYBER', clue: 'Relatif à internet', length: 5, level: 3 },
    { word: 'LASER', clue: 'Rayon lumineux', length: 5, level: 3 },
    { word: 'FIBER', clue: 'Fibre (anglais)', length: 5, level: 3 },

    // Mots avec terminaisons -AR/-OR
    { word: 'CLEAR', clue: 'Clair (anglais)', length: 5, level: 3 },
    { word: 'SOLAR', clue: 'Relatif au soleil', length: 5, level: 3 },
    { word: 'POLAR', clue: 'Relatif aux pôles', length: 5, level: 3 },
    { word: 'SUGAR', clue: 'Sucre (anglais)', length: 5, level: 3 },
    { word: 'LUNAR', clue: 'Relatif à la lune', length: 5, level: 3 },
    { word: 'MAJOR', clue: 'Important', length: 5, level: 3 },
    { word: 'MINOR', clue: 'Moins important', length: 5, level: 3 },
    { word: 'HONOR', clue: 'Honneur (anglais)', length: 5, level: 3 },
    { word: 'HUMOR', clue: 'Humour (anglais)', length: 5, level: 3 },
    { word: 'TUMOR', clue: 'Tumeur (anglais)', length: 5, level: 3 },

    // Mots avec terminaisons -AL/-EL
    { word: 'METAL', clue: 'Matériau dur', length: 5, level: 3 },
    { word: 'TOTAL', clue: 'Complet', length: 5, level: 3 },
    { word: 'LEGAL', clue: 'Conforme à la loi', length: 5, level: 3 },
    { word: 'EQUAL', clue: 'Égal (anglais)', length: 5, level: 3 },
    { word: 'ROYAL', clue: 'Relatif au roi', length: 5, level: 3 },
    { word: 'LOYAL', clue: 'Fidèle', length: 5, level: 3 },
    { word: 'CORAL', clue: 'Animal marin', length: 5, level: 3 },
    { word: 'MEDAL', clue: 'Récompense', length: 5, level: 3 },
    { word: 'PEDAL', clue: 'Levier du pied', length: 5, level: 3 },
    { word: 'CANAL', clue: 'Voie d\'eau artificielle', length: 5, level: 3 },

    // Mots avec S multiples (très utiles)
    { word: 'SEVEN', clue: 'Sept (anglais)', length: 5, level: 3 },
    { word: 'SENSE', clue: 'Sens (anglais)', length: 5, level: 3 },
    { word: 'SMILE', clue: 'Sourire (anglais)', length: 5, level: 3 },
    { word: 'SMOKE', clue: 'Fumée (anglais)', length: 5, level: 3 },
    { word: 'SNAKE', clue: 'Serpent (anglais)', length: 5, level: 3 },
    { word: 'SPACE', clue: 'Espace (anglais)', length: 5, level: 3 },
    { word: 'SPICE', clue: 'Épice (anglais)', length: 5, level: 3 },
    { word: 'SPIKE', clue: 'Pointe (anglais)', length: 5, level: 3 },
    { word: 'SPINE', clue: 'Colonne vertébrale', length: 5, level: 3 },
    { word: 'SPLIT', clue: 'Diviser (anglais)', length: 5, level: 3 },

    // Mots courts très connecteurs (3-4 lettres niveau 3)
    { word: 'ARE', clue: 'Être (anglais pluriel)', length: 3, level: 3 },
    { word: 'OUR', clue: 'Notre (anglais)', length: 3, level: 3 },
    { word: 'SEE', clue: 'Voir (anglais)', length: 3, level: 3 },
    { word: 'TEE', clue: 'T-shirt', length: 3, level: 3 },
    { word: 'BEE', clue: 'Abeille (anglais)', length: 3, level: 3 },
    { word: 'FEE', clue: 'Frais (anglais)', length: 3, level: 3 },
    { word: 'LEE', clue: 'Côté abrité', length: 3, level: 3 },
    { word: 'PEE', clue: 'Uriner (familier)', length: 3, level: 3 },
    { word: 'WEE', clue: 'Petit (anglais)', length: 3, level: 3 },
    { word: 'HEE', clue: 'Exclamation', length: 3, level: 3 },

    // Mots avec double voyelles (très connecteurs)
    { word: 'TREE', clue: 'Arbre (anglais)', length: 4, level: 3 },
    { word: 'FREE', clue: 'Libre (anglais)', length: 4, level: 3 },
    { word: 'FLEE', clue: 'Fuir (anglais)', length: 4, level: 3 },
    { word: 'KNEE', clue: 'Genou (anglais)', length: 4, level: 3 },
    { word: 'THEE', clue: 'Toi (anglais ancien)', length: 4, level: 3 },
    { word: 'DEED', clue: 'Action (anglais)', length: 4, level: 3 },
    { word: 'FEED', clue: 'Nourrir (anglais)', length: 4, level: 3 },
    { word: 'NEED', clue: 'Besoin (anglais)', length: 4, level: 3 },
    { word: 'REED', clue: 'Roseau (anglais)', length: 4, level: 3 },
    { word: 'SEED', clue: 'Graine (anglais)', length: 4, level: 3 },

    // Mots techniques et modernes
    { word: 'ROBOT', clue: 'Machine automatique', length: 5, level: 3 },
    { word: 'CLOUD', clue: 'Nuage (anglais)', length: 5, level: 3 },
    { word: 'SMART', clue: 'Intelligent (anglais)', length: 5, level: 3 },
    { word: 'DIGIT', clue: 'Chiffre', length: 5, level: 3 },
    { word: 'VIRUS', clue: 'Microbe informatique', length: 5, level: 3 },
    { word: 'PIXEL', clue: 'Point d\'image', length: 5, level: 3 },
    { word: 'MOUSE', clue: 'Souris d\'ordinateur', length: 5, level: 3 },
    { word: 'CLICK', clue: 'Clic de souris', length: 5, level: 3 },
    { word: 'LOGIN', clue: 'Connexion', length: 5, level: 3 },
    { word: 'EMAIL', clue: 'Courrier électronique', length: 5, level: 3 }
  ];

  const getGridSize = (level: Difficulty): number => {
    const sizes = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 13 };
    return sizes[level];
  };

  const getTargetWordCount = (level: Difficulty): number => {
    const targets = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 30 };
    return targets[level];
  };

  const getWordsForLevel = (level: Difficulty): WordData[] => {
    return wordsDatabase.filter(w => w.level === level);
  };

  const createEmptyGrid = (size: number): Grid => {
    const newGrid = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        letter: '',
        correctLetter: '',
        isBlack: true,
        isEditable: false,
        wordIds: []
      }))
    );

    gridRefs.current = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => React.createRef<HTMLInputElement>())
    );

    return newGrid;
  };

  const copyGrid = (grid: Grid): Grid => {
    return grid.map(row => row.map(cell => ({ ...cell, wordIds: [...(cell.wordIds || [])] })));
  };

  const findAllIntersections = (word1: string, word2: string): IntersectionPoint[] => {
    const intersections: IntersectionPoint[] = [];
    for (let i = 0; i < word1.length; i++) {
      for (let j = 0; j < word2.length; j++) {
        if (word1[i] === word2[j]) {
          // Score basé sur la position (centre = meilleur score)
          const centerScore1 = Math.abs(i - word1.length / 2);
          const centerScore2 = Math.abs(j - word2.length / 2);
          const score = 10 - (centerScore1 + centerScore2);
          
          intersections.push({
            word1Index: i,
            word2Index: j,
            pos1: i,
            pos2: j,
            score: Math.max(1, score)
          });
        }
      }
    }
    return intersections.sort((a, b) => b.score - a.score);
  };

  const isValidPlacement = (
    grid: Grid,
    word: string,
    row: number,
    col: number,
    direction: Direction,
    size: number,
    allowAdjacent: boolean = true
  ): boolean => {
    // Vérification des limites de base
    if (direction === 'horizontal') {
      if (col + word.length > size || row < 0 || row >= size || col < 0) return false;
    } else {
      if (row + word.length > size || col < 0 || col >= size || row < 0) return false;
    }

    // Vérifier chaque position du mot
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'horizontal' ? row : row + i;
      const currentCol = direction === 'horizontal' ? col + i : col;
      
      if (currentRow < 0 || currentRow >= size || currentCol < 0 || currentCol >= size) {
        return false;
      }
      
      const cell = grid[currentRow][currentCol];
      if (!cell) return false;

      // Si la cellule a déjà une lettre différente
      if (cell.correctLetter && cell.correctLetter !== word[i]) {
        return false;
      }
    }

    // Vérification plus souple de l'adjacence pour permettre plus de mots
    if (allowAdjacent) {
      // Permettre les mots adjacents séparés par au moins 1 case
      const checkRow = direction === 'horizontal' ? row - 1 : row;
      const checkCol = direction === 'horizontal' ? col : col - 1;
      
      if (checkRow >= 0 && checkRow < size && checkCol >= 0 && checkCol < size) {
        const beforeCell = grid[checkRow][checkCol];
        if (beforeCell && beforeCell.correctLetter && !beforeCell.isBlack) {
          // Vérifier s'il y a au moins une intersection
          let hasIntersection = false;
          for (let i = 0; i < word.length; i++) {
            const currentRow = direction === 'horizontal' ? row : row + i;
            const currentCol = direction === 'horizontal' ? col + i : col;
            if (grid[currentRow][currentCol].correctLetter) {
              hasIntersection = true;
              break;
            }
          }
          if (!hasIntersection) return false;
        }
      }
    }

    return true;
  };

  const placeWord = (
    grid: Grid,
    word: string,
    row: number,
    col: number,
    direction: Direction,
    wordId: number
  ): void => {
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'horizontal' ? row : row + i;
      const currentCol = direction === 'horizontal' ? col + i : col;
      
      grid[currentRow][currentCol].correctLetter = word[i];
      grid[currentRow][currentCol].isBlack = false;
      grid[currentRow][currentCol].isEditable = true;
      
      if (!grid[currentRow][currentCol].wordIds) {
        grid[currentRow][currentCol].wordIds = [];
      }
      if (!grid[currentRow][currentCol].wordIds!.includes(wordId)) {
        grid[currentRow][currentCol].wordIds!.push(wordId);
      }
    }

    // Marquer le début du mot
    grid[row][col].hasArrow = true;
    grid[row][col].arrowDirection = direction;
    grid[row][col].wordNumber = wordId;
  };

  const calculateGridDensity = (grid: Grid): number => {
    let filledCells = 0;
    let totalCells = grid.length * grid[0].length;
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (!grid[i][j].isBlack) filledCells++;
      }
    }
    
    return filledCells / totalCells;
  };

  const generateCrosswordGrid = (level: Difficulty): { grid: Grid, placedWords: PlacedWord[] } => {
    const size = getGridSize(level);
    const availableWords = getWordsForLevel(level);
    const targetWords = getTargetWordCount(level);
    
    console.log(`🎯 Phase 1 enrichie - Objectif: ${targetWords} mots pour une grille ${size}x${size} niveau ${level}`);
    console.log(`📚 Mots disponibles: ${availableWords.length} pour le niveau ${level}`);

    let bestResult = { grid: createEmptyGrid(size), placedWords: [] as PlacedWord[] };
    let maxWordsPlaced = 0;

    // Augmentation du nombre de tentatives avec la base enrichie
    const maxAttempts = level >= 3 ? 20 : 15;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`🚀 Tentative ${attempt + 1}/${maxAttempts}`);
      
      // Trier les mots pour optimiser les intersections
      const sortedWords = [...availableWords].sort((a, b) => {
        // Privilégier les mots courts avec beaucoup de voyelles communes
        const vowels = 'AEIOU';
        const aVowels = a.word.split('').filter(c => vowels.includes(c)).length;
        const bVowels = b.word.split('').filter(c => vowels.includes(c)).length;
        
        if (aVowels !== bVowels) return bVowels - aVowels;
        if (a.length !== b.length) return a.length - b.length;
        return Math.random() - 0.5;
      });
      
      const newGrid = createEmptyGrid(size);
      const placedWords: PlacedWord[] = [];
      const gridStates: GridState[] = [];

      // Placer le premier mot au centre
      if (sortedWords.length > 0) {
        const firstWord = sortedWords[0];
        const startRow = Math.floor(size / 2);
        const startCol = Math.floor((size - firstWord.length) / 2);

        if (isValidPlacement(newGrid, firstWord.word, startRow, startCol, 'horizontal', size)) {
          placeWord(newGrid, firstWord.word, startRow, startCol, 'horizontal', 1);
          placedWords.push({
            id: 1,
            word: firstWord.word,
            clue: firstWord.clue,
            startRow,
            startCol,
            direction: 'horizontal',
            length: firstWord.length
          });
          
          gridStates.push({
            grid: copyGrid(newGrid),
            placedWords: [...placedWords]
          });
          
          console.log(`✅ Premier mot placé: ${firstWord.word} (${firstWord.length} lettres)`);
        }
      }

      // Placer les mots suivants avec backtracking intelligent
      let wordIndex = 1;
      let backtrackCount = 0;
      const maxBacktrack = 8;

      while (wordIndex < sortedWords.length && placedWords.length < targetWords && backtrackCount < maxBacktrack) {
        const currentWord = sortedWords[wordIndex];
        let wordPlaced = false;
        let bestPlacements: Array<{
          row: number;
          col: number;
          direction: Direction;
          score: number;
          intersections: number;
        }> = [];

        // Rechercher toutes les intersections possibles avec tous les mots placés
        for (const existingWord of placedWords) {
          const intersections = findAllIntersections(existingWord.word, currentWord.word);
          
          for (const intersection of intersections) {
            const newDirection: Direction = existingWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
            
            let newRow, newCol;
            if (existingWord.direction === 'horizontal') {
              newRow = existingWord.startRow - intersection.pos2;
              newCol = existingWord.startCol + intersection.pos1;
            } else {
              newRow = existingWord.startRow + intersection.pos1;
              newCol = existingWord.startCol - intersection.pos2;
            }

            if (isValidPlacement(newGrid, currentWord.word, newRow, newCol, newDirection, size, true)) {
              // Calculer le score de ce placement
              let intersectionCount = 0;
              for (let i = 0; i < currentWord.word.length; i++) {
                const checkRow = newDirection === 'horizontal' ? newRow : newRow + i;
                const checkCol = newDirection === 'horizontal' ? newCol + i : newCol;
                if (newGrid[checkRow][checkCol].correctLetter) {
                  intersectionCount++;
                }
              }
              
              const densityScore = calculateGridDensity(newGrid);
              const positionScore = Math.abs(newRow - size/2) + Math.abs(newCol - size/2);
              const vowelBonus = currentWord.word.split('').filter(c => 'AEIOU'.includes(c)).length;
              const totalScore = intersection.score + intersectionCount * 5 + densityScore * 3 + vowelBonus * 2 - positionScore * 0.1;

              bestPlacements.push({
                row: newRow,
                col: newCol,
                direction: newDirection,
                score: totalScore,
                intersections: intersectionCount
              });
            }
          }
        }

        // Trier les placements par score et essayer le meilleur
        bestPlacements.sort((a, b) => b.score - a.score);
        
        if (bestPlacements.length > 0) {
          const bestPlacement = bestPlacements[0];
          
          placeWord(newGrid, currentWord.word, bestPlacement.row, bestPlacement.col, bestPlacement.direction, placedWords.length + 1);
          placedWords.push({
            id: placedWords.length + 1,
            word: currentWord.word,
            clue: currentWord.clue,
            startRow: bestPlacement.row,
            startCol: bestPlacement.col,
            direction: bestPlacement.direction,
            length: currentWord.length
          });
          
          // Sauvegarder l'état pour le backtracking
          if (placedWords.length % 3 === 0) {
            gridStates.push({
              grid: copyGrid(newGrid),
              placedWords: [...placedWords]
            });
          }
          
          console.log(`✅ Mot ${placedWords.length} placé: ${currentWord.word} (score: ${bestPlacement.score.toFixed(1)}, intersections: ${bestPlacement.intersections})`);
          wordPlaced = true;
        }

        if (!wordPlaced) {
          // Backtracking si on est bloqué
          if (gridStates.length > 1 && backtrackCount < maxBacktrack) {
            console.log(`🔄 Backtracking - retour à ${gridStates[gridStates.length - 2].placedWords.length} mots`);
            const previousState = gridStates[gridStates.length - 2];
            
            // Restaurer l'état précédent
            for (let i = 0; i < size; i++) {
              for (let j = 0; j < size; j++) {
                newGrid[i][j] = { ...previousState.grid[i][j], wordIds: [...(previousState.grid[i][j].wordIds || [])] };
              }
            }
            
            placedWords.length = 0;
            placedWords.push(...previousState.placedWords.map(w => ({ ...w })));
            
            gridStates.pop();
            backtrackCount++;
            wordIndex = placedWords.length; // Reprendre après le dernier mot placé
            continue;
          }
        }

        wordIndex++;
      }

      console.log(`📊 Tentative ${attempt + 1}: ${placedWords.length} mots placés (densité: ${(calculateGridDensity(newGrid) * 100).toFixed(1)}%) - Base: ${availableWords.length} mots`);

      if (placedWords.length > maxWordsPlaced) {
        maxWordsPlaced = placedWords.length;
        bestResult = { 
          grid: copyGrid(newGrid), 
          placedWords: [...placedWords] 
        };
      }

      // Si on atteint l'objectif, on peut s'arrêter
      if (placedWords.length >= targetWords * 0.85) {
        console.log(`🎉 Objectif largement atteint: ${placedWords.length}/${targetWords} mots`);
        break;
      }
    }

    console.log(`🏆 Résultat final Phase 1: ${bestResult.placedWords.length} mots (objectif: ${targetWords}) avec ${availableWords.length} mots disponibles`);
    return bestResult;
  };

  const generateNewGame = () => {
    const { grid: newGrid, placedWords } = generateCrosswordGrid(difficulty);
    setGrid(newGrid);
    setWords(placedWords);
    setGameCompleted(false);
    setShowSolution(false);
    setSelectedWord(null);
    setCurrentPosition(null);
  };

  const handleCellInput = (row: number, col: number, value: string) => {
    if (!grid[row][col].isEditable || showSolution) return;
    
    const letter = value.toUpperCase().replace(/[^A-Z]/g, '');
    if (letter.length > 1) return;

    const newGrid = [...grid];
    newGrid[row][col].letter = letter;
    setGrid(newGrid);

    // Navigation automatique
    if (letter && selectedWord) {
      const word = words.find(w => w.id === selectedWord);
      if (word) {
        moveToNextCell(row, col, word.direction);
      }
    }

    checkCompletion(newGrid);
  };

  const moveToNextCell = (currentRow: number, currentCol: number, direction: Direction) => {
    const nextRow = direction === 'horizontal' ? currentRow : currentRow + 1;
    const nextCol = direction === 'horizontal' ? currentCol + 1 : currentCol;

    if (nextRow < grid.length && nextCol < grid[0].length && 
        grid[nextRow][nextCol].isEditable) {
      setCurrentPosition({ row: nextRow, col: nextCol });
      setTimeout(() => {
        const inputRef = gridRefs.current[nextRow][nextCol];
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.wordIds && cell.wordIds.length > 0) {
      setSelectedWord(cell.wordIds[0]);
      setCurrentPosition({ row, col });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveWithArrow(row, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveWithArrow(row, col + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveWithArrow(row - 1, col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveWithArrow(row + 1, col);
        break;
    }
  };

  const moveWithArrow = (newRow: number, newCol: number) => {
    if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length && 
        grid[newRow][newCol].isEditable) {
      setCurrentPosition({ row: newRow, col: newCol });
      setTimeout(() => {
        const inputRef = gridRefs.current[newRow][newCol];
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const checkCompletion = (currentGrid: Grid) => {
    const allCorrect = words.every(word => {
      for (let i = 0; i < word.length; i++) {
        const row = word.direction === 'horizontal' ? word.startRow : word.startRow + i;
        const col = word.direction === 'horizontal' ? word.startCol + i : word.startCol;
        if (currentGrid[row][col].letter !== currentGrid[row][col].correctLetter) {
          return false;
        }
      }
      return true;
    });

    if (allCorrect && words.length > 0) {
      setGameCompleted(true);
    }
  };

  const revealSolution = () => {
    const newGrid = [...grid];
    for (let i = 0; i < newGrid.length; i++) {
      for (let j = 0; j < newGrid[i].length; j++) {
        if (newGrid[i][j].isEditable) {
          newGrid[i][j].letter = newGrid[i][j].correctLetter;
        }
      }
    }
    setGrid(newGrid);
    setShowSolution(true);
    setGameCompleted(true);
  };

  const renderCell = (row: number, col: number) => {
    const cell = grid[row][col];
    
    if (cell.isBlack) {
      return (
        <div
          key={`${row}-${col}`}
          className="w-12 h-12 bg-gray-800 border border-gray-600"
        />
      );
    }

    const isHighlighted = selectedWord && cell.wordIds && cell.wordIds.includes(selectedWord);
    const isCurrent = currentPosition?.row === row && currentPosition?.col === col;

    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-12 h-12 border border-gray-400 relative flex items-center justify-center cursor-pointer
          ${cell.isEditable ? 'bg-white' : 'bg-gray-100'}
          ${isHighlighted ? 'bg-yellow-200 border-yellow-400 border-2' : ''}
          ${isCurrent ? 'bg-blue-200 border-blue-500 border-2' : ''}
          ${showSolution && cell.letter === cell.correctLetter ? 'text-red-600' : ''}
        `}
        onClick={() => handleCellClick(row, col)}
      >
        {cell.hasArrow && (
          <div className="absolute top-0 left-0 text-xs font-bold text-blue-600">
            {cell.wordNumber}
            {cell.arrowDirection === 'horizontal' ? (
              <ArrowRight className="w-3 h-3 inline ml-1" />
            ) : (
              <ArrowDown className="w-3 h-3 inline ml-1" />
            )}
          </div>
        )}
        {cell.isEditable ? (
          <Input
            ref={gridRefs.current[row] ? gridRefs.current[row][col] : null}
            type="text"
            value={cell.letter}
            onChange={(e) => handleCellInput(row, col, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, row, col)}
            onFocus={() => setCurrentPosition({ row, col })}
            className="w-full h-full border-0 text-center text-sm font-bold p-0 bg-transparent focus:ring-0 focus:outline-none"
            maxLength={1}
            disabled={showSolution}
          />
        ) : (
          <span className="text-sm font-bold">{cell.letter}</span>
        )}
      </div>
    );
  };

  const horizontalWords = words.filter(w => w.direction === 'horizontal');
  const verticalWords = words.filter(w => w.direction === 'vertical');

  useEffect(() => {
    generateNewGame();
  }, [difficulty]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <Puzzle className="w-8 h-8 text-indigo-600 mr-3" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Mots Fléchés - Phase 1 Enrichie
                </h1>
                <Trophy className="w-8 h-8 text-yellow-500 ml-3" />
              </div>
              <p className="text-gray-600 text-lg">
                Remplissez la grille en suivant les flèches et les définitions
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {words.length} mots à deviner • Base enrichie de {getWordsForLevel(difficulty).length} mots niveau {difficulty}
              </p>
            </div>
          </div>

          {/* Controls */}
          <Card className="mb-8 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
              <CardTitle className="text-2xl text-gray-800 flex items-center justify-between">
                <span>Contrôles</span>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Niveau {difficulty} - {words.length} mots
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-bold text-gray-700">Difficulté :</label>
                  <Select value={difficulty.toString()} onValueChange={(value) => setDifficulty(parseInt(value) as Difficulty)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Niveau 1 - Très facile</SelectItem>
                      <SelectItem value="2">Niveau 2 - Facile</SelectItem>
                      <SelectItem value="3">Niveau 3 - Moyen</SelectItem>
                      <SelectItem value="4">Niveau 4 - Difficile</SelectItem>
                      <SelectItem value="5">Niveau 5 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={generateNewGame} className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Nouveau jeu</span>
                </Button>

                <Button onClick={revealSolution} variant="outline" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Afficher solution</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Grille */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
                  <CardTitle className="text-xl text-center">
                    Grille {getGridSize(difficulty)}×{getGridSize(difficulty)} - {words.length} mots
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 flex justify-center">
                  <div 
                    className="grid gap-1 border-2 border-gray-800 bg-white rounded-lg overflow-hidden"
                    style={{ gridTemplateColumns: `repeat(${getGridSize(difficulty)}, minmax(0, 1fr))` }}
                  >
                    {grid.map((row, rowIndex) =>
                      row.map((_, colIndex) => renderCell(rowIndex, colIndex))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Définitions */}
            <div>
              <Card className="shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
                  <CardTitle className="text-xl flex items-center">
                    <HelpCircle className="w-5 h-5 mr-2" />
                    Définitions ({words.length} mots)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {horizontalWords.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center">
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Horizontaux ({horizontalWords.length})
                        </h3>
                        <div className="space-y-2">
                          {horizontalWords.map((word) => (
                            <div
                              key={word.id}
                              className={`p-2 rounded cursor-pointer transition-colors ${
                                selectedWord === word.id ? 'bg-yellow-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedWord(word.id)}
                            >
                              <span className="font-bold text-blue-600">{word.id}.</span> {word.clue}
                              <span className="text-xs text-gray-500 ml-2">({word.length} lettres)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {verticalWords.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center">
                          <ArrowDown className="w-4 h-4 mr-1" />
                          Verticaux ({verticalWords.length})
                        </h3>
                        <div className="space-y-2">
                          {verticalWords.map((word) => (
                            <div
                              key={word.id}
                              className={`p-2 rounded cursor-pointer transition-colors ${
                                selectedWord === word.id ? 'bg-yellow-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedWord(word.id)}
                            >
                              <span className="font-bold text-blue-600">{word.id}.</span> {word.clue}
                              <span className="text-xs text-gray-500 ml-2">({word.length} lettres)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Message de victoire */}
          {gameCompleted && !showSolution && (
            <Card className="mt-8 bg-gradient-to-r from-green-100 to-emerald-100 shadow-2xl">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-4">
                    Félicitations !
                  </h2>
                  <p className="text-green-700 text-lg">
                    Vous avez résolu tous les {words.length} mots fléchés !
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrosswordBoard;
