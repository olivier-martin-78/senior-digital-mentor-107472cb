
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, RotateCcw, CheckCircle, Clock } from 'lucide-react';
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
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVoluntaryStop, setIsVoluntaryStop] = useState(false);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize speech synthesis when component mounts
  useEffect(() => {
    console.log('DictationGame component loaded - improved version with progress tracking');
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsReady(true);
      // Calculate estimated duration (average reading speed: 150 words per minute)
      const wordCount = dictationText.split(' ').length;
      const estimatedMinutes = (wordCount / 150) * 60; // Convert to seconds
      setEstimatedDuration(estimatedMinutes);
    } else {
      toast({
        title: 'Erreur',
        description: 'La synthèse vocale n\'est pas supportée dans ce navigateur',
        variant: 'destructive',
      });
    }
  }, [dictationText, toast]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    const startTime = Date.now() - (elapsedTime * 1000);
    
    progressInterval.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      setElapsedTime(elapsed);
      
      if (estimatedDuration > 0) {
        const progressPercent = Math.min((elapsed / estimatedDuration) * 100, 100);
        setProgress(progressPercent);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const speakText = () => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    setIsVoluntaryStop(false);
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(dictationText);
    utterance.rate = 0.8; // Slightly slower for dictation
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a French voice if available
    const voices = speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => 
      voice.lang.startsWith('fr') || voice.name.toLowerCase().includes('french')
    );
    
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      startProgressTracking();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      stopProgressTracking();
      
      // Only show completion message if it wasn't a voluntary stop
      if (!isVoluntaryStop) {
        setProgress(100);
        setElapsedTime(estimatedDuration);
        toast({
          title: 'Lecture terminée',
          description: 'Vous pouvez maintenant commencer à écrire votre dictée',
        });
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      stopProgressTracking();
      
      // Only show error if it wasn't a voluntary stop
      if (!isVoluntaryStop) {
        toast({
          title: 'Erreur',
          description: 'Impossible de lire le texte',
          variant: 'destructive',
        });
      }
    };

    speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    // Reset progress if starting from the beginning
    if (!isPaused) {
      setProgress(0);
      setElapsedTime(0);
    }
    speakText();
  };

  const handlePause = () => {
    setIsVoluntaryStop(true);
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(true);
    stopProgressTracking();
  };

  const handleRestart = () => {
    setIsVoluntaryStop(true);
    speechSynthesis.cancel();
    setProgress(0);
    setElapsedTime(0);
    setIsPaused(false);
    setTimeout(() => speakText(), 100);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    setProgress(0);
    setElapsedTime(0);
    setIsPaused(false);
    setIsVoluntaryStop(true);
    speechSynthesis.cancel();
    setIsPlaying(false);
    stopProgressTracking();
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
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions :</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cliquez sur "Lire" pour commencer la dictée</li>
              <li>• Utilisez "Pause" pour arrêter temporairement (la lecture reprendra au début)</li>
              <li>• "Recommencer" relance la lecture depuis le début</li>
              <li>• Écrivez ce que vous entendez dans la zone de texte</li>
            </ul>
          </div>

          {/* Contrôles audio */}
          <div className="space-y-4">
            <div className="flex justify-center items-center space-x-4">
              <Button
                onClick={handlePlay}
                disabled={!isReady || isPlaying}
                variant="outline"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                {isPaused ? 'Reprendre' : 'Lire'}
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
                onClick={handleRestart}
                disabled={!isReady}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Recommencer
              </Button>
            </div>
            
            {/* Progress bar and timing */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(elapsedTime)} / {formatTime(estimatedDuration)}</span>
                </div>
                <div>
                  {isPlaying && '🔊 Lecture en cours...'}
                  {isPaused && '⏸️ En pause'}
                  {!isPlaying && !isPaused && progress > 0 && '✓ Lecture terminée'}
                </div>
              </div>
              
              <Progress 
                value={progress} 
                className="w-full" 
                indicatorClassName={isPlaying ? 'bg-blue-500' : 'bg-green-500'}
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
