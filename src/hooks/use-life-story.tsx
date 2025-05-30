
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
  const { getEffectiveUserId } = useAuth();
  const effectiveUserId = targetUserId || getEffectiveUserId?.() || '';
  
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
  
  // Ref pour éviter les appels multiples
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const savingRef = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSaveRef = useRef<string>(''); // Pour éviter les sauvegardes identiques
  const lastToastRef = useRef<string>(''); // Pour éviter les toasts identiques

  // DEBUG: Log du hook principal
  console.log('📚 useLifeStory - Initialisation:', {
    targetUserId,
    effectiveUserId,
    hasExistingStory: !!existingStory
  });

  // Fonction pour charger l'histoire existante de l'utilisateur
  const loadUserLifeStory = async () => {
    if (!effectiveUserId || loadingRef.current || hasLoadedRef.current) return;

    // Si existingStory est fourni, ne pas recharger
    if (existingStory) {
      console.log('use-life-story - Histoire existante fournie, pas de rechargement');
      hasLoadedRef.current = true;
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      console.log('use-life-story - Chargement pour utilisateur:', effectiveUserId);
      
      // Récupérer l'histoire la plus récente pour cet utilisateur
      const { data: storyData, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false })
        .limit(1)
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
                  console.log('📚 use-life-story - Question avec données existantes:', {
                    questionId: initialQuestion.id,
                    answer: existingQuestion.answer,
                    audioUrl: existingQuestion.audioUrl,
                    audioUrlLength: existingQuestion.audioUrl?.length
                  });
                  
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

        console.log('📚 use-life-story - Histoire fusionnée avec audioUrls:', {
          totalChapters: lifeStory.chapters.length,
          questionsWithAudio: lifeStory.chapters.flatMap(ch => ch.questions || []).filter(q => q.audioUrl).length,
          questionsWithAudioDetails: lifeStory.chapters.flatMap(ch => ch.questions || []).filter(q => q.audioUrl).map(q => ({ id: q.id, audioUrl: q.audioUrl?.substring(0, 50) + '...' }))
        });
        
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
      
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Erreur lors du chargement de l\'histoire de vie:', err);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // Recharger quand l'utilisateur effectif change
  useEffect(() => {
    console.log('use-life-story - Effet targetUserId changé:', { targetUserId, effectiveUserId });
    hasLoadedRef.current = false; // Reset pour permettre le rechargement
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
    console.log('📚 useLifeStory - handleAudioUrlChange:', { 
      chapterId, 
      questionId, 
      audioUrl, 
      preventAutoSave,
      currentData: data.chapters.find(c => c.id === chapterId)?.questions?.find(q => q.id === questionId)?.audioUrl
    });
    
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
      
      console.log('📚 useLifeStory - Données mises à jour:', {
        chapterId,
        questionId,
        newAudioUrl: audioUrl,
        questionData: newData.chapters.find(c => c.id === chapterId)?.questions?.find(q => q.id === questionId)
      });
      
      return newData;
    });

    // Si preventAutoSave est true, ne pas déclencher de sauvegarde automatique
    if (preventAutoSave) {
      console.log('📚 useLifeStory - Sauvegarde automatique désactivée');
      return;
    }

    // Si preventAutoSave n'est pas défini ou est false, sauvegarder automatiquement
    // Mais seulement si ce n'est pas la même URL qu'avant et qu'on n'est pas en train de sauvegarder
    if (!savingRef.current && hasLoadedRef.current) {
      const saveKey = `${chapterId}-${questionId}-${audioUrl}`;
      
      if (lastAutoSaveRef.current !== saveKey) {
        console.log('📚 useLifeStory - Planification sauvegarde auto dans 1s');
        lastAutoSaveRef.current = saveKey;
        
        // Annuler le timeout précédent s'il existe
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          if (!savingRef.current) { // Double vérification
            console.log('📚 useLifeStory - Exécution sauvegarde auto');
            saveNow();
          }
        }, 1000);
      }
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

  const handleAudioDeleted = (chapterId: string, questionId: string, showToast: boolean = true) => {
    console.log('Suppression audio:', { chapterId, questionId, showToast });
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
    
    // Seulement afficher le toast si demandé explicitement
    if (showToast) {
      toast.success('Enregistrement audio supprimé', { duration: 700 });
    }
  };

  const saveNow = async () => {
    if (!effectiveUserId || isSaving || savingRef.current) {
      console.warn('Utilisateur non connecté ou sauvegarde en cours, sauvegarde ignorée');
      return;
    }

    // Ne pas sauvegarder si les données ne sont pas encore chargées
    if (!hasLoadedRef.current) {
      console.log('Sauvegarde ignorée - données pas encore chargées');
      return;
    }
    
    setIsSaving(true);
    savingRef.current = true;
    
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

      // Corriger la logique d'upsert
      const dataToSave = {
        user_id: effectiveUserId,
        title: data.title,
        chapters: chaptersToSave,
        updated_at: new Date().toISOString(),
        last_edited_chapter: activeTab,
        last_edited_question: activeQuestion,
      };

      // Si on a un ID valide et non vide, on fait un update
      if (data.id && data.id !== '') {
        const { error } = await supabase
          .from('life_stories')
          .update(dataToSave)
          .eq('id', data.id);

        if (error) {
          console.error('Erreur lors de la mise à jour:', error);
          throw error;
        }
      } else {
        // Sinon on fait un insert et on récupère l'ID
        const { data: insertedData, error } = await supabase
          .from('life_stories')
          .insert(dataToSave)
          .select()
          .single();

        if (error) {
          console.error('Erreur lors de l\'insertion:', error);
          throw error;
        }

        // Mettre à jour l'ID local
        if (insertedData) {
          setData(prev => ({ ...prev, id: insertedData.id }));
        }
      }

      setLastSaved(new Date());
      console.log('Histoire sauvegardée avec succès à:', new Date().toISOString());
      
      // Éviter les toasts identiques consécutifs
      const toastKey = `save-${Date.now()}`;
      if (lastToastRef.current !== toastKey) {
        lastToastRef.current = toastKey;
        toast.success('Histoire sauvegardée', { duration: 700 });
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast.error('Erreur lors de la sauvegarde', { duration: 700 });
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  };

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
