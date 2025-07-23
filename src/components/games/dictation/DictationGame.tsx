
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DictationGameProps {
  title: string;
  dictationText: string;
  correctedText: string;
}

interface WordDifference {
  word: string;
  isCorrect: boolean;
  index: number;
}

const DictationGame: React.FC<DictationGameProps> = ({
  title,
  dictationText,
  correctedText
}) => {
  const [userText, setUserText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [score, setScore] = useState(20);
  const [differences, setDifferences] = useState<WordDifference[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [textSegments, setTextSegments] = useState<string[]>([]);
  const { toast } = useToast();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const synth = window.speechSynthesis;

  // Initialize speech synthesis and text segments
  useEffect(() => {
    if (dictationText) {
      // Diviser le texte en segments pour simuler la progression
      const sentences = dictationText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      setTextSegments(sentences);
      
      // Estimer la durée basée sur le nombre de mots (environ 2 mots par seconde)
      const wordCount = dictationText.split(' ').length;
      const estimatedDuration = Math.max(10, wordCount * 0.5); // Minimum 10 secondes
      setDuration(estimatedDuration);
      
      utteranceRef.current = new SpeechSynthesisUtterance(dictationText);
      utteranceRef.current.lang = 'fr-FR';
      utteranceRef.current.rate = 0.8;
      utteranceRef.current.pitch = 1;
      utteranceRef.current.volume = 1;
      
      utteranceRef.current.onend = () => {
        setIsPlaying(false);
        setCurrentPosition(duration);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
      
      utteranceRef.current.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        toast({
          title: 'Erreur',
          description: 'Impossible de lire le texte',
          variant: 'destructive',
        });
      };
    }
  }, [dictationText, toast, duration]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [synth]);

  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    progressInterval.current = setInterval(() => {
      setCurrentPosition(prev => {
        const newPosition = prev + 0.1;
        if (newPosition >= duration) {
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          return duration;
        }
        return newPosition;
      });
    }, 100);
  };

  const handlePlay = () => {
    if (!utteranceRef.current) return;
    
    if (synth.speaking && synth.paused) {
      synth.resume();
      startProgressTracking();
    } else if (!synth.speaking) {
      // Si on n'est pas au début, on doit recréer l'utterance pour la position
      if (currentPosition > 0) {
        handleSeek([currentPosition]);
      } else {
        synth.speak(utteranceRef.current);
        startProgressTracking();
      }
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (synth.speaking) {
      synth.pause();
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPlaying(false);
  };

  const handleRestart = () => {
    synth.cancel();
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setCurrentPosition(0);
    setIsPlaying(false);
    setTimeout(() => {
      if (utteranceRef.current) {
        synth.speak(utteranceRef.current);
        setIsPlaying(true);
        startProgressTracking();
      }
    }, 100);
  };

  const handleSeek = (value: number[]) => {
    const newPosition = value[0];
    setCurrentPosition(newPosition);
    
    if (synth.speaking) {
      synth.cancel();
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    // Calculer quel segment commencer basé sur la position
    const segmentDuration = duration / textSegments.length;
    const segmentIndex = Math.floor(newPosition / segmentDuration);
    
    if (segmentIndex < textSegments.length) {
      // Créer un nouvel utterance avec le texte à partir du segment sélectionné
      const remainingText = textSegments.slice(segmentIndex).join('. ');
      const newUtterance = new SpeechSynthesisUtterance(remainingText);
      newUtterance.lang = 'fr-FR';
      newUtterance.rate = 0.8;
      newUtterance.pitch = 1;
      newUtterance.volume = 1;
      
      newUtterance.onend = () => {
        setIsPlaying(false);
        setCurrentPosition(duration);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
      
      if (isPlaying) {
        synth.speak(newUtterance);
        startProgressTracking();
      }
    }
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
    setCurrentPosition(0);
    synth.cancel();
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contrôles audio */}
          <div className="space-y-4">
            <div className="flex justify-center items-center space-x-4">
              <Button
                onClick={handlePlay}
                disabled={isPlaying}
                variant="outline"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Lire
              </Button>
              
              <Button
                onClick={handlePause}
                disabled={!isPlaying}
                variant="outline"
                size="lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              
              <Button
                onClick={handleRestart}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Recommencer
              </Button>
            </div>
            
            {/* Curseur de progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentPosition)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentPosition]}
                onValueChange={handleSeek}
                max={duration}
                min={0}
                step={0.1}
                className="w-full"
              />
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
