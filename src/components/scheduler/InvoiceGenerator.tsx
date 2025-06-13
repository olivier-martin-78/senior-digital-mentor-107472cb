
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface InvoiceGeneratorProps {
  professionalId: string;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ professionalId }) => {
  const generateMonthlyInvoices = async () => {
    try {
      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Récupérer tous les rendez-vous terminés du mois
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          notes,
          status,
          clients:client_id (
            id,
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

      // Grouper les rendez-vous par client
      const appointmentsByClient = data.reduce((acc, appointment) => {
        const client = appointment.clients;
        const clientId = client?.id;
        if (!clientId) return acc;
        
        if (!acc[clientId]) {
          acc[clientId] = {
            client: client,
            appointments: []
          };
        }
        acc[clientId].appointments.push(appointment);
        return acc;
      }, {} as Record<string, { client: any; appointments: any[] }>);

      let invoicesGenerated = 0;

      // Générer une facture pour chaque client
      for (const [clientId, clientData] of Object.entries(appointmentsByClient)) {
        const client = clientData.client;
        const appointments = clientData.appointments;

        // Préparer les données pour la facture
        const invoiceData = appointments.map(appointment => {
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
            'Description': appointment.notes || 'Intervention',
            'Prix horaire (€)': hourlyRate,
            'Total (€)': Number(total.toFixed(2))
          };
        });

        // Calculer les totaux pour le client
        const totalHours = invoiceData.reduce((sum, row) => sum + row['Nombre d\'heures'], 0);
        const totalAmount = invoiceData.reduce((sum, row) => sum + row['Total (€)'], 0);

        // Ajouter une ligne de total
        invoiceData.push({
          'Date': '',
          'Heure début': '',
          'Heure fin': '',
          'Nombre d\'heures': totalHours,
          'Description': 'TOTAL',
          'Prix horaire (€)': '',
          'Total (€)': Number(totalAmount.toFixed(2))
        });

        // Créer le classeur Excel
        const worksheet = XLSX.utils.json_to_sheet(invoiceData);
        const workbook = XLSX.utils.book_new();
        
        // Définir la largeur des colonnes
        const columnWidths = [
          { wch: 12 }, // Date
          { wch: 12 }, // Heure début
          { wch: 12 }, // Heure fin
          { wch: 15 }, // Nombre d'heures
          { wch: 30 }, // Description
          { wch: 15 }, // Prix horaire
          { wch: 12 }  // Total
        ];
        worksheet['!cols'] = columnWidths;

        // Ajouter la feuille au classeur
        const sheetName = `Facture ${format(currentDate, 'MM-yyyy')}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

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
        
        const clientName = `${client?.first_name || ''} ${client?.last_name || ''}`.trim();
        const fileName = `facture-${clientName.replace(/\s+/g, '-')}-${format(currentDate, 'MM-yyyy')}.xlsx`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        invoicesGenerated++;
        
        // Petite pause entre les téléchargements pour éviter les problèmes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: 'Factures générées',
        description: `${invoicesGenerated} facture(s) générée(s) avec succès`,
      });

    } catch (error) {
      console.error('Erreur lors de la génération des factures:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les factures',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button 
      onClick={generateMonthlyInvoices}
      variant="outline"
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      Générer factures du mois
    </Button>
  );
};

export default InvoiceGenerator;
