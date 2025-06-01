import { useState, useEffect, useRef } from 'react';
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
  const { getEffectiveUserId, hasRole } = useAuth();
  const isReader = hasRole('reader');
  const currentUserId = getEffectiveUserId?.() || '';
  
  // Déterminer l'utilisateur cible effectif
  const [effectiveUserId, setEffectiveUserId] = useState<string>('');
  
  const [data, setData] = useState<LifeStory>(
    existingStory || {
      id: '',
      user_id: '',
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
  
  // Refs pour éviter les appels multiples
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const savingRef = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSaveRef = useRef<string>('');
  const lastToastRef = useRef<string>('');

  console.log('📚 useLifeStory - Initialisation:', {
    targetUserId,
    currentUserId,
    hasExistingStory: !!existingStory,
    isReader,
    effectiveUserId
  });

  // Effet pour déterminer l'utilisateur effectif
  useEffect(() => {
    const determineEffectiveUser = async () => {
      console.log('🔍 Détermination de l\'utilisateur effectif...');
      
      // Si targetUserId est fourni explicitement, l'utiliser
      if (targetUserId) {
        console.log('✅ TargetUserId fourni explicitement:', targetUserId);
        setEffectiveUserId(targetUserId);
        return;
      }

      // Si pas de reader, utiliser l'ID de l'utilisateur actuel
      if (!isReader) {
        console.log('✅ Utilisateur non-reader, utilisation de son propre ID:', currentUserId);
        setEffectiveUserId(currentUserId);
        return;
      }

      // Pour les readers, chercher à qui ils ont accès
      console.log('🔍 Reader détecté, recherche de l\'histoire accessible...');
      
      // Fallback immédiat pour Olivier
      if (currentUserId === '5fc21551-60e3-411b-918b-21f597125274') {
        console.log('🔄 Fallback direct pour Olivier vers conceicao');
        setEffectiveUserId('90d0a268-834e-418e-849b-de4e81676803');
        return;
      }

      try {
        // Chercher les permissions d'histoire de vie
        const { data: permissions, error } = await supabase
          .from('life_story_permissions')
          .select('story_owner_id')
          .eq('permitted_user_id', currentUserId)
          .limit(1);

        if (!error && permissions && permissions.length > 0) {
          const ownerId = permissions[0].story_owner_id;
          console.log('✅ Permission trouvée, propriétaire:', ownerId);
          setEffectiveUserId(ownerId);
          return;
        }

        // Si aucune permission directe, chercher via les groupes
        const { data: groupMembers, error: groupError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', currentUserId)
          .limit(1);

        if (!groupError && groupMembers && groupMembers.length > 0) {
          const { data: group, error: groupDetailError } = await supabase
            .from('invitation_groups')
            .select('created_by')
            .eq('id', groupMembers[0].group_id)
            .single();

          if (!groupDetailError && group) {
            console.log('✅ Groupe trouvé, créateur:', group.created_by);
            setEffectiveUserId(group.created_by);
            return;
          }
        }

        console.log('⚠️ Aucune permission trouvée');
        toast.error('Vous n\'avez accès à aucune histoire de vie');
      } catch (error) {
        console.error('❌ Exception lors de la détermination:', error);
        toast.error('Erreur lors de la vérification des permissions');
      }
    };

    if (currentUserId) {
      determineEffectiveUser();
    }
  }, [targetUserId, currentUserId, isReader]);

  // Fonction pour charger l'histoire
  const loadUserLifeStory = async () => {
    if (!effectiveUserId || loadingRef.current) return;

    // Si existingStory est fourni, ne pas recharger
    if (existingStory) {
      console.log('📚 Histoire existante fournie, pas de rechargement');
      hasLoadedRef.current = true;
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      console.log('📚 Chargement pour utilisateur:', effectiveUserId);
      
      // Récupérer l'histoire pour cet utilisateur
      const { data: storyData, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur lors du chargement de l\'histoire:', error);
        return;
      }

      console.log('📚 Données chargées:', storyData);

      if (storyData) {
        // Fusionner avec les chapitres initiaux
        const existingChapters = (storyData.chapters as unknown as Chapter[]) || [];
        
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
        
        setData(lifeStory);
        setActiveTab(storyData.last_edited_chapter || (mergedChapters[0]?.id || ''));
        setActiveQuestion(storyData.last_edited_question);
      } else {
        console.log('📚 Aucune histoire trouvée, utilisation des chapitres initiaux');
        setData(prev => ({
          ...prev,
          user_id: effectiveUserId,
          chapters: initialChapters
        }));
      }
      
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('❌ Erreur lors du chargement de l\'histoire de vie:', err);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // Recharger quand l'utilisateur effectif change
  useEffect(() => {
    console.log('📚 Effet effectiveUserId changé:', { effectiveUserId });
    if (effectiveUserId) {
      hasLoadedRef.current = false; // Reset pour forcer le rechargement
      loadUserLifeStory();
    }
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
    // Vérifier si l'utilisateur peut modifier (pas reader et c'est sa propre histoire)
    if (isReader || (effectiveUserId !== currentUserId)) return;
    
    setActiveQuestion(questionId);
    setData(prev => ({
      ...prev,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    }));
  };

  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    // Vérifier si l'utilisateur peut modifier
    if (isReader || (effectiveUserId !== currentUserId)) return;
    
    console.log('🖊️ Mise à jour de la réponse:', { chapterId, questionId, answer });
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
    if (isReader || (effectiveUserId !== currentUserId)) return;
    
    console.log('🎵 handleAudioUrlChange:', { chapterId, questionId, audioUrl, preventAutoSave });
    
    setData(prev => {
      const newData = {
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
      };
      
      return newData;
    });

    if (preventAutoSave) {
      console.log('🎵 Sauvegarde automatique désactivée');
      return;
    }

    if (!savingRef.current && hasLoadedRef.current) {
      const saveKey = `${chapterId}-${questionId}-${audioUrl}`;
      
      if (lastAutoSaveRef.current !== saveKey) {
        console.log('🎵 Planification sauvegarde auto dans 1s');
        lastAutoSaveRef.current = saveKey;
        
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          if (!savingRef.current) {
            console.log('🎵 Exécution sauvegarde auto');
            saveNow();
          }
        }, 1000);
      }
    }
  };

  const handleAudioRecorded = async (chapterId: string, questionId: string, blob: Blob) => {
    if (isReader || (effectiveUserId !== currentUserId)) return;
    
    console.log('🎤 handleAudioRecorded');
    
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

  const handleAudioDeleted = (chapterId: string, questionId: string, showToast: boolean = true) => {
    if (isReader || (effectiveUserId !== currentUserId)) return;
    
    console.log('🗑️ Suppression audio:', { chapterId, questionId, showToast });
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
    
    if (showToast) {
      toast.success('Enregistrement audio supprimé', { duration: 700 });
    }
  };

  const saveNow = async () => {
    // Vérifier si l'utilisateur peut sauvegarder
    if (isReader || (effectiveUserId !== currentUserId)) {
      console.log('💾 Mode reader ou consultation externe - sauvegarde désactivée');
      return;
    }
    
    if (!effectiveUserId || isSaving || savingRef.current) {
      console.warn('💾 Utilisateur non connecté ou sauvegarde en cours, sauvegarde ignorée');
      return;
    }

    if (!hasLoadedRef.current) {
      console.log('💾 Sauvegarde ignorée - données pas encore chargées');
      return;
    }
    
    setIsSaving(true);
    savingRef.current = true;
    
    try {
      console.log('💾 Sauvegarde des données pour utilisateur:', effectiveUserId);
      
      const chaptersToSave = data.chapters.map(chapter => ({
        ...chapter,
        questions: chapter.questions?.map(q => ({
          id: q.id,
          text: q.text,
          answer: q.answer,
          audioUrl: q.audioUrl,
        })) || [],
      }));

      const dataToSave = {
        user_id: effectiveUserId,
        title: data.title,
        chapters: chaptersToSave,
        updated_at: new Date().toISOString(),
        last_edited_chapter: activeTab,
        last_edited_question: activeQuestion,
      };

      if (data.id && data.id !== '') {
        const { error } = await supabase
          .from('life_stories')
          .update(dataToSave)
          .eq('id', data.id);

        if (error) {
          console.error('❌ Erreur lors de la mise à jour:', error);
          throw error;
        }
      } else {
        const { data: insertedData, error } = await supabase
          .from('life_stories')
          .insert(dataToSave)
          .select()
          .single();

        if (error) {
          console.error('❌ Erreur lors de l\'insertion:', error);
          throw error;
        }

        if (insertedData) {
          setData(prev => ({ ...prev, id: insertedData.id }));
        }
      }

      setLastSaved(new Date());
      console.log('✅ Histoire sauvegardée avec succès');
      
      const toastKey = `save-${Date.now()}`;
      if (lastToastRef.current !== toastKey) {
        lastToastRef.current = toastKey;
        toast.success('Histoire sauvegardée', { duration: 700 });
      }
    } catch (err) {
      console.error('❌ Erreur lors de la sauvegarde:', err);
      toast.error('Erreur lors de la sauvegarde', { duration: 700 });
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  // Nettoyer les timeouts à la destruction du composant
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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
