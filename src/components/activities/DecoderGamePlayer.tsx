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
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [helpCount, setHelpCount] = useState(0);
  const [score, setScore] = useState<number | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

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
    setElapsed(0);
    setFinished(false);
    setHelpCount(0);
    setScore(null);
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

  // Timer that runs while the word is not finished
  useEffect(() => {
    if (!current || finished) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [current, finished]);
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
      if (!finished) setFinished(true);
      const base = 1000;
      const timePenalty = Math.floor(elapsed * 2); // plus progressif
      const helpPenalty = helpCount * 60; // aides moins pénalisantes
      const s = Math.max(100, base - timePenalty - helpPenalty);
      setScore(s);
      toast({ title: 'Excellent ! 🎉', description: `Mot ${current.word} décodé en ${formatTime(elapsed)} • Score ${s} 🌟` });
    } else {
      toast({ title: 'Continuez !', description: 'Ce n\'est pas encore ça, essayez une autre combinaison.' });
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
    setHelpCount((c) => c + 1);
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
        'rounded-xl border-2 p-3 text-center select-none transition-all duration-200 hover:scale-105 hover:shadow-lg',
        'bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-200 hover:border-purple-400'
      )}
      aria-label={`Touche ${d}${letters ? ` (${letters.split('').join(', ')})` : ''}`}
    >
      <div className="text-lg font-extrabold">{d}</div>
      {letters && <div className="text-sm opacity-80 tracking-widest font-semibold">{letters}</div>}
    </div>
  );

  if (!current) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="mb-4 overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-sky-50 rounded-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-t-2xl py-3">
          <CardTitle className="text-xl">Mot à décoder</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center gap-1 mb-3">
            <div className="text-sm opacity-80">Thématique</div>
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 font-semibold text-sm shadow-sm">
              {current.theme}
            </div>
            <div className="text-xs text-muted-foreground" role="status" aria-live="polite">
              Chrono: <span className="font-semibold text-foreground">{formatTime(elapsed)}</span>
            </div>
          </div>

          <div className="mb-4 text-center">
            <p className="text-muted-foreground mb-2">Mot chiffré (pavé T9)</p>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl px-3 py-2 text-xl font-bold tracking-widest shadow-md">
              {current.digits.split('').join(' ')}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-center text-sm text-muted-foreground mb-2">Votre proposition</p>
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: current.word.length }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  inputMode="text"
                  maxLength={1}
                  value={guess[i] || ''}
                  onChange={(e) => onChangeLetter(i, e.target.value)}
                  className={cn(
                    'w-9 h-10 text-center text-lg font-semibold rounded-md border-2 focus:outline-none focus:ring-2 transition-colors',
                    'bg-white text-foreground border-purple-200 hover:border-purple-400',
                    revealed.has(i) ? 'ring-2 ring-purple-400' : 'focus:ring-purple-500'
                  )}
                  aria-label={`Lettre ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {keypad.map((k) => keypadTile(k.d, k.letters))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button onClick={handleCheck} className="min-w-[180px] py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              Vérifier
            </Button>
            <Button onClick={handleHelp} variant="secondary" className="min-w-[180px] py-2 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              Aide-moi
            </Button>
            <Button onClick={startNew} variant="outline" className="min-w-[180px] py-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50">
              Nouveau mot
            </Button>
          </div>

          {checked !== null && (
            <div className={cn(
              'mt-4 text-center font-semibold p-4 rounded-xl border-0',
              checked ? 'bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 text-green-800' : 'bg-gradient-to-r from-red-100 via-pink-100 to-orange-100 text-red-800'
            )}>
              {checked ? (
                <div>
                  <div className="text-3xl mb-1">🎉</div>
                  <div className="text-xl">Félicitations ! Vous avez décodé le mot.</div>
                  <div className="text-sm mt-1 opacity-80">Temps {formatTime(elapsed)} • Score {score ?? 0}</div>
                </div>
              ) : (
                'Incorrect, continuez à essayer.'
              )}
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
