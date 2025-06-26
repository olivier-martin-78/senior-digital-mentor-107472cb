
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { validateAndCleanAudioUrl, isExpiredBlobUrl } from '@/utils/audioUrlCleanup';

export const useReportData = (reportId: string | null) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [audioStatus, setAudioStatus] = useState<'loading' | 'valid' | 'expired' | 'none'>('none');

  useEffect(() => {
    if (reportId && user) {
      loadReport();
    } else {
      console.log('❌ Paramètres manquants:', { reportId, hasUser: !!user });
      setLoading(false);
    }
  }, [reportId, user]);

  const loadReport = async () => {
    if (!reportId || !user) {
      console.log('❌ Paramètres manquants pour charger le rapport');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📋 Chargement du rapport:', reportId);
      
      // Charger le rapport
      const { data: reportData, error: reportError } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) {
        console.error('❌ Erreur lors du chargement du rapport:', reportError);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le rapport d\'intervention',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ Rapport chargé - Analyse détaillée de l\'audio:', {
        reportId: reportData?.id,
        hasAudioUrl: !!reportData?.audio_url,
        audioUrl: reportData?.audio_url,
        audioUrlLength: reportData?.audio_url?.length || 0,
        audioUrlType: typeof reportData?.audio_url,
        isEmptyString: reportData?.audio_url === '',
        isNull: reportData?.audio_url === null,
        isUndefined: reportData?.audio_url === undefined,
        trimmedUrl: reportData?.audio_url?.trim?.(),
        appointmentId: reportData?.appointment_id
      });

      // Analyser l'état de l'audio avec plus de détails
      if (!reportData?.audio_url || reportData.audio_url.trim() === '') {
        console.log('🎵 Aucune URL audio dans le rapport (vide, null, ou undefined)');
        setAudioStatus('none');
      } else {
        const trimmedUrl = reportData.audio_url.trim();
        console.log('🎵 URL audio détectée, analyse approfondie:', {
          originalUrl: reportData.audio_url,
          trimmedUrl,
          urlLength: trimmedUrl.length,
          startsWithHttp: trimmedUrl.startsWith('http'),
          includesSupabase: trimmedUrl.includes('supabase'),
          includesInterventionAudios: trimmedUrl.includes('intervention-audios')
        });
        
        if (isExpiredBlobUrl(trimmedUrl)) {
          console.log('🎵 URL audio expirée détectée (blob:):', trimmedUrl);
          setAudioStatus('expired');
          // Nettoyer l'URL expirée
          const validatedAudioUrl = await validateAndCleanAudioUrl(trimmedUrl, reportId);
          reportData.audio_url = validatedAudioUrl;
          if (!validatedAudioUrl) {
            setAudioStatus('expired');
          }
        } else {
          console.log('🎵 URL audio détectée, validation de l\'accessibilité:', trimmedUrl);
          setAudioStatus('loading');
          
          // Vérifier si l'URL est accessible
          try {
            const response = await fetch(trimmedUrl, { method: 'HEAD' });
            console.log('🎵 Réponse de validation URL:', {
              status: response.status,
              ok: response.ok,
              headers: {
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
              }
            });
            
            if (response.ok) {
              console.log('🎵 URL audio VALIDE et accessible');
              setAudioStatus('valid');
            } else {
              console.log('🎵 URL audio NON accessible, status:', response.status);
              setAudioStatus('expired');
            }
          } catch (error) {
            console.log('🎵 Erreur lors de la vérification de l\'URL audio:', error);
            setAudioStatus('expired');
          }
        }
      }

      setReport(reportData);

      // Si le rapport a un appointment_id, charger le rendez-vous associé
      if (reportData?.appointment_id) {
        console.log('📅 Chargement du rendez-vous:', reportData.appointment_id);
        
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            *,
            clients:client_id (
              first_name,
              last_name,
              address
            ),
            intervenants:intervenant_id (
              first_name,
              last_name
            )
          `)
          .eq('id', reportData.appointment_id)
          .single();

        if (appointmentData && !appointmentError) {
          console.log('✅ Rendez-vous chargé');
          setAppointment(appointmentData);
        } else {
          console.log('⚠️ Erreur lors du chargement du rendez-vous:', appointmentError);
        }
      }
    } catch (error) {
      console.error('💥 Erreur inattendue:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    report,
    appointment,
    audioStatus,
    setAudioStatus
  };
};
