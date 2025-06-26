
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LifeStory } from '@/types/lifeStory';
import { toast } from '@/hooks/use-toast';

interface UseLifeStorySaveProps {
  data: LifeStory | null;
  setData: (data: LifeStory | null) => void;
  effectiveUserId?: string;
  hasRole: (role: string) => boolean;
}

export const useLifeStorySave = ({ data, setData, effectiveUserId, hasRole }: UseLifeStorySaveProps) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingSave, setPendingSave] = useState(false);

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

  // Effet pour sauvegarder automatiquement les changements en attente
  useEffect(() => {
    if (pendingSave && !isSaving && data) {
      console.log('🔄 Traitement d\'une sauvegarde en attente');
      const timer = setTimeout(() => {
        if (pendingSave && !isSaving) {
          saveNow();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [pendingSave, isSaving, data]);

  return {
    isSaving,
    lastSaved,
    pendingSave,
    setPendingSave,
    saveNow
  };
};
