
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
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();
  
  // Fonction pour segmenter le texte en phrases
  const segmentText = (text: string): Sentence[] => {
    const sentenceRegex = /[.!?]+/g;
    const sentences: Sentence[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
      if (sentence.length > 0) {
        sentences.push({
          text: sentence,
          start: lastIndex,
          end: match.index + match[0].length
        });
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex).trim();
      if (remainingText.length > 0) {
        sentences.push({
          text: remainingText,
          start: lastIndex,
          end: text.length
        });
      }
    }

    return sentences;
  };

  // Initialisation
  useEffect(() => {
    setIsReady(true);
    const segmentedSentences = segmentText(dictationText);
    setSentences(segmentedSentences);
  }, [dictationText]);

  // Mise à jour de la progression
  useEffect(() => {
    if (sentences.length > 0) {
      const progressPercent = (currentSentenceIndex / sentences.length) * 100;
      setProgress(progressPercent);
    }
  }, [currentSentenceIndex, sentences.length]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setCurrentAudioUrl(url);
      setCurrentSentenceIndex(0);
      setProgress(0);
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
      // Fallback vers TTS si pas d'audio uploadé
      speakWithNativeTTS(dictationText);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = currentAudioUrl;
      audioRef.current.load();
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
        toast({
          title: 'Erreur de lecture',
          description: 'Impossible de lire le fichier audio, passage en mode TTS',
          variant: 'destructive',
        });
        // Fallback vers TTS
        speakWithNativeTTS(dictationText);
      });
    }
  };

  const speakWithNativeTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    const voices = speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => 
      voice.lang.startsWith('fr') || voice.name.toLowerCase().includes('french')
    );
    
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesis.speak(utterance);
  };

  // Gestionnaire pour l'audio et navigation par phrases
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
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
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentSentenceIndex(0);
    setProgress(0);
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    }
  };

  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
    // Si pas d'audio MP3, lire la phrase avec TTS
    if (!currentAudioUrl) {
      speakWithNativeTTS(sentences[index].text);
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
    setCurrentSentenceIndex(0);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const renderTextWithHighlight = () => {
    return sentences.map((sentence, index) => (
      <span
        key={index}
        className={`cursor-pointer p-2 m-1 rounded transition-colors inline-block ${
          index === currentSentenceIndex
            ? 'bg-blue-200 text-blue-900'
            : 'hover:bg-gray-100'
        }`}
        onClick={() => handleSentenceClick(index)}
        title={currentAudioUrl ? 'Cliquez pour sélectionner cette phrase' : 'Cliquez pour écouter cette phrase'}
      >
        Phrase {index + 1}
      </span>
    ));
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
      {/* Audio element - hidden */}
      <audio 
        ref={audioRef} 
        className="hidden"
        preload="metadata"
        playsInline
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Instructions :</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• {currentAudioUrl ? 'Utilisez les contrôles pour écouter l\'audio MP3' : 'Chargez un fichier audio MP3 ou utilisez la synthèse vocale'}</li>
              <li>• Cliquez sur une phrase dans le texte pour la sélectionner{!currentAudioUrl && ' ou l\'écouter'}</li>
              <li>• Utilisez les flèches pour naviguer entre les phrases</li>
              <li>• Écrivez ce que vous entendez dans la zone de texte ci-dessous</li>
              <li>• Cliquez sur "Correction" pour voir vos erreurs</li>
            </ul>
          </div>

          {/* Texte de référence avec phrases cliquables */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Texte de la dictée :</h4>
            <div className="text-sm leading-relaxed">
              {sentences.length > 0 ? renderTextWithHighlight() : dictationText}
            </div>
            {sentences.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                Phrase sélectionnée : {currentSentenceIndex + 1} sur {sentences.length}
              </div>
            )}
          </div>

          {/* Contrôles audio avec navigation par phrases */}
          <div className="space-y-4">
            <div className="flex justify-center items-center space-x-2">
              <Button
                onClick={handlePreviousSentence}
                disabled={!isReady || currentSentenceIndex === 0}
                variant="outline"
                size="sm"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
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
              
              <Button
                onClick={handleNextSentence}
                disabled={!isReady || currentSentenceIndex === sentences.length - 1}
                variant="outline"
                size="sm"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progression */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                  {sentences.length > 0 && `Phrase ${currentSentenceIndex + 1} sur ${sentences.length}`}
                </div>
                <div>
                  {isPlaying && '🔊 Lecture en cours...'}
                  {!isPlaying && progress > 0 && progress < 100 && '⏸️ En pause'}
                  {progress === 100 && '✓ Dictée terminée'}
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
