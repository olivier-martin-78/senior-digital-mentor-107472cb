import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import AudioExtractor from './AudioExtractor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
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
  quizType: 'videos' | 'illustrations';
  showInstructionAfterAnswer?: boolean;
}

interface CreateMusicQuizFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateMusicQuizForm = ({ onSuccess, onCancel }: CreateMusicQuizFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    thumbnail_url: '',
    shared_globally: false,
    showInstructionAfterAnswer: false,
  });
  
  const [quizType, setQuizType] = useState<'videos' | 'illustrations'>('videos');
  
  const [selectedSubTagId, setSelectedSubTagId] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      youtubeEmbed: '',
      question: '',
      artistTitle: '',
      answerA: '',
      answerB: '',
      answerC: '',
      correctAnswer: 'A' as 'A' | 'B' | 'C',
    }
  ]);

  const addQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, {
        id: (questions.length + 1).toString(),
        youtubeEmbed: '',
        question: '',
        artistTitle: '',
        answerA: '',
        answerB: '',
        answerC: '',
        correctAnswer: 'A',
      }]);
    }
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = useCallback((id: string, field: keyof Question, value: string) => {
    console.log('🔍 [QUIZ_FORM_DEBUG] Mise à jour question:', id, field, value);
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  }, []);

  const handleAudioUpload = async (questionId: string, file: File | undefined) => {
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `audio/quiz_${questionId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('activity-thumbnails')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('activity-thumbnails')
        .getPublicUrl(fileName);

      updateQuestion(questionId, 'audioUrl', publicUrl);

      toast({
        title: 'Succès',
        description: 'Fichier audio uploadé avec succès',
      });
    } catch (error) {
      console.error('Erreur upload audio:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader le fichier audio',
        variant: 'destructive',
      });
    }
  };

  const handleAudioExtracted = (questionId: string, audioUrl: string) => {
    updateQuestion(questionId, 'audioUrl', audioUrl);
  };

  const handleImageUpload = async (questionId: string, file: File | undefined) => {
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `images/quiz_${questionId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('activity-thumbnails')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('activity-thumbnails')
        .getPublicUrl(fileName);

      updateQuestion(questionId, 'imageUrl', publicUrl);

      toast({
        title: 'Succès',
        description: 'Image uploadée avec succès',
      });
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image',
        variant: 'destructive',
      });
    }
  };

  const extractYouTubeUrl = (embedCode: string): string => {
    const match = embedCode.match(/src="([^"]+)"/);
    if (match) {
      const embedUrl = match[1];
      const videoIdMatch = embedUrl.match(/embed\/([^?]+)/);
      if (videoIdMatch) {
        return `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
      }
    }
    return '';
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 [QUIZ_FORM_DEBUG] DÉBUT SOUMISSION FORMULAIRE');
    console.log('🔍 [QUIZ_FORM_DEBUG] User connecté:', !!user);
    console.log('🔍 [QUIZ_FORM_DEBUG] Nombre de questions:', questions.length);
    console.log('🔍 [QUIZ_FORM_DEBUG] Titre du quiz:', formData.title);
    console.log('🔍 [QUIZ_FORM_DEBUG] Type de quiz:', quizType);
    console.log('🔍 [QUIZ_FORM_DEBUG] Questions détaillées:', JSON.stringify(questions, null, 2));
    
    if (!user) {
      console.log('🔍 [QUIZ_FORM_DEBUG] Erreur: utilisateur non connecté');
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer un quiz musical',
        variant: 'destructive',
      });
      return;
    }

    // Validation : au moins une question complète
    const completeQuestions = questions.filter(q => {
      const isComplete = quizType === 'videos' 
        ? (q.audioUrl || q.youtubeEmbed) && q.question && q.answerA && q.answerB && q.answerC
        : q.imageUrl && q.question && q.answerA && q.answerB && q.answerC;
      
      console.log('🔍 [QUIZ_FORM_DEBUG] Question', q.id, 'complète:', isComplete, q);
      return isComplete;
    });

    console.log('🔍 [QUIZ_FORM_DEBUG] Questions complètes:', completeQuestions.length);

    if (completeQuestions.length === 0) {
      console.log('🔍 [QUIZ_FORM_DEBUG] Erreur: aucune question complète');
      toast({
        title: 'Erreur',
        description: 'Veuillez compléter au moins une question entièrement',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🔍 [QUIZ_FORM_DEBUG] Construction des données quiz...');
      
      const quizData = {
        type: 'music_quiz',
        title: formData.title,
        questions: completeQuestions, // Utilise seulement les questions complètes
        quizType: quizType,
        showInstructionAfterAnswer: formData.showInstructionAfterAnswer,
      };

      console.log('🔍 [QUIZ_FORM_DEBUG] Quiz data créée:', quizData);
      console.log('🔍 [QUIZ_FORM_DEBUG] Taille JSON:', JSON.stringify(quizData).length, 'caractères');

      // Si toutes les questions ont un audio, on peut utiliser le premier comme audio principal
      const firstAudioUrl = completeQuestions.find(q => q.audioUrl)?.audioUrl || null;

      console.log('🔍 [QUIZ_FORM_DEBUG] Insertion en base de données...');
      
      const activityData = {
        activity_type: 'games',
        title: formData.title,
        link: '',
        thumbnail_url: formData.thumbnail_url || null,
        audio_url: firstAudioUrl,
        iframe_code: JSON.stringify(quizData),
        sub_activity_tag_id: selectedSubTagId,
        created_by: user.id,
        shared_globally: formData.shared_globally,
      };

      console.log('🔍 [QUIZ_FORM_DEBUG] Données activité:', activityData);

      const { error } = await supabase
        .from('activities')
        .insert([activityData]);

      if (error) {
        console.error('🔍 [QUIZ_FORM_DEBUG] Erreur Supabase:', error);
        throw error;
      }
      
      console.log('🔍 [QUIZ_FORM_DEBUG] ✅ Insertion réussie');

      // Track quiz creation
      UserActionsService.trackCreate('activity', 'music-quiz-created', formData.title, {
        action: 'quiz_created',
        questionsCount: questions.length,
        quizType: quizType,
        sharedGlobally: formData.shared_globally,
        subTagId: selectedSubTagId
      });

      toast({
        title: 'Succès',
        description: 'Quiz musical créé avec succès',
      });

      onSuccess();
    } catch (error) {
      console.error('🔍 [QUIZ_FORM_DEBUG] ❌ Erreur lors de la création:', error);
      console.error('🔍 [QUIZ_FORM_DEBUG] ❌ Type d\'erreur:', typeof error);
      console.error('🔍 [QUIZ_FORM_DEBUG] ❌ Message d\'erreur:', error?.message || 'Message non disponible');
      console.error('🔍 [QUIZ_FORM_DEBUG] ❌ Stack trace:', error?.stack || 'Stack non disponible');
      
      toast({
        title: 'Erreur',
        description: `Impossible de créer le quiz musical: ${error?.message || 'Erreur inconnue'}`,
        variant: 'destructive',
      });
    }
  }, [user, questions, formData, quizType, selectedSubTagId, toast, onSuccess]);

  const canShareGlobally = user?.email === 'olivier.martin.78000@gmail.com';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un quiz</CardTitle>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Compatible iOS :</strong> Pour que votre quiz fonctionne sur iPad/iPhone, 
            ajoutez des fichiers audio ou utilisez l'extracteur automatique YouTube.
            <br />
            <strong>Compatible PC :</strong> Les vidéos YouTube fonctionnent normalement.
          </AlertDescription>
        </Alert>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Titre du quiz</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Quiz Musical - Années 80"
              required
            />
          </div>

          <ActivityThumbnailUploader
            currentThumbnail={formData.thumbnail_url}
            onThumbnailChange={(url) => setFormData({ ...formData, thumbnail_url: url || '' })}
          />

          <div>
            <Label htmlFor="quizType">Type de quiz</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="quizType"
                  value="videos"
                  checked={quizType === 'videos'}
                  onChange={(e) => setQuizType(e.target.value as 'videos' | 'illustrations')}
                  className="text-primary"
                />
                <span>Avec vidéos YouTube</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="quizType"
                  value="illustrations"
                  checked={quizType === 'illustrations'}
                  onChange={(e) => setQuizType(e.target.value as 'videos' | 'illustrations')}
                  className="text-primary"
                />
                <span>Avec illustrations</span>
              </label>
            </div>
          </div>

          <div>
            <SubActivitySelector
              activityType="games"
              selectedSubTagId={selectedSubTagId}
              onSubTagChange={setSelectedSubTagId}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showInstructionAfterAnswer"
              checked={formData.showInstructionAfterAnswer}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, showInstructionAfterAnswer: checked as boolean })
              }
            />
            <Label htmlFor="showInstructionAfterAnswer" className="text-sm font-medium">
              Affiche la consigne après la réponse
            </Label>
          </div>

          {canShareGlobally && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shared_globally"
                checked={formData.shared_globally}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, shared_globally: checked as boolean })
                }
              />
              <Label htmlFor="shared_globally" className="text-sm font-medium">
                Partager avec tout le monde
              </Label>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Questions ({questions.length}/10)</h3>
              {questions.length < 10 && (
                <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une question
                </Button>
              )}
            </div>

            {questions.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {quizType === 'videos' && (
                    <>
                      <div>
                        <Label>Code d'intégration YouTube</Label>
                        <Textarea
                          value={question.youtubeEmbed}
                          onChange={(e) => updateQuestion(question.id, 'youtubeEmbed', e.target.value)}
                          placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." title="YouTube video player" frameborder="0" allow="..." allowfullscreen></iframe>'
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Upload de fichier audio</Label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleAudioUpload(question.id, e.target.files?.[0])}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        {question.audioUrl && (
                          <div className="mt-2">
                            <audio controls className="w-full">
                              <source src={question.audioUrl} type="audio/mpeg" />
                              Votre navigateur ne supporte pas la lecture audio.
                            </audio>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Nom de l'artiste - Titre de la chanson</Label>
                        <Input
                          value={question.artistTitle}
                          onChange={(e) => updateQuestion(question.id, 'artistTitle', e.target.value)}
                          placeholder="Jean-Jacques Goldman - Il changeait la vie"
                          required
                        />
                      </div>
                    </>
                  )}

                  {quizType === 'illustrations' && (
                    <>
                      <div>
                        <Label>Illustration de la question</Label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(question.id, e.target.files?.[0])}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        {question.imageUrl && (
                          <div className="mt-2">
                            <img 
                              src={question.imageUrl} 
                              alt="Illustration de la question"
                              className="w-full max-w-md h-auto rounded-md"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Upload de fichier audio (optionnel)</Label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleAudioUpload(question.id, e.target.files?.[0])}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        {question.audioUrl && (
                          <div className="mt-2">
                            <audio controls className="w-full">
                              <source src={question.audioUrl} type="audio/mpeg" />
                              Votre navigateur ne supporte pas la lecture audio.
                            </audio>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                   <div>
                     <Label>Consigne</Label>
                     <Textarea
                       value={question.instruction || ''}
                       onChange={(e) => updateQuestion(question.id, 'instruction', e.target.value)}
                       placeholder="Trouvez le mot manquant dans cette phrase"
                       rows={2}
                     />
                   </div>

                   <div>
                     <Label>Question</Label>
                     <Input
                       value={question.question}
                       onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                       placeholder="Quel mot vient après cette phrase ?"
                       required
                     />
                   </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Réponse A</Label>
                      <Input
                        value={question.answerA}
                        onChange={(e) => updateQuestion(question.id, 'answerA', e.target.value)}
                        placeholder="Réponse A"
                        required
                      />
                    </div>
                    <div>
                      <Label>Réponse B</Label>
                      <Input
                        value={question.answerB}
                        onChange={(e) => updateQuestion(question.id, 'answerB', e.target.value)}
                        placeholder="Réponse B"
                        required
                      />
                    </div>
                    <div>
                      <Label>Réponse C</Label>
                      <Input
                        value={question.answerC}
                        onChange={(e) => updateQuestion(question.id, 'answerC', e.target.value)}
                        placeholder="Réponse C"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Bonne réponse</Label>
                    <div className="flex gap-4 mt-2">
                      {(['A', 'B', 'C'] as const).map((answer) => (
                        <label key={answer} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            value={answer}
                            checked={question.correctAnswer === answer}
                            onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                            className="text-primary"
                          />
                          <span>Réponse {answer}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit"
              onClick={() => console.log('🔍 [QUIZ_FORM_DEBUG] 🖱️ Bouton "Créer le quiz" cliqué')}
            >
              Créer le quiz
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateMusicQuizForm;
