
import { useAuth } from '@/contexts/AuthContext';
import { useLifeStoryData } from './life-story/useLifeStoryData';
import { useLifeStorySave } from './life-story/useLifeStorySave';
import { useLifeStoryNavigation } from './life-story/useLifeStoryNavigation';
import { useLifeStoryActions } from './life-story/useLifeStoryActions';

interface UseLifeStoryProps {
  targetUserId?: string;
}

export const useLifeStory = ({ targetUserId }: UseLifeStoryProps = {}) => {
  const { user } = useAuth();
  
  // Data management
  const { data, setData, isLoading, effectiveUserId, hasRole } = useLifeStoryData({ targetUserId });
  
  // Save functionality
  const { isSaving, lastSaved, pendingSave, setPendingSave, saveNow } = useLifeStorySave({
    data,
    setData,
    effectiveUserId,
    hasRole
  });
  
  // Navigation state
  const { activeTab, setActiveTab, openQuestions, activeQuestion, toggleQuestions, handleQuestionFocus } = useLifeStoryNavigation();
  
  // User actions
  const { updateAnswer, handleAudioRecorded, handleAudioDeleted, handleAudioUrlChange } = useLifeStoryActions({
    data,
    setData,
    isSaving,
    setPendingSave,
    saveNow,
    effectiveUserId
  });

  // Calculer le progrès
  const progress = data ? (() => {
    const totalQuestions = data.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
    const answeredQuestions = data.chapters.reduce((sum, chapter) => 
      sum + chapter.questions.filter(q => q.answer && q.answer.trim() !== '').length, 0
    );
    return { totalQuestions, answeredQuestions };
  })() : { totalQuestions: 0, answeredQuestions: 0 };

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
