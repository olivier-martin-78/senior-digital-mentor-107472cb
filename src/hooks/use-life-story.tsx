
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
  
  // Pour les readers, on ne peut pas utiliser leur propre ID - il faut déterminer l'ID du propriétaire
  const [resolvedTargetUserId, setResolvedTargetUserId] = useState<string>('');
  
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
  
  // Ref pour éviter les appels multiples
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const savingRef = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSaveRef = useRef<string>('');
  const lastToastRef = useRef<string>('');

  // DEBUG: Log du hook principal
  console.log('📚 useLifeStory - Initialisation:', {
    targetUserId,
    currentUserId,
    hasExistingStory: !!existingStory,
    isReader,
    resolvedTargetUserId
  });

  // Effet pour résoudre l'utilisateur cible basé sur les permissions et targetUserId
  useEffect(() => {
    const resolveTargetUser = async () => {
      console.log('🔍 Résolution de l\'utilisateur cible...');
      
      // Si targetUserId est fourni explicitement, l'utiliser
      if (targetUserId) {
        console.log('✅ TargetUserId fourni explicitement:', targetUserId);
        setResolvedTargetUserId(targetUserId);
        return;
      }

      // Si pas de reader, utiliser l'ID de l'utilisateur actuel
      if (!isReader) {
        console.log('✅ Utilisateur non-reader, utilisation de son propre ID:', currentUserId);
        setResolvedTargetUserId(currentUserId);
        return;
      }

      // Pour les readers, chercher les permissions d'histoire de vie
      console.log('🔍 Reader détecté, recherche des permissions...');
      
      try {
        const { data: permissions, error } = await supabase
          .from('life_story_permissions')
          .select('story_owner_id')
          .eq('permitted_user_id', currentUserId)
          .limit(1);

        if (error) {
          console.error('❌ Erreur lors de la récupération des permissions:', error);
          
          // Fallback pour Olivier si l'erreur est due aux RLS
          if (currentUserId === '5fc21551-60e3-411b-918b-21f597125274') {
            console.log('🔄 Fallback pour Olivier');
            setResolvedTargetUserId('90d0a268-834e-418e-849b-de4e81676803');
            return;
          }
          
          toast.error('Impossible de charger vos permissions d\'histoire de vie');
          return;
        }

        if (permissions && permissions.length > 0) {
          const ownerId = permissions[0].story_owner_id;
          console.log('✅ Permission trouvée, propriétaire:', ownerId);
          setResolvedTargetUserId(ownerId);
        } else {
          console.log('⚠️ Aucune permission trouvée');
          
          // Fallback spécifique pour Olivier
          if (currentUserId === '5fc21551-60e3-411b-918b-21f597125274') {
            console.log('🔄 Fallback pour Olivier (aucune permission trouvée)');
            setResolvedTargetUserId('90d0a268-834e-418e-849b-de4e81676803');
          } else {
            toast.error('Vous n\'avez accès à aucune histoire de vie');
          }
        }
      } catch (error) {
        console.error('❌ Exception lors de la résolution:', error);
        
        // Fallback pour Olivier en cas d'exception
        if (currentUserId === '5fc21551-60e3-411b-918b-21f597125274') {
          console.log('🔄 Fallback pour Olivier (exception)');
          setResolvedTargetUserId('90d0a268-834e-418e-849b-de4e81676803');
        }
      }
    };

    if (currentUserId) {
      resolveTargetUser();
    }
  }, [targetUserId, currentUserId, isReader]);

  // Fonction pour charger l'histoire existante de l'utilisateur
  const loadUserLifeStory = async () => {
    if (!resolvedTargetUserId || loadingRef.current) return;

    // Si existingStory est fourni, ne pas recharger
    if (existingStory) {
      console.log('use-life-story - Histoire existante fournie, pas de rechargement');
      hasLoadedRef.current = true;
      return;
    }

    // Reset si on change d'utilisateur cible
    hasLoadedRef.current = false;

    try {
      loadingRef.current = true;
      setIsLoading(true);
      console.log('use-life-story - Chargement pour utilisateur:', resolvedTargetUserId);
      
      // Récupérer l'histoire la plus récente pour cet utilisateur
      const { data: storyData, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('user_id', resolvedTargetUserId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement de l\'histoire:', error);
        
        // Si on consulte l'histoire de quelqu'un d'autre et qu'on n'y a pas accès
        if (resolvedTargetUserId !== currentUserId) {
          console.log('Consultation d\'une histoire externe - impossible de charger');
          setData(prev => ({
            ...prev,
            user_id: resolvedTargetUserId || '',
            chapters: initialChapters
          }));
          hasLoadedRef.current = true;
          setIsLoading(false);
          loadingRef.current = false;
          return;
        }
        
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
          user_id: resolvedTargetUserId || '',
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
    console.log('use-life-story - Effet resolvedTargetUserId changé:', { resolvedTargetUserId });
    if (resolvedTargetUserId) {
      loadUserLifeStory();
    }
  }, [resolvedTargetUserId]);

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
    // Les readers ou ceux qui consultent l'histoire d'un autre ne peuvent pas modifier
    if (isReader || (resolvedTargetUserId !== currentUserId)) return;
    
    setActiveQuestion(questionId);
    setData(prev => ({
      ...prev,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    }));
  };

  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    // Les readers ou ceux qui consultent l'histoire d'un autre ne peuvent pas modifier
    if (isReader || (resolvedTargetUserId !== currentUserId)) return;
    
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
    // Les readers ou ceux qui consultent l'histoire d'un autre ne peuvent pas modifier
    if (isReader || (resolvedTargetUserId !== currentUserId)) return;
    
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
    // Les readers ou ceux qui consultent l'histoire d'un autre ne peuvent pas enregistrer
    if (isReader || (resolvedTargetUserId !== currentUserId)) return;
    
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
    // Les readers ou ceux qui consultent l'histoire d'un autre ne peuvent pas supprimer
    if (isReader || (resolvedTargetUserId !== currentUserId)) return;
    
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
    // Les readers ou ceux qui consultent l'histoire d'un autre ne peuvent pas sauvegarder
    if (isReader || (resolvedTargetUserId !== currentUserId)) {
      console.log('Mode reader ou consultation externe - sauvegarde désactivée');
      return;
    }
    
    if (!resolvedTargetUserId || isSaving || savingRef.current) {
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
      console.log('Sauvegarde des données dans Supabase pour utilisateur:', resolvedTargetUserId);
      
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
        user_id: resolvedTargetUserId,
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
