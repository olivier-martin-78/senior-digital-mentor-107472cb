
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
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
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate audio using Web Speech API (free alternative)
  useEffect(() => {
    if (dictationText && !audioUrl) {
      generateAudio();
    }
  }, [dictationText]);

  const generateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      console.log('Generating audio using Web Speech API...');
      
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported in this browser');
      }

      // Create speech utterance for audio generation only (no immediate playback)
      const utterance = new SpeechSynthesisUtterance(dictationText);
      
      // Configure voice settings
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
        console.log('Using French voice:', frenchVoice.name);
      } else {
        console.log('No French voice found, using default voice');
      }

      // Create audio blob from speech synthesis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log('Audio generated successfully with Web Speech API');
      };

      // Start recording and speak
      mediaRecorder.start();
      speechSynthesis.speak(utterance);

      utterance.onend = () => {
        setTimeout(() => {
          mediaRecorder.stop();
          audioContext.close();
        }, 100);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        mediaRecorder.stop();
        audioContext.close();
        throw new Error('Speech synthesis failed');
      };

    } catch (error) {
      console.error('Error generating audio:', error);
      
      // Fallback: create audio URL for controlled speech synthesis
      console.log('Using fallback mode with controlled speech synthesis...');
      const fallbackUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuE0fG+2+LDdCkGJG/E+eOGOgcUZrXo8KhV3+LDdSYGIm/G9-WMPwgNYLPq9qFQDA0L';
      setAudioUrl(fallbackUrl);
      
      toast({
        title: 'Mode de lecture directe',
        description: 'Audio prêt pour la lecture',
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Initialize audio element when URL is available
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentPosition(audioRef.current.currentTime);
        }
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      
      audioRef.current.onerror = (event) => {
        console.error('Audio playback error:', event);
        setIsPlaying(false);
        toast({
          title: 'Erreur',
          description: 'Impossible de lire l\'audio',
          variant: 'destructive',
        });
      };
    }
  }, [audioUrl, toast]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const speakText = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(dictationText);
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

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        toast({
          title: 'Erreur',
          description: 'Impossible de lire le texte',
          variant: 'destructive',
        });
      };

      speechSynthesis.speak(utterance);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioRef.current.src && !audioRef.current.src.includes('data:audio/wav;base64')) {
      // Use audio element if we have a real audio file
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      // Use speech synthesis for direct playback
      speakText();
    }
  };

  const handlePause = () => {
    if (audioRef.current && !audioRef.current.src.includes('data:audio/wav;base64')) {
      audioRef.current.pause();
    } else {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handleRestart = () => {
    if (audioRef.current && !audioRef.current.src.includes('data:audio/wav;base64')) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      speechSynthesis.cancel();
      setTimeout(() => speakText(), 100);
    }
  };

  const handleSeek = (value: number[]) => {
    const newPosition = value[0];
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = newPosition;
    setCurrentPosition(newPosition);
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
            {isGeneratingAudio ? (
              <div className="flex justify-center items-center space-x-2 py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Génération de l'audio en cours...</span>
              </div>
            ) : (
              <div className="flex justify-center items-center space-x-4">
                <Button
                  onClick={handlePlay}
                  disabled={isPlaying || !audioUrl}
                  variant="outline"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Lire
                </Button>
                
                <Button
                  onClick={handlePause}
                  disabled={!isPlaying || !audioUrl}
                  variant="outline"
                  size="lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                
                <Button
                  onClick={handleRestart}
                  disabled={!audioUrl}
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Recommencer
                </Button>
              </div>
            )}
            
            {/* Curseur de progression */}
            {!isGeneratingAudio && audioUrl && (
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
