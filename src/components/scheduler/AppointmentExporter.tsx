
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppointmentExporterProps {
  professionalId: string;
}

const AppointmentExporter: React.FC<AppointmentExporterProps> = ({ professionalId }) => {
  const exportCompletedAppointments = async () => {
    try {
      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          notes,
          status,
          clients:client_id (
            first_name,
            last_name,
            address,
            phone,
            email
          )
        `)
        .eq('professional_id', professionalId)
        .eq('status', 'completed')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Aucun rendez-vous',
          description: 'Aucun rendez-vous terminé trouvé pour ce mois',
        });
        return;
      }

      // Créer le contenu CSV
      const csvHeaders = [
        'Date',
        'Heure début',
        'Heure fin',
        'Client',
        'Adresse',
        'Téléphone',
        'Email',
        'Notes'
      ];

      const csvContent = [
        csvHeaders.join(','),
        ...data.map(appointment => {
          const client = appointment.clients;
          return [
            format(new Date(appointment.start_time), 'dd/MM/yyyy'),
            format(new Date(appointment.start_time), 'HH:mm'),
            format(new Date(appointment.end_time), 'HH:mm'),
            `"${client?.first_name || ''} ${client?.last_name || ''}"`,
            `"${client?.address || ''}"`,
            `"${client?.phone || ''}"`,
            `"${client?.email || ''}"`,
            `"${appointment.notes || ''}"`
          ].join(',');
        })
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rendez-vous-termines-${format(currentDate, 'MM-yyyy')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export réussi',
        description: `${data.length} rendez-vous exportés avec succès`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les rendez-vous',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button 
      onClick={exportCompletedAppointments}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Exporter RDV terminés (CSV)
    </Button>
  );
};

export default AppointmentExporter;
