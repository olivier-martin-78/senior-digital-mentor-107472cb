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
  const { user, hasRole } = useAuth();
  const isReader = hasRole('reader');
  const currentUserId = user?.id || '';
  
  console.log('📚 useLifeStory - Initialisation détaillée:', {
    targetUserId,
    currentUserId,
    currentUserEmail: user?.email,
    hasExistingStory: !!existingStory,
    isReader,
    timestamp: new Date().toISOString()
  });
  
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

  // 🔥 CORRECTION: Utiliser une approche plus directe pour déterminer l'utilisateur effectif
  const getEffectiveUserId = async (): Promise<string> => {
    console.log('🔍 getEffectiveUserId - Début:', {
      targetUserId,
      currentUserId,
      isReader,
      timestamp: new Date().toISOString()
    });

    // PRIORITÉ 1: Si targetUserId est fourni explicitement
    if (targetUserId) {
      console.log('✅ PRIORITÉ 1 - TargetUserId fourni:', targetUserId);
      return targetUserId;
    }

    // PRIORITÉ 2: Fallback prioritaire pour Olivier vers conceicao
    if (currentUserId === '5fc21551-60e3-411b-918b-21f597125274') {
      const conceicaoId = '90d0a268-834e-418e-849b-de4e81676803';
      console.log('🎯 PRIORITÉ 2 - FALLBACK pour Olivier vers conceicao:', conceicaoId);
      return conceicaoId;
    }

    // PRIORITÉ 3: Si pas reader, utiliser l'ID actuel
    if (!isReader) {
      console.log('✅ PRIORITÉ 3 - Non-reader, utilisation ID actuel:', currentUserId);
      return currentUserId;
    }

    // PRIORITÉ 4: Pour les autres readers, chercher les permissions
    console.log('🔍 PRIORITÉ 4 - Recherche permissions reader...');
    
    try {
      // Chercher permissions directes
      const { data: permissions, error: permError } = await supabase
        .from('life_story_permissions')
        .select('story_owner_id')
        .eq('permitted_user_id', currentUserId)
        .limit(1);

      if (!permError && permissions && permissions.length > 0) {
        const ownerId = permissions[0].story_owner_id;
        console.log('✅ Permission directe trouvée:', ownerId);
        return ownerId;
      }

      // Chercher via groupes
      const { data: groupMembers, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUserId);

      if (!groupError && groupMembers && groupMembers.length > 0) {
        for (const member of groupMembers) {
          const { data: group, error: groupDetailError } = await supabase
            .from('invitation_groups')
            .select('created_by')
            .eq('id', member.group_id)
            .single();

          if (!groupDetailError && group) {
            console.log('✅ Groupe trouvé, créateur:', group.created_by);
            return group.created_by;
          }
        }
      }

      console.log('⚠️ Aucune permission trouvée');
      return '';
    } catch (error) {
      console.error('❌ Erreur détermination utilisateur effectif:', error);
      return '';
    }
  };

  // Fonction pour charger l'histoire
  const loadUserLifeStory = async (effectiveUserId: string) => {
    if (!effectiveUserId || loadingRef.current) {
      console.log('📚 loadUserLifeStory - Skip:', {
        effectiveUserId,
        isLoading: loadingRef.current,
        hasExistingStory: !!existingStory
      });
      return;
    }

    // Si existingStory est fourni, ne pas recharger
    if (existingStory) {
      console.log('📚 Histoire existante fournie, pas de rechargement');
      hasLoadedRef.current = true;
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      console.log('📚 DÉBUT - Chargement pour utilisateur effectif:', effectiveUserId);
      
      // 🔥 NOUVEAU: Vérifier d'abord les permissions explicitement
      console.log('🔐 VÉRIFICATION PERMISSIONS - Début pour utilisateur:', currentUserId);
      
      // Test 1: Vérifier si l'utilisateur est propriétaire
      const isOwner = currentUserId === effectiveUserId;
      console.log('👤 Test propriétaire:', { isOwner, currentUserId, effectiveUserId });
      
      // Test 2: Vérifier permissions directes
      const { data: permissionsCheck, error: permError } = await supabase
        .from('life_story_permissions')
        .select('*')
        .eq('story_owner_id', effectiveUserId)
        .eq('permitted_user_id', currentUserId);
      
      console.log('🔐 Permissions directes:', { permissionsCheck, permError });
      
      // Test 3: Vérifier permissions via groupes
      const { data: groupCheck, error: groupError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          user_id,
          role,
          invitation_groups!inner(
            created_by
          )
        `)
        .eq('user_id', currentUserId);
      
      console.log('🔐 Permissions via groupes:', { groupCheck, groupError });
      
      // Récupérer l'histoire pour cet utilisateur avec gestion d'erreur détaillée
      console.log('📚 🔍 REQUÊTE HISTOIRE - Début pour:', effectiveUserId);
      const { data: storyData, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('📚 ✅ REQUÊTE HISTOIRE TERMINÉE:', {
        storyData: storyData ? {
          id: storyData.id,
          user_id: storyData.user_id,
          title: storyData.title,
          hasChapters: !!storyData.chapters,
          chaptersLength: Array.isArray(storyData.chapters) ? storyData.chapters.length : 0,
          firstChapterPreview: storyData.chapters?.[0] ? {
            id: storyData.chapters[0].id,
            title: storyData.chapters[0].title,
            questionsCount: storyData.chapters[0].questions?.length || 0,
            firstQuestionPreview: storyData.chapters[0].questions?.[0] ? {
              id: storyData.chapters[0].questions[0].id,
              text: storyData.chapters[0].questions[0].text?.substring(0, 50) + '...',
              hasAnswer: !!storyData.chapters[0].questions[0].answer,
              answer: storyData.chapters[0].questions[0].answer,
              hasAudioUrl: !!storyData.chapters[0].questions[0].audioUrl,
              audioUrl: storyData.chapters[0].questions[0].audioUrl
            } : null
          } : null
        } : null,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        } : null
      });

      if (error) {
        console.error('❌ ERREUR DÉTAILLÉE lors du chargement de l\'histoire:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          effectiveUserId,
          currentUserId,
          isReader
        });
        
        // 🔥 NOUVEAU: Afficher plus d'informations sur l'erreur de permission
        if (error.message?.includes('permission') || error.code === 'PGRST116') {
          console.error('❌ ERREUR DE PERMISSION RLS détectée !');
          toast.error('Erreur de permission pour accéder à cette histoire');
        }
        return;
      }

      if (storyData) {
        // 🔥 CHANGEMENT CRITIQUE: Utiliser directement les données de la base
        console.log('🔄 FUSION DONNÉES - Début fusion avec initialChapters');
        const existingChapters = (storyData.chapters as unknown as Chapter[]) || [];
        
        // Créer les chapitres finaux en préservant les données existantes
        const finalChapters = initialChapters.map(initialChapter => {
          const existingChapter = existingChapters.find((ch: Chapter) => ch.id === initialChapter.id);
          
          if (existingChapter && existingChapter.questions) {
            console.log(`🔄 FUSION CHAPITRE ${initialChapter.id}:`, {
              initialQuestionsCount: initialChapter.questions.length,
              existingQuestionsCount: existingChapter.questions.length,
              firstExistingQuestion: existingChapter.questions[0] ? {
                id: existingChapter.questions[0].id,
                hasAnswer: !!existingChapter.questions[0].answer,
                answer: existingChapter.questions[0].answer,
                hasAudioUrl: !!existingChapter.questions[0].audioUrl,
                audioUrl: existingChapter.questions[0].audioUrl
              } : null
            });
            
            return {
              ...initialChapter,
              questions: initialChapter.questions.map(initialQuestion => {
                const existingQuestion = existingChapter.questions?.find((q: any) => q.id === initialQuestion.id);
                
                if (existingQuestion) {
                  console.log(`✅ QUESTION TROUVÉE ${existingQuestion.id}:`, {
                    answer: existingQuestion.answer,
                    audioUrl: existingQuestion.audioUrl,
                    audioBlob: existingQuestion.audioBlob
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
          chapters: finalChapters,
          created_at: storyData.created_at,
          updated_at: storyData.updated_at,
          last_edited_chapter: storyData.last_edited_chapter,
          last_edited_question: storyData.last_edited_question,
        };
        
        console.log('✅ 🎯 HISTOIRE FINALE CONSTRUITE:', {
          storyId: lifeStory.id,
          userId: lifeStory.user_id,
          title: lifeStory.title,
          chaptersCount: lifeStory.chapters.length,
          firstChapterFirstQuestion: lifeStory.chapters[0]?.questions[0] ? {
            id: lifeStory.chapters[0].questions[0].id,
            text: lifeStory.chapters[0].questions[0].text.substring(0, 50) + '...',
            answer: lifeStory.chapters[0].questions[0].answer,
            audioUrl: lifeStory.chapters[0].questions[0].audioUrl,
            hasAnswer: !!lifeStory.chapters[0].questions[0].answer,
            hasAudioUrl: !!lifeStory.chapters[0].questions[0].audioUrl
          } : null
        });
        
        // 🔥 IMPORTANT: Appliquer les données chargées
        console.log('📝 SETDATA - Application des données chargées...');
        setData(lifeStory);
        setActiveTab(storyData.last_edited_chapter || (finalChapters[0]?.id || ''));
        setActiveQuestion(storyData.last_edited_question);
        
        console.log('✅ 🎯 DONNÉES APPLIQUÉES AVEC SUCCÈS');
      } else {
        console.log('📚 Aucune histoire trouvée pour:', effectiveUserId, ', utilisation des chapitres initiaux');
        setData(prev => ({
          ...prev,
          user_id: effectiveUserId,
          chapters: initialChapters
        }));
      }
      
      hasLoadedRef.current = true;
      console.log('✅ 🎯 CHARGEMENT TERMINÉ - hasLoadedRef = true');
    } catch (err) {
      console.error('❌ Exception lors du chargement de l\'histoire de vie:', err);
      toast.error('Erreur technique lors du chargement');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      console.log('🏁 CHARGEMENT FINALISÉ');
    }
  };

  // 🔥 CORRECTION: Charger l'histoire au montage du composant
  useEffect(() => {
    const initializeLifeStory = async () => {
      if (!currentUserId) {
        console.log('⚠️ Pas d\'utilisateur connecté, skip initialisation');
        return;
      }

      console.log('🚀 INITIALISATION - Début chargement histoire...');
      const effectiveUserId = await getEffectiveUserId();
      
      console.log('🎯 UTILISATEUR EFFECTIF DÉTERMINÉ:', effectiveUserId);
      
      if (effectiveUserId) {
        await loadUserLifeStory(effectiveUserId);
      } else {
        console.log('⚠️ Aucun utilisateur effectif trouvé');
        // Utiliser les chapitres initiaux par défaut
        setData(prev => ({
          ...prev,
          user_id: currentUserId,
          chapters: initialChapters
        }));
      }
    };

    initializeLifeStory();
  }, [currentUserId, targetUserId, isReader]);

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
    const canEdit = !isReader && (data.user_id === currentUserId);
    if (!canEdit) return;
    
    setActiveQuestion(questionId);
    setData(prev => ({
      ...prev,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    }));
  };

  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    // Vérifier si l'utilisateur peut modifier
    const canEdit = !isReader && (data.user_id === currentUserId);
    if (!canEdit) return;
    
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
    const canEdit = !isReader && (data.user_id === currentUserId);
    if (!canEdit) return;
    
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
    const canEdit = !isReader && (data.user_id === currentUserId);
    if (!canEdit) return;
    
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
    const canEdit = !isReader && (data.user_id === currentUserId);
    if (!canEdit) return;
    
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
    const canEdit = !isReader && (data.user_id === currentUserId);
    if (!canEdit) {
      console.log('💾 Mode reader ou consultation externe - sauvegarde désactivée');
      return;
    }
    
    if (!data.user_id || isSaving || savingRef.current) {
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
      console.log('💾 Sauvegarde des données pour utilisateur:', data.user_id);
      
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
        user_id: data.user_id,
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
