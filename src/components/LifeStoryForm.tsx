
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, Save, Edit3 } from 'lucide-react';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useAuth } from '@/contexts/AuthContext';
import { LifeStory, LifeStoryProgress, Chapter } from '@/types/lifeStory';
import VoiceRecorder from './VoiceRecorder';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Définition des chapitres et questions
const initialChapters: Chapter[] = [
  {
    id: 'ch1',
    title: 'Enfance et Famille',
    description: 'Souvenirs et relations familiales',
    questions: [
      { id: 'q1_1', text: 'Quel est votre tout premier souvenir d'enfance ?' },
      { id: 'q1_2', text: 'Comment décririez-vous vos parents ? Quels traits de caractère ou valeurs vous ont-ils transmis ?' },
      { id: 'q1_3', text: 'Avez-vous des frères et sœurs ? Quelle était votre relation avec eux (complicité, rivalité, etc.) ?' },
      { id: 'q1_4', text: 'Quels sont les moments marquants de votre enfance (vacances, traditions familiales, jeux, etc.) ?' },
      { id: 'q1_5', text: 'Comment était votre maison d'enfance et votre quartier ? Y a-t-il des anecdotes liées à cet environnement ?' },
      { id: 'q1_6', text: 'Y a-t-il des figures familiales élargies (grands-parents, oncles, tantes) qui ont joué un rôle important ?' },
    ],
  },
  {
    id: 'ch2',
    title: 'Éducation et Formation',
    description: 'Parcours scolaire et apprentissages',
    questions: [
      { id: 'q2_1', text: 'Quelle était votre école préférée et pourquoi ? Y a-t-il des enseignants qui vous ont particulièrement marqué ?' },
      { id: 'q2_2', text: 'Quelles étaient vos matières favorites et celles que vous aimiez le moins ?' },
      { id: 'q2_3', text: 'Avez-vous des souvenirs marquants de vos années d'études (amitiés, événements scolaires, réussites, échecs) ?' },
      { id: 'q2_4', text: 'Avez-vous poursuivi des études supérieures ? Si oui, comment avez-vous choisi votre domaine ?' },
      { id: 'q2_5', text: 'Y a-t-il des mentors ou des figures inspirantes qui ont influencé votre parcours éducatif ?' },
    ],
  },
  {
    id: 'ch3',
    title: 'Adolescence et Jeunesse',
    description: 'Période de découvertes et transformations',
    questions: [
      { id: 'q3_1', text: 'Comment avez-vous vécu votre adolescence (rébellions, explorations, premières fois) ?' },
      { id: 'q3_2', text: 'Quels étaient vos passe-temps, passions ou rêves à cette époque ?' },
      { id: 'q3_3', text: 'Avez-vous eu des expériences qui ont façonné votre personnalité ou vos valeurs (voyages, rencontres, etc.) ?' },
      { id: 'q3_4', text: 'Quels sont les événements marquants de cette période (premier amour, premier emploi, déménagement, etc.) ?' },
      { id: 'q3_5', text: 'Y a-t-il des anecdotes amusantes ou embarrassantes de votre jeunesse que vous aimeriez partager ?' },
    ],
  },
  {
    id: 'ch4',
    title: 'Vie Professionnelle',
    description: 'Carrière et accomplissements professionnels',
    questions: [
      { id: 'q4_1', text: 'Quel a été votre premier emploi et comment l'avez-vous obtenu ?' },
      { id: 'q4_2', text: 'Quelles ont été les étapes clés de votre carrière (promotions, changements de poste, reconversions) ?' },
      { id: 'q4_3', text: 'Avez-vous des anecdotes ou des leçons apprises dans votre vie professionnelle (collègues, projets, échecs, succès) ?' },
      { id: 'q4_4', text: 'Comment votre carrière a-t-elle influencé votre vie personnelle (équilibre travail-vie, sacrifices, opportunités) ?' },
      { id: 'q4_5', text: 'Y a-t-il un moment où vous avez senti que vous aviez atteint un sommet professionnel ou réalisé un rêve ?' },
    ],
  },
  {
    id: 'ch5',
    title: 'Relations et Vie Sociale',
    description: 'Amitiés et relations importantes',
    questions: [
      { id: 'q5_1', text: 'Qui sont les personnes les plus importantes dans votre vie (amis, mentors, partenaires) et pourquoi ?' },
      { id: 'q5_2', text: 'Comment avez-vous rencontré votre conjoint/partenaire, si applicable ? Quelle est l'histoire de votre relation ?' },
      { id: 'q5_3', text: 'Quelles sont les amitiés ou relations amoureuses qui ont eu un impact significatif sur vous ?' },
      { id: 'q5_4', text: 'Avez-vous des anecdotes sur des moments partagés avec des proches (fêtes, voyages, disputes, réconciliations) ?' },
      { id: 'q5_5', text: 'Y a-t-il des personnes que vous avez perdues et qui vous manquent particulièrement ?' },
    ],
  },
  {
    id: 'ch6',
    title: 'Défis et Obstacles',
    description: 'Difficultés et résilience',
    questions: [
      { id: 'q6_1', text: 'Quels ont été les plus grands défis que vous avez affrontés (personnels, professionnels, de santé, etc.) ?' },
      { id: 'q6_2', text: 'Comment avez-vous surmonté ces obstacles ? Qui ou quoi vous a aidé ?' },
      { id: 'q6_3', text: 'Quelles leçons avez-vous tirées de ces expériences difficiles ?' },
      { id: 'q6_4', text: 'Y a-t-il des regrets ou des choses que vous auriez aimé faire différemment ?' },
      { id: 'q6_5', text: 'Comment ces défis ont-ils façonné la personne que vous êtes aujourd'hui ?' },
    ],
  },
  {
    id: 'ch7',
    title: 'Réalisations et Moments de Fierté',
    description: 'Succès personnels et accomplissements',
    questions: [
      { id: 'q7_1', text: 'Quelles sont vos plus grandes réalisations personnelles et professionnelles ?' },
      { id: 'q7_2', text: 'Quels sont les moments où vous vous êtes senti le plus fier (diplômes, projets, actes de générosité, etc.) ?' },
      { id: 'q7_3', text: 'Comment ces succès ont-ils influencé votre vie ou celle des autres ?' },
      { id: 'q7_4', text: 'Y a-t-il des reconnaissances ou des récompenses qui ont une signification particulière pour vous ?' },
    ],
  },
  {
    id: 'ch8',
    title: 'Voyages et Aventures',
    description: 'Exploration et découvertes',
    questions: [
      { id: 'q8_1', text: 'Quels sont les voyages qui vous ont le plus marqué et pourquoi ?' },
      { id: 'q8_2', text: 'Avez-vous des anecdotes amusantes, surprenantes ou significatives de vos aventures ?' },
      { id: 'q8_3', text: 'Comment les voyages ont-ils élargi votre perspective sur le monde ou sur vous-même ?' },
      { id: 'q8_4', text: 'Y a-t-il un lieu que vous considérez comme votre « chez-vous » loin de chez vous ?' },
    ],
  },
  {
    id: 'ch9',
    title: 'Passions et Loisirs',
    description: 'Hobbies et intérêts personnels',
    questions: [
      { id: 'q9_1', text: 'Quelles sont vos passions et hobbies (sports, arts, collections, etc.) ?' },
      { id: 'q9_2', text: 'Comment avez-vous découvert ces intérêts et comment ont-ils évolué au fil du temps ?' },
      { id: 'q9_3', text: 'Quels sont les moments marquants liés à ces activités (compétitions, créations, rencontres) ?' },
      { id: 'q9_4', text: 'Y a-t-il une passion que vous avez abandonnée et que vous regrettez ?' },
    ],
  },
  {
    id: 'ch10',
    title: 'Réflexions et Leçons de Vie',
    description: 'Sagesse et regards sur le parcours',
    questions: [
      { id: 'q10_1', text: 'Quelles sont les leçons les plus importantes que vous avez apprises au cours de votre vie ?' },
      { id: 'q10_2', text: 'Quels conseils donneriez-vous à votre jeune-moi si vous le pouviez ?' },
      { id: 'q10_3', text: 'Comment voyez-vous votre vie dans son ensemble ? Quels sont les fils conducteurs ou les thèmes récurrents ?' },
      { id: 'q10_4', text: 'Quels sont vos espoirs, rêves ou projets pour l'avenir ?' },
      { id: 'q10_5', text: 'Y a-t-il un message ou une sagesse que vous aimeriez transmettre à vos lecteurs ou à vos proches ?' },
    ],
  },
];

interface LifeStoryFormProps {
  existingStory?: LifeStory;
}

export const LifeStoryForm: React.FC<LifeStoryFormProps> = ({ existingStory }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>('ch1');
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState<string | null>(null);
  
  // Initialisation des données de l'histoire
  const initialData: LifeStory = existingStory || {
    title: "Mon histoire de vie",
    chapters: initialChapters,
  };
  
  const { data, updateData, isSaving, lastSaved, saveNow } = useAutoSave({
    initialData,
    userId: user?.id || '',
    onSaveSuccess: (savedStory) => {
      toast({
        title: "Sauvegarde réussie",
        description: "Votre histoire a été sauvegardée avec succès.",
      });
    }
  });
  
  // Calcul de la progression
  const calculateProgress = (): LifeStoryProgress => {
    let total = 0;
    let answered = 0;
    
    data.chapters.forEach(chapter => {
      total += chapter.questions.length;
      answered += chapter.questions.filter(q => q.answer && q.answer.trim().length > 0).length;
    });
    
    return {
      totalQuestions: total,
      answeredQuestions: answered
    };
  };
  
  const progress = calculateProgress();
  const progressPercentage = progress.totalQuestions > 0 
    ? Math.round((progress.answeredQuestions / progress.totalQuestions) * 100) 
    : 0;
  
  // Mise à jour d'une réponse
  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    const updatedChapters = data.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          questions: chapter.questions.map(question => {
            if (question.id === questionId) {
              return { ...question, answer };
            }
            return question;
          })
        };
      }
      return chapter;
    });
    
    updateData({
      chapters: updatedChapters,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    });
  };
  
  // Gestion de l'enregistrement vocal
  const handleVoiceRecorder = (questionId: string) => {
    setShowVoiceRecorder(showVoiceRecorder === questionId ? null : questionId);
  };
  
  const handleTranscription = (text: string) => {
    if (showVoiceRecorder && activeQuestion) {
      const [chapterId, questionId] = activeQuestion.split(':');
      updateAnswer(chapterId, questionId, text);
      setShowVoiceRecorder(null);
    }
  };
  
  // Gestion du focus sur une question
  const handleQuestionFocus = (chapterId: string, questionId: string) => {
    setActiveQuestion(`${chapterId}:${questionId}`);
  };
  
  // Toggle pour ouvrir/fermer les questions dans un chapitre
  const toggleQuestions = (chapterId: string) => {
    setOpenQuestions(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-medium text-tranches-charcoal">
            {data.title || "Mon histoire de vie"}
          </h2>
          <div className="text-sm text-gray-500 mt-1">
            {lastSaved ? (
              <span>Dernière sauvegarde: {format(new Date(lastSaved), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
            ) : (
              <span>Modification en cours...</span>
            )}
          </div>
        </div>
        
        <Button onClick={saveNow} disabled={isSaving}>
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-tranches-sage rounded-full"></span>
              Sauvegarde...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>
      
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progression: {progress.answeredQuestions}/{progress.totalQuestions} questions</span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      {/* Navigation des chapitres */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Chapitres</CardTitle>
              <CardDescription>Naviguez entre les différentes parties de votre histoire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data.chapters.map(chapter => (
                  <div key={chapter.id} className="space-y-1">
                    <div
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${activeTab === chapter.id ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => {
                        setActiveTab(chapter.id);
                        toggleQuestions(chapter.id);
                      }}
                    >
                      <span>{chapter.title}</span>
                      <Button variant="ghost" size="icon" onClick={(e) => {
                        e.stopPropagation();
                        toggleQuestions(chapter.id);
                      }}>
                        {openQuestions[chapter.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {openQuestions[chapter.id] && (
                      <div className="ml-4 pl-2 border-l space-y-1">
                        {chapter.questions.map((question, i) => (
                          <div
                            key={question.id}
                            className={`p-1 text-sm rounded cursor-pointer hover:bg-gray-50 ${activeQuestion === `${chapter.id}:${question.id}` ? 'bg-gray-50 font-medium' : ''}`}
                            onClick={() => {
                              setActiveTab(chapter.id);
                              handleQuestionFocus(chapter.id, question.id);
                            }}
                          >
                            <span className={question.answer ? 'text-green-600' : 'text-gray-500'}>
                              {i + 1}. {question.text.length > 40 ? `${question.text.substring(0, 40)}...` : question.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contenu des chapitres */}
        <div className="md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
              {data.chapters.slice(0, 5).map(chapter => (
                <TabsTrigger key={chapter.id} value={chapter.id}>
                  {chapter.title.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
              {data.chapters.slice(5).map(chapter => (
                <TabsTrigger key={chapter.id} value={chapter.id}>
                  {chapter.title.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {data.chapters.map(chapter => (
              <TabsContent key={chapter.id} value={chapter.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{chapter.title}</CardTitle>
                    <CardDescription>{chapter.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {chapter.questions.map(question => (
                      <div key={question.id} className="space-y-2">
                        <h3 className="font-medium text-tranches-charcoal">{question.text}</h3>
                        
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Votre réponse..."
                            value={question.answer || ''}
                            onChange={(e) => updateAnswer(chapter.id, question.id, e.target.value)}
                            onFocus={() => handleQuestionFocus(chapter.id, question.id)}
                            className="min-h-[120px]"
                          />
                          
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleQuestionFocus(chapter.id, question.id);
                                handleVoiceRecorder(question.id);
                              }}
                            >
                              <Mic className="w-4 h-4 mr-2" />
                              {showVoiceRecorder === question.id 
                                ? 'Cacher l\'enregistrement' 
                                : 'Répondre par la voix'}
                            </Button>
                          </div>
                          
                          {showVoiceRecorder === question.id && (
                            <VoiceRecorder onTranscriptionComplete={handleTranscription} />
                          )}
                        </div>
                        
                        <Separator className="my-4" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LifeStoryForm;
