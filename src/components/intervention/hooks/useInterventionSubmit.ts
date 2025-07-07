
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InterventionFormData } from '../types/FormData';

export const useInterventionSubmit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Refs pour éviter les soumissions multiples
  const isSubmitting = useRef(false);
  const navigationPending = useRef(false);

  const handleSubmit = async (
    e: React.FormEvent,
    formData: InterventionFormData,
    reportId: string | null,
    uploadAudioIfNeeded: (reportId: string, audioUrl: string) => Promise<string | null>,
    setLoading: (loading: boolean) => void,
    isRecording?: boolean
  ) => {
    e.preventDefault();
    
    console.log('📝 SUBMIT_HOOK - Tentative de soumission:', {
      isRecording,
      reportId,
      hasAudioUrl: !!formData.audio_url,
      audioUrl: formData.audio_url
    });
    
    // CRITIQUE: Empêcher absolument la soumission pendant l'enregistrement
    if (isRecording) {
      console.log('🚫 SUBMIT_HOOK - Soumission bloquée - enregistrement en cours');
      toast({
        title: 'Enregistrement en cours',
        description: 'Veuillez arrêter l\'enregistrement avant de sauvegarder le rapport',
        variant: 'destructive',
      });
      return false;
    }
    
    // Éviter les soumissions multiples
    if (isSubmitting.current || navigationPending.current) {
      console.log('⚠️ SUBMIT_HOOK - Soumission déjà en cours, ignorer');
      return false;
    }
    
    if (!user) {
      console.log('❌ SUBMIT_HOOK - Utilisateur non connecté');
      return false;
    }

    if (!formData.patient_name || !formData.auxiliary_name || !formData.date) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return false;
    }

    try {
      isSubmitting.current = true;
      setLoading(true);
      
      console.log('📝 SUBMIT_HOOK - Début sauvegarde du rapport');

      // Mapper les données du formulaire vers les colonnes de la base de données
      const reportData = {
        appointment_id: formData.appointment_id || null,
        professional_id: user.id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        auxiliary_name: formData.auxiliary_name,
        patient_name: formData.patient_name,
        physical_state: formData.physical_state,
        physical_state_other: formData.physical_state_other || null,
        pain_location: formData.pain_location || null,
        mental_state: formData.mental_state,
        mental_state_change: formData.mental_state_change || null,
        appetite: formData.appetite,
        hydration: formData.hydration,
        appetite_comments: formData.appetite_comments || null,
        hygiene: formData.hygiene,
        hygiene_comments: formData.hygiene_comments || null,
        activities: formData.activities,
        activities_other: formData.activities_other || null,
        observations: formData.observations || null,
        follow_up: formData.follow_up,
        follow_up_other: formData.follow_up_other || null,
        audio_url: null, // On va l'uploader après
        media_files: formData.media_files || null,
        client_rating: formData.client_rating || null,
        client_comments: formData.client_comments || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      };

      console.log('💾 SUBMIT_HOOK - Sauvegarde des données du rapport');

      if (reportId) {
        // Mise à jour d'un rapport existant
        console.log('📝 SUBMIT_HOOK - Mise à jour du rapport existant');
        
        // CRITIQUE: Upload de l'audio AVANT la mise à jour
        console.log('🎵 SUBMIT_HOOK - Upload audio avant mise à jour...');
        const finalAudioUrl = await uploadAudioIfNeeded(reportId, formData.audio_url);
        console.log('🎵 SUBMIT_HOOK - Résultat upload audio:', finalAudioUrl);
        
        const updateData = {
          ...reportData,
          audio_url: finalAudioUrl
        };
        
        console.log('💾 SUBMIT_HOOK - Données à sauvegarder:', {
          ...updateData,
          audio_url: finalAudioUrl ? 'URL_PRÉSENTE' : 'NULL'
        });
        
        const { error } = await supabase
          .from('intervention_reports')
          .update(updateData)
          .eq('id', reportId);

        if (error) {
          console.error('❌ SUBMIT_HOOK - Erreur de mise à jour:', error);
          throw error;
        }

        console.log('✅ SUBMIT_HOOK - Rapport mis à jour avec succès');
        toast({
          title: 'Succès',
          description: 'Rapport mis à jour avec succès',
        });
      } else {
        // Création d'un nouveau rapport
        console.log('📝 SUBMIT_HOOK - Création d\'un nouveau rapport');
        const { data: newReport, error } = await supabase
          .from('intervention_reports')
          .insert([reportData])
          .select()
          .single();

        if (error) {
          console.error('❌ SUBMIT_HOOK - Erreur de création:', error);
          throw error;
        }

        console.log('✅ SUBMIT_HOOK - Nouveau rapport créé:', newReport.id);

        // Upload de l'audio après création du rapport
        console.log('🎵 SUBMIT_HOOK - Upload audio après création...');
        const finalAudioUrl = await uploadAudioIfNeeded(newReport.id, formData.audio_url);
        console.log('🎵 SUBMIT_HOOK - Résultat upload audio:', finalAudioUrl);
        
        // Mettre à jour le rapport avec l'URL audio
        if (finalAudioUrl) {
          console.log('💾 SUBMIT_HOOK - Mise à jour du rapport avec URL audio');
          const { error: updateError } = await supabase
            .from('intervention_reports')
            .update({ audio_url: finalAudioUrl })
            .eq('id', newReport.id);
          
          if (updateError) {
            console.error('❌ SUBMIT_HOOK - Erreur mise à jour audio URL:', updateError);
          } else {
            console.log('✅ SUBMIT_HOOK - URL audio mise à jour avec succès');
          }
        }

        // Mettre à jour le rendez-vous si associé
        if (formData.appointment_id && newReport) {
          await supabase
            .from('appointments')
            .update({ 
              intervention_report_id: newReport.id,
              status: 'completed'
            })
            .eq('id', formData.appointment_id);
        }

        toast({
          title: 'Succès',
          description: 'Rapport créé avec succès',
        });
      }

      // Navigation sécurisée - SEULEMENT après sauvegarde complète
      navigationPending.current = true;
      console.log('🔄 SUBMIT_HOOK - Navigation vers la page appropriée');
      
      // Déterminer où naviguer en fonction du paramètre 'from'
      const fromParam = searchParams.get('from');
      const destination = fromParam === 'caregivers' ? '/caregivers' : '/professional-scheduler';
      
      // Délai pour s'assurer que tout est sauvegardé
      setTimeout(() => {
        navigate(destination);
      }, 500);
      
      return true;
      
    } catch (error) {
      console.error('💥 SUBMIT_HOOK - Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder le rapport: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return {
    handleSubmit,
  };
};
