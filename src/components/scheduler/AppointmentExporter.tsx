
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

      // Récupérer tous les rendez-vous du mois (terminés, programmés et annulés)
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
        .in('status', ['completed', 'scheduled', 'cancelled'])
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Aucun rendez-vous',
          description: 'Aucun rendez-vous trouvé pour ce mois',
        });
        return;
      }

      // Séparer les rendez-vous par statut
      const completedAppointments = data.filter(apt => apt.status === 'completed');
      const scheduledAppointments = data.filter(apt => apt.status === 'scheduled');
      const cancelledAppointments = data.filter(apt => apt.status === 'cancelled');

      // Créer le classeur Excel
      const workbook = XLSX.utils.book_new();

      // Fonction pour préparer les données d'une liste de rendez-vous
      const prepareAppointmentData = (appointments: any[], includeFinancialData = false) => {
        return appointments.map(appointment => {
          const client = appointment.clients;
          const startTime = new Date(appointment.start_time);
          const endTime = new Date(appointment.end_time);
          
          const baseData = {
            'Date': format(startTime, 'dd/MM/yyyy'),
            'Heure début': format(startTime, 'HH:mm'),
            'Heure fin': format(endTime, 'HH:mm'),
            'Client': `${client?.first_name || ''} ${client?.last_name || ''}`.trim(),
            'Adresse': client?.address || '',
            'Téléphone': client?.phone || '',
            'Email': client?.email || '',
            'Notes': appointment.notes || ''
          };

          if (includeFinancialData) {
            // Calculer le nombre d'heures
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            
            // Prix horaire du client
            const hourlyRate = client?.hourly_rate || 0;
            
            // Total en euros
            const total = durationHours * hourlyRate;

            return {
              ...baseData,
              'Nombre d\'heures': Number(durationHours.toFixed(2)),
              'Prix horaire (€)': hourlyRate,
              'Total (€)': Number(total.toFixed(2))
            };
          }

          return baseData;
        });
      };

      // 1. Feuille des rendez-vous terminés (avec données financières)
      if (completedAppointments.length > 0) {
        const completedData = prepareAppointmentData(completedAppointments, true);
        const completedWorksheet = XLSX.utils.json_to_sheet(completedData);
        
        // Définir la largeur des colonnes pour les RDV terminés
        const completedColumnWidths = [
          { wch: 12 }, // Date
          { wch: 12 }, // Heure début
          { wch: 12 }, // Heure fin
          { wch: 25 }, // Client
          { wch: 30 }, // Adresse
          { wch: 15 }, // Téléphone
          { wch: 25 }, // Email
          { wch: 30 }, // Notes
          { wch: 15 }, // Nombre d'heures
          { wch: 15 }, // Prix horaire
          { wch: 12 }  // Total
        ];
        completedWorksheet['!cols'] = completedColumnWidths;
        
        XLSX.utils.book_append_sheet(workbook, completedWorksheet, 'RDV Terminés');
      }

      // 2. Feuille des rendez-vous programmés
      if (scheduledAppointments.length > 0) {
        const scheduledData = prepareAppointmentData(scheduledAppointments, false);
        const scheduledWorksheet = XLSX.utils.json_to_sheet(scheduledData);
        
        // Définir la largeur des colonnes pour les RDV programmés
        const scheduledColumnWidths = [
          { wch: 12 }, // Date
          { wch: 12 }, // Heure début
          { wch: 12 }, // Heure fin
          { wch: 25 }, // Client
          { wch: 30 }, // Adresse
          { wch: 15 }, // Téléphone
          { wch: 25 }, // Email
          { wch: 30 }  // Notes
        ];
        scheduledWorksheet['!cols'] = scheduledColumnWidths;
        
        XLSX.utils.book_append_sheet(workbook, scheduledWorksheet, 'RDV Programmés');
      }

      // 3. Feuille des rendez-vous annulés
      if (cancelledAppointments.length > 0) {
        const cancelledData = prepareAppointmentData(cancelledAppointments, false);
        const cancelledWorksheet = XLSX.utils.json_to_sheet(cancelledData);
        
        // Définir la largeur des colonnes pour les RDV annulés
        const cancelledColumnWidths = [
          { wch: 12 }, // Date
          { wch: 12 }, // Heure début
          { wch: 12 }, // Heure fin
          { wch: 25 }, // Client
          { wch: 30 }, // Adresse
          { wch: 15 }, // Téléphone
          { wch: 25 }, // Email
          { wch: 30 }  // Notes
        ];
        cancelledWorksheet['!cols'] = cancelledColumnWidths;
        
        XLSX.utils.book_append_sheet(workbook, cancelledWorksheet, 'RDV Annulés');
      }

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
      link.setAttribute('download', `rendez-vous-${format(currentDate, 'MM-yyyy')}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Calculer les totaux pour le message
      const totalHours = completedAppointments.reduce((sum, appointment) => {
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        return sum + durationHours;
      }, 0);

      const totalAmount = completedAppointments.reduce((sum, appointment) => {
        const client = appointment.clients;
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const hourlyRate = client?.hourly_rate || 0;
        const total = durationHours * hourlyRate;
        return sum + total;
      }, 0);

      toast({
        title: 'Export réussi',
        description: `${completedAppointments.length} RDV terminés, ${scheduledAppointments.length} programmés, ${cancelledAppointments.length} annulés (${totalHours.toFixed(2)}h - ${totalAmount.toFixed(2)}€)`,
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
      Exporter RDV du mois
    </Button>
  );
};

export default AppointmentExporter;
