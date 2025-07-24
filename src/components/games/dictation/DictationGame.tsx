
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw, CheckCircle, SkipForward, SkipBack, Square, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DictationGameProps {
  title: string;
  dictationText: string;
  correctedText: string;
  audioUrl?: string;
}

interface WordDifference {
  word: string;
  isCorrect: boolean;
  index: number;
}

interface Sentence {
  text: string;
  start: number;
  end: number;
}

const DictationGame: React.FC<DictationGameProps> = ({
  title,
  dictationText,
  correctedText,
  audioUrl
}) => {
  const [userText, setUserText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [score, setScore] = useState(20);
  const [differences, setDifferences] = useState<WordDifference[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(audioUrl || null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();

  // Initialisation
  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setCurrentAudioUrl(url);
      toast({
        title: 'Fichier audio chargé',
        description: 'Vous pouvez maintenant lancer la dictée',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier audio valide (MP3, WAV, etc.)',
        variant: 'destructive',
      });
    }
  };

  const handlePlay = () => {
    if (!currentAudioUrl) {
      toast({
        title: 'Aucun fichier audio',
        description: 'Veuillez d\'abord charger un fichier audio MP3',
        variant: 'destructive',
      });
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = currentAudioUrl;
      audioRef.current.load();
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
        toast({
          title: 'Erreur de lecture',
          description: 'Impossible de lire le fichier audio',
          variant: 'destructive',
        });
      });
    }
  };

  // Gestionnaire pour l'audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      toast({
        title: 'Dictée terminée',
        description: 'L\'audio est terminé',
      });
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [toast]);

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[.,!?;:«»""]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const calculateScore = (): void => {
    const normalizedUser = normalizeText(userText);
    const normalizedCorrect = normalizeText(correctedText);
    
    const userWords = normalizedUser.split(' ').filter(word => word.length > 0);
    const correctWords = normalizedCorrect.split(' ').filter(word => word.length > 0);
    
    const maxLength = Math.max(userWords.length, correctWords.length);
    const wordDifferences: WordDifference[] = [];
    let errors = 0;
    
    for (let i = 0; i < maxLength; i++) {
      const userWord = userWords[i] || '';
      const correctWord = correctWords[i] || '';
      const isCorrect = userWord === correctWord;
      
      if (!isCorrect) {
        errors++;
      }
      
      wordDifferences.push({
        word: userWord || correctWord,
        isCorrect,
        index: i
      });
    }
    
    const finalScore = Math.max(0, 20 - errors);
    setScore(finalScore);
    setDifferences(wordDifferences);
    setShowCorrection(true);
    
    toast({
      title: 'Correction terminée',
      description: `Votre score : ${finalScore}/20`,
    });
  };

  const resetGame = () => {
    setUserText('');
    setShowCorrection(false);
    setScore(20);
    setDifferences([]);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const renderCorrectedText = () => {
    if (!showCorrection) return null;
    
    const normalizedUser = normalizeText(userText);
    const normalizedCorrect = normalizeText(correctedText);
    const userWords = normalizedUser.split(' ').filter(word => word.length > 0);
    const correctWords = normalizedCorrect.split(' ').filter(word => word.length > 0);
    
    const maxLength = Math.max(userWords.length, correctWords.length);
    const renderWords = [];
    
    for (let i = 0; i < maxLength; i++) {
      const userWord = userWords[i] || '';
      const correctWord = correctWords[i] || '';
      const isCorrect = userWord === correctWord;
      
      renderWords.push(
        <span
          key={i}
          className={`inline-block mr-1 px-1 rounded ${
            isCorrect 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800 line-through'
          }`}
        >
          {userWord || correctWord}
        </span>
      );
      
      if (!isCorrect && userWord && correctWord) {
        renderWords.push(
          <span key={`correct-${i}`} className="inline-block mr-1 px-1 rounded bg-green-100 text-green-800">
            {correctWord}
          </span>
        );
      }
    }
    
    return renderWords;
  };


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Audio element */}
      <audio 
        ref={audioRef} 
        controls
        className="w-full"
        preload="metadata"
        playsInline
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload de fichier audio */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900">Fichier audio de la dictée :</h3>
              <div className="flex items-center space-x-3">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-900 hover:file:bg-blue-200"
                />
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-800">
                Chargez un fichier MP3 généré avec ElevenLabs ou tout autre fichier audio de la dictée.
              </p>
              {currentAudioUrl && (
                <p className="text-sm text-green-700 font-semibold">✓ Fichier audio chargé avec succès</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Instructions :</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Chargez d'abord un fichier audio MP3 de la dictée</li>
              <li>• Utilisez les contrôles audio pour écouter la dictée</li>
              <li>• Écrivez ce que vous entendez dans la zone de texte ci-dessous</li>
              <li>• Cliquez sur "Correction" pour voir vos erreurs</li>
            </ul>
          </div>

          {/* Texte de référence */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Texte de la dictée :</h4>
            <div className="text-sm leading-relaxed">
              {dictationText}
            </div>
          </div>

          {/* Contrôles audio simplifiés */}
          <div className="space-y-4">
            <div className="flex justify-center items-center space-x-2">
              <Button
                onClick={handlePlay}
                disabled={!isReady || isPlaying || !currentAudioUrl}
                variant="outline"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Lire
              </Button>
              
              <Button
                onClick={handlePause}
                disabled={!isReady || !isPlaying}
                variant="outline"
                size="lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              
              <Button
                onClick={handleStop}
                disabled={!isReady}
                variant="outline"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </div>
          </div>
          
          {/* Zone de saisie */}
          <div className="space-y-2">
            <label htmlFor="user-input" className="block text-sm font-medium">
              Écrivez ici ce que vous entendez :
            </label>
            <Textarea
              id="user-input"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Commencez à écrire..."
              className="min-h-[200px]"
              disabled={showCorrection}
            />
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={calculateScore}
              disabled={!userText.trim() || showCorrection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Correction
            </Button>
            
            {showCorrection && (
              <Button
                onClick={resetGame}
                variant="outline"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Recommencer
              </Button>
            )}
          </div>
          
          {/* Affichage du score */}
          {showCorrection && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  Résultat : {score}/20 points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Votre texte corrigé :</h4>
                    <div className="p-3 bg-white rounded border leading-relaxed">
                      {renderCorrectedText()}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Texte correct :</h4>
                    <div className="p-3 bg-green-50 rounded border">
                      {correctedText}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DictationGame;
