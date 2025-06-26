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
  const [pendingSave, setPendingSave] = useState(false);

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

        // CORRECTION: Meilleure gestion des chemins audio lors du chargement
        const mergedChapters = initialChapters.map(initialChapter => {
          const existingChapter = parsedChapters.find(ch => ch.id === initialChapter.id);
          
          if (existingChapter) {
            const mergedQuestions = initialChapter.questions.map(initialQuestion => {
              const existingQuestion = existingChapter.questions?.find(q => q.id === initialQuestion.id);
              
              if (existingQuestion) {
                // CORRECTION: Validation stricte des chemins audio
                let validAudioUrl = null;
                if (existingQuestion.audioUrl && 
                    typeof existingQuestion.audioUrl === 'string' && 
                    existingQuestion.audioUrl.trim() !== '') {
                  validAudioUrl = existingQuestion.audioUrl.trim();
                  
                  // LOG DÉTAILLÉ pour question 1 chapitre 1
                  if (initialChapter.id === 'chapter-1' && initialQuestion.id === 'question-1') {
                    console.log('🎵 LOAD - Question 1 Chapitre 1 - Audio trouvé:', {
                      questionId: initialQuestion.id,
                      rawAudioUrl: existingQuestion.audioUrl,
                      validAudioUrl,
                      audioUrlType: typeof existingQuestion.audioUrl,
                      audioUrlLength: existingQuestion.audioUrl?.length,
                      isString: typeof existingQuestion.audioUrl === 'string',
                      isTrimmed: existingQuestion.audioUrl?.trim() !== '',
                      finalValidUrl: validAudioUrl
                    });
                  }
                } else {
                  // LOG DÉTAILLÉ pour question 1 chapitre 1
                  if (initialChapter.id === 'chapter-1' && initialQuestion.id === 'question-1') {
                    console.log('🎵 LOAD - Question 1 Chapitre 1 - Pas d\'audio valide:', {
                      questionId: initialQuestion.id,
                      rawAudioUrl: existingQuestion.audioUrl,
                      audioUrlType: typeof existingQuestion.audioUrl,
                      hasAudioUrl: !!existingQuestion.audioUrl,
                      isString: typeof existingQuestion.audioUrl === 'string',
                      isTrimmed: existingQuestion.audioUrl && existingQuestion.audioUrl.trim() !== ''
                    });
                  }
                }
                
                return {
                  ...initialQuestion,
                  answer: existingQuestion.answer || initialQuestion.answer,
                  audioUrl: validAudioUrl,
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

        // LOG DÉTAILLÉ pour question 1 chapitre 1 après merge
        const chapter1 = mergedChapters.find(ch => ch.id === 'chapter-1');
        const question1 = chapter1?.questions.find(q => q.id === 'question-1');
        if (question1) {
          console.log('🎵 LOAD - Question 1 Chapitre 1 - État final après merge:', {
            questionId: question1.id,
            audioUrl: question1.audioUrl,
            hasAudioUrl: !!question1.audioUrl,
            audioUrlType: typeof question1.audioUrl,
            answer: question1.answer
          });
        }

        setData({
          ...storyData,
          user_id: userId,
          chapters: mergedChapters
        });
      } else {
        console.log('💡 Aucune histoire trouvée, création avec les chapitres initiaux pour utilisateur:', userId);
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
      setPendingSave(false);
      console.log('💾 Sauvegarde de l\'histoire de vie pour user_id:', {
        effectiveUserId,
        currentDataUserId: data.user_id
      });

      // LOG DÉTAILLÉ pour question 1 chapitre 1 avant sauvegarde
      const chapter1 = data.chapters.find(ch => ch.id === 'chapter-1');
      const question1 = chapter1?.questions.find(q => q.id === 'question-1');
      if (question1) {
        console.log('🎵 SAVE - Question 1 Chapitre 1 - État avant sauvegarde:', {
          questionId: question1.id,
          audioUrl: question1.audioUrl,
          hasAudioUrl: !!question1.audioUrl,
          audioUrlType: typeof question1.audioUrl,
          audioUrlLength: question1.audioUrl?.length,
          answer: question1.answer
        });
      }

      // Préparer les données pour la sauvegarde - PRÉSERVER les chemins audio existants
      const chaptersToSave = data.chapters.map(chapter => ({
        ...chapter,
        questions: chapter.questions.map(question => {
          // CORRECTION: Sauvegarder le chemin relatif au lieu de l'URL complète
          const normalizedAudioPath = question.audioUrl && question.audioUrl.trim() !== '' 
            ? question.audioUrl 
            : null;
          
          // LOG DÉTAILLÉ pour question 1 chapitre 1
          if (chapter.id === 'chapter-1' && question.id === 'question-1') {
            console.log('🎵 SAVE - Question 1 Chapitre 1 - Normalisation audio:', {
              questionId: question.id,
              originalAudioUrl: question.audioUrl,
              normalizedAudioPath,
              willSaveAudio: !!normalizedAudioPath
            });
          }
          
          return {
            id: question.id,
            text: question.text,
            answer: question.answer || '',
            audioUrl: normalizedAudioPath, // Maintenant c'est un chemin relatif
          };
        })
      }));

      // LOG DÉTAILLÉ pour question 1 chapitre 1 dans les données finales
      const chapter1ToSave = chaptersToSave.find(ch => ch.id === 'chapter-1');
      const question1ToSave = chapter1ToSave?.questions.find(q => q.id === 'question-1');
      if (question1ToSave) {
        console.log('🎵 SAVE - Question 1 Chapitre 1 - Données finales à sauvegarder:', {
          questionId: question1ToSave.id,
          audioUrl: question1ToSave.audioUrl,
          hasAudioUrl: !!question1ToSave.audioUrl,
          answer: question1ToSave.answer
        });
      }

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
        chaptersJson: dataToSave.chapters.substring(0, 200) + '...'
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
        title: 'Sauvegarde réussie',
        description: 'Votre histoire de vie a été sauvegardée automatiquement !',
        duration: 2000
      });
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      setPendingSave(true); // Marquer qu'une sauvegarde est en attente
      toast({
        title: 'Erreur de sauvegarde',
        description: `Impossible de sauvegarder: ${error.message}. Réessai automatique en cours...`,
        variant: 'destructive',
      });
      
      // Réessayer la sauvegarde après un délai
      setTimeout(() => {
        if (!isSaving && pendingSave) {
          console.log('🔄 Nouvelle tentative de sauvegarde automatique');
          saveNow();
        }
      }, 3000);
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

  // CORRECTION: handleQuestionFocus doit accepter chapterId et questionId
  const handleQuestionFocus = (chapterId: string, questionId: string) => {
    setActiveQuestion(questionId);
  };

  // CORRECTION: updateAnswer doit accepter chapterId et questionId
  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    if (!data) return;

    console.log('📝 Mise à jour réponse:', { chapterId, questionId, answer, dataUserId: data.user_id });
    
    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId ? { ...question, answer } : question
        )
      } : chapter
    );

    setData({ ...data, chapters: updatedChapters });
  };

  // CORRECTION: handleAudioRecorded doit accepter chapterId et questionId
  const handleAudioRecorded = (chapterId: string, questionId: string, audioBlob: Blob, audioPath?: string) => {
    if (!data) return;

    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🎤 RECORD - Question 1 Chapitre 1 - Audio enregistré (HOOK):', {
        chapterId,
        questionId,
        audioPath,
        audioBlobSize: audioBlob.size,
        dataUserId: data.user_id,
        effectiveUserId,
        timestamp: new Date().toISOString()
      });
    }

    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId 
            ? { ...question, audioBlob } 
            : question
        )
      } : chapter
    );

    setData({ ...data, chapters: updatedChapters });
  };

  // CORRECTION: handleAudioDeleted doit accepter chapterId et questionId
  const handleAudioDeleted = (chapterId: string, questionId: string) => {
    if (!data) return;

    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🗑️ DELETE - Question 1 Chapitre 1 - Audio supprimé:', {
        chapterId,
        questionId,
        dataUserId: data.user_id,
        effectiveUserId,
        timestamp: new Date().toISOString()
      });
    }

    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId 
            ? { ...question, audioBlob: null, audioUrl: null } 
            : question
        )
      } : chapter
    );

    setData({ ...data, chapters: updatedChapters });
    
    // CORRECTION: Sauvegarde automatique pour la suppression
    console.log('💾 Déclenchement sauvegarde automatique pour suppression audio');
    setTimeout(() => {
      if (!isSaving) {
        saveNow();
      }
    }, 100);
  };

  // CORRECTION: handleAudioUrlChange doit accepter chapterId et questionId
  const handleAudioUrlChange = (chapterId: string, questionId: string, audioPath: string | null) => {
    if (!data) return;

    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🔄 URL_CHANGE - Question 1 Chapitre 1 - Changement chemin audio (HOOK):', {
        chapterId,
        questionId,
        audioPath,
        audioPathType: typeof audioPath,
        dataUserId: data.user_id,
        effectiveUserId,
        timestamp: new Date().toISOString()
      });
    }

    // CORRECTION: Validation stricte du chemin audio
    const validAudioPath = (audioPath && typeof audioPath === 'string' && audioPath.trim() !== '') 
      ? audioPath.trim() 
      : null;

    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId 
            ? { ...question, audioUrl: validAudioPath } 
            : question
        )
      } : chapter
    );

    // CORRECTION: Mettre à jour l'état local immédiatement
    setData({ ...data, chapters: updatedChapters });
    
    // SAUVEGARDE AUTOMATIQUE IMMÉDIATE pour les nouveaux audios
    if (validAudioPath) {
      console.log('💾 NOUVEAU AUDIO - Sauvegarde automatique IMMÉDIATE pour:', { chapterId, questionId });
      
      // Sauvegarde immédiate sans délai pour les nouveaux audios
      setTimeout(() => {
        if (!isSaving) {
          console.log('✅ Exécution immédiate de la sauvegarde automatique pour nouvel audio');
          saveNow();
        } else {
          console.log('⏳ Sauvegarde en cours, programmation d\'une sauvegarde différée');
          // Marquer qu'une sauvegarde est en attente
          setPendingSave(true);
          
          // Vérifier périodiquement si on peut sauvegarder
          const checkAndSave = () => {
            setTimeout(() => {
              if (!isSaving && pendingSave) {
                console.log('✅ Exécution différée de la sauvegarde automatique pour nouvel audio');
                saveNow();
              } else if (isSaving) {
                // Réessayer si encore en cours de sauvegarde
                checkAndSave();
              }
            }, 500);
          };
          checkAndSave();
        }
      }, 50); // Délai très court pour la stabilisation
    } else {
      // Pour la suppression d'audio, sauvegarde normale
      console.log('💾 Déclenchement sauvegarde automatique pour suppression audio');
      setTimeout(() => {
        if (!isSaving) {
          saveNow();
        } else {
          setPendingSave(true);
        }
      }, 100);
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

  // Effet pour sauvegarder automatiquement les changements en attente
  useEffect(() => {
    if (pendingSave && !isSaving && !isLoading) {
      console.log('🔄 Traitement d\'une sauvegarde en attente');
      const timer = setTimeout(() => {
        if (pendingSave && !isSaving) {
          saveNow();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [pendingSave, isSaving, isLoading]);

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
