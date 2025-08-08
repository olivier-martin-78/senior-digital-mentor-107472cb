import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserActionsService } from '@/services/UserActionsService';

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
      
      // Track answer
      UserActionsService.trackView('activity', 'music-quiz-answer', quizData.title, {
        action: 'answer_submitted',
        questionId: currentQuestion.id,
        answer: answer,
        correctAnswer: currentQuestion.correctAnswer,
        questionIndex: currentQuestionIndex,
        quizType: quizData.quizType
      });
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
      "w-full max-w-2xl mx-auto transition-all duration-300 neon-surface neon-glow",
      gameState === 'playing' && "ring-2 ring-[hsl(var(--neon-2))]",
      gameState === 'answered' && showAnswer && "ring-2 ring-[hsl(var(--neon-3))]"
    )}>
      <CardHeader>
        <CardTitle className="text-center text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--neon-4))] to-[hsl(var(--neon-2))]">{quizData.title}</CardTitle>
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
          <div className="relative aspect-video overflow-hidden rounded-lg">
            {(() => {
              // Extract YouTube URL safely
              const match = currentQuestion.youtubeEmbed.match(/src="([^"]*youtube[^"]*)"/);
              if (match && match[1]) {
                try {
                  const url = new URL(match[1]);
                  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                    return (
                      <iframe
                        src={match[1]}
                        className="w-full h-full border-0"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube video"
                      />
                    );
                  }
                } catch (error) {
                  console.error('Invalid YouTube URL:', error);
                }
              }
               return <div className="flex items-center justify-center h-full neon-text opacity-80">Vidéo non disponible</div>;
            })()}
          </div>
        )}

        {/* Image pour le type "illustrations" */}
        {quizData.quizType === 'illustrations' && currentQuestion.imageUrl && (
          <div className="relative aspect-video rounded-lg overflow-hidden neon-surface">
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
            <div className="flex items-center justify-center space-x-4 p-4 neon-surface rounded-lg neon-glow">
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePlay}
                disabled={gameState !== 'playing'}
                className="w-16 h-16 rounded-full neon-button"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-[hsl(var(--neon-2))] opacity-80" />
                <span className="text-sm neon-text opacity-90">
                  {isPlaying ? 'En cours de lecture...' : 'Audio'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Consigne si disponible et non vide */}
        {currentQuestion.instruction && currentQuestion.instruction.trim() && (
          <div className="p-4 rounded-lg bg-[hsl(var(--neon-2)/0.08)] border border-[hsl(var(--neon-2)/0.35)]">
            <p className="font-medium text-center neon-text">
              {currentQuestion.instruction}
            </p>
          </div>
        )}

        {/* Nom de l'artiste et titre pour le type "videos" seulement */}
        {quizData.quizType === 'videos' && currentQuestion.artistTitle && currentQuestion.artistTitle.trim() && (
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold neon-text">{currentQuestion.artistTitle}</h3>
          </div>
        )}

        {/* Question */}
        <div className="text-center">
          <h4 className="text-xl font-medium mb-6">{currentQuestion.question}</h4>
        </div>

        {/* Réponses */}
        <div className="grid grid-cols-1 gap-4">
          {(['A', 'B', 'C'] as const).map((letter) => {
            const answerKey = `answer${letter}` as keyof Question;
            const answer = currentQuestion[answerKey] as string;
            const isCorrect = showAnswer && currentQuestion.correctAnswer === letter;
            
            return (
              <Button
                key={letter}
                variant="outline"
                size="lg"
                onClick={() => handleAnswerClick(letter)}
                disabled={gameState !== 'playing'}
                className={cn(
                  "w-full justify-start p-4 h-auto text-left neon-answer-button",
                  isCorrect && "neon-correct"
                )}
              >
                <span className="font-bold mr-3 text-lg">{letter}.</span>
                <span className="text-base">{answer}</span>
              </Button>
            );
          })}
        </div>

        {/* Réponse correcte */}
        {showAnswer && (
          <div className="text-center p-4 rounded-lg bg-[hsl(var(--neon-3)/0.08)] border border-[hsl(var(--neon-3)/0.35)]">
            <p className="font-medium text-[hsl(var(--neon-3))]">
              Réponse correcte : {currentQuestion.correctAnswer} - {currentQuestion[`answer${currentQuestion.correctAnswer}` as keyof Question]}
            </p>
          </div>
        )}

        {/* Message si pas d'audio ni vidéo ni image */}
        {!currentQuestion.audioUrl && !currentQuestion.youtubeEmbed && !currentQuestion.imageUrl && (
          <div className="p-3 rounded-lg bg-[hsl(var(--neon-4)/0.08)] border border-[hsl(var(--neon-4)/0.35)]">
            <p className="text-sm text-center text-[hsl(var(--neon-4))]">
              Aucun média disponible pour cette question
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}