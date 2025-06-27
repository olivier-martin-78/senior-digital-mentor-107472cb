
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InterventionFormData } from '@/types/intervention';
import { toast } from '@/hooks/use-toast';

interface LastReport {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  auxiliary_name: string;
}

interface FullReportData {
  id: string;
  appointment_id?: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  auxiliary_name: string;
  patient_name: string;
  physical_state: string[] | null;
  physical_state_other?: string;
  pain_location?: string;
  mental_state: string[] | null;
  mental_state_change?: string;
  appetite: string;
  hydration: string;
  appetite_comments?: string;
  hygiene: string[] | null;
  hygiene_comments?: string;
  activities: string[] | null;
  activities_other?: string;
  observations?: string;
  follow_up: string[] | null;
  follow_up_other?: string;
  audio_url?: string;
  media_files?: any;
  client_rating?: number;
  client_comments?: string;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export const useLastReports = (clientName?: string) => {
  const [lastReports, setLastReports] = useState<LastReport[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLastReports = async () => {
    if (!clientName || clientName.trim() === '') {
      setLastReports([]);
      return;
    }

    try {
      setLoading(true);
      
      const { data: reports, error } = await supabase
        .from('intervention_reports')
        .select('id, date, start_time, end_time, patient_name, auxiliary_name')
        .eq('patient_name', clientName)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erreur lors du chargement des derniers rapports:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les derniers rapports',
          variant: 'destructive',
        });
        return;
      }

      setLastReports(reports || []);
    } catch (error) {
      console.error('Erreur inattendue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullReport = async (reportId: string): Promise<Partial<InterventionFormData> | null> => {
    try {
      const { data: report, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du rapport complet:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le rapport complet',
          variant: 'destructive',
        });
        return null;
      }

      if (!report) return null;

      // Convertir le rapport en données de formulaire, en excluant audio et médias
      const reportData: Partial<InterventionFormData> = {
        // Ne pas copier appointment_id, patient_name, auxiliary_name, date, start_time, end_time
        // car ce sont des données spécifiques à la nouvelle intervention
        activities: Array.isArray(report.activities) ? report.activities : [],
        activities_other: report.activities_other || '',
        physical_state: Array.isArray(report.physical_state) ? report.physical_state : [],
        physical_state_other: report.physical_state_other || '',
        pain_location: report.pain_location || '',
        mental_state: Array.isArray(report.mental_state) ? report.mental_state : [],
        mental_state_change: report.mental_state_change || '',
        hygiene: Array.isArray(report.hygiene) ? report.hygiene : [],
        hygiene_comments: report.hygiene_comments || '',
        appetite: report.appetite || '',
        appetite_comments: report.appetite_comments || '',
        hydration: report.hydration || '',
        observations: report.observations || '',
        follow_up: Array.isArray(report.follow_up) ? report.follow_up : [],
        follow_up_other: report.follow_up_other || '',
        hourly_rate: report.hourly_rate?.toString() || '',
        // Ne pas copier audio_url, media_files, client_rating, client_comments
      };

      return reportData;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  };

  useEffect(() => {
    loadLastReports();
  }, [clientName]);

  return {
    lastReports,
    loading,
    loadFullReport,
    refreshReports: loadLastReports,
  };
};
