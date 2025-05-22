// src/hooks/use-life-story.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LifeStory } from '@/types/lifeStory';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

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
      chapters: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_edited_chapter: null,
      last_edited_question: null,
    }
  );
  const [activeTab, setActiveTab] = useState<string>('chapter-1');
  const [openQuestions, setOpenQuestions] = useState<{ [key: string]: boolean }>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Simuler le calcul de progression
  useEffect(() => {
    const totalQuestions = data.chapters.reduce((sum, chapter) => sum + (chapter.questions?.length || 0), 0);
    const answeredQuestions = data.chapters.reduce(
      (sum, chapter) => sum + (chapter.questions?.filter(q => q.answer || q.audioUrl).length || 0),
      0
    );
    setProgress(totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0);
  }, [data]);

  const toggleQuestions = (chapterId: string) => {
    setOpenQuestions(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleQuestionFocus = (questionId: string) => {
    setActiveQuestion(questionId);
  };

  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    setData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              questions: chapter.questions?.map(q =>
                q.id === questionId ? { ...q, answer } : q
              ),
            }
          : chapter
      ),
    }));
  };

  const handleAudioRecorded = (chapterId: string, questionId: string, blob: Blob) => {
    const audioUrl = URL.createObjectURL(blob);
    console.log('Audio enregistré:', { chapterId, questionId, blob, audioUrl }); // Débogage
    setData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              questions: chapter.questions?.map(q =>
                q.id === questionId ? { ...q, audioBlob: blob, audioUrl } : q
              ),
            }
          : chapter
      ),
    }));
    toast.success('Enregistrement audio ajouté');
  };

  const handleAudioDeleted = (chapterId: string, questionId: string) => {
    setData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              questions: chapter.questions?.map(q =>
                q.id === questionId
                  ? { ...q, audioBlob: null, audioUrl: null }
                  : q
              ),
            }
          : chapter
      ),
    }));
    toast.success('Enregistrement audio supprimé');
  };

  const saveNow = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('life_stories')
        .upsert({
          id: data.id || undefined,
          user_id: user.id,
          title: data.title,
          chapters: data.chapters,
          updated_at: new Date().toISOString(),
          last_edited_chapter: activeTab,
          last_edited_question: activeQuestion,
        });

      if (error) throw error;
      setLastSaved(new Date());
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
