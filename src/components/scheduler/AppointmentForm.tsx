
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Client, Appointment } from '@/types/appointments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { addHours, format } from 'date-fns';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  clients: Client[];
  onSave: () => void;
  onCancel: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  appointment, 
  clients, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    client_id: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      const startTime = new Date(appointment.start_time);
      const endTime = new Date(appointment.end_time);
      
      setFormData({
        client_id: appointment.client_id,
        start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
        notes: appointment.notes || '',
        status: appointment.status,
      });
    } else {
      // Valeurs par défaut pour un nouveau rendez-vous
      const now = new Date();
      const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
      const twoHoursLater = addHours(nextHour, 2);
      
      setFormData({
        client_id: '',
        start_time: format(nextHour, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(twoHoursLater, "yyyy-MM-dd'T'HH:mm"),
        notes: '',
        status: 'scheduled',
      });
    }
  }, [appointment]);

  const handleStartTimeChange = (value: string) => {
    setFormData(prev => {
      const startTime = new Date(value);
      const endTime = addHours(startTime, 2);
      return {
        ...prev,
        start_time: value,
        end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      };
    });
  };

  const validateTimes = () => {
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    if (duration < 2) {
      toast({
        title: 'Erreur',
        description: 'La durée minimale d\'un rendez-vous est de 2 heures',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateTimes()) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        professional_id: user.id,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        notes: formData.notes || null,
      };

      if (appointment) {
        const { error } = await supabase
          .from('appointments')
          .update(data)
          .eq('id', appointment.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rendez-vous modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert([data]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rendez-vous créé avec succès',
        });
      }

      onSave();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rendez-vous:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rendez-vous',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewIntervention = () => {
    if (appointment?.intervention_report_id) {
      toast({
        title: 'Rapport d\'intervention',
        description: 'Fonctionnalité de consultation du rapport à venir',
      });
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </span>
            {appointment?.intervention_report_id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleViewIntervention}
                className="ml-2 bg-green-50 hover:bg-green-100"
              >
                <FileText className="h-4 w-4 text-green-600" />
                <span className="ml-1 text-green-600">Voir l'intervention</span>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client_id">Client *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start_time">Heure de début *</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="end_time">Heure de fin *</Label>
            <Input
              id="end_time"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') => 
                setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Programmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes sur le rendez-vous..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;
