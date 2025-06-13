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
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import InterventionAudioRecorder from './InterventionAudioRecorder';

const InterventionReportForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const reportId = searchParams.get('reportId');

  const [reportData, setReportData] = useState({
    auxiliary_name: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00',
    patient_name: '',
    physical_state: [] as string[],
    physical_state_other: '',
    pain_location: '',
    mental_state: [] as string[],
    mental_state_change: '',
    appetite: '',
    hydration: '',
    appetite_comments: '',
    hygiene: [] as string[],
    hygiene_comments: '',
    activities: [] as string[],
    activities_other: '',
    observations: '',
    follow_up: [] as string[],
    follow_up_other: '',
    audio_url: '',
    hourly_rate: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Préremplir avec les données de l'état de navigation si disponibles
    if (location.state?.prefilledData) {
      const prefilledData = location.state.prefilledData;
      setReportData(prev => ({
        ...prev,
        ...prefilledData
      }));
    } else if (reportId) {
      loadReportData(reportId);
    } else if (appointmentId) {
      loadAppointmentData(appointmentId);
    }
  }, [reportId, appointmentId, location.state]);

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
        physical_state: data.physical_state || [],
        physical_state_other: data.physical_state_other || '',
        pain_location: data.pain_location || '',
        mental_state: data.mental_state || [],
        mental_state_change: data.mental_state_change || '',
        appetite: data.appetite || '',
        hydration: data.hydration || '',
        appetite_comments: data.appetite_comments || '',
        hygiene: data.hygiene || [],
        hygiene_comments: data.hygiene_comments || '',
        activities: data.activities || [],
        activities_other: data.activities_other || '',
        observations: data.observations || '',
        follow_up: data.follow_up || [],
        follow_up_other: data.follow_up_other || '',
        audio_url: data.audio_url || '',
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
    const { name, value } = e.target;
    
    setReportData(prev => ({
      ...prev,
      [name]: value,
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
                <Label htmlFor="auxiliary_name">Nom de l'intervenant</Label>
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
              <Label htmlFor="appetite">Appétit</Label>
              <Input
                id="appetite"
                name="appetite"
                value={reportData.appetite}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="appetite_comments">Commentaires sur l'appétit</Label>
              <Textarea
                id="appetite_comments"
                name="appetite_comments"
                value={reportData.appetite_comments}
                onChange={handleInputChange}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="hydration">Hydratation</Label>
              <Input
                id="hydration"
                name="hydration"
                value={reportData.hydration}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="observations">Observations</Label>
              <Textarea
                id="observations"
                name="observations"
                value={reportData.observations}
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
