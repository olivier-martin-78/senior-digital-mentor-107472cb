import React from 'react';
import { LifeStory } from '@/types/lifeStory';
import { useLifeStory } from '@/hooks/use-life-story';
import StoryHeader from './StoryHeader';
import StoryProgress from './StoryProgress';
import LifeStoryLayout from './LifeStoryLayout';
import { initialChapters } from './initialChapters';

interface LifeStoryFormProps {
  existingStory?: LifeStory;
  isReadOnly?: boolean;
  targetUserId?: string | null;
}

export const LifeStoryForm: React.FC<LifeStoryFormProps> = ({ 
  existingStory,
  isReadOnly = false,
  targetUserId 
}) => {
  // En mode lecture seule (admin), utiliser directement les données existantes sans hook
  if (isReadOnly && existingStory) {
    // Mélanger les chapitres initiaux avec les données existantes pour préserver les réponses
    const storyWithChapters = {
      ...existingStory,
      chapters: initialChapters.map(initialChapter => {
        // Chercher le chapitre correspondant dans l'histoire existante
        const existingChapter = existingStory.chapters.find(ch => ch.id === initialChapter.id);
        
        // Préserver les réponses des questions existantes
        return {
          ...initialChapter,
          questions: initialChapter.questions.map(initialQuestion => {
            // Chercher si cette question existe déjà dans les données de l'utilisateur
            const existingQuestion = existingChapter?.questions.find(q => q.id === initialQuestion.id);
            
            // Si la question existe, préserver sa réponse et l'audio
            if (existingQuestion) {
              return {
                ...initialQuestion,
                answer: existingQuestion.answer || initialQuestion.answer || '',
                audioUrl: existingQuestion.audioUrl || initialQuestion.audioUrl || null,
                audioBlob: existingQuestion.audioBlob || initialQuestion.audioBlob || null,
              };
            }
            
            return {
              ...initialQuestion,
              answer: initialQuestion.answer || '',
            };
          }),
        };
      }),
    };

    console.log('Mode lecture seule - Histoire avec chapitres:', storyWithChapters);

    // Créer un état local pour la navigation en mode lecture seule
    const [activeTab, setActiveTab] = React.useState('chapter-1'); // CORRECTION: Utiliser l'ID du chapitre
    const [openQuestions, setOpenQuestions] = React.useState<{ [key: string]: boolean }>({});

    const toggleQuestions = (chapterId: string) => {
      setOpenQuestions(prev => ({
        ...prev,
        [chapterId]: !prev[chapterId]
      }));
    };

    return (
      <div className="space-y-6">
        <StoryHeader 
          title={storyWithChapters.title} 
          lastSaved={null} 
          isSaving={false} 
          onSave={() => {}} 
        />
        
        {/* Layout principal avec navigation et contenu */}
        {storyWithChapters.chapters.length > 0 ? (
          <LifeStoryLayout
            chapters={storyWithChapters.chapters}
            activeTab={activeTab}
            openQuestions={openQuestions}
            activeQuestion={null}
            isReadOnly={true}
            setActiveTab={setActiveTab}
            toggleQuestions={toggleQuestions}
            handleQuestionFocus={() => {}}
            updateAnswer={() => {}}
            onAudioRecorded={() => {}}
            onAudioDeleted={() => {}}
            onAudioUrlChange={() => {}}
          />
        ) : (
          <div className="p-6 text-center bg-gray-100 rounded-lg">
            <p>Aucun chapitre n'a été trouvé. Veuillez réessayer plus tard.</p>
          </div>
        )}
      </div>
    );
  }

  // Mode normal avec hook pour l'édition - passer targetUserId au hook
  const lifeStoryHook = useLifeStory({ targetUserId });
  
  console.log('Chapitres dans LifeStoryForm:', lifeStoryHook.data?.chapters);
  
  // Si nous avons une histoire existante, utiliser ses données, sinon utiliser les données du hook
  const displayData = existingStory ? {
    ...existingStory,
    chapters: initialChapters.map(initialChapter => {
      // Chercher le chapitre correspondant dans l'histoire existante
      const existingChapter = existingStory.chapters.find(ch => ch.id === initialChapter.id);
      
      // Préserver les réponses des questions existantes, mais garantir que TOUTES les questions
      // du chapitre initial sont présentes
      return {
        ...initialChapter,
        questions: initialChapter.questions.map(initialQuestion => {
          // Chercher si cette question existe déjà dans les données de l'utilisateur
          const existingQuestion = existingChapter?.questions.find(q => q.id === initialQuestion.id);
          
          // Si la question existe, préserver sa réponse et l'audio
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
    }),
  } : lifeStoryHook.data;
  
  if (!displayData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // CORRECTION: Convertir l'activeTab numérique en ID de chapitre
  const activeTabString = displayData.chapters[lifeStoryHook.activeTab]?.id || 'chapter-1';
  
  // Convert openQuestions Set to object for component compatibility
  const openQuestionsObject: { [key: string]: boolean } = {};
  lifeStoryHook.openQuestions.forEach(key => {
    openQuestionsObject[key] = true;
  });
  
  // CORRECTION: Wrapper function to convert chapter ID to index for setActiveTab
  const handleSetActiveTab = (chapterId: string) => {
    const chapterIndex = displayData.chapters.findIndex(ch => ch.id === chapterId);
    if (chapterIndex !== -1) {
      lifeStoryHook.setActiveTab(chapterIndex);
    }
  };
  
  // Wrapper function to match expected audio recording signature
  const handleAudioRecorded = (chapterId: string, questionId: string, blob: Blob) => {
    // CORRECTION: Ne pas interférer avec la gestion d'URL, juste logger
    console.log('🎤 LifeStoryForm - handleAudioRecorded appelé pour:', { chapterId, questionId, blobSize: blob.size });
    // L'URL sera gérée par onAudioUrlChange
  };
  
  return (
    <div className="space-y-6">
      <StoryHeader 
        title={displayData.title} 
        lastSaved={lifeStoryHook.lastSaved} 
        isSaving={lifeStoryHook.isSaving} 
        onSave={lifeStoryHook.saveNow} 
      />
      
      {/* Barre de progression */}
      <StoryProgress progress={lifeStoryHook.progress} />
      
      {/* Partage Global - Seulement en mode édition */}
      {!isReadOnly && (
        <div className="mb-6">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-blue-50">
            <div className="space-y-0.5">
              <label className="text-base font-medium">
                Partager globalement
              </label>
              <div className="text-sm text-muted-foreground">
                Rendre cette histoire de vie visible par tous les utilisateurs authentifiés
              </div>
            </div>
            <input
              type="checkbox"
              checked={displayData.shared_globally || false}
              onChange={(e) => {
                const newData = { ...displayData, shared_globally: e.target.checked };
                lifeStoryHook.setData?.(newData);
              }}
              className="toggle"
            />
          </div>
        </div>
      )}

      {/* Layout principal avec navigation et contenu */}
      {displayData.chapters.length > 0 ? (
        <LifeStoryLayout
          chapters={displayData.chapters}
          activeTab={activeTabString}
          openQuestions={openQuestionsObject}
          activeQuestion={lifeStoryHook.activeQuestion}
          isReadOnly={isReadOnly}
          setActiveTab={handleSetActiveTab}
          toggleQuestions={lifeStoryHook.toggleQuestions}
          handleQuestionFocus={lifeStoryHook.handleQuestionFocus}
          updateAnswer={lifeStoryHook.updateAnswer}
          onAudioRecorded={handleAudioRecorded}
          onAudioDeleted={lifeStoryHook.handleAudioDeleted}
          onAudioUrlChange={lifeStoryHook.handleAudioUrlChange}
        />
      ) : (
        <div className="p-6 text-center bg-gray-100 rounded-lg">
          <p>Aucun chapitre n'a été trouvé. Veuillez réessayer plus tard.</p>
        </div>
      )}
    </div>
  );
};

export default LifeStoryForm;
