import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useReportActions = (reportId: string | null, report: any) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [deleting, setDeleting] = useState(false);

  const handleEdit = () => {
    const fromParam = searchParams.get('from');
    const editUrl = `/intervention-report?report_id=${reportId}&edit=true${fromParam ? `&from=${fromParam}` : ''}`;
    navigate(editUrl);
  };

  const handleDelete = async () => {
    if (!reportId) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('intervention_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      if (report?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ 
            intervention_report_id: null,
            status: 'scheduled'
          })
          .eq('id', report.appointment_id);
      }

      toast({
        title: 'Succès',
        description: 'Rapport supprimé avec succès',
      });

      navigate('/scheduler');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rapport',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportAudio = async () => {
    if (!report?.audio_url) {
      toast({
        title: "Erreur d'export",
        description: "Aucun enregistrement audio disponible pour l'export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Télécharger le fichier comme blob pour forcer le téléchargement
      const response = await fetch(report.audio_url);
      if (!response.ok) {
        throw new Error('Impossible de télécharger le fichier audio');
      }
      
      const blob = await response.blob();
      
      // Créer une URL temporaire pour le blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Créer un élément de téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Générer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const fileName = `rapport-audio-${report.patient_name}-${report.date}-${timestamp}.webm`;
      
      link.download = fileName;
      
      // Forcer le téléchargement en ajoutant des attributs spécifiques
      link.style.display = 'none';
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: 'Téléchargement lancé',
        description: 'L\'enregistrement audio est en cours de téléchargement',
      });
    } catch (error) {
      console.error("Erreur lors de l'export audio:", error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'enregistrement audio",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    const fromParam = searchParams.get('from');
    if (fromParam === 'caregivers') {
      navigate('/caregivers');
    } else {
      navigate('/professional-scheduler');
    }
  };

  return {
    deleting,
    handleEdit,
    handleDelete,
    handleExportAudio,
    handleBack
  };
};
