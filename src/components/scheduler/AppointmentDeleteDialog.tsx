
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Appointment } from '@/types/appointments';

interface AppointmentDeleteDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (appointmentId: string, deleteReport?: boolean) => void;
}

const AppointmentDeleteDialog: React.FC<AppointmentDeleteDialogProps> = ({
  appointment,
  open,
  onOpenChange,
  onConfirm,
}) => {
  const hasReport = !!appointment?.intervention_report_id;

  const handleConfirm = (deleteReport: boolean = false) => {
    if (appointment) {
      onConfirm(appointment.id, deleteReport);
      onOpenChange(false);
    }
  };

  if (!appointment) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le rendez-vous</AlertDialogTitle>
          <AlertDialogDescription>
            {hasReport ? (
              <>
                Ce rendez-vous est associé à un rapport d'intervention. 
                Que souhaitez-vous faire ?
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer ce rendez-vous avec{' '}
                <strong>{appointment.client?.first_name} {appointment.client?.last_name}</strong> ?
                Cette action ne peut pas être annulée.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          {hasReport ? (
            <>
              <AlertDialogAction
                variant="outline"
                onClick={() => handleConfirm(false)}
              >
                Supprimer uniquement le rendez-vous
              </AlertDialogAction>
              <AlertDialogAction
                variant="destructive"
                onClick={() => handleConfirm(true)}
              >
                Supprimer rendez-vous et rapport
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              variant="destructive"
              onClick={() => handleConfirm(false)}
            >
              Supprimer
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AppointmentDeleteDialog;
