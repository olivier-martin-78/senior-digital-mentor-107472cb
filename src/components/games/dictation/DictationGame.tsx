
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Play, Square, RotateCcw, CheckCircle } from 'lucide-react';
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
  const { toast } = useToast();

  // Initialize speech synthesis when component mounts
  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsReady(true);
    } else {
      toast({
        title: 'Erreur',
        description: 'La synthèse vocale n\'est pas supportée dans ce navigateur',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const speakText = () => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
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
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      toast({
        title: 'Erreur',
        description: 'Impossible de lire le texte',
        variant: 'destructive',
      });
    };

    speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    speakText();
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleRestart = () => {
    speechSynthesis.cancel();
    setTimeout(() => speakText(), 100);
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
    speechSynthesis.cancel();
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
                disabled={!isReady || isPlaying}
                variant="outline"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Lire
              </Button>
              
              <Button
                onClick={handleStop}
                disabled={!isReady || !isPlaying}
                variant="outline"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                Arrêter
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
            
            {isPlaying && (
              <div className="text-center text-sm text-muted-foreground">
                🔊 Lecture en cours...
              </div>
            )}
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
