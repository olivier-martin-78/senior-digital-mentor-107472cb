
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();

  // Fonction pour synthétiser et lire le texte avec l'API Speech Synthesis
  const handleSynthesizeAndPlay = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: 'Synthèse vocale non supportée',
        description: 'Votre navigateur ne supporte pas la synthèse vocale.',
        variant: 'destructive',
      });
      return;
    }

    // Arrêter toute synthèse en cours
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurer la voix française si disponible
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8; // Vitesse de lecture plus lente pour la dictée
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log('🎵 Synthèse vocale démarrée');
      setIsPlaying(true);
    };

    utterance.onend = () => {
      console.log('🎵 Synthèse vocale terminée');
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('Erreur synthèse vocale:', event);
      setIsPlaying(false);
      toast({
        title: 'Erreur de synthèse vocale',
        description: 'Impossible de lire le texte avec la synthèse vocale.',
        variant: 'destructive',
      });
    };

    window.speechSynthesis.speak(utterance);
  };
  
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

  // Synchronisation de l'URL audio permanente avec currentAudioUrl
  useEffect(() => {
    console.log('DictationGame - audioUrl reçue:', audioUrl);
    console.log('DictationGame - currentAudioUrl état actuel:', currentAudioUrl);
    
    // Si on a une URL permanente (Supabase) et qu'elle est différente de currentAudioUrl
    if (audioUrl && audioUrl !== currentAudioUrl) {
      console.log('DictationGame - Synchronisation URL permanente:', audioUrl);
      setCurrentAudioUrl(audioUrl);
    }
  }, [audioUrl, currentAudioUrl]);

  // Initialisation - seulement au premier chargement
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

  const handlePlay = async () => {
    console.log('🎵 handlePlay - Début de lecture');
    console.log('🎵 currentAudioUrl:', currentAudioUrl);
    console.log('🎵 audioUrl prop initial:', audioUrl);
    
    if (!currentAudioUrl) {
      // Pas de fichier audio - utiliser la synthèse vocale pour la phrase actuelle
      console.log('🎵 Pas de fichier audio - utilisation de la synthèse vocale');
      if (sentences.length > 0 && currentSentenceIndex < sentences.length) {
        const currentSentence = sentences[currentSentenceIndex];
        handleSynthesizeAndPlay(currentSentence.text);
      } else {
        toast({
          title: 'Aucune phrase disponible',
          description: 'Impossible de lire la dictée car aucune phrase n\'est sélectionnée.',
          variant: 'destructive',
        });
      }
      return;
    }

    console.log('🎵 Type d\'URL détecté:', currentAudioUrl.startsWith('blob:') ? 'Blob URL' : 'URL normale');

    if (audioRef.current) {
      try {
        console.log('🎵 Configuration de l\'élément audio...');
        console.log('🎵 Audio element état avant:', {
          src: audioRef.current.src,
          readyState: audioRef.current.readyState,
          networkState: audioRef.current.networkState,
          currentTime: audioRef.current.currentTime
        });
        
        // Ne recharger l'audio que si nécessaire
        if (audioRef.current.src !== currentAudioUrl) {
          console.log('🎵 URL différente - rechargement nécessaire');
          audioRef.current.src = currentAudioUrl;
          audioRef.current.load();
        } else if (audioRef.current.readyState < 2) {
          console.log('🎵 Audio pas encore prêt - rechargement nécessaire');
          audioRef.current.load();
        } else {
          console.log('🎵 Audio déjà prêt - pas de rechargement');
        }
        
        console.log('🎵 Audio element état après traitement:', {
          src: audioRef.current.src,
          readyState: audioRef.current.readyState,
          networkState: audioRef.current.networkState,
          currentTime: audioRef.current.currentTime
        });
        
        // Attendre un peu pour que l'audio soit prêt sur iOS (seulement si rechargé)
        if (audioRef.current.readyState < 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('🎵 Tentative de lecture...');
        await audioRef.current.play();
        console.log('✅ Lecture démarrée avec succès');
      } catch (error) {
        console.error('❌ Error playing audio:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        console.error('❌ Audio element final state:', {
          src: audioRef.current?.src,
          readyState: audioRef.current?.readyState,
          networkState: audioRef.current?.networkState,
          error: audioRef.current?.error
        });
        
        // Si l'erreur est due à une URL blob expirée (fichier temporaire du joueur), basculer vers la synthèse vocale
        // Ne pas traiter les URLs permanentes de Supabase comme expirées
        if (error.name === 'NotSupportedError' && currentAudioUrl.startsWith('blob:')) {
          console.log('🎵 URL blob temporaire expirée - basculement vers synthèse vocale');
          setCurrentAudioUrl(null); // Supprimer l'URL blob expirée
          toast({
            title: 'Fichier audio temporaire expiré',
            description: 'Le fichier audio temporaire a expiré. Basculement vers la synthèse vocale.',
            variant: 'default',
          });
          
          // Relancer avec synthèse vocale
          if (sentences.length > 0 && currentSentenceIndex < sentences.length) {
            const currentSentence = sentences[currentSentenceIndex];
            handleSynthesizeAndPlay(currentSentence.text);
          }
          return;
        }
        
        // Pour les fichiers permanents (Supabase), ne pas traiter comme expiré
        if (currentAudioUrl && !currentAudioUrl.startsWith('blob:')) {
          console.log('🎵 Erreur avec fichier permanent - pas de basculement vers synthèse vocale');
        }
        
        toast({
          title: 'Erreur de lecture',
          description: `Impossible de lire le fichier audio. ${error.message}`,
          variant: 'destructive',
        });
      }
    } else {
      console.log('❌ audioRef.current est null');
    }
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
      setCurrentTime(duration);
      toast({
        title: 'Dictée terminée',
        description: 'L\'audio est terminé',
      });
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      const total = audio.duration;
      setCurrentTime(current);
      if (total) {
        setProgress((current / total) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [toast, duration]);

  const handlePause = () => {
    if (currentAudioUrl && audioRef.current) {
      audioRef.current.pause();
    } else {
      // Arrêter la synthèse vocale
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (currentAudioUrl && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      // Arrêter complètement la synthèse vocale
      window.speechSynthesis.cancel();
    }
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
    // Si on a un fichier audio MP3, on ne peut pas naviguer par phrases
    if (currentAudioUrl) {
      toast({
        title: 'Navigation par phrases non disponible',
        description: 'Avec les fichiers audio, utilisez les contrôles de lecture pour écouter toute la dictée.',
        variant: 'default',
      });
      return;
    }
    
    setCurrentSentenceIndex(index);
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

  const handleSeek = (value: number) => {
    console.log('🎯 handleSeek appelée avec value:', value);
    console.log('🎯 Duration actuelle:', duration);
    
    if (audioRef.current && duration) {
      const newTime = (value / 100) * duration;
      console.log('🎯 Nouveau temps calculé:', newTime);
      console.log('🎯 Audio currentTime avant:', audioRef.current.currentTime);
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(value);
      
      console.log('🎯 Audio currentTime après:', audioRef.current.currentTime);
      console.log('🎯 State currentTime mis à jour:', newTime);
    } else {
      console.log('❌ handleSeek: audioRef ou duration manquant');
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetGame = () => {
    setUserText('');
    setShowCorrection(false);
    setScore(20);
    setDifferences([]);
    setCurrentSentenceIndex(0);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const renderTextWithHighlight = () => {
    // Mode sans audio - afficher seulement les numéros de phrases
    return sentences.map((sentence, index) => (
      <span
        key={index}
        className={`cursor-pointer p-2 m-1 rounded transition-colors inline-block ${
          index === currentSentenceIndex
            ? 'bg-blue-200 text-blue-900'
            : 'hover:bg-gray-100'
        }`}
        onClick={() => handleSentenceClick(index)}
        title="Cliquez pour sélectionner cette phrase"
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

          {/* Texte de référence */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Texte de la dictée :</h4>
            <div className="text-sm leading-relaxed">
              {renderTextWithHighlight()}
            </div>
            {!currentAudioUrl && sentences.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                Phrase sélectionnée : {currentSentenceIndex + 1} sur {sentences.length}
              </div>
            )}
          </div>

          {/* Upload de fichier audio optionnel */}
          {!currentAudioUrl && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Fichier audio (optionnel) :</h4>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="text-sm"
                />
                <p className="text-xs text-blue-700">
                  Chargez un fichier MP3 pour une meilleure qualité audio, ou utilisez la synthèse vocale du navigateur (qualité variable selon l'appareil).
                </p>
              </div>
            </div>
          )}

          {/* Contrôles audio */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2">
              {!currentAudioUrl && (
                <>
                  <Button
                    onClick={handlePreviousSentence}
                    disabled={!isReady || currentSentenceIndex === 0}
                    variant="outline"
                    size="sm"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              <Button
                onClick={handlePlay}
                disabled={!isReady || isPlaying}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Lire
              </Button>
              
              <Button
                onClick={handlePause}
                disabled={!isReady || !isPlaying}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              
              <Button
                onClick={handleStop}
                disabled={!isReady}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
              
              {!currentAudioUrl && (
                <Button
                  onClick={handleNextSentence}
                  disabled={!isReady || currentSentenceIndex === sentences.length - 1}
                  variant="outline"
                  size="sm"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Progression et contrôles temporels */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                  {currentAudioUrl ? 'Audio continu' : 
                   (sentences.length > 0 && `Phrase ${currentSentenceIndex + 1} sur ${sentences.length}`)}
                </div>
                <div>
                  {isPlaying && '🔊 Lecture en cours...'}
                  {!isPlaying && progress > 0 && progress < 100 && '⏸️ En pause'}
                  {progress === 100 && '✓ Dictée terminée'}
                </div>
              </div>

              {/* Barre de progression interactive pour l'audio */}
              {currentAudioUrl && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              {/* Barre de progression simple pour le mode sans audio */}
              {!currentAudioUrl && (
                <Progress 
                  value={progress} 
                  className="w-full" 
                  indicatorClassName={isPlaying ? 'bg-blue-500' : 'bg-green-500'}
                />
              )}
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
