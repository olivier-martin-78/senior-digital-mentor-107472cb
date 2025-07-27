import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserActionsService } from '@/services/UserActionsService';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "Quelle est l'année de sortie des \"Dents de la mer\" de Steven Spielberg ?",
    options: ["1975", "1977", "1979"],
    correctAnswer: "1975"
  },
  {
    id: 2,
    question: "Quel pont reliant une île de la côte Atlantique au continent est inauguré le 7 juillet 1971 ?",
    options: ["L'île de Ré", "L'île de Noirmoutier", "L'île d'Oléron"],
    correctAnswer: "L'île de Noirmoutier"
  },
  {
    id: 3,
    question: "En tennis, qui gagne 56 matchs consécutifs en 1974 ?",
    options: ["Martina Navratilova", "Chris Evert", "Bjorn Börg"],
    correctAnswer: "Chris Evert"
  },
  {
    id: 4,
    question: "\"Le fil vert sur le bouton vert, le fil rouge sur le bouton rouge\" réplique culte d'un film de 1975 !",
    options: ["La septième compagnie au clair de Lune", "Mais où est donc passée la septième compagnie", "On a retrouvé la septième compagnie"],
    correctAnswer: "On a retrouvé la septième compagnie"
  },
  {
    id: 5,
    question: "Quel était le prénom de la femme de Georges Marchais ?",
    options: ["Sylviane", "Liliane", "Eliane"],
    correctAnswer: "Liliane"
  },
  {
    id: 6,
    question: "Qu'est-ce qui est bionique chez \"L'homme qui valait 3 milliards\", en 1975 ?",
    options: ["Le bras droit, l'œil gauche et les jambes", "La jambe gauche, l'œil et le bras droit", "Les bras, la jambe droite et l'œil gauche"],
    correctAnswer: "Le bras droit, l'œil gauche et les jambes"
  },
  {
    id: 7,
    question: "Avant le 5 juillet 1974, quel était l'âge de la majorité légale en France ?",
    options: ["21 ans", "20 ans", "19 ans"],
    correctAnswer: "21 ans"
  },
  {
    id: 8,
    question: "Comment s'appelle le personnage joué par John Travolta dans \"La fièvre du samedi soir\" en 1977 ?",
    options: ["Dany Zuki", "Tony Manero", "Tony Marciano"],
    correctAnswer: "Tony Manero"
  },
  {
    id: 9,
    question: "Qui fait cadeau de tout son amour à son petit garçon dans une chanson de 1974 ?",
    options: ["Nicoletta", "Marie Laforêt", "Nicole Croisille"],
    correctAnswer: "Marie Laforêt"
  },
  {
    id: 10,
    question: "De ces trois inventions des années 1970, laquelle est apparue la première ?",
    options: ["Le magnétoscope", "Le walkman", "Le micro-ordinateur"],
    correctAnswer: "Le magnétoscope"
  },
  {
    id: 11,
    question: "Où se déroulent les évènements tragiques du Bloody Sunday, le dimanche 30 janvier 1972 ?",
    options: ["Écosse", "Irlande du Nord", "Pays de Galles"],
    correctAnswer: "Irlande du Nord"
  },
  {
    id: 12,
    question: "Comment s'appelle la James Bond girl qu'interprète Lana Wood dans \"Les diamants sont éternels\", en 1971 ?",
    options: ["Bonne-Nuit", "Holly Goodhead", "Abondance de la queue"],
    correctAnswer: "Abondance de la queue"
  },
  {
    id: 13,
    question: "Qu'est-ce qui frappe les lecteurs de Tintin lorsque paraît en 1976, l'album \"Tintin et les Picaros\" ?",
    options: ["Il est en jeans", "Il porte un bracelet montre", "Il fume de la marijuana"],
    correctAnswer: "Il est en jeans"
  },
  {
    id: 14,
    question: "Ancien 1er secrétaire du Parti communiste d'Union soviétique, Nikita...",
    options: ["Kroutchev", "Khrouchtchev", "Khroutchev"],
    correctAnswer: "Khrouchtchev"
  },
  {
    id: 15,
    question: "Qui est le \"Cannibale\" du vélo dans les années 1970 ?",
    options: ["Eddy Merckx", "Jacques Anquetil", "Bernard Hinault"],
    correctAnswer: "Eddy Merckx"
  }
];

const encouragingMessages = {
  correct: [
    "Fantastique ! 🌟",
    "Bravo ! 🎉",
    "Excellent ! ✨",
    "Super ! 🎊",
    "Parfait ! 🌈",
    "Magnifique ! 🎭",
    "Génial ! 🎯"
  ],
  incorrect: [
    "Pas de souci, continuez ! 💪",
    "La prochaine sera la bonne ! 🌟",
    "Courage, vous y arrivez ! 🎯",
    "Continuez, c'est bien ! ✨",
    "Ne vous découragez pas ! 🌈",
    "Allez-y, persévérez ! 🎊",
    "Vous progressez ! 🎭"
  ]
};

const Quiz70sGame: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ question: number; selected: string; correct: string; isCorrect: boolean }[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted) {
      UserActionsService.trackView('activity', 'quiz70s-game-start', 'Quiz Années 70 - Partie commencée').catch(console.error);
      setGameStarted(true);
    }
  }, [gameStarted]);

  const currentQuestion = questions[currentQuestionIndex];

  const getRandomMessage = (isCorrect: boolean) => {
    const messages = isCorrect ? encouragingMessages.correct : encouragingMessages.incorrect;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return; // Empêcher de changer la réponse

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([...answers, {
      question: currentQuestion.id,
      selected: answer,
      correct: currentQuestion.correctAnswer,
      isCorrect
    }]);

    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameCompleted(true);
      // Track game completion
      UserActionsService.trackView('activity', 'quiz70s-game-completed', `Quiz Années 70 - Terminé avec ${score}/${questions.length} bonnes réponses`).catch(console.error);
    }
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setGameCompleted(false);
  };

  const percentage = Math.round((score / questions.length) * 100);

  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <Link 
            to="/activities" 
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux activités
          </Link>

          <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-t-lg">
              <Trophy className="w-16 h-16 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold">Quiz terminé !</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Votre score : {score}/{questions.length}
                </h3>
                <div className="text-4xl font-bold text-primary mb-4">
                  {percentage}%
                </div>
                <p className="text-lg text-gray-600">
                  {percentage >= 80 ? "Excellent ! Vous maîtrisez parfaitement les années 70 ! 🌟" :
                   percentage >= 60 ? "Très bien ! Vous avez de belles connaissances sur cette décennie ! 🎉" :
                   percentage >= 40 ? "Pas mal ! Continuez à explorer cette époque fascinante ! 💪" :
                   "Courage ! Les années 70 n'ont plus de secrets, continuez à apprendre ! 🌈"}
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={resetGame}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3"
                >
                  Rejouer
                </Button>
                <Link to="/activities">
                  <Button 
                    variant="outline"
                    className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Retour aux activités
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/activities" 
          className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux activités
        </Link>

        <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="text-center">
              <div className="flex items-center justify-between">
                <span className="text-lg">Quiz Années 70</span>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ";
                  
                  if (!showResult) {
                    buttonClass += "border-gray-200 hover:border-primary hover:bg-primary/10 bg-white";
                  } else {
                    if (option === currentQuestion.correctAnswer) {
                      buttonClass += "border-green-500 bg-green-100 text-green-800";
                    } else if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
                      buttonClass += "border-red-500 bg-red-100 text-red-800";
                    } else {
                      buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {showResult && option === currentQuestion.correctAnswer && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {showResult && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800 mb-2">
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <span className="text-green-700">
                          {getRandomMessage(true)}
                        </span>
                      ) : (
                        <span className="text-orange-700">
                          {getRandomMessage(false)}
                        </span>
                      )}
                    </p>
                    {selectedAnswer !== currentQuestion.correctAnswer && (
                      <p className="text-sm text-gray-600 mb-3">
                        La bonne réponse était : <strong>{currentQuestion.correctAnswer}</strong>
                      </p>
                    )}
                    <Button 
                      onClick={handleNextQuestion}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold"
                    >
                      {currentQuestionIndex < questions.length - 1 ? 'Question suivante' : 'Voir les résultats'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quiz70sGame;