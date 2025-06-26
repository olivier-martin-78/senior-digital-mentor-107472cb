
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LifeStory, Chapter } from '@/types/lifeStory';
import { toast } from '@/hooks/use-toast';
import { initialChapters } from '@/components/life-story/initialChapters';

interface UseLifeStoryDataProps {
  targetUserId?: string;
}

export const useLifeStoryData = ({ targetUserId }: UseLifeStoryDataProps = {}) => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<LifeStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // CORRECTION CRITIQUE: Déterminer l'utilisateur cible de manière cohérente
  const effectiveUserId = targetUserId || user?.id;

  console.log('🔍 useLifeStoryData - Configuration:', {
    targetUserId,
    currentUserId: user?.id,
    effectiveUserId,
    hasUser: !!user
  });

  const loadLifeStory = async (userId: string) => {
    if (!user) {
      console.log('🔍 useLifeStoryData - Pas d\'utilisateur connecté, abandon');
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

  // EFFET PRINCIPAL: Charger l'histoire quand effectiveUserId change
  useEffect(() => {
    console.log('🔄 useLifeStoryData useEffect déclenché:', {
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
    setData,
    isLoading,
    effectiveUserId,
    hasRole
  };
};
