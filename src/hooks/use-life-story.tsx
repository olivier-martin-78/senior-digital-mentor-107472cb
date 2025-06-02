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

  // CORRECTION CRITIQUE: Déterminer l'utilisateur cible de manière cohérente
  const effectiveUserId = targetUserId || user?.id;

  console.log('🔍 useLifeStory - Configuration:', {
    targetUserId,
    currentUserId: user?.id,
    effectiveUserId,
    hasUser: !!user
  });

  const loadLifeStory = async (userId: string) => {
    if (!user) {
      console.log('🔍 useLifeStory - Pas d\'utilisateur connecté, abandon');
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`🔍 Chargement de l'histoire de vie pour l'utilisateur: ${userId} (demandé par: ${user.id})`);

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
        console.log('✅ Histoire de vie chargée avec succès:', {
          storyId: storyData.id,
          storyUserId: storyData.user_id,
          requestedUserId: userId,
          matchesRequest: storyData.user_id === userId
        });
        
        // VALIDATION CRITIQUE: Vérifier que les données correspondent bien à l'utilisateur demandé
        if (storyData.user_id !== userId) {
          console.error('❌ ERREUR CRITIQUE: les données chargées ne correspondent pas à l\'utilisateur demandé', {
            expected: userId,
            received: storyData.user_id
          });
          throw new Error(`Incohérence des données: attendu ${userId}, reçu ${storyData.user_id}`);
        }
        
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

        // Fusionner avec les chapitres initiaux pour s'assurer que toutes les questions sont présentes
        const mergedChapters = initialChapters.map(initialChapter => {
          const existingChapter = parsedChapters.find(ch => ch.id === initialChapter.id);
          
          if (existingChapter) {
            const mergedQuestions = initialChapter.questions.map(initialQuestion => {
              const existingQuestion = existingChapter.questions?.find(q => q.id === initialQuestion.id);
              
              if (existingQuestion) {
                const normalizedAudioUrl = existingQuestion.audioUrl && existingQuestion.audioUrl.trim() !== '' 
                  ? existingQuestion.audioUrl 
                  : null;
                
                return {
                  ...initialQuestion,
                  answer: existingQuestion.answer || initialQuestion.answer,
                  audioUrl: normalizedAudioUrl,
                  audioBlob: existingQuestion.audioBlob || initialQuestion.audioBlob,
                };
              }
              
              return initialQuestion;
            });
            
            return {
              ...initialChapter,
              questions: mergedQuestions
            };
          }
          
          return initialChapter;
        });

        console.log('🎵 Audio URLs récupérées lors du chargement:', 
          mergedChapters.flatMap(ch => 
            ch.questions.filter(q => q.audioUrl).map(q => ({
              questionId: q.id,
              audioUrl: q.audioUrl
            }))
          )
        );

        setData({
          ...storyData,
          user_id: userId, // S'ASSURER que l'user_id est cohérent
          chapters: mergedChapters
        });
      } else {
        console.log('💡 Aucune histoire trouvée, création avec les chapitres initiaux pour utilisateur:', userId);
        const newStory: LifeStory = {
          user_id: userId, // IMPORTANT: Utiliser le userId demandé
          title: 'Mon Histoire de Vie',
          chapters: initialChapters,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setData(newStory);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement:', error);
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
    if (!data || !user || !effectiveUserId) {
      console.error('❌ Données manquantes pour la sauvegarde:', {
        hasData: !!data,
        hasUser: !!user,
        effectiveUserId
      });
      return;
    }
    
    // Vérifier les permissions avant la sauvegarde
    const isAdmin = hasRole('admin');
    const isOwnStory = effectiveUserId === user.id;
    
    if (!isOwnStory && !isAdmin) {
      console.error('❌ Permissions insuffisantes pour sauvegarder cette histoire');
      toast({
        title: 'Erreur de permissions',
        description: 'Vous n\'avez pas le droit de modifier cette histoire de vie.',
        variant: 'destructive',
      });
      return;
    }

    // CORRECTION CRITIQUE: S'assurer que data.user_id correspond à effectiveUserId
    if (data.user_id !== effectiveUserId) {
      console.warn('⚠️ CORRECTION de l\'user_id incohérent:', {
        currentDataUserId: data.user_id,
        expectedUserId: effectiveUserId
      });
      
      // Mettre à jour les données locales pour corriger l'incohérence
      setData(prev => prev ? { ...prev, user_id: effectiveUserId } : null);
    }

    try {
      setIsSaving(true);
      console.log('💾 Sauvegarde de l\'histoire de vie pour user_id:', {
        effectiveUserId,
        currentDataUserId: data.user_id
      });

      // Log des URLs audio avant sauvegarde
      const audioUrls = data.chapters.flatMap(ch => 
        ch.questions.filter(q => q.audioUrl).map(q => ({
          questionId: q.id,
          audioUrl: q.audioUrl
        }))
      );
      console.log('🎵 URLs audio à sauvegarder:', audioUrls);

      // Préparer les données pour la sauvegarde - PRÉSERVER les URLs audio existantes
      const chaptersToSave = data.chapters.map(chapter => ({
        ...chapter,
        questions: chapter.questions.map(question => {
          const normalizedAudioUrl = question.audioUrl && question.audioUrl.trim() !== '' 
            ? question.audioUrl 
            : null;
          
          return {
            id: question.id,
            text: question.text,
            answer: question.answer || '',
            audioUrl: normalizedAudioUrl,
          };
        })
      }));

      console.log('💾 Chapitres préparés pour sauvegarde:', chaptersToSave);

      const dataToSave = {
        user_id: effectiveUserId, // UTILISER effectiveUserId de manière cohérente
        title: data.title,
        chapters: JSON.stringify(chaptersToSave),
        updated_at: new Date().toISOString(),
        last_edited_chapter: data.last_edited_chapter || null,
        last_edited_question: data.last_edited_question || null,
      };

      console.log('💾 Données à sauvegarder:', {
        user_id: dataToSave.user_id,
        chaptersCount: chaptersToSave.length,
        audioCount: audioUrls.length
      });

      const { data: savedData, error } = await supabase
        .from('life_stories')
        .upsert(dataToSave, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'histoire:', error);
        throw error;
      }

      console.log('✅ Histoire de vie sauvegardée avec succès:', {
        savedId: savedData?.id,
        savedUserId: savedData?.user_id,
        expectedUserId: effectiveUserId
      });
      
      // VALIDATION POST-SAUVEGARDE: Vérifier la cohérence
      if (savedData?.user_id !== effectiveUserId) {
        console.error('❌ ERREUR CRITIQUE: user_id incohérent après sauvegarde:', {
          saved: savedData?.user_id,
          expected: effectiveUserId
        });
        throw new Error('Incohérence des données après sauvegarde');
      }
      
      // Mettre à jour les données locales avec l'ID retourné et s'assurer de la cohérence
      if (savedData && savedData.id) {
        setData(prevData => ({
          ...prevData!,
          id: savedData.id,
          user_id: effectiveUserId, // S'assurer que l'user_id est cohérent
          created_at: savedData.created_at,
          updated_at: savedData.updated_at
        }));
      }
      
      setLastSaved(new Date());
      toast({
        title: 'Succès',
        description: 'Histoire de vie sauvegardée !',
      });
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
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

    console.log('📝 Mise à jour réponse:', { questionId, answer, dataUserId: data.user_id });
    
    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId ? { ...question, answer } : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
    
    setTimeout(() => {
      if (!isSaving) {
        saveNow();
      }
    }, 1000);
  };

  const handleAudioRecorded = (questionId: string, audioBlob: Blob, audioUrl: string) => {
    if (!data) return;

    console.log('🎤 Audio enregistré:', { questionId, audioUrl, dataUserId: data.user_id, effectiveUserId });

    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId 
          ? { ...question, audioBlob, audioUrl } 
          : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
    
    setTimeout(() => {
      if (!isSaving) {
        saveNow();
      }
    }, 500);
  };

  const handleAudioDeleted = (questionId: string) => {
    if (!data) return;

    console.log('🗑️ Audio supprimé:', { questionId, dataUserId: data.user_id, effectiveUserId });

    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId 
          ? { ...question, audioBlob: null, audioUrl: null } 
          : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
    
    setTimeout(() => {
      if (!isSaving) {
        saveNow();
      }
    }, 500);
  };

  const handleAudioUrlChange = (questionId: string, audioUrl: string | null) => {
    if (!data) return;

    console.log('🔄 Changement URL audio:', { questionId, audioUrl, dataUserId: data.user_id, effectiveUserId });

    const normalizedAudioUrl = audioUrl && audioUrl.trim() !== '' ? audioUrl : null;

    const updatedChapters = data.chapters.map(chapter => ({
      ...chapter,
      questions: chapter.questions.map(question =>
        question.id === questionId 
          ? { ...question, audioUrl: normalizedAudioUrl } 
          : question
      )
    }));

    setData({ ...data, chapters: updatedChapters });
    
    // CORRECTION CRITIQUE: Toujours sauvegarder quand il y a une URL audio
    // car cela signifie qu'un upload vient de se terminer
    if (normalizedAudioUrl) {
      setTimeout(() => {
        if (!isSaving) {
          saveNow();
        }
      }, 500);
    }
  };

  // Calculer le progrès
  const progress = data ? (() => {
    const totalQuestions = data.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
    const answeredQuestions = data.chapters.reduce((sum, chapter) => 
      sum + chapter.questions.filter(q => q.answer && q.answer.trim() !== '').length, 0
    );
    return { totalQuestions, answeredQuestions };
  })() : { totalQuestions: 0, answeredQuestions: 0 };

  // EFFET PRINCIPAL: Charger l'histoire quand effectiveUserId change
  useEffect(() => {
    console.log('🔄 useEffect déclenché:', {
      effectiveUserId,
      hasUser: !!user,
      userId: user?.id,
      targetUserId
    });

    if (effectiveUserId && user) {
      console.log('🔄 Rechargement pour utilisateur:', {
        effectiveUserId,
        targetUserId,
        currentUserId: user?.id
      });
      loadLifeStory(effectiveUserId);
    } else {
      console.log('🔄 Pas d\'utilisateur effectif, reset des données');
      setData(null);
      setIsLoading(false);
    }
  }, [effectiveUserId, user?.id]); // DÉPENDANCES CRITIQUES

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
