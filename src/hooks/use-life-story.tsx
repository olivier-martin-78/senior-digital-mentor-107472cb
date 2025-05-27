import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LifeStory, LifeStoryProgress } from '@/types/lifeStory';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { initialChapters } from '@/components/life-story/initialChapters';

interface UseLifeStoryProps {
  existingStory?: LifeStory;
}

export const useLifeStory = ({ existingStory }: UseLifeStoryProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<LifeStory>(
    existingStory || {
      id: '',
      user_id: user?.id || '',
      title: 'Mon histoire',
      chapters: initialChapters,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_edited_chapter: null,
      last_edited_question: null,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    existingStory?.last_edited_chapter || (data.chapters[0]?.id || '')
  );
  const [openQuestions, setOpenQuestions] = useState<{ [key: string]: boolean }>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(
    existingStory?.last_edited_question || null
  );
  const [progress, setProgress] = useState<LifeStoryProgress>({
    totalQuestions: 0,
    answeredQuestions: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fonction pour charger l'histoire existante de l'utilisateur
  const loadUserLifeStory = async () => {
    if (!user || existingStory) return;

    try {
      setIsLoading(true);
      const { data: storyData, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement de l\'histoire:', error);
        return;
      }

      if (storyData) {
        // Fusionner les chapitres existants avec les chapitres initiaux
        const mergedChapters = initialChapters.map(initialChapter => {
          const existingChapter = storyData.chapters?.find((ch: any) => ch.id === initialChapter.id);
          
          if (existingChapter) {
            return {
              ...initialChapter,
              questions: initialChapter.questions.map(initialQuestion => {
                const existingQuestion = existingChapter.questions?.find((q: any) => q.id === initialQuestion.id);
                
                if (existingQuestion) {
                  return {
                    ...initialQuestion,
                    answer: existingQuestion.answer || initialQuestion.answer,
                    audioUrl: existingQuestion.audioUrl || initialQuestion.audioUrl,
                    audioBlob: existingQuestion.audioBlob || initialQuestion.audioBlob,
                  };
                }
                
                return initialQuestion;
              }),
            };
          }
          
          return initialChapter;
        });

        const lifeStory: LifeStory = {
          id: storyData.id,
          user_id: storyData.user_id,
          title: storyData.title,
          chapters: mergedChapters,
          created_at: storyData.created_at,
          updated_at: storyData.updated_at,
          last_edited_chapter: storyData.last_edited_chapter,
          last_edited_question: storyData.last_edited_question,
        };

        setData(lifeStory);
        setActiveTab(storyData.last_edited_chapter || (mergedChapters[0]?.id || ''));
        setActiveQuestion(storyData.last_edited_question);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'histoire de vie:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserLifeStory();
  }, [user]);

  useEffect(() => {
    const initialOpenState: { [key: string]: boolean } = {};
    data.chapters.forEach(chapter => {
      initialOpenState[chapter.id] = true;
    });
    setOpenQuestions(initialOpenState);
  }, [data.chapters]);

  useEffect(() => {
    const totalQuestions = data.chapters.reduce(
      (sum, chapter) => sum + (chapter.questions?.length || 0),
      0
    );
    const answeredQuestions = data.chapters.reduce(
      (sum, chapter) =>
        sum + (chapter.questions?.filter(q => q.answer || q.audioUrl).length || 0),
      0
    );
    setProgress({
      totalQuestions,
      answeredQuestions,
    });
  }, [data]);

  const toggleQuestions = (chapterId: string) => {
    setOpenQuestions(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleQuestionFocus = (chapterId: string, questionId: string) => {
    setActiveQuestion(questionId);
    setData(prev => ({
      ...prev,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    }));
  };

  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    console.log('Mise à jour de la réponse:', { chapterId, questionId, answer });
    setData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              questions: chapter.questions?.map(q =>
                q.id === questionId ? { ...q, answer } : q
              ) || [],
            }
          : chapter
      ),
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    }));
  };

  const handleAudioRecorded = async (chapterId: string, questionId: string, blob: Blob) => {
    console.log('Début de handleAudioRecorded:', { chapterId, questionId, blobSize: blob.size, blobType: blob.type });
    let audioUrl: string;

    if (!user) {
      console.warn('Utilisateur non connecté, utilisation d’une URL temporaire');
      audioUrl = URL.createObjectURL(blob);
    } else {
      try {
        const fileName = `audio/${user.id}/${chapterId}/${questionId}-${Date.now()}.m4a`;
        console.log('Upload du fichier audio:', fileName);
        const { error } = await supabase.storage
          .from('life-story-audio')
          .upload(fileName, blob, {
            contentType: 'audio/mp4',
          });

        if (error) {
          console.error('Erreur lors de l’upload audio:', error);
          throw error;
        }

        const { data: urlData } = supabase.storage
          .from('life-story-audio')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          console.error('URL publique non générée');
          throw new Error('Impossible de générer l’URL publique');
        }

        audioUrl = urlData.publicUrl;
        console.log('Audio uploadé avec succès:', audioUrl);
      } catch (err) {
        console.error('Erreur lors de l’upload audio:', err);
        toast.error('Erreur lors de la sauvegarde de l’audio');
        audioUrl = URL.createObjectURL(blob); // Fallback temporaire
      }
    }

    console.log('Mise à jour de l’état avec audioUrl:', audioUrl);
    setData(prev => {
      const newData = {
        ...prev,
        chapters: prev.chapters.map(chapter =>
          chapter.id === chapterId
            ? {
                ...chapter,
                questions: chapter.questions?.map(q =>
                  q.id === questionId ? { ...q, audioBlob: blob, audioUrl } : q
                ) || [],
              }
            : chapter
        ),
        last_edited_chapter: chapterId,
        last_edited_question: questionId,
      };
      console.log('Nouvel état après enregistrement:', JSON.stringify(newData, null, 2));
      return newData;
    });
    toast.success('Enregistrement audio ajouté');

    // Sauvegarde immédiate pour persister l’URL
    await saveNow();
  };

  const handleAudioDeleted = (chapterId: string, questionId: string) => {
    console.log('Suppression audio:', { chapterId, questionId });
    setData(prev => {
      const newData = {
        ...prev,
        chapters: prev.chapters.map(chapter =>
          chapter.id === chapterId
            ? {
                ...chapter,
                questions: chapter.questions?.map(q =>
                  q.id === questionId
                    ? { ...q, audioBlob: null, audioUrl: null }
                    : q
                ) || [],
              }
            : chapter
        ),
      };
      console.log('Nouvel état après suppression:', JSON.stringify(newData, null, 2));
      return newData;
    });
    toast.success('Enregistrement audio supprimé');
  };

  const saveNow = async () => {
    if (!user) {
      console.warn('Utilisateur non connecté, sauvegarde ignorée');
      return;
    }
    setIsSaving(true);
    try {
      console.log('Sauvegarde des données dans Supabase:', JSON.stringify(data, null, 2));
      const { error } = await supabase
        .from('life_stories')
        .upsert({
          id: data.id || undefined,
          user_id: user.id,
          title: data.title,
          chapters: data.chapters.map(chapter => ({
            ...chapter,
            questions: chapter.questions?.map(q => ({
              id: q.id,
              text: q.text,
              answer: q.answer,
              audioUrl: q.audioUrl,
            })) || [],
          })),
          updated_at: new Date().toISOString(),
          last_edited_chapter: activeTab,
          last_edited_question: activeQuestion,
        });

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        throw error;
      }
      setLastSaved(new Date());
      console.log('Histoire sauvegardée avec succès à:', new Date().toISOString());
      toast.success('Histoire sauvegardée');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    data,
    isLoading,
    activeTab,
    openQuestions,
    activeQuestion,
    progress,
    isSaving,
    lastSaved,
    setActiveTab,
    toggleQuestions,
    handleQuestionFocus,
    updateAnswer,
    handleAudioRecorded,
    handleAudioDeleted,
    saveNow,
  };
};
