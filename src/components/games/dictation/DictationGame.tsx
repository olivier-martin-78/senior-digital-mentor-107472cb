
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, RotateCcw, CheckCircle, SkipForward, SkipBack, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface Sentence {
  text: string;
  start: number;
  end: number;
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
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVoluntaryStop, setIsVoluntaryStop] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();

  // Fonction pour segmenter le texte en phrases
  const segmentText = (text: string): Sentence[] => {
    // Divise par phrases en utilisant les points, points d'exclamation et points d'interrogation
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

    // Ajouter le reste du texte s'il n'y a pas de ponctuation finale
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
    console.log('DictationGame component loaded - segmented version');
    if ('speechSynthesis' in window) {
      setIsReady(true);
      const segmentedSentences = segmentText(dictationText);
      setSentences(segmentedSentences);
      console.log('Sentences segmented:', segmentedSentences);
    } else {
      toast({
        title: 'Erreur',
        description: 'La synthèse vocale n\'est pas supportée dans ce navigateur',
        variant: 'destructive',
      });
    }
  }, [dictationText, toast]);

  // Mettre à jour la progression
  useEffect(() => {
    if (sentences.length > 0) {
      const progressPercent = (currentSentenceIndex / sentences.length) * 100;
      setProgress(progressPercent);
    }
  }, [currentSentenceIndex, sentences.length]);

  // Fonction pour générer l'audio avec ElevenLabs
  const generateElevenLabsAudio = async (text: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: text,
          voice_id: '9BWtsMINqrJLrQacOk9x' // Aria voice - excellente pour la dictée
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        return `data:audio/mpeg;base64,${data.audioContent}`;
      }
      return null;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      return null;
    }
  };

  const speakSentence = async (sentenceIndex: number) => {
    if (!sentences[sentenceIndex]) return;
    
    setIsVoluntaryStop(false);
    speechSynthesis.cancel();
    
    const sentenceText = sentences[sentenceIndex].text;

    // Essayer d'abord ElevenLabs si activé
    if (useElevenLabs) {
      try {
        const audioUrl = await generateElevenLabsAudio(sentenceText);
        if (audioUrl && audioRef.current) {
          audioRef.current.src = audioUrl;
          
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch((error) => {
                console.error('Audio play error:', error);
                // Fallback vers la synthèse native
                speakWithNativeTTS(sentenceText, sentenceIndex);
              });
          }
          return;
        }
      } catch (error) {
        console.error('ElevenLabs error, falling back to native TTS:', error);
      }
    }

    // Fallback vers la synthèse vocale native
    speakWithNativeTTS(sentenceText, sentenceIndex);
  };

  const speakWithNativeTTS = (text: string, sentenceIndex: number) => {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Essayer d'utiliser une voix française
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
      
      if (!isVoluntaryStop) {
        // Passer automatiquement à la phrase suivante
        if (sentenceIndex < sentences.length - 1) {
          setCurrentSentenceIndex(sentenceIndex + 1);
          setTimeout(() => speakSentence(sentenceIndex + 1), 500);
        } else {
          // Fin de la dictée
          setProgress(100);
          toast({
            title: 'Dictée terminée',
            description: 'Toutes les phrases ont été lues',
          });
        }
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    speechSynthesis.speak(utterance);
  };

  // Gestionnaire pour l'audio ElevenLabs
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      
      if (!isVoluntaryStop) {
        // Passer automatiquement à la phrase suivante
        if (currentSentenceIndex < sentences.length - 1) {
          setCurrentSentenceIndex(currentSentenceIndex + 1);
          setTimeout(() => speakSentence(currentSentenceIndex + 1), 500);
        } else {
          // Fin de la dictée
          setProgress(100);
          toast({
            title: 'Dictée terminée',
            description: 'Toutes les phrases ont été lues',
          });
        }
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSentenceIndex, sentences.length, isVoluntaryStop, toast]);

  const handlePlay = () => {
    speakSentence(currentSentenceIndex);
  };

  const handlePause = () => {
    setIsVoluntaryStop(true);
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsVoluntaryStop(true);
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentSentenceIndex(0);
    setProgress(0);
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      const newIndex = currentSentenceIndex - 1;
      setCurrentSentenceIndex(newIndex);
      if (isPlaying) {
        speakSentence(newIndex);
      }
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const newIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(newIndex);
      if (isPlaying) {
        speakSentence(newIndex);
      }
    }
  };

  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
    if (isPlaying) {
      speakSentence(index);
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
    setIsVoluntaryStop(true);
    speechSynthesis.cancel();
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
      >
        Phrase {index + 1}
      </span>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Audio element caché pour ElevenLabs */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélecteur de mode vocal */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Qualité vocale :</h3>
                <p className="text-sm text-yellow-800">
                  {useElevenLabs ? 'Mode Premium (ElevenLabs) - Voix de haute qualité' : 'Mode Standard (Navigateur) - Voix native'}
                </p>
              </div>
              <Button
                onClick={() => setUseElevenLabs(!useElevenLabs)}
                variant={useElevenLabs ? "default" : "outline"}
                size="sm"
              >
                {useElevenLabs ? '🎙️ Premium' : '🔊 Standard'}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions :</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cliquez sur "Lire" pour commencer la dictée phrase par phrase</li>
              <li>• Utilisez les flèches pour naviguer entre les phrases</li>
              <li>• Cliquez sur une phrase dans le texte pour la sélectionner</li>
              <li>• "Pause" arrête la lecture, "Stop" remet au début</li>
              <li>• Écrivez ce que vous entendez dans la zone de texte</li>
            </ul>
          </div>

          {/* Texte avec phrases surlignées */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Texte de la dictée :</h4>
            <div className="text-sm leading-relaxed">
              {renderTextWithHighlight()}
            </div>
          </div>

          {/* Contrôles audio */}
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
                  Phrase {currentSentenceIndex + 1} sur {sentences.length}
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
