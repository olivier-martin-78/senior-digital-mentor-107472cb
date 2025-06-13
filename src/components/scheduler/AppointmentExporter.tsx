
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

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
            email,
            hourly_rate
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

      // Préparer les données pour Excel
      const excelData = data.map(appointment => {
        const client = appointment.clients;
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        
        // Calculer le nombre d'heures
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        
        // Prix horaire du client
        const hourlyRate = client?.hourly_rate || 0;
        
        // Total en euros
        const total = durationHours * hourlyRate;

        return {
          'Date': format(startTime, 'dd/MM/yyyy'),
          'Heure début': format(startTime, 'HH:mm'),
          'Heure fin': format(endTime, 'HH:mm'),
          'Nombre d\'heures': Number(durationHours.toFixed(2)),
          'Client': `${client?.first_name || ''} ${client?.last_name || ''}`.trim(),
          'Adresse': client?.address || '',
          'Téléphone': client?.phone || '',
          'Email': client?.email || '',
          'Prix horaire (€)': hourlyRate,
          'Total (€)': Number(total.toFixed(2)),
          'Notes': appointment.notes || ''
        };
      });

      // Créer le classeur Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      
      // Définir la largeur des colonnes
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 12 }, // Heure début
        { wch: 12 }, // Heure fin
        { wch: 15 }, // Nombre d'heures
        { wch: 25 }, // Client
        { wch: 30 }, // Adresse
        { wch: 15 }, // Téléphone
        { wch: 25 }, // Email
        { wch: 15 }, // Prix horaire
        { wch: 12 }, // Total
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;

      // Ajouter la feuille au classeur
      XLSX.utils.book_append_sheet(workbook, worksheet, 'RDV Terminés');

      // Générer le fichier Excel avec encodage UTF-8
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false,
        compression: true
      });

      // Créer le blob et télécharger
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rendez-vous-termines-${format(currentDate, 'MM-yyyy')}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Calculer les totaux pour le message
      const totalHours = excelData.reduce((sum, row) => sum + row['Nombre d\'heures'], 0);
      const totalAmount = excelData.reduce((sum, row) => sum + row['Total (€)'], 0);

      toast({
        title: 'Export réussi',
        description: `${data.length} rendez-vous exportés (${totalHours.toFixed(2)}h - ${totalAmount.toFixed(2)}€)`,
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
      Exporter RDV terminés (Excel)
    </Button>
  );
};

export default AppointmentExporter;
