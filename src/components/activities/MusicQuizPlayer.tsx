import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  youtubeEmbed: string;
  question: string;
  artistTitle: string;
  answerA: string;
  answerB: string;
  answerC: string;
  correctAnswer: 'A' | 'B' | 'C';
  audioUrl?: string;
  instruction?: string;
  imageUrl?: string;
}

interface QuizData {
  type: 'music_quiz';
  title: string;
  questions: Question[];
  quizType?: 'videos' | 'illustrations';
}

interface MusicQuizPlayerProps {
  quizData: QuizData;
  onAnswer: (questionId: string, answer: string) => void;
  currentQuestionIndex: number;
  gameState: 'waiting' | 'playing' | 'answered';
  showAnswer?: boolean;
}

export function MusicQuizPlayer({ 
  quizData, 
  onAnswer, 
  currentQuestionIndex, 
  gameState, 
  showAnswer 
}: MusicQuizPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const currentQuestion = quizData.questions[currentQuestionIndex];

  const handlePlay = () => {
    if (gameState === 'playing') {
      if (currentQuestion.audioUrl && audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(console.error);
        }
      }
    }
  };

  const handleAnswerClick = (answer: 'A' | 'B' | 'C') => {
    if (gameState === 'playing') {
      onAnswer(currentQuestion.id, answer);
      // Pause l'audio si en cours de lecture
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
    }
  };

  // Gestion des événements audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentQuestion]);

  // Pause l'audio quand une réponse est donnée
  useEffect(() => {
    if (audioRef.current && gameState === 'answered' && isPlaying) {
      audioRef.current.pause();
    }
  }, [gameState, isPlaying]);

  return (
    <Card className={cn(
      "w-full max-w-2xl mx-auto transition-all duration-300",
      gameState === 'playing' && "ring-2 ring-blue-500",
      gameState === 'answered' && showAnswer && "ring-2 ring-green-500"
    )}>
      <CardHeader>
        <CardTitle className="text-center">{quizData.title}</CardTitle>
        <div className="text-center">
          <Badge variant={gameState === 'answered' ? 'default' : 'secondary'}>
            {gameState === 'waiting' && <Clock className="h-3 w-3 mr-1" />}
            {gameState === 'playing' && <Play className="h-3 w-3 mr-1" />}
            {gameState === 'answered' && <CheckCircle className="h-3 w-3 mr-1" />}
            Question {currentQuestionIndex + 1} / {quizData.questions.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Vidéo YouTube si disponible pour le type "videos" */}
        {quizData.quizType === 'videos' && currentQuestion.youtubeEmbed && (
          <div className="relative aspect-video">
            <div 
              dangerouslySetInnerHTML={{ __html: currentQuestion.youtubeEmbed }}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Image pour le type "illustrations" */}
        {quizData.quizType === 'illustrations' && currentQuestion.imageUrl && (
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={currentQuestion.imageUrl} 
              alt="Illustration de la question"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Audio Player si disponible */}
        {currentQuestion.audioUrl && (
          <div className="space-y-3">
            <audio
              ref={audioRef}
              src={currentQuestion.audioUrl}
              preload="metadata"
              className="hidden"
            />
            
            {/* Contrôles audio personnalisés */}
            <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePlay}
                disabled={gameState !== 'playing'}
                className="w-16 h-16 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {isPlaying ? 'En cours de lecture...' : 'Audio'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Consigne si disponible et non vide */}
        {currentQuestion.instruction && currentQuestion.instruction.trim() && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium text-center">
              {currentQuestion.instruction}
            </p>
          </div>
        )}

        {/* Nom de l'artiste et titre pour le type "videos" seulement */}
        {quizData.quizType === 'videos' && currentQuestion.artistTitle && currentQuestion.artistTitle.trim() && (
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{currentQuestion.artistTitle}</h3>
          </div>
        )}

        {/* Question */}
        <div className="text-center">
          <h4 className="text-xl font-medium mb-6">{currentQuestion.question}</h4>
        </div>

        {/* Réponses */}
        <div className="grid grid-cols-1 gap-3">
          {(['A', 'B', 'C'] as const).map((letter) => {
            const answerKey = `answer${letter}` as keyof Question;
            const answer = currentQuestion[answerKey] as string;
            const isCorrect = showAnswer && currentQuestion.correctAnswer === letter;
            
            return (
              <Button
                key={letter}
                variant={isCorrect ? "default" : "outline"}
                size="lg"
                onClick={() => handleAnswerClick(letter)}
                disabled={gameState !== 'playing'}
                className={cn(
                  "w-full justify-start p-4 h-auto text-left",
                  isCorrect && "bg-green-500 hover:bg-green-600 text-white"
                )}
              >
                <span className="font-bold mr-3">{letter}.</span>
                <span>{answer}</span>
              </Button>
            );
          })}
        </div>

        {/* Réponse correcte */}
        {showAnswer && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Réponse correcte : {currentQuestion.correctAnswer} - {currentQuestion[`answer${currentQuestion.correctAnswer}` as keyof Question]}
            </p>
          </div>
        )}

        {/* Message si pas d'audio ni vidéo ni image */}
        {!currentQuestion.audioUrl && !currentQuestion.youtubeEmbed && !currentQuestion.imageUrl && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              Aucun média disponible pour cette question
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}