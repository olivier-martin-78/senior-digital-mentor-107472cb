
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import AudioExtractor from './AudioExtractor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity } from '@/hooks/useActivities';

interface Question {
  id: string;
  youtubeEmbed: string;
  question: string;
  answerA: string;
  answerB: string;
  answerC: string;
  correctAnswer: 'A' | 'B' | 'C';
  audioUrl?: string;
}

interface EditMusicQuizFormProps {
  activity: Activity;
  onSave: () => void;
  onCancel: () => void;
}

const EditMusicQuizForm = ({ activity, onSave, onCancel }: EditMusicQuizFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: activity.title,
    thumbnail_url: activity.thumbnail_url || '',
    shared_globally: activity.shared_globally || false,
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Charger les données du quiz depuis l'iframe_code
    if (activity.iframe_code) {
      try {
        const quizData = JSON.parse(activity.iframe_code);
        if (quizData.type === 'music_quiz' && quizData.questions) {
          setQuestions(quizData.questions);
        }
      } catch (error) {
        console.error('Erreur lors du parsing des données du quiz:', error);
      }
    }
  }, [activity]);

  const addQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, {
        id: (questions.length + 1).toString(),
        youtubeEmbed: '',
        question: '',
        answerA: '',
        answerB: '',
        answerC: '',
        correctAnswer: 'A',
        audioUrl: '',
      }]);
    }
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour modifier un quiz musical',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (questions.some(q => (!q.audioUrl && !q.youtubeEmbed) || !q.question || !q.answerA || !q.answerB || !q.answerC)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir un fichier audio ou un code YouTube et remplir tous les champs pour chaque question',
        variant: 'destructive',
      });
      return;
    }

    try {
      const quizData = {
        type: 'music_quiz',
        title: formData.title,
        questions: questions,
      };

      // Si toutes les questions ont un audio, on peut utiliser le premier comme audio principal
      const firstAudioUrl = questions.find(q => q.audioUrl)?.audioUrl || null;

      const { error } = await supabase
        .from('activities')
        .update({
          title: formData.title,
          thumbnail_url: formData.thumbnail_url || null,
          audio_url: firstAudioUrl,
          iframe_code: JSON.stringify(quizData),
          shared_globally: formData.shared_globally,
        })
        .eq('id', activity.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Quiz musical modifié avec succès',
      });

      onSave();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le quiz musical',
        variant: 'destructive',
      });
    }
  };

  const canShareGlobally = user?.email === 'olivier.martin.78000@gmail.com';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier le Quiz Musical</CardTitle>
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
                  <div>
                    <Label>Code d'intégration YouTube</Label>
                    <Textarea
                      value={question.youtubeEmbed}
                      onChange={(e) => updateQuestion(question.id, 'youtubeEmbed', e.target.value)}
                      placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." title="YouTube video player" frameborder="0" allow="..." allowfullscreen></iframe>'
                      rows={3}
                    />
                  </div>

                  {question.youtubeEmbed && (
                    <div className="space-y-2">
                      <Label>Extraction automatique d'audio (pour iOS)</Label>
                      <AudioExtractor
                        youtubeUrl={extractYouTubeUrl(question.youtubeEmbed)}
                        onAudioExtracted={(audioUrl) => handleAudioExtracted(question.id, audioUrl)}
                      />
                    </div>
                  )}

                  <div>
                    <Label>OU Upload manuel de fichier audio</Label>
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
            <Button type="submit">Enregistrer les modifications</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditMusicQuizForm;
