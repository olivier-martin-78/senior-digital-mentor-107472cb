
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams, useNavigate } from 'react-router-dom';
import InterventionAudioRecorder from './InterventionAudioRecorder';

const InterventionReportForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const reportId = searchParams.get('reportId');

  const [reportData, setReportData] = useState({
    auxiliary_name: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00',
    patient_name: '',
    mood: 'good',
    general_health: '',
    treatment_taken: '',
    activities: [] as string[],
    activities_other: '',
    hygiene: '',
    appetite: '',
    appetite_comments: '',
    toileting: '',
    mobility: '',
    mobility_assistance: '',
    social_interactions: '',
    cognitive_status: '',
    pain_level: 0,
    pain_location: '',
    other_observations: '',
    audio_url: '',
    professional_signature: false,
    hourly_rate: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportId) {
      loadReportData(reportId);
    } else if (appointmentId) {
      loadAppointmentData(appointmentId);
    }
  }, [reportId, appointmentId]);

  const loadReportData = async (reportId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      setReportData({
        auxiliary_name: data.auxiliary_name || '',
        date: data.date || new Date().toISOString().split('T')[0],
        start_time: data.start_time || '09:00',
        end_time: data.end_time || '11:00',
        patient_name: data.patient_name || '',
        mood: data.mood || 'good',
        general_health: data.general_health || '',
        treatment_taken: data.treatment_taken || '',
        activities: data.activities || [],
        activities_other: data.activities_other || '',
        hygiene: data.hygiene || '',
        appetite: data.appetite || '',
        appetite_comments: data.appetite_comments || '',
        toileting: data.toileting || '',
        mobility: data.mobility || '',
        mobility_assistance: data.mobility_assistance || '',
        social_interactions: data.social_interactions || '',
        cognitive_status: data.cognitive_status || '',
        pain_level: data.pain_level || 0,
        pain_location: data.pain_location || '',
        other_observations: data.other_observations || '',
        audio_url: data.audio_url || '',
        professional_signature: data.professional_signature || false,
        hourly_rate: data.hourly_rate || 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentData = async (appointmentId: string) => {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            first_name,
            last_name,
            hourly_rate
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      if (appointment) {
        const startDate = new Date(appointment.start_time);
        const endDate = new Date(appointment.end_time);
        
        setReportData(prev => ({
          ...prev,
          date: startDate.toISOString().split('T')[0],
          start_time: startDate.toTimeString().slice(0, 5),
          end_time: endDate.toTimeString().slice(0, 5),
          patient_name: appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : '',
          hourly_rate: appointment.clients?.hourly_rate || 0
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du rendez-vous:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
    setReportData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data = {
        ...reportData,
        professional_id: user.id,
        appointment_id: appointmentId,
      };

      if (reportId) {
        const { error } = await supabase
          .from('intervention_reports')
          .update(data)
          .eq('id', reportId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rapport modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('intervention_reports')
          .insert([data]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rapport créé avec succès',
        });
      }

      navigate('/professional-scheduler');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rapport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Rapport d'Intervention</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_name">Nom du patient</Label>
                <Input
                  id="patient_name"
                  name="patient_name"
                  value={reportData.patient_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="auxiliary_name">Nom de l'auxiliaire</Label>
                <Input
                  id="auxiliary_name"
                  name="auxiliary_name"
                  value={reportData.auxiliary_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={reportData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="start_time">Heure de début</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={reportData.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="end_time">Heure de fin</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={reportData.end_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="other_observations">Observations</Label>
              <Textarea
                id="other_observations"
                name="other_observations"
                value={reportData.other_observations}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                step="0.01"
                value={reportData.hourly_rate}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="professional_signature"
                name="professional_signature"
                checked={reportData.professional_signature}
                onCheckedChange={(checked) => setReportData(prev => ({ ...prev, professional_signature: checked === true }))}
              />
              <Label htmlFor="professional_signature">Signature du professionnel</Label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterventionReportForm;
