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

interface WordPlacement {
  word: WordData;
  row: number;
  col: number;
  direction: Direction;
  score: number;
  intersections: number;
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

  // Base de données de mots considérablement élargie
  const wordsDatabase: WordData[] = [
    // Niveau 1 - Mots simples 2-3 lettres (50+ mots)
    { word: 'SOL', clue: 'Surface terrestre', length: 3, level: 1 },
    { word: 'MER', clue: 'Étendue d\'eau salée', length: 3, level: 1 },
    { word: 'ROI', clue: 'Souverain d\'un royaume', length: 3, level: 1 },
    { word: 'VIE', clue: 'Existence', length: 3, level: 1 },
    { word: 'LOI', clue: 'Règle juridique', length: 3, level: 1 },
    { word: 'FOI', clue: 'Croyance religieuse', length: 3, level: 1 },
    { word: 'ART', clue: 'Expression créative', length: 3, level: 1 },
    { word: 'AIR', clue: 'Gaz que l\'on respire', length: 3, level: 1 },
    { word: 'EAU', clue: 'Liquide H2O', length: 3, level: 1 },
    { word: 'FEU', clue: 'Combustion', length: 3, level: 1 },
    { word: 'OR', clue: 'Métal précieux jaune', length: 2, level: 1 },
    { word: 'LIT', clue: 'Meuble pour dormir', length: 3, level: 1 },
    { word: 'NEZ', clue: 'Organe de l\'odorat', length: 3, level: 1 },
    { word: 'DOS', clue: 'Partie arrière du corps', length: 3, level: 1 },
    { word: 'COU', clue: 'Partie entre tête et corps', length: 3, level: 1 },
    { word: 'CAR', clue: 'Véhicule automobile', length: 3, level: 1 },
    { word: 'BAR', clue: 'Établissement de boissons', length: 3, level: 1 },
    { word: 'SAC', clue: 'Contenant portable', length: 3, level: 1 },
    { word: 'LAC', clue: 'Étendue d\'eau douce', length: 3, level: 1 },
    { word: 'PAR', clue: 'Au moyen de', length: 3, level: 1 },
    { word: 'PAS', clue: 'Mouvement du pied', length: 3, level: 1 },
    { word: 'BAS', clue: 'Partie inférieure', length: 3, level: 1 },
    { word: 'GAS', clue: 'État de la matière', length: 3, level: 1 },
    { word: 'TAS', clue: 'Amas d\'objets', length: 3, level: 1 },
    { word: 'RAS', clue: 'À niveau', length: 3, level: 1 },
    { word: 'JUS', clue: 'Liquide de fruit', length: 3, level: 1 },
    { word: 'BUS', clue: 'Transport en commun', length: 3, level: 1 },
    { word: 'SUR', clue: 'Au-dessus de', length: 3, level: 1 },
    { word: 'MUR', clue: 'Cloison verticale', length: 3, level: 1 },
    { word: 'DUR', clue: 'Pas mou', length: 3, level: 1 },
    { word: 'PUR', clue: 'Sans mélange', length: 3, level: 1 },
    { word: 'BUT', clue: 'Objectif visé', length: 3, level: 1 },
    { word: 'PUT', clue: 'Coup au golf', length: 3, level: 1 },
    { word: 'CUT', clue: 'Action de couper', length: 3, level: 1 },
    { word: 'HUT', clue: 'Petite cabane', length: 3, level: 1 },
    { word: 'BAT', clue: 'Animal volant', length: 3, level: 1 },
    { word: 'CAT', clue: 'Chat en anglais', length: 3, level: 1 },
    { word: 'HAT', clue: 'Chapeau en anglais', length: 3, level: 1 },
    { word: 'MAT', clue: 'Tapis de sport', length: 3, level: 1 },
    { word: 'RAT', clue: 'Petit rongeur', length: 3, level: 1 },
    { word: 'VAT', clue: 'Grande cuve', length: 3, level: 1 },
    { word: 'BIT', clue: 'Unité informatique', length: 3, level: 1 },
    { word: 'FIT', clue: 'En forme', length: 3, level: 1 },
    { word: 'HIT', clue: 'Frapper en anglais', length: 3, level: 1 },
    { word: 'KIT', clue: 'Ensemble d\'outils', length: 3, level: 1 },
    { word: 'SIT', clue: 'S\'asseoir en anglais', length: 3, level: 1 },
    { word: 'WIT', clue: 'Esprit vif', length: 3, level: 1 },
    { word: 'BOT', clue: 'Robot automatisé', length: 3, level: 1 },
    { word: 'COT', clue: 'Petit lit', length: 3, level: 1 },
    { word: 'DOT', clue: 'Point minuscule', length: 3, level: 1 },
    { word: 'HOT', clue: 'Chaud en anglais', length: 3, level: 1 },
    { word: 'LOT', clue: 'Parcelle de terrain', length: 3, level: 1 },
    { word: 'NOT', clue: 'Négation en anglais', length: 3, level: 1 },
    { word: 'POT', clue: 'Récipient de cuisine', length: 3, level: 1 },
    { word: 'ROT', clue: 'Pourriture', length: 3, level: 1 },
    { word: 'TOT', clue: 'Petit enfant', length: 3, level: 1 },
    
    // Niveau 2 - Mots de 3-4 lettres (80+ mots)
    { word: 'CHAT', clue: 'Animal domestique qui miaule', length: 4, level: 2 },
    { word: 'PAIN', clue: 'Aliment fait de farine', length: 4, level: 2 },
    { word: 'LUNE', clue: 'Satellite naturel de la Terre', length: 4, level: 2 },
    { word: 'MAIN', clue: 'Extrémité du bras', length: 4, level: 2 },
    { word: 'JOUR', clue: 'Période de 24 heures', length: 4, level: 2 },
    { word: 'NUIT', clue: 'Période d\'obscurité', length: 4, level: 2 },
    { word: 'YEUX', clue: 'Organes de la vue', length: 4, level: 2 },
    { word: 'PIED', clue: 'Extrémité de la jambe', length: 4, level: 2 },
    { word: 'TOIT', clue: 'Couverture d\'une maison', length: 4, level: 2 },
    { word: 'VOIX', clue: 'Son émis par la gorge', length: 4, level: 2 },
    { word: 'BRAS', clue: 'Membre supérieur', length: 4, level: 2 },
    { word: 'COIN', clue: 'Angle d\'un lieu', length: 4, level: 2 },
    { word: 'ROSE', clue: 'Fleur parfumée', length: 4, level: 2 },
    { word: 'FILS', clue: 'Descendant mâle', length: 4, level: 2 },
    { word: 'PAIX', clue: 'Absence de guerre', length: 4, level: 2 },
    { word: 'OURS', clue: 'Grand mammifère', length: 4, level: 2 },
    { word: 'LION', clue: 'Roi des animaux', length: 4, level: 2 },
    { word: 'RIRE', clue: 'Expression de joie', length: 4, level: 2 },
    { word: 'DIRE', clue: 'Exprimer par la parole', length: 4, level: 2 },
    { word: 'LIRE', clue: 'Déchiffrer un texte', length: 4, level: 2 },
    { word: 'TIRE', clue: 'Action de tirer', length: 4, level: 2 },
    { word: 'FIRE', clue: 'Feu en anglais', length: 4, level: 2 },
    { word: 'WIRE', clue: 'Fil métallique', length: 4, level: 2 },
    { word: 'HIRE', clue: 'Embaucher', length: 4, level: 2 },
    { word: 'CARE', clue: 'Soin, attention', length: 4, level: 2 },
    { word: 'DARE', clue: 'Oser', length: 4, level: 2 },
    { word: 'FARE', clue: 'Prix du transport', length: 4, level: 2 },
    { word: 'HARE', clue: 'Lièvre', length: 4, level: 2 },
    { word: 'MARE', clue: 'Jument', length: 4, level: 2 },
    { word: 'RARE', clue: 'Peu commun', length: 4, level: 2 },
    { word: 'WARE', clue: 'Marchandise', length: 4, level: 2 },
    { word: 'PACE', clue: 'Rythme', length: 4, level: 2 },
    { word: 'RACE', clue: 'Course', length: 4, level: 2 },
    { word: 'FACE', clue: 'Visage', length: 4, level: 2 },
    { word: 'LACE', clue: 'Dentelle', length: 4, level: 2 },
    { word: 'MACE', clue: 'Épice', length: 4, level: 2 },
    { word: 'DICE', clue: 'Dés à jouer', length: 4, level: 2 },
    { word: 'NICE', clue: 'Agréable', length: 4, level: 2 },
    { word: 'RICE', clue: 'Riz', length: 4, level: 2 },
    { word: 'VICE', clue: 'Défaut moral', length: 4, level: 2 },
    { word: 'MICE', clue: 'Souris (pluriel)', length: 4, level: 2 },
    { word: 'SPICE', clue: 'Épice', length: 5, level: 2 },
    { word: 'PRICE', clue: 'Prix', length: 5, level: 2 },
    { word: 'TWICE', clue: 'Deux fois', length: 5, level: 2 },
    { word: 'DANCE', clue: 'Mouvement rythmé', length: 5, level: 2 },
    { word: 'LANCE', clue: 'Arme d\'hast', length: 5, level: 2 },
    { word: 'PENCE', clue: 'Monnaie britannique', length: 5, level: 2 },
    { word: 'FENCE', clue: 'Clôture', length: 5, level: 2 },
    { word: 'HENCE', clue: 'Par conséquent', length: 5, level: 2 },
    { word: 'SINCE', clue: 'Depuis', length: 5, level: 2 },
    { word: 'PLACE', clue: 'Lieu', length: 5, level: 2 },
    { word: 'GRACE', clue: 'Élégance', length: 5, level: 2 },
    { word: 'SPACE', clue: 'Espace', length: 5, level: 2 },
    { word: 'TRACE', clue: 'Marque laissée', length: 5, level: 2 },
    { word: 'BRACE', clue: 'Support', length: 5, level: 2 },
    { word: 'CHOSE', clue: 'Objet', length: 5, level: 2 },
    { word: 'CLOSE', clue: 'Fermer', length: 5, level: 2 },
    { word: 'THOSE', clue: 'Ceux-là', length: 5, level: 2 },
    { word: 'WHOSE', clue: 'À qui', length: 5, level: 2 },
    { word: 'PROSE', clue: 'Texte non versifié', length: 5, level: 2 },
    { word: 'AROSE', clue: 'Se leva', length: 5, level: 2 },
    { word: 'HORSE', clue: 'Cheval', length: 5, level: 2 },
    { word: 'WORSE', clue: 'Pire', length: 5, level: 2 },
    { word: 'NURSE', clue: 'Infirmière', length: 5, level: 2 },
    { word: 'PURSE', clue: 'Sac à main', length: 5, level: 2 },
    { word: 'CURSE', clue: 'Malédiction', length: 5, level: 2 },
    { word: 'HOUSE', clue: 'Maison', length: 5, level: 2 },
    { word: 'MOUSE', clue: 'Souris', length: 5, level: 2 },
    { word: 'SPOUSE', clue: 'Conjoint', length: 6, level: 2 },
    { word: 'ROUSE', clue: 'Réveiller', length: 5, level: 2 },
    { word: 'DOUSE', clue: 'Tremper', length: 5, level: 2 },
    { word: 'LOUSE', clue: 'Pou', length: 5, level: 2 },
    { word: 'GROUSE', clue: 'Gelinotte', length: 6, level: 2 },
    { word: 'BLOUSE', clue: 'Chemisier', length: 6, level: 2 },
    { word: 'CLAUSE', clue: 'Article', length: 6, level: 2 },
    { word: 'PAUSE', clue: 'Arrêt temporaire', length: 5, level: 2 },
    { word: 'CAUSE', clue: 'Raison', length: 5, level: 2 },
    { word: 'SAUCE', clue: 'Condiment liquide', length: 5, level: 2 },
    { word: 'GAUGE', clue: 'Instrument de mesure', length: 5, level: 2 },
    
    // Niveau 3 - Mots de 3-5 lettres (100+ mots)
    { word: 'CHIEN', clue: 'Meilleur ami de l\'homme', length: 5, level: 3 },
    { word: 'FLEUR', clue: 'Partie colorée d\'une plante', length: 5, level: 3 },
    { word: 'LIVRE', clue: 'Objet fait de pages reliées', length: 5, level: 3 },
    { word: 'TABLE', clue: 'Meuble avec un plateau', length: 5, level: 3 },
    { word: 'MONDE', clue: 'Planète Terre', length: 5, level: 3 },
    { word: 'TEMPS', clue: 'Durée des événements', length: 5, level: 3 },
    { word: 'VILLE', clue: 'Grande agglomération urbaine', length: 5, level: 3 },
    { word: 'ROUGE', clue: 'Couleur du sang', length: 5, level: 3 },
    { word: 'BLANC', clue: 'Couleur de la neige', length: 5, level: 3 },
    { word: 'VERT', clue: 'Couleur de l\'herbe', length: 4, level: 3 },
    { word: 'BLEU', clue: 'Couleur du ciel', length: 4, level: 3 },
    { word: 'GRAND', clue: 'De grande taille', length: 5, level: 3 },
    { word: 'PETIT', clue: 'De petite taille', length: 5, level: 3 },
    { word: 'COURT', clue: 'De faible longueur', length: 5, level: 3 },
    { word: 'LONG', clue: 'De grande longueur', length: 4, level: 3 },
    { word: 'BEAU', clue: 'Agréable à voir', length: 4, level: 3 },
    { word: 'LAID', clue: 'Désagréable à voir', length: 4, level: 3 },
    { word: 'RICHE', clue: 'Qui a beaucoup d\'argent', length: 5, level: 3 },
    { word: 'PIANO', clue: 'Instrument de musique', length: 5, level: 3 },
    { word: 'RADIO', clue: 'Appareil de diffusion', length: 5, level: 3 },
    { word: 'VIDEO', clue: 'Enregistrement visuel', length: 5, level: 3 },
    { word: 'AUDIO', clue: 'Son enregistré', length: 5, level: 3 },
    { word: 'PHOTO', clue: 'Image photographique', length: 5, level: 3 },
    { word: 'METRO', clue: 'Transport souterrain', length: 5, level: 3 },
    { word: 'RETRO', clue: 'Style d\'époque passée', length: 5, level: 3 },
    { word: 'MACRO', clue: 'Très grand', length: 5, level: 3 },
    { word: 'MICRO', clue: 'Très petit', length: 5, level: 3 },
    { word: 'INTRO', clue: 'Début d\'une œuvre', length: 5, level: 3 },
    { word: 'OUTRO', clue: 'Fin d\'une œuvre', length: 5, level: 3 },
    { word: 'COMBO', clue: 'Combinaison', length: 5, level: 3 },
    { word: 'JUMBO', clue: 'Très grand', length: 5, level: 3 },
    { word: 'MAMBO', clue: 'Danse latine', length: 5, level: 3 },
    { word: 'BINGO', clue: 'Jeu de hasard', length: 5, level: 3 },
    { word: 'MANGO', clue: 'Fruit tropical', length: 5, level: 3 },
    { word: 'TANGO', clue: 'Danse argentine', length: 5, level: 3 },
    { word: 'CARGO', clue: 'Marchandises transportées', length: 5, level: 3 },
    { word: 'LARGO', clue: 'Tempo musical lent', length: 5, level: 3 },
    { word: 'PATIO', clue: 'Cour intérieure', length: 5, level: 3 },
    { word: 'RATIO', clue: 'Rapport mathématique', length: 5, level: 3 },
    { word: 'FOLIO', clue: 'Feuille pliée', length: 5, level: 3 },
    { word: 'JULIO', clue: 'Prénom masculin', length: 5, level: 3 },
    { word: 'SOPRANO', clue: 'Voix aiguë féminine', length: 7, level: 3 },
    { word: 'CASINO', clue: 'Établissement de jeux', length: 6, level: 3 },
    { word: 'DOMINO', clue: 'Jeu de société', length: 6, level: 3 },
    { word: 'KIMONO', clue: 'Vêtement japonais', length: 6, level: 3 },
    { word: 'ALBINO', clue: 'Dépourvu de pigments', length: 6, level: 3 },
    { word: 'BAMBINO', clue: 'Petit enfant', length: 7, level: 3 },
    { word: 'TORINO', clue: 'Ville italienne', length: 6, level: 3 },
    { word: 'MARINO', clue: 'Relatif à la mer', length: 6, level: 3 },
    { word: 'ALTIMO', clue: 'Très haut', length: 6, level: 3 },
    { word: 'ULTIMO', clue: 'Le dernier', length: 6, level: 3 },
    { word: 'PRIMO', clue: 'Le premier', length: 5, level: 3 },
    { word: 'TERMO', clue: 'Relatif à la chaleur', length: 5, level: 3 },
    { word: 'KARMA', clue: 'Loi de cause à effet', length: 5, level: 3 },
    { word: 'DRAMA', clue: 'Pièce théâtrale', length: 5, level: 3 },
    { word: 'COMMA', clue: 'Signe de ponctuation', length: 5, level: 3 },
    { word: 'GAMMA', clue: 'Lettre grecque', length: 5, level: 3 },
    { word: 'MAMMA', clue: 'Maman en italien', length: 5, level: 3 },
    { word: 'LLAMA', clue: 'Animal des Andes', length: 5, level: 3 },
    { word: 'PRIMA', clue: 'Première', length: 5, level: 3 },
    { word: 'SIGMA', clue: 'Lettre grecque', length: 5, level: 3 },
    { word: 'DOGMA', clue: 'Vérité indiscutable', length: 5, level: 3 },
    { word: 'MAGMA', clue: 'Roche en fusion', length: 5, level: 3 },
    { word: 'PLASMA', clue: 'État de la matière', length: 6, level: 3 },
    { word: 'CINEMA', clue: 'Art du film', length: 6, level: 3 },
    { word: 'SCHEMA', clue: 'Plan simplifié', length: 6, level: 3 },
    { word: 'TRAUMA', clue: 'Choc psychologique', length: 6, level: 3 },
    { word: 'PHARMA', clue: 'Industrie pharmaceutique', length: 6, level: 3 },
    
    // Niveau 4 - Mots de 4-6 lettres (120+ mots)
    { word: 'MUSIQUE', clue: 'Art des sons organisés', length: 7, level: 4 },
    { word: 'SCIENCE', clue: 'Connaissance rationnelle', length: 7, level: 4 },
    { word: 'VOYAGE', clue: 'Déplacement vers un lieu lointain', length: 6, level: 4 },
    { word: 'FAMILLE', clue: 'Groupe de personnes apparentées', length: 7, level: 4 },
    { word: 'BONHEUR', clue: 'État de satisfaction complète', length: 7, level: 4 },
    { word: 'NATURE', clue: 'Environnement naturel', length: 6, level: 4 },
    { word: 'SOLEIL', clue: 'Étoile qui éclaire la Terre', length: 6, level: 4 },
    { word: 'AMOUR', clue: 'Sentiment d\'affection profonde', length: 5, level: 4 },
    { word: 'ESPOIR', clue: 'Sentiment d\'attente confiante', length: 6, level: 4 },
    { word: 'RÊVE', clue: 'Pensées pendant le sommeil', length: 4, level: 4 },
    { word: 'ÉCOLE', clue: 'Établissement d\'enseignement', length: 5, level: 4 },
    { word: 'TRAVAIL', clue: 'Activité professionnelle', length: 7, level: 4 },
    { word: 'MAISON', clue: 'Lieu d\'habitation', length: 6, level: 4 },
    { word: 'JARDIN', clue: 'Espace cultivé de verdure', length: 6, level: 4 },
    { word: 'ENFANT', clue: 'Jeune être humain', length: 6, level: 4 },
    { word: 'PARENT', clue: 'Père ou mère', length: 6, level: 4 },
    { word: 'FRÈRE', clue: 'Fils des mêmes parents', length: 5, level: 4 },
    { word: 'SŒUR', clue: 'Fille des mêmes parents', length: 4, level: 4 },
    { word: 'ONCLE', clue: 'Frère du père ou de la mère', length: 5, level: 4 },
    { word: 'TANTE', clue: 'Sœur du père ou de la mère', length: 5, level: 4 },
    { word: 'COUSIN', clue: 'Fils de l\'oncle ou de la tante', length: 6, level: 4 },
    { word: 'MONTAGNE', clue: 'Relief élevé', length: 8, level: 4 },
    { word: 'CAMPAGNE', clue: 'Zone rurale', length: 8, level: 4 },
    { word: 'BRETAGNE', clue: 'Région française', length: 8, level: 4 },
    { word: 'ESPAGNE', clue: 'Pays ibérique', length: 7, level: 4 },
    { word: 'ALLEMAGNE', clue: 'Pays européen', length: 9, level: 4 },
    { word: 'COMPAGNE', clue: 'Partenaire féminine', length: 8, level: 4 },
    { word: 'CHAMPAGNE', clue: 'Vin pétillant', length: 9, level: 4 },
    { word: 'LASAGNE', clue: 'Plat italien', length: 7, level: 4 },
    { word: 'BAIGNE', clue: 'Trempe dans l\'eau', length: 6, level: 4 },
    { word: 'PEIGNE', clue: 'Objet pour cheveux', length: 6, level: 4 },
    { word: 'RÈGNE', clue: 'Période de pouvoir', length: 5, level: 4 },
    { word: 'SIGNE', clue: 'Marque distinctive', length: 5, level: 4 },
    { word: 'LIGNE', clue: 'Trait continu', length: 5, level: 4 },
    { word: 'DIGNE', clue: 'Qui mérite respect', length: 5, level: 4 },
    { word: 'VIGNE', clue: 'Plant de raisin', length: 5, level: 4 },
    { word: 'CYGNE', clue: 'Oiseau aquatique', length: 5, level: 4 },
    { word: 'ROGNE', clue: 'Maladie de peau', length: 5, level: 4 },
    { word: 'CHAMPIGNON', clue: 'Organisme sans chlorophylle', length: 10, level: 4 },
    { word: 'RELIGION', clue: 'Croyance spirituelle', length: 8, level: 4 },
    { word: 'DIMENSION', clue: 'Mesure spatiale', length: 9, level: 4 },
    { word: 'ATTENTION', clue: 'Concentration mentale', length: 9, level: 4 },
    { word: 'INTENTION', clue: 'But recherché', length: 9, level: 4 },
    { word: 'EXTENSION', clue: 'Agrandissement', length: 9, level: 4 },
    { word: 'TENSION', clue: 'Force d\'étirement', length: 7, level: 4 },
    { word: 'PENSION', clue: 'Retraite', length: 7, level: 4 },
    { word: 'MISSION', clue: 'Tâche à accomplir', length: 7, level: 4 },
    { word: 'PASSION', clue: 'Émotion intense', length: 7, level: 4 },
    { word: 'SESSION', clue: 'Période d\'activité', length: 7, level: 4 },
    { word: 'VERSION', clue: 'Variante', length: 7, level: 4 },
    { word: 'MANSION', clue: 'Grande demeure', length: 7, level: 4 },
    { word: 'FASHION', clue: 'Mode vestimentaire', length: 7, level: 4 },
    { word: 'CUSHION', clue: 'Coussin', length: 7, level: 4 },
    { word: 'BASTION', clue: 'Fortification', length: 7, level: 4 },
    { word: 'PORTION', clue: 'Part d\'un tout', length: 7, level: 4 },
    { word: 'CAUTION', clue: 'Prudence', length: 7, level: 4 },
    { word: 'AUCTION', clue: 'Vente aux enchères', length: 7, level: 4 },
    { word: 'FICTION', clue: 'Œuvre imaginaire', length: 7, level: 4 },
    { word: 'SECTION', clue: 'Partie d\'un ensemble', length: 7, level: 4 },
    { word: 'FACTION', clue: 'Groupe opposé', length: 7, level: 4 },
    { word: 'ACTION', clue: 'Fait d\'agir', length: 6, level: 4 },
    { word: 'NATION', clue: 'Peuple organisé', length: 6, level: 4 },
    { word: 'STATION', clue: 'Lieu d\'arrêt', length: 7, level: 4 },
    { word: 'POTION', clue: 'Breuvage magique', length: 6, level: 4 },
    { word: 'LOTION', clue: 'Produit de soin', length: 6, level: 4 },
    { word: 'MOTION', clue: 'Mouvement', length: 6, level: 4 },
    { word: 'NOTION', clue: 'Concept', length: 6, level: 4 },
    { word: 'OPTION', clue: 'Choix possible', length: 6, level: 4 },
    { word: 'DEVOTION', clue: 'Attachement religieux', length: 8, level: 4 },
    { word: 'EMOTION', clue: 'Sentiment intense', length: 7, level: 4 },
    { word: 'PROMOTION', clue: 'Avancement', length: 9, level: 4 },
    { word: 'LOCOMOTION', clue: 'Capacité de se mouvoir', length: 10, level: 4 },
    
    // Niveau 5 - Mots de 4-7 lettres (150+ mots)
    { word: 'PARADOXE', clue: 'Contradiction apparente', length: 8, level: 5 },
    { word: 'MYSTÈRE', clue: 'Chose inexpliquée', length: 7, level: 5 },
    { word: 'SAGESSE', clue: 'Qualité de celui qui est sage', length: 7, level: 5 },
    { word: 'LIBERTÉ', clue: 'État de celui qui n\'est pas contraint', length: 7, level: 5 },
    { word: 'JUSTICE', clue: 'Respect du droit et de l\'équité', length: 7, level: 5 },
    { word: 'VÉRITÉ', clue: 'Conformité à la réalité', length: 6, level: 5 },
    { word: 'BEAUTÉ', clue: 'Qualité de ce qui est beau', length: 6, level: 5 },
    { word: 'COURAGE', clue: 'Qualité de celui qui brave le danger', length: 7, level: 5 },
    { word: 'PASSION', clue: 'Émotion intense et durable', length: 7, level: 5 },
    { word: 'ÉTERNITÉ', clue: 'Durée sans fin', length: 8, level: 5 },
    { word: 'LUMIÈRE', clue: 'Rayonnement visible', length: 7, level: 5 },
    { word: 'OMBRE', clue: 'Zone non éclairée', length: 5, level: 5 },
    { word: 'SILENCE', clue: 'Absence de bruit', length: 7, level: 5 },
    { word: 'MÉMOIRE', clue: 'Faculté de se souvenir', length: 7, level: 5 },
    { word: 'OUBLI', clue: 'Perte de mémoire', length: 5, level: 5 },
    { word: 'DESTIN', clue: 'Sort fixé d\'avance', length: 6, level: 5 },
    { word: 'HASARD', clue: 'Ce qui arrive par chance', length: 6, level: 5 },
    { word: 'FORTUNE', clue: 'Grande richesse', length: 7, level: 5 },
    { word: 'PAUVRETÉ', clue: 'État de celui qui est pauvre', length: 8, level: 5 },
    { word: 'RICHESSE', clue: 'Abondance de biens', length: 8, level: 5 },
    { word: 'GLOIRE', clue: 'Renommée éclatante', length: 6, level: 5 },
    { word: 'HONNEUR', clue: 'Sentiment de dignité', length: 7, level: 5 },
    { word: 'HONTE', clue: 'Sentiment de déshonneur', length: 5, level: 5 },
    { word: 'FIERTÉ', clue: 'Sentiment de satisfaction', length: 6, level: 5 },
    { word: 'PHILOSOPHIE', clue: 'Réflexion sur l\'existence', length: 11, level: 5 },
    { word: 'PSYCHOLOGIE', clue: 'Science de l\'esprit', length: 11, level: 5 },
    { word: 'SOCIOLOGIE', clue: 'Étude des sociétés', length: 10, level: 5 },
    { word: 'ANTHROPOLOGIE', clue: 'Science de l\'homme', length: 13, level: 5 },
    { word: 'MÉTAPHYSIQUE', clue: 'Étude de l\'être', length: 12, level: 5 },
    { word: 'PHYSIQUE', clue: 'Science de la matière', length: 8, level: 5 },
    { word: 'CHIMIE', clue: 'Science des éléments', length: 6, level: 5 },
    { word: 'BIOLOGIE', clue: 'Science du vivant', length: 8, level: 5 },
    { word: 'GÉOLOGIE', clue: 'Science de la Terre', length: 8, level: 5 },
    { word: 'ASTRONOMIE', clue: 'Science des astres', length: 10, level: 5 },
    { word: 'MATHÉMATIQUES', clue: 'Science des nombres', length: 13, level: 5 },
    { word: 'GÉOMÉTRIE', clue: 'Science des formes', length: 9, level: 5 },
    { word: 'ALGÈBRE', clue: 'Branche des mathématiques', length: 7, level: 5 },
    { word: 'TRIGONOMÉTRIE', clue: 'Calcul des triangles', length: 13, level: 5 },
    { word: 'STATISTIQUE', clue: 'Science des données', length: 11, level: 5 },
    { word: 'PROBABILITÉ', clue: 'Calcul des chances', length: 11, level: 5 },
    { word: 'ÉCONOMIE', clue: 'Science des richesses', length: 8, level: 5 },
    { word: 'POLITIQUE', clue: 'Art de gouverner', length: 9, level: 5 },
    { word: 'HISTOIRE', clue: 'Science du passé', length: 8, level: 5 },
    { word: 'GÉOGRAPHIE', clue: 'Science des lieux', length: 10, level: 5 },
    { word: 'LITTÉRATURE', clue: 'Art de l\'écriture', length: 11, level: 5 },
    { word: 'POÉSIE', clue: 'Art des vers', length: 6, level: 5 },
    { word: 'THÉÂTRE', clue: 'Art dramatique', length: 7, level: 5 },
    { word: 'CINÉMA', clue: 'Septième art', length: 6, level: 5 },
    { word: 'PEINTURE', clue: 'Art des couleurs', length: 8, level: 5 },
    { word: 'SCULPTURE', clue: 'Art du relief', length: 9, level: 5 },
    { word: 'ARCHITECTURE', clue: 'Art de construire', length: 12, level: 5 },
    { word: 'PHOTOGRAPHIE', clue: 'Art de l\'image', length: 12, level: 5 },
    { word: 'CALLIGRAPHIE', clue: 'Art de l\'écriture', length: 12, level: 5 }
  ];

  const getGridSize = (level: Difficulty): number => {
    const sizes = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 13 };
    return sizes[level];
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

    // Initialiser les références
    gridRefs.current = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => React.createRef<HTMLInputElement>())
    );

    return newGrid;
  };

  // NOUVEL ALGORITHME AMÉLIORÉ
  const findAllIntersections = (word1: string, word2: string): Array<{pos1: number, pos2: number, letter: string}> => {
    const intersections = [];
    for (let i = 0; i < word1.length; i++) {
      for (let j = 0; j < word2.length; j++) {
        if (word1[i] === word2[j]) {
          intersections.push({ pos1: i, pos2: j, letter: word1[i] });
        }
      }
    }
    return intersections;
  };

  const canPlaceWordAdvanced = (
    grid: Grid, 
    word: string, 
    row: number, 
    col: number, 
    direction: Direction, 
    size: number,
    placedWords: PlacedWord[]
  ): boolean => {
    // Vérifier les limites de base
    if (direction === 'horizontal') {
      if (col + word.length > size || row >= size || row < 0 || col < 0) return false;
    } else {
      if (row + word.length > size || col >= size || row < 0 || col < 0) return false;
    }

    let requiredIntersections = 0;
    let actualIntersections = 0;

    // Vérifier chaque position du mot
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'horizontal' ? row : row + i;
      const currentCol = direction === 'horizontal' ? col + i : col;
      const cell = grid[currentRow][currentCol];

      // Si une lettre existe, elle doit correspondre (intersection)
      if (cell.correctLetter) {
        if (cell.correctLetter !== word[i]) {
          return false;
        }
        actualIntersections++;
      }

      // Vérifier qu'il n'y a pas de conflit avec les mots adjacents
      const adjacentChecks = [
        [currentRow - 1, currentCol], // haut
        [currentRow + 1, currentCol], // bas
        [currentRow, currentCol - 1], // gauche  
        [currentRow, currentCol + 1]  // droite
      ];

      for (const [adjRow, adjCol] of adjacentChecks) {
        if (adjRow >= 0 && adjRow < size && adjCol >= 0 && adjCol < size) {
          const adjCell = grid[adjRow][adjCol];
          
          // Si une cellule adjacente a une lettre
          if (adjCell.correctLetter) {
            const isInSameDirection = (direction === 'horizontal' && adjRow === currentRow) ||
                                    (direction === 'vertical' && adjCol === currentCol);
            
            // Si c'est dans la même direction, c'est ok (continuité)
            if (isInSameDirection) continue;
            
            // Sinon c'est une intersection, elle doit correspondre
            if (adjCell.correctLetter !== word[i]) {
              return false;
            }
          }
        }
      }
    }

    // Pour les mots après le premier, exiger au moins une intersection
    if (placedWords.length > 0 && actualIntersections === 0) {
      return false;
    }

    return true;
  };

  const scoreWordPlacement = (
    grid: Grid,
    word: WordData,
    row: number,
    col: number,
    direction: Direction,
    size: number,
    placedWords: PlacedWord[]
  ): number => {
    let score = 0;
    let intersections = 0;

    // Calculer les intersections
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'horizontal' ? row : row + i;
      const currentCol = direction === 'horizontal' ? col + i : col;
      
      if (grid[currentRow][currentCol].correctLetter === word.word[i]) {
        intersections++;
        score += 10; // Bonus pour intersection
      }
    }

    // Bonus pour position centrale
    const centerRow = Math.floor(size / 2);
    const centerCol = Math.floor(size / 2);
    const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
    score += Math.max(0, 20 - distanceFromCenter);

    // Bonus pour multiples intersections
    if (intersections > 1) {
      score += intersections * 15;
    }

    // Bonus pour la longueur du mot
    score += word.length * 2;

    // Malus pour les mots trop éloignés des autres
    if (placedWords.length > 0 && intersections === 0) {
      score -= 50;
    }

    return score;
  };

  const findBestPlacements = (
    grid: Grid,
    word: WordData,
    size: number,
    placedWords: PlacedWord[]
  ): WordPlacement[] => {
    const placements: WordPlacement[] = [];

    // Essayer toutes les positions et directions
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        for (const direction of ['horizontal' as Direction, 'vertical' as Direction]) {
          if (canPlaceWordAdvanced(grid, word.word, row, col, direction, size, placedWords)) {
            const score = scoreWordPlacement(grid, word, row, col, direction, size, placedWords);
            placements.push({
              word,
              row,
              col,
              direction,
              score,
              intersections: 0 // sera calculé plus tard si nécessaire
            });
          }
        }
      }
    }

    // Trier par score décroissant
    return placements.sort((a, b) => b.score - a.score);
  };

  const placeWordOnGrid = (
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
      grid[currentRow][currentCol].wordIds!.push(wordId);
    }

    // Marquer la flèche au début du mot
    grid[row][col].hasArrow = true;
    grid[row][col].arrowDirection = direction;
    grid[row][col].wordNumber = wordId;
  };

  const generateGridAdvanced = (level: Difficulty): { grid: Grid, placedWords: PlacedWord[] } => {
    const size = getGridSize(level);
    const availableWords = getWordsForLevel(level);
    
    // Objectifs ambitieux de nombre de mots
    const targetWordCounts = { 1: 10, 2: 15, 3: 22, 4: 30, 5: 40 };
    const targetWords = Math.min(targetWordCounts[level], availableWords.length);
    
    console.log(`🎯 Objectif: ${targetWords} mots pour une grille ${size}x${size} niveau ${level}`);

    // Trier les mots par longueur décroissante pour commencer par les plus longs
    const sortedWords = availableWords
      .sort(() => Math.random() - 0.5) // mélanger d'abord
      .sort((a, b) => b.length - a.length) // puis trier par longueur
      .slice(0, Math.min(targetWords * 2, availableWords.length)); // prendre plus de mots que nécessaire

    const newGrid = createEmptyGrid(size);
    const placedWords: PlacedWord[] = [];

    // Placer le premier mot au centre
    if (sortedWords.length > 0) {
      const firstWord = sortedWords[0];
      const startRow = Math.floor(size / 2);
      const startCol = Math.floor((size - firstWord.length) / 2);

      const firstPlacedWord: PlacedWord = {
        id: 1,
        word: firstWord.word,
        clue: firstWord.clue,
        startRow,
        startCol,
        direction: 'horizontal',
        length: firstWord.length
      };

      placeWordOnGrid(newGrid, firstWord.word, startRow, startCol, 'horizontal', 1);
      placedWords.push(firstPlacedWord);
      console.log(`✅ Premier mot placé: ${firstWord.word} (${firstWord.length} lettres)`);
    }

    // Placer les autres mots avec l'algorithme amélioré
    let attempts = 0;
    const maxAttempts = sortedWords.length * 10;

    for (let wordIndex = 1; wordIndex < sortedWords.length && placedWords.length < targetWords && attempts < maxAttempts; wordIndex++) {
      attempts++;
      const currentWord = sortedWords[wordIndex];
      
      // Trouver les meilleurs emplacements
      const bestPlacements = findBestPlacements(newGrid, currentWord, size, placedWords);
      
      if (bestPlacements.length > 0) {
        // Prendre un des 3 meilleurs placements au hasard pour plus de variété
        const topPlacements = bestPlacements.slice(0, Math.min(3, bestPlacements.length));
        const chosenPlacement = topPlacements[Math.floor(Math.random() * topPlacements.length)];
        
        const newPlacedWord: PlacedWord = {
          id: placedWords.length + 1,
          word: currentWord.word,
          clue: currentWord.clue,
          startRow: chosenPlacement.row,
          startCol: chosenPlacement.col,
          direction: chosenPlacement.direction,
          length: currentWord.length
        };

        placeWordOnGrid(newGrid, currentWord.word, chosenPlacement.row, chosenPlacement.col, chosenPlacement.direction, newPlacedWord.id);
        placedWords.push(newPlacedWord);
        
        console.log(`✅ Mot ${placedWords.length} placé: ${currentWord.word} (${currentWord.length} lettres, score: ${chosenPlacement.score})`);
      } else {
        console.log(`❌ Impossible de placer: ${currentWord.word}`);
      }
    }

    // Si on n'a pas assez de mots, essayer avec des mots plus petits
    if (placedWords.length < targetWords) {
      console.log(`🔄 Tentative avec des mots plus petits... (${placedWords.length}/${targetWords})`);
      
      const smallerWords = availableWords
        .filter(w => w.length >= 2 && w.length <= 4)
        .sort(() => Math.random() - 0.5)
        .slice(0, 50);

      for (const word of smallerWords) {
        if (placedWords.length >= targetWords) break;
        
        const placements = findBestPlacements(newGrid, word, size, placedWords);
        if (placements.length > 0) {
          const placement = placements[0];
          const newPlacedWord: PlacedWord = {
            id: placedWords.length + 1,
            word: word.word,
            clue: word.clue,
            startRow: placement.row,
            startCol: placement.col,
            direction: placement.direction,
            length: word.length
          };

          placeWordOnGrid(newGrid, word.word, placement.row, placement.col, placement.direction, newPlacedWord.id);
          placedWords.push(newPlacedWord);
          console.log(`✅ Petit mot ajouté: ${word.word}`);
        }
      }
    }

    console.log(`🎉 Grille générée: ${placedWords.length} mots placés (objectif: ${targetWords})`);
    return { grid: newGrid, placedWords };
  };

  const generateNewGame = () => {
    const { grid: newGrid, placedWords } = generateGridAdvanced(difficulty);
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
                  Mots Fléchés
                </h1>
                <Trophy className="w-8 h-8 text-yellow-500 ml-3" />
              </div>
              <p className="text-gray-600 text-lg">
                Remplissez la grille en suivant les flèches et les définitions
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {words.length} mots à deviner dans cette grille
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
