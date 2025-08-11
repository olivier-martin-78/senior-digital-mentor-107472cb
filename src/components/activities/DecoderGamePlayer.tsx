import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// T9 keypad mapping
const T9: Record<string, string[]> = {
  '2': ['A', 'B', 'C'],
  '3': ['D', 'E', 'F'],
  '4': ['G', 'H', 'I'],
  '5': ['J', 'K', 'L'],
  '6': ['M', 'N', 'O'],
  '7': ['P', 'Q', 'R', 'S'],
  '8': ['T', 'U', 'V'],
  '9': ['W', 'X', 'Y', 'Z'],
};

const LETTER_TO_T9: Record<string, string> = Object.entries(T9).reduce(
  (map, [digit, letters]) => {
    letters.forEach((l) => (map[l] = digit));
    return map;
  },
  {} as Record<string, string>
);

// A small French dataset with themes (UPPERCASE)
const WORDS: { word: string; theme: string }[] = [
  { word: 'MAISON', theme: 'Habitation' },
  { word: 'JARDIN', theme: 'Habitation' },
  { word: 'ANIMAL', theme: 'Animaux' },
  { word: 'CHEVAL', theme: 'Animaux' },
  { word: 'SINGE', theme: 'Animaux' },
  { word: 'LIVRES', theme: 'Objets' },
  { word: 'TABLE', theme: 'Objets' },
  { word: 'CHAIR', theme: 'Objets' },
  { word: 'AVION', theme: 'Transports' },
  { word: 'TRAIN', theme: 'Transports' },
  { word: 'POMMES', theme: 'Nourriture' },
  { word: 'FROMAGE', theme: 'Nourriture' },
  { word: 'CAFE', theme: 'Boisson' },
  { word: 'THE', theme: 'Boisson' },
  { word: 'POMPIER', theme: 'Métiers' },
  { word: 'MEDECIN', theme: 'Métiers' },
  { word: 'CHANTEUR', theme: 'Métiers' },
  { word: 'MER', theme: 'Nature' },
  { word: 'FORET', theme: 'Nature' },
  { word: 'MONTAGNE', theme: 'Nature' },
  { word: 'AMITIE', theme: 'Sentiments' },
  { word: 'BONHEUR', theme: 'Sentiments' },
];

function encodeToDigits(word: string): string {
  return word
    .toUpperCase()
    .split('')
    .map((ch) => LETTER_TO_T9[ch] || ch)
    .join('');
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const DecoderGamePlayer: React.FC = () => {
  const { toast } = useToast();
  const [current, setCurrent] = useState<{ word: string; theme: string; digits: string } | null>(null);
  const [guess, setGuess] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState<null | boolean>(null);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const keypad = useMemo(
    () => [
      { d: '1', letters: '' },
      { d: '2', letters: 'ABC' },
      { d: '3', letters: 'DEF' },
      { d: '4', letters: 'GHI' },
      { d: '5', letters: 'JKL' },
      { d: '6', letters: 'MNO' },
      { d: '7', letters: 'PQRS' },
      { d: '8', letters: 'TUV' },
      { d: '9', letters: 'WXYZ' },
      { d: '*', letters: '' },
      { d: '0', letters: '' },
      { d: '#', letters: '' },
    ],
    []
  );

  const startNew = () => {
    const chosen = randomChoice(WORDS);
    const digits = encodeToDigits(chosen.word);
    setCurrent({ word: chosen.word, theme: chosen.theme, digits });
    setGuess(Array(chosen.word.length).fill(''));
    setRevealed(new Set());
    setChecked(null);
    // SEO - title and meta update
    document.title = 'Mot à décoder | Jeux cognitifs';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        "Décoder le mot chiffré avec le pavé T9. Indices par thématique, aide lettre par lettre."
      );
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = "Décoder le mot chiffré avec le pavé T9. Indices par thématique, aide lettre par lettre.";
      document.head.appendChild(m);
    }
  };

  useEffect(() => {
    startNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeLetter = (index: number, value: string) => {
    const v = value.toUpperCase().replace(/[^A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/g, '');
    const letter = v.charAt(0) || '';
    setGuess((prev) => {
      const next = [...prev];
      next[index] = letter
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '') // strip accents
        .toUpperCase();
      return next;
    });
    setChecked(null);

    // Focus next input automatically
    if (letter && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleCheck = () => {
    if (!current) return;
    const user = guess.join('');
    const isOk = user.length === current.word.length && user === current.word;
    setChecked(isOk);
    if (isOk) {
      toast({ title: 'Bravo !', description: 'Vous avez décodé le mot 🎉' });
    } else {
      toast({ title: 'Encore !', description: 'Ce n\'est pas tout à fait ça. Réessayez.' });
    }
  };

  const handleHelp = () => {
    if (!current) return;
    // pick a non revealed and non-correct index
    const candidates: number[] = [];
    for (let i = 0; i < current.word.length; i++) {
      if (!revealed.has(i) && guess[i] !== current.word[i]) {
        candidates.push(i);
      }
    }
    if (candidates.length === 0) {
      toast({ title: 'Astuce', description: 'Toutes les lettres sont déjà révélées ou correctes.' });
      return;
    }
    const idx = randomChoice(candidates);
    const next = [...guess];
    next[idx] = current.word[idx];
    setGuess(next);
    const r = new Set(revealed);
    r.add(idx);
    setRevealed(r);
    setChecked(null);
    toast({ title: 'Aide utilisée', description: `La lettre #${idx + 1} a été révélée.` });
    // focus next empty
    const firstEmpty = next.findIndex((ch) => ch === '');
    if (firstEmpty >= 0) {
      inputsRef.current[firstEmpty]?.focus();
    }
  };

  const keypadTile = (d: string, letters: string) => (
    <div
      key={d}
      className={cn(
        'rounded-xl border shadow-sm p-3 text-center select-none',
        'bg-card text-foreground border-border'
      )}
      aria-label={`Touche ${d}${letters ? ` (${letters.split('').join(', ')})` : ''}`}
    >
      <div className="text-lg font-bold">{d}</div>
      {letters && <div className="text-xs opacity-70 tracking-widest">{letters}</div>}
    </div>
  );

  if (!current) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
        <CardHeader className="text-center bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-t-lg">
          <CardTitle className="text-2xl">Mot à décoder</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="text-sm opacity-80">Thématique</div>
            <div className="px-3 py-1 rounded-full bg-primary/15 text-primary font-semibold text-sm">
              {current.theme}
            </div>
          </div>

          <div className="mb-6 text-center">
            <p className="text-muted-foreground mb-2">Mot chiffré (pavé T9)</p>
            <div className="inline-flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3 text-2xl font-bold tracking-widest">
              {current.digits.split('').join(' ')}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-center text-sm text-muted-foreground mb-2">Votre proposition</p>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: current.word.length }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  inputMode="text"
                  maxLength={1}
                  value={guess[i] || ''}
                  onChange={(e) => onChangeLetter(i, e.target.value)}
                  className={cn(
                    'w-10 h-12 text-center text-xl font-semibold rounded-md border focus:outline-none focus:ring-2',
                    'bg-background text-foreground border-border',
                    revealed.has(i) ? 'ring-2 ring-primary/60' : 'focus:ring-primary/60'
                  )}
                  aria-label={`Lettre ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {keypad.map((k) => keypadTile(k.d, k.letters))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={handleCheck} className="min-w-[180px] bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700">
              Vérifier
            </Button>
            <Button onClick={handleHelp} variant="secondary" className="min-w-[180px] bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white hover:from-fuchsia-600 hover:to-pink-700">
              Aide-moi
            </Button>
            <Button onClick={startNew} variant="outline" className="min-w-[180px]">
              Nouveau mot
            </Button>
          </div>

          {checked !== null && (
            <div className={cn(
              'mt-6 text-center font-semibold p-3 rounded-lg',
              checked ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-rose-100 text-rose-700 border border-rose-300'
            )}>
              {checked ? 'Correct ! 🎉' : 'Incorrect, continuez à essayer.'}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Astuce: 2=ABC, 3=DEF, 4=GHI, 5=JKL, 6=MNO, 7=PQRS, 8=TUV, 9=WXYZ
      </div>
    </div>
  );
};

export default DecoderGamePlayer;
