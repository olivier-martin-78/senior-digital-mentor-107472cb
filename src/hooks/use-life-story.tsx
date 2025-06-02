
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LifeStory, Chapter } from '@/types/lifeStory';
import { toast } from '@/hooks/use-toast';
import { initialChapters } from '@/components/life-story/initialChapters';

interface UseLifeStoryProps {
  targetUserId?: string;
}

export const useLifeStory = ({ targetUserId }: UseLifeStoryProps = {}) => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<LifeStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Déterminer l'utilisateur cible
  const effectiveUserId = targetUserId || user?.id;

  const loadLifeStory = async (userId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log(`🔍 Chargement de l'histoire de vie pour l'utilisateur: ${userId}`);

      const { data: storyData, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur lors du chargement de l\'histoire:', error);
        throw error;
      }

      if (storyData) {
        console.log('✅ Histoire de vie chargée avec succès:', storyData);
        
        // Parser les chapitres JSON en toute sécurité
        let parsedChapters: Chapter[] = [];
        try {
          if (typeof storyData.chapters === 'string') {
            parsedChapters = JSON.parse(storyData.chapters);
          } else if (Array.isArray(storyData.chapters)) {
            parsedChapters = storyData.chapters as unknown as Chapter[];
          } else {
            parsedChapters = initialChapters;
          }
        } catch (parseError) {
          console.error('Erreur parsing chapters:', parseError);
          parsedChapters = initialChapters;
        }

        setData({
          ...storyData,
          chapters: parsedChapters
        });
      } else {
        console.log('💡 Aucune histoire trouvée, création avec les chapitres initiaux');
        // Créer une nouvelle histoire avec les chapitres initiaux
        const newStory: LifeStory = {
          user_id: userId,
          title: 'Mon Histoire de Vie',
          chapters: initialChapters,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setData(newStory);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de charger l'histoire de vie : ${error.message}`,
        variant: 'destructive',
      });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNow = async () => {
    if (!data || !user || !effectiveUserId) return;

    try {
      setIsSaving(true);
      console.log('💾 Sauvegarde de l\'histoire de vie:', data);

      // Préparer les données pour la sauvegarde avec user_id requis
      const dataToSave = {
        user_id: effectiveUserId,
        title: data.title,
        chapters: JSON.stringify(data.chapters),
        updated_at: new Date().toISOString(),
        last_edited_chapter: data.last_edited_chapter || null,
        last_edited_question: data.last_edited_question || null,
        ...(data.id && { id: data.id }),
        ...(data.created_at && { created_at: data.created_at }),
      };

      const { error } = await supabase
        .from('life_stories')
        .upsert(dataToSave, { onConflict: 'user_id' });

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'histoire:', error);
        throw error;
      }

      console.log('✅ Histoire de vie sauvegardée avec succès.');
      setLastSaved(new Date());
      toast({
        title: 'Succès',
        description: 'Histoire de vie sauvegardée !',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder l'histoire de vie : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleQuestions = (chapterId: string) => {
    setOpenQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleQuestionFocus = (questionId: string) => {
    setActiveQuestion(questionId);
  };

  const updateAnswer = (questionId: string, answer: string) => {
    if (!data) return;

    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId ? { ...question, answer } : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
  };

  const handleAudioRecorded = (questionId: string, audioBlob: Blob, audioUrl: string) => {
    if (!data) return;

    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId 
          ? { ...question, audioBlob, audioUrl } 
          : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
  };

  const handleAudioDeleted = (questionId: string) => {
    if (!data) return;

    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId 
          ? { ...question, audioBlob: null, audioUrl: null } 
          : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
  };

  const handleAudioUrlChange = (questionId: string, audioUrl: string | null) => {
    if (!data) return;

    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId 
          ? { ...question, audioUrl } 
          : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
  };

  // Calculer le progrès
  const progress = data ? (() => {
    const totalQuestions = data.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
    const answeredQuestions = data.chapters.reduce((sum, chapter) => 
      sum + chapter.questions.filter(q => q.answer && q.answer.trim() !== '').length, 0
    );
    return { totalQuestions, answeredQuestions };
  })() : { totalQuestions: 0, answeredQuestions: 0 };

  useEffect(() => {
    if (effectiveUserId) {
      loadLifeStory(effectiveUserId);
    } else {
      setData(null);
      setIsLoading(false);
    }
  }, [effectiveUserId, user]);

  return {
    data,
    isLoading,
    isSaving,
    activeTab,
    openQuestions,
    activeQuestion,
    progress,
    lastSaved,
    setActiveTab,
    toggleQuestions,
    handleQuestionFocus,
    updateAnswer,
    handleAudioRecorded,
    handleAudioDeleted,
    handleAudioUrlChange,
    saveNow
  };
};
