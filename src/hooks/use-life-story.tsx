
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LifeStory, LifeStoryProgress, Chapter } from '@/types/lifeStory';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { initialChapters } from '@/components/life-story/initialChapters';

interface UseLifeStoryProps {
  existingStory?: LifeStory;
  targetUserId?: string;
}

export const useLifeStory = ({ existingStory, targetUserId }: UseLifeStoryProps) => {
  const { user } = useAuth();
  const effectiveUserId = targetUserId || user?.id;
  
  const [data, setData] = useState<LifeStory>(
    existingStory || {
      id: '',
      user_id: effectiveUserId || '',
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
    if (!effectiveUserId) return;

    // Si existingStory est fourni, ne pas recharger
    if (existingStory) {
      console.log('use-life-story - Histoire existante fournie, pas de rechargement');
      return;
    }

    try {
      setIsLoading(true);
      console.log('use-life-story - Chargement pour utilisateur:', effectiveUserId);
      
      const { data: storyData, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement de l\'histoire:', error);
        return;
      }

      console.log('use-life-story - Données chargées:', storyData);

      if (storyData) {
        // Conversion sûre via unknown pour satisfaire TypeScript
        const existingChapters = (storyData.chapters as unknown as Chapter[]) || [];
        
        // Fusionner les chapitres existants avec les chapitres initiaux
        const mergedChapters = initialChapters.map(initialChapter => {
          const existingChapter = existingChapters.find((ch: Chapter) => ch.id === initialChapter.id);
          
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

        console.log('use-life-story - Histoire fusionnée:', lifeStory);
        setData(lifeStory);
        setActiveTab(storyData.last_edited_chapter || (mergedChapters[0]?.id || ''));
        setActiveQuestion(storyData.last_edited_question);
      } else {
        console.log('use-life-story - Aucune histoire trouvée, utilisation des chapitres initiaux');
        // Pas d'histoire existante, utiliser les chapitres initiaux
        setData(prev => ({
          ...prev,
          user_id: effectiveUserId || '',
          chapters: initialChapters
        }));
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'histoire de vie:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Recharger quand l'utilisateur effectif change
  useEffect(() => {
    console.log('use-life-story - Effet targetUserId changé:', { targetUserId, effectiveUserId });
    loadUserLifeStory();
  }, [effectiveUserId]);

  // Initialiser l'état des questions fermées par défaut
  useEffect(() => {
    const initialOpenState: { [key: string]: boolean } = {};
    data.chapters.forEach(chapter => {
      initialOpenState[chapter.id] = false; // Fermé par défaut
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

  // Fonction simplifiée pour gérer l'audio
  const handleAudioUrlChange = (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => {
    console.log('handleAudioUrlChange appelé:', { chapterId, questionId, audioUrl, preventAutoSave });
    
    setData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              questions: chapter.questions?.map(q =>
                q.id === questionId ? { ...q, audioUrl } : q
              ) || [],
            }
          : chapter
      ),
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    }));

    // Si preventAutoSave n'est pas défini ou est false, sauvegarder automatiquement
    if (!preventAutoSave) {
      setTimeout(() => {
        saveNow();
      }, 1000);
    }
  };

  const handleAudioRecorded = async (chapterId: string, questionId: string, blob: Blob) => {
    console.log('handleAudioRecorded - AudioRecorder s\'occupe de l\'upload');
    
    setData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              questions: chapter.questions?.map(q =>
                q.id === questionId ? { ...q, audioBlob: blob } : q
              ) || [],
            }
          : chapter
      ),
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    }));
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
      return newData;
    });
    toast.success('Enregistrement audio supprimé');
  };

  const saveNow = async () => {
    if (!user || !effectiveUserId) {
      console.warn('Utilisateur non connecté, sauvegarde ignorée');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Sauvegarde des données dans Supabase pour utilisateur:', effectiveUserId);
      
      // Préparer les chapitres avec les audioUrl sauvegardées
      const chaptersToSave = data.chapters.map(chapter => ({
        ...chapter,
        questions: chapter.questions?.map(q => ({
          id: q.id,
          text: q.text,
          answer: q.answer,
          audioUrl: q.audioUrl,
        })) || [],
      }));
      
      const { error } = await supabase
        .from('life_stories')
        .upsert({
          id: data.id || undefined,
          user_id: effectiveUserId,
          title: data.title,
          chapters: chaptersToSave,
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
    handleAudioUrlChange,
    saveNow,
  };
};
